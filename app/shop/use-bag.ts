"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT_RATE,
  getProduct,
  type Product,
} from "./products";

export type BagLine = {
  key: string;
  slug: string;
  size: string;
  color: string;
  qty: number;
};

export type BagLineView = BagLine & { product: Product; lineTotal: number };

export type Order = {
  reference: string;
  placedAt: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  payment: string;
  lines: BagLine[];
  subtotal: number;
  shipping: number;
  total: number;
};

export const BAG_KEY = ["bag"] as const;
export const ORDER_KEY = ["last-order"] as const;

const BAG_STORAGE = "mimi-bag-v1";
const ORDER_STORAGE = "mimi-last-order-v1";

export const lineKey = (slug: string, size: string, color: string) => `${slug}::${size}::${color}`;

/** A deliberate pause so pending states are perceivable — this is a UI-only shop. */
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the in-memory cache stays correct */
  }
}

/** Drops anything that no longer matches the catalogue, so a stale bag can't break the UI. */
function sanitise(lines: unknown): BagLine[] {
  if (!Array.isArray(lines)) return [];
  return lines.flatMap((line) => {
    if (!line || typeof line !== "object") return [];
    const { slug, size, color, qty } = line as Partial<BagLine>;
    if (typeof slug !== "string" || typeof size !== "string" || typeof color !== "string") return [];
    const product = getProduct(slug);
    if (!product) return [];
    if (!product.sizes.some((option) => option.label === size)) return [];
    if (!product.colors.some((option) => option.name === color)) return [];
    const safeQty = Math.min(9, Math.max(1, Math.round(Number(qty) || 1)));
    return [{ key: lineKey(slug, size, color), slug, size, color, qty: safeQty }];
  });
}

export function bagTotals(lines: BagLine[]) {
  const subtotal = lines.reduce((sum, line) => {
    const product = getProduct(line.slug);
    return product ? sum + product.price * line.qty : sum;
  }, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  return { subtotal, shipping, total: subtotal + shipping };
}

export function useBag() {
  const query = useQuery({
    queryKey: BAG_KEY,
    queryFn: async () => sanitise(readStorage<BagLine[]>(BAG_STORAGE, [])),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const lines = useMemo(() => query.data ?? [], [query.data]);

  const views = useMemo<BagLineView[]>(
    () =>
      lines.flatMap((line) => {
        const product = getProduct(line.slug);
        return product ? [{ ...line, product, lineTotal: product.price * line.qty }] : [];
      }),
    [lines],
  );

  const count = useMemo(() => lines.reduce((sum, line) => sum + line.qty, 0), [lines]);
  const totals = useMemo(() => bagTotals(lines), [lines]);

  return { ...query, lines, views, count, totals };
}

/** Shared writer: every mutation resolves the next bag from the live cache, then persists it. */
function useBagWriter() {
  const client = useQueryClient();
  return (update: (current: BagLine[]) => BagLine[]) => {
    const current = client.getQueryData<BagLine[]>(BAG_KEY) ?? [];
    const next = update(current);
    writeStorage(BAG_STORAGE, next);
    return next;
  };
}

export function useAddToBag() {
  const client = useQueryClient();
  const write = useBagWriter();

  return useMutation({
    mutationKey: ["bag", "add"],
    mutationFn: async (input: { slug: string; size: string; color: string; qty?: number }) => {
      await pause(420);
      const qty = Math.max(1, input.qty ?? 1);
      const key = lineKey(input.slug, input.size, input.color);
      return write((current) => {
        const existing = current.find((line) => line.key === key);
        if (existing) {
          return current.map((line) =>
            line.key === key ? { ...line, qty: Math.min(9, line.qty + qty) } : line,
          );
        }
        return [...current, { key, slug: input.slug, size: input.size, color: input.color, qty }];
      });
    },
    onSuccess: (next) => client.setQueryData(BAG_KEY, next),
  });
}

export function useSetQty() {
  const client = useQueryClient();
  const write = useBagWriter();

  return useMutation({
    mutationKey: ["bag", "qty"],
    mutationFn: async (input: { key: string; qty: number }) =>
      write((current) =>
        input.qty < 1
          ? current.filter((line) => line.key !== input.key)
          : current.map((line) =>
              line.key === input.key ? { ...line, qty: Math.min(9, input.qty) } : line,
            ),
      ),
    // Steppers must feel instant, so the cache moves before the write resolves.
    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: BAG_KEY });
      const previous = client.getQueryData<BagLine[]>(BAG_KEY) ?? [];
      client.setQueryData<BagLine[]>(BAG_KEY, (current = []) =>
        input.qty < 1
          ? current.filter((line) => line.key !== input.key)
          : current.map((line) =>
              line.key === input.key ? { ...line, qty: Math.min(9, input.qty) } : line,
            ),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) client.setQueryData(BAG_KEY, context.previous);
    },
    onSuccess: (next) => client.setQueryData(BAG_KEY, next),
  });
}

export function useRemoveLine() {
  const client = useQueryClient();
  const write = useBagWriter();

  return useMutation({
    mutationKey: ["bag", "remove"],
    mutationFn: async (key: string) => {
      await pause(220);
      return write((current) => current.filter((line) => line.key !== key));
    },
    onSuccess: (next) => client.setQueryData(BAG_KEY, next),
  });
}

export function useClearBag() {
  const client = useQueryClient();
  const write = useBagWriter();

  return useMutation({
    mutationKey: ["bag", "clear"],
    mutationFn: async () => write(() => []),
    onSuccess: (next) => client.setQueryData(BAG_KEY, next),
  });
}

export type CheckoutDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  payment: string;
};

function orderReference() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const noise = Math.floor(Math.random() * 1296)
    .toString(36)
    .toUpperCase()
    .padStart(2, "0");
  return `MIMI-${stamp}${noise}`;
}

/**
 * Confirms an order entirely on the client — there is no backend, so this
 * records the order locally and empties the bag.
 */
export function usePlaceOrder() {
  const client = useQueryClient();
  const write = useBagWriter();

  return useMutation({
    mutationKey: ["order", "place"],
    mutationFn: async (details: CheckoutDetails) => {
      const lines = client.getQueryData<BagLine[]>(BAG_KEY) ?? [];
      if (lines.length === 0) throw new Error("Your bag is empty.");
      await pause(1400);
      const totals = bagTotals(lines);
      const order: Order = {
        reference: orderReference(),
        placedAt: new Date().toISOString(),
        ...details,
        lines,
        ...totals,
      };
      writeStorage(ORDER_STORAGE, order);
      write(() => []);
      return order;
    },
    onSuccess: (order) => {
      client.setQueryData(BAG_KEY, []);
      client.setQueryData(ORDER_KEY, order);
    },
  });
}

export function useLastOrder() {
  return useQuery({
    queryKey: ORDER_KEY,
    queryFn: async () => readStorage<Order | null>(ORDER_STORAGE, null),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
