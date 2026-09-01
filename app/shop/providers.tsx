"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import BagDrawer from "./bag-drawer";

type BagUI = {
  open: boolean;
  openBag: () => void;
  closeBag: () => void;
  toggleBag: () => void;
};

const BagUIContext = createContext<BagUI | null>(null);

export function useBagUI() {
  const context = useContext(BagUIContext);
  if (!context) throw new Error("useBagUI must be used inside <Providers>");
  return context;
}

function BagUIProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const value = useMemo<BagUI>(
    () => ({
      open,
      openBag: () => setOpen(true),
      closeBag: () => setOpen(false),
      toggleBag: () => setOpen((current) => !current),
    }),
    [open],
  );

  useEffect(() => {
    document.body.classList.toggle("bag-open", open);
    return () => document.body.classList.remove("bag-open");
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <BagUIContext.Provider value={value}>
      {children}
      <BagDrawer />
    </BagUIContext.Provider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <BagUIProvider>{children}</BagUIProvider>
    </QueryClientProvider>
  );
}
