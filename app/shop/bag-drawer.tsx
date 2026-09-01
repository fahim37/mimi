"use client";

import Image from "next/image";
import Link from "next/link";
import { useBagUI } from "./providers";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "./products";
import { useBag, useRemoveLine, useSetQty } from "./use-bag";

function Stepper({
  qty,
  busy,
  onChange,
}: {
  qty: number;
  busy: boolean;
  onChange: (qty: number) => void;
}) {
  return (
    <div className="bag-stepper" data-busy={busy || undefined}>
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        aria-label={qty === 1 ? "Remove item" : "Decrease quantity"}
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 6h7" />
        </svg>
      </button>
      <span aria-live="polite">{qty}</span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        disabled={qty >= 9}
        aria-label="Increase quantity"
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M6 2.5v7M2.5 6h7" />
        </svg>
      </button>
    </div>
  );
}

export default function BagDrawer() {
  const { open, closeBag } = useBagUI();
  const { views, count, totals, isPending } = useBag();
  const setQty = useSetQty();
  const removeLine = useRemoveLine();

  const toFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - totals.subtotal);
  const shippingProgress = Math.min(1, totals.subtotal / FREE_SHIPPING_THRESHOLD);

  return (
    <div className={`bag${open ? " is-open" : ""}`} aria-hidden={!open}>
      <button className="bag__scrim" type="button" onClick={closeBag} tabIndex={-1} aria-label="Close bag" />

      <aside
        className="bag__panel"
        role="dialog"
        aria-modal={open}
        aria-label="Shopping bag"
        inert={!open}
      >
        <header className="bag__head">
          <span className="kicker">
            Your bag<i>{count}</i>
          </span>
          <button className="bag__close" type="button" onClick={closeBag} data-cursor="Close">
            Close
          </button>
        </header>

        {count > 0 && (
          <div className="bag__shipping">
            <p>
              {toFreeShipping > 0 ? (
                <>
                  <b>{formatPrice(toFreeShipping)}</b> away from free delivery
                </>
              ) : (
                <>Free delivery unlocked</>
              )}
            </p>
            <span className="bag__shipping-rail">
              <i style={{ transform: `scaleX(${shippingProgress})` }} />
            </span>
          </div>
        )}

        <div className="bag__body">
          {isPending && (
            <div className="bag__loading" aria-hidden="true">
              {[0, 1].map((row) => (
                <div className="bag__skeleton" key={row} />
              ))}
            </div>
          )}

          {!isPending && count === 0 && (
            <div className="bag__empty">
              <span className="bag__empty-mark">M</span>
              <p>Your bag is empty.</p>
              <small>Everything from the 2026 collection is waiting in the lookbook.</small>
              <Link className="bag__empty-link" href="/#lookbook" onClick={closeBag}>
                Shop the lookbook
                <svg className="arrow" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 12h15M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          )}

          {!isPending && count > 0 && (
            <ul className="bag__lines">
              {views.map((line, index) => {
                const removing = removeLine.isPending && removeLine.variables === line.key;
                return (
                  <li
                    className="bag-line"
                    key={line.key}
                    data-removing={removing || undefined}
                    style={{ "--i": index } as React.CSSProperties}
                  >
                    <Link className="bag-line__media" href={`/product/${line.slug}`} onClick={closeBag}>
                      <Image
                        src={line.product.images[0].src}
                        alt={line.product.images[0].alt}
                        fill
                        sizes="120px"
                      />
                    </Link>

                    <div className="bag-line__body">
                      <div className="bag-line__top">
                        <Link href={`/product/${line.slug}`} onClick={closeBag}>
                          {line.product.name}
                        </Link>
                        <b>{formatPrice(line.lineTotal)}</b>
                      </div>
                      <p className="bag-line__variant">
                        {line.size} · {line.color}
                      </p>
                      <div className="bag-line__foot">
                        <Stepper
                          qty={line.qty}
                          busy={setQty.isPending && setQty.variables?.key === line.key}
                          onChange={(qty) =>
                            qty < 1
                              ? removeLine.mutate(line.key)
                              : setQty.mutate({ key: line.key, qty })
                          }
                        />
                        <button
                          className="bag-line__remove"
                          type="button"
                          onClick={() => removeLine.mutate(line.key)}
                          disabled={removing}
                        >
                          {removing ? "Removing" : "Remove"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {count > 0 && (
          <footer className="bag__foot">
            <dl className="bag__totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(totals.subtotal)}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}</dd>
              </div>
              <div className="bag__totals-sum">
                <dt>Total</dt>
                <dd>{formatPrice(totals.total)}</dd>
              </div>
            </dl>
            <Link className="btn btn--fill bag__checkout" href="/checkout" onClick={closeBag} data-cursor="Order">
              <span>Checkout</span>
              <svg className="arrow" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12h15M13 6l6 6-6 6" />
              </svg>
            </Link>
            <button className="bag__continue" type="button" onClick={closeBag}>
              Continue shopping
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
