"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ShopHeader from "@/app/shop/shop-header";
import ShopFooter from "@/app/shop/shop-footer";
import { formatPrice, getProduct } from "@/app/shop/products";
import { useBag, usePlaceOrder, type CheckoutDetails, type Order } from "@/app/shop/use-bag";
import { useBagUI } from "@/app/shop/providers";
import { useReveal } from "@/app/shop/use-reveal";

const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on delivery", note: "Pay the courier when it arrives" },
  { id: "bkash", label: "bKash / Nagad", note: "We send the number after confirming" },
  { id: "bank", label: "Bank transfer", note: "Details follow by email" },
];

const EMPTY: CheckoutDetails = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  payment: "cod",
};

type Errors = Partial<Record<keyof CheckoutDetails, string>>;

function validate(values: CheckoutDetails): Errors {
  const errors: Errors = {};
  if (values.name.trim().length < 2) errors.name = "Tell us who this is for";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Check this email address";
  if (values.phone.replace(/\D/g, "").length < 10) errors.phone = "A reachable number, please";
  if (values.address.trim().length < 6) errors.address = "Add a full delivery address";
  if (values.city.trim().length < 2) errors.city = "Which city?";
  return errors;
}

function Field({
  id,
  label,
  value,
  error,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  textarea,
  span,
}: {
  id: keyof CheckoutDetails;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  textarea?: boolean;
  span?: boolean;
}) {
  return (
    <div className={`field${span ? " field--span" : ""}`} data-error={error ? true : undefined}>
      <label htmlFor={id}>{label}</label>
      {textarea ? (
        <textarea
          id={id}
          name={id}
          rows={3}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      )}
      <i className="field__rule" aria-hidden="true" />
      {error && (
        <small className="field__error" id={`${id}-error`} role="alert">
          {error}
        </small>
      )}
    </div>
  );
}

