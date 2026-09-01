"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, type Product } from "./products";
import { useAddToBag } from "./use-bag";
import { useBagUI } from "./providers";

export default function ProductCard({
  product,
  index = 0,
  className = "",
}: {
  product: Product;
  index?: number;
  className?: string;
}) {
  const addToBag = useAddToBag();
  const { openBag } = useBagUI();
  const [quickOpen, setQuickOpen] = useState(false);
  const [pendingSize, setPendingSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const soldOut = product.sizes.every((option) => !option.available);
  const hover = product.images[1] ?? product.images[0];

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => {
      setAdded(false);
      setQuickOpen(false);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [added]);

  const quickAdd = async (size: string) => {
    if (pendingSize) return;
    setPendingSize(size);
    try {
      await addToBag.mutateAsync({
        slug: product.slug,
        size,
        color: product.colors[0].name,
        qty: 1,
      });
      setAdded(true);
      openBag();
    } catch {
      /* local write — nothing to recover */
    } finally {
      setPendingSize(null);
    }
  };

  return (
    <article
      className={`product-card${className ? ` ${className}` : ""}`}
      data-quick={quickOpen || undefined}
      style={{ "--i": index } as React.CSSProperties}
    >
      <div className="product-card__media">
        <Link
          className="product-card__link"
          href={`/product/${product.slug}`}
          aria-label={`View ${product.name}`}
          data-cursor="View"
        >
          <Image
            className="product-card__image product-card__image--base"
            src={product.images[0].src}
            alt={product.images[0].alt}
            fill
            sizes="(max-width: 900px) 88vw, 42vw"
          />
          <Image
            className="product-card__image product-card__image--hover"
            src={hover.src}
            alt=""
            fill
            sizes="(max-width: 900px) 88vw, 42vw"
          />
        </Link>

        {product.badge && <span className="product-card__badge">{product.badge}</span>}

        {!soldOut && (
          <>
            <div className="product-card__quick" role="group" aria-label={`Quick add ${product.name}`}>
              <span className="product-card__quick-label">Add size</span>
              <div className="product-card__chips">
                {product.sizes.map((option) => (
                  <button
                    className="product-card__chip"
                    key={option.label}
                    type="button"
                    disabled={!option.available || Boolean(pendingSize)}
                    onClick={() => quickAdd(option.label)}
                    data-pending={pendingSize === option.label || undefined}
                    tabIndex={quickOpen ? 0 : -1}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="product-card__quick-toggle"
              type="button"
              onClick={() => setQuickOpen((open) => !open)}
              aria-expanded={quickOpen}
              data-cursor={quickOpen ? "Close" : "Add"}
            >
              {quickOpen ? "Close" : "Quick add"}
            </button>
          </>
        )}

        {soldOut && <span className="product-card__soldout">Sold out</span>}

        <div className="product-card__added" data-show={added || undefined} aria-hidden={!added}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 10.5l4 4 8-9" />
          </svg>
          <span>Added to bag</span>
        </div>
      </div>

      <Link className="product-card__foot" href={`/product/${product.slug}`} tabIndex={-1}>
        <span className="product-card__name">
          <b>{product.name}</b>
          <i>{product.type}</i>
        </span>
        <span className="product-card__price">
          {formatPrice(product.price)}
          {product.compareAt && <s>{formatPrice(product.compareAt)}</s>}
        </span>
      </Link>
    </article>
  );
}