function Confirmation({ order }: { order: Order }) {
  return (
    <div className="confirm">
      <div className="confirm__mark" aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="30" />
          <path d="M18 33.5l9.5 9.5L46 22" />
        </svg>
      </div>

      <span className="kicker confirm__kicker">Order confirmed</span>
      <h1 className="confirm__title">
        Thank you,<br />
        <em>{order.name.split(" ")[0]}.</em>
      </h1>
      <p className="confirm__lede">
        Your order is placed. We will confirm the details over a call before dispatch.
      </p>

      <dl className="confirm__meta">
        <div>
          <dt>Reference</dt>
          <dd>{order.reference}</dd>
        </div>
        <div>
          <dt>Delivering to</dt>
          <dd>
            {order.address}, {order.city}
          </dd>
        </div>
        <div>
          <dt>Payment</dt>
          <dd>{PAYMENT_METHODS.find((method) => method.id === order.payment)?.label ?? order.payment}</dd>
        </div>
      </dl>

      <ul className="confirm__lines">
        {order.lines.map((line) => {
          const product = getProduct(line.slug);
          if (!product) return null;
          return (
            <li key={line.key}>
              <span className="confirm__media">
                <Image src={product.images[0].src} alt="" fill sizes="64px" />
              </span>
              <span className="confirm__line-text">
                <b>{product.name}</b>
                <i>
                  {line.size} · {line.color} · Qty {line.qty}
                </i>
              </span>
              <b className="confirm__line-price">{formatPrice(product.price * line.qty)}</b>
            </li>
          );
        })}
      </ul>

      <div className="confirm__total">
        <span>Total paid on delivery</span>
        <b>{formatPrice(order.total)}</b>
      </div>

      <Link className="btn btn--fill confirm__cta" href="/#lookbook">
        <span>Continue shopping</span>
        <svg className="arrow" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12h15M13 6l6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}

export default function CheckoutView() {
  const { views, count, totals, isPending } = useBag();
  const { openBag } = useBagUI();
  const placeOrder = usePlaceOrder();
  const [values, setValues] = useState<CheckoutDetails>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  useReveal(placeOrder.isSuccess ? "confirmed" : "form");

  const order = placeOrder.data;

  const set = (key: keyof CheckoutDetails) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = document.querySelector<HTMLElement>('[data-error="true"] input, [data-error="true"] textarea');
      first?.focus();
      return;
    }
    placeOrder.mutate(values);
  };

  return (
    <div className="checkout">
      <ShopHeader />

      <main className="checkout__main">
        {order ? (
          <Confirmation order={order} />
        ) : (
          <>
            <nav className="pdp__crumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <i aria-hidden="true">/</i>
              <span aria-current="page">Checkout</span>
            </nav>

            <header className="checkout__head">
              <span className="kicker">Almost yours</span>
              <h1>
                Checkout<em>.</em>
              </h1>
            </header>

            {!isPending && count === 0 ? (
              <div className="checkout__empty">
                <span className="bag__empty-mark">M</span>
                <p>There is nothing in your bag yet.</p>
                <Link className="btn btn--fill" href="/#lookbook">
                  <span>Shop the lookbook</span>
                  <svg className="arrow" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 12h15M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="checkout__layout">
                <form className="checkout__form" onSubmit={submit} noValidate>
                  <section className="checkout__block">
                    <h2>
                      <i>01</i>Your details
                    </h2>
                    <div className="checkout__grid">
                      <Field
                        id="name"
                        label="Full name"
                        value={values.name}
                        error={errors.name}
                        onChange={set("name")}
                        autoComplete="name"
                        placeholder="Afsana Mimi"
                      />
                      <Field
                        id="phone"
                        label="Phone"
                        type="tel"
                        value={values.phone}
                        error={errors.phone}
                        onChange={set("phone")}
                        autoComplete="tel"
                        placeholder="01XXXXXXXXX"
                      />
                      <Field
                        id="email"
                        label="Email"
                        type="email"
                        value={values.email}
                        error={errors.email}
                        onChange={set("email")}
                        autoComplete="email"
                        placeholder="you@example.com"
                        span
                      />
                    </div>
                  </section>

                  <section className="checkout__block">
                    <h2>
                      <i>02</i>Delivery
                    </h2>
                    <div className="checkout__grid">
                      <Field
                        id="address"
                        label="Address"
                        value={values.address}
                        error={errors.address}
                        onChange={set("address")}
                        autoComplete="street-address"
                        placeholder="House, road, area"
                        textarea
                        span
                      />
                      <Field
                        id="city"
                        label="City"
                        value={values.city}
                        error={errors.city}
                        onChange={set("city")}
                        autoComplete="address-level2"
                        placeholder="Dhaka"
                      />
                    </div>
                  </section>

                  <section className="checkout__block">
                    <h2>
                      <i>03</i>Payment
                    </h2>
                    <div className="pay">
                      {PAYMENT_METHODS.map((method) => (
                        <label
                          className="pay__option"
                          key={method.id}
                          data-active={values.payment === method.id || undefined}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={method.id}
                            checked={values.payment === method.id}
                            onChange={() => set("payment")(method.id)}
                          />
                          <span className="pay__dot" aria-hidden="true" />
                          <span className="pay__text">
                            <b>{method.label}</b>
                            <i>{method.note}</i>
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="checkout__note">
                      No card details are taken on this site. We confirm every order by phone before it ships.
                    </p>
                  </section>

                  {placeOrder.isError && (
                    <p className="checkout__error" role="alert">
                      {placeOrder.error instanceof Error ? placeOrder.error.message : "Something went wrong."}
                    </p>
                  )}

                  <button
                    className="btn btn--fill checkout__submit"
                    type="submit"
                    disabled={placeOrder.isPending || count === 0}
                  >
                    <span>{placeOrder.isPending ? "Placing your order" : `Place order · ${formatPrice(totals.total)}`}</span>
                    {placeOrder.isPending && <i className="btn__spinner" aria-hidden="true" />}
                  </button>
                </form>

                <aside className="checkout__summary" aria-label="Order summary">
                  <div className="checkout__summary-inner">
                    <div className="checkout__summary-head">
                      <span className="kicker">Your bag</span>
                      <button type="button" onClick={openBag}>
                        Edit
                      </button>
                    </div>

                    <ul className="checkout__lines">
                      {views.map((line, index) => (
                        <li key={line.key} style={{ "--i": index } as React.CSSProperties}>
                          <span className="checkout__media">
                            <Image src={line.product.images[0].src} alt="" fill sizes="72px" />
                            <i>{line.qty}</i>
                          </span>
                          <span className="checkout__line-text">
                            <b>{line.product.name}</b>
                            <i>
                              {line.size} · {line.color}
                            </i>
                          </span>
                          <b className="checkout__line-price">{formatPrice(line.lineTotal)}</b>
                        </li>
                      ))}
                    </ul>

                    <dl className="checkout__totals">
                      <div>
                        <dt>Subtotal</dt>
                        <dd>{formatPrice(totals.subtotal)}</dd>
                      </div>
                      <div>
                        <dt>Delivery</dt>
                        <dd>{totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}</dd>
                      </div>
                      <div className="checkout__totals-sum">
                        <dt>Total</dt>
                        <dd>{formatPrice(totals.total)}</dd>
                      </div>
                    </dl>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}
      </main>

      <ShopFooter />
    </div>
  );
}
