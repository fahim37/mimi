"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ShopFooter from "@/app/shop/shop-footer";
import ShopHeader from "@/app/shop/shop-header";
import { useReveal } from "@/app/shop/use-reveal";
import { useSendMessage, type ContactMessage } from "./use-contact";

const TOPICS = [
  { id: "custom", label: "A custom piece", note: "Made to your measurements" },
  { id: "order", label: "An existing order", note: "Sizing, delivery, exchanges" },
  { id: "press", label: "Press & collaboration", note: "Features, shoots, styling" },
  { id: "stockist", label: "Stockists", note: "Bring Mimi to your floor" },
];

/** Studio contact points. Swap the placeholder number for the real one before launch. */
const CHANNELS = [
  {
    number: "01",
    label: "Email",
    value: "hello@thebrandmimi.com",
    note: "Answered within one working day",
    href: "mailto:hello@thebrandmimi.com",
  },
  {
    number: "02",
    label: "Instagram",
    value: "@thebrand_mimi",
    note: "Direct messages are always open",
    href: "https://www.instagram.com/thebrand_mimi/",
    external: true,
  },
  { number: "03", label: "WhatsApp", value: "+880 1XXX XXXXXX", note: "Voice notes welcome" },
  { number: "04", label: "Studio", value: "Dhaka, Bangladesh", note: "Fittings by appointment" },
];

const MESSAGE_LIMIT = 600;

const EMPTY: ContactMessage = { name: "", email: "", topic: "custom", message: "" };

type Errors = Partial<Record<keyof ContactMessage, string>>;

function validate(values: ContactMessage): Errors {
  const errors: Errors = {};
  if (values.name.trim().length < 2) errors.name = "Tell us who is writing";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Check this email address";
  if (values.message.trim().length < 12) errors.message = "A line or two more, please";
  return errors;
}

function Arrow({ direction = "right" }: { direction?: "right" | "down" }) {
  return (
    <svg className={`arrow arrow--${direction}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

/** Starts on a placeholder so the ticking value can never mismatch the server render. */
function StudioClock() {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dhaka",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(format.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="contact-hero__clock">
      <i aria-hidden="true" />
      Studio time, Dhaka <b>{time}</b>
    </span>
  );
}

export default function ContactView() {
  const [values, setValues] = useState<ContactMessage>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const send = useSendMessage();
  const receipt = send.data;
  const mediaRef = useRef<HTMLDivElement>(null);

  useReveal(receipt ? "sent" : "form");

  // Hero art drifts against the scroll and dims as the paper section takes over.
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const viewport = window.innerHeight || 1;
      const travel = Math.min(window.scrollY, viewport);
      media.style.setProperty("--hero-shift", `${travel * 0.16}px`);
      media.style.setProperty("--hero-scale", String(1.06 + (travel / viewport) * 0.08));
      media.style.setProperty("--hero-veil", String(Math.min(0.55, (travel / viewport) * 0.7)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // The same pointer tracking the home page uses for card tilt, dialled down to a nudge.
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic]"));
    const cleanups = targets.map((target) => {
      const move = (event: PointerEvent) => {
        const rect = target.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        target.style.setProperty("--pull-x", `${x * 16}px`);
        target.style.setProperty("--pull-y", `${y * 9}px`);
      };
      const leave = () => {
        target.style.setProperty("--pull-x", "0px");
        target.style.setProperty("--pull-y", "0px");
      };
      target.addEventListener("pointermove", move);
      target.addEventListener("pointerleave", leave);
      return () => {
        target.removeEventListener("pointermove", move);
        target.removeEventListener("pointerleave", leave);
      };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [receipt]);

  const set = (key: keyof ContactMessage) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (send.isPending) return;

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = document.querySelector<HTMLElement>(
        '[data-error="true"] input, [data-error="true"] textarea',
      );
      first?.focus();
      return;
    }
    send.mutate(values);
  };

  const writeAnother = () => {
    send.reset();
    setValues(EMPTY);
    setErrors({});
  };

  const chosenTopic = TOPICS.find((topic) => topic.id === (receipt?.topic ?? values.topic));
  const used = values.message.length;

  return (
    <div className="contact">
      <ShopHeader />

      <main>
        <section className="contact-hero" aria-labelledby="contact-title">
          <div className="contact-hero__media" ref={mediaRef}>
            <Image
              src="/media/plum-wide.webp"
              alt="Mimi campaign portrait in a plum draped look"
              fill
              sizes="100vw"
              priority
            />
            <span className="contact-hero__scrim" aria-hidden="true" />
            <span className="contact-hero__glow" aria-hidden="true" />
            <span className="contact-hero__grain" aria-hidden="true" />
          </div>

          <nav className="contact-hero__crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <i aria-hidden="true">/</i>
            <span aria-current="page">Contact</span>
          </nav>

          <div className="contact-hero__inner">
            <h1 id="contact-title" className="contact-hero__title">
              <span className="contact-hero__line">
                <i style={{ "--i": 0 } as React.CSSProperties}>Let&apos;s</i>
              </span>
              <span className="contact-hero__line">
                <i style={{ "--i": 1 } as React.CSSProperties}>
                  <em>talk.</em>
                </i>
              </span>
            </h1>

            <div className="contact-hero__lower">
              <p className="contact-hero__lede">
                A custom fitting, a press request, a stockist question — or simply the beginning of
                your Mimi moment. Tell us what you have in mind.
              </p>
              <dl className="contact-hero__facts">
                <div>
                  <dt>Reply time</dt>
                  <dd>Under 24 hours</dd>
                </div>
                <div>
                  <dt>Studio</dt>
                  <dd>Dhaka</dd>
                </div>
                <div>
                  <dt>Season</dt>
                  <dd>MMXXVI</dd>
                </div>
              </dl>
            </div>

            <div className="contact-hero__foot">
              <StudioClock />
              <a
                className="contact-hero__cue"
                href="#write"
                data-magnetic
                aria-label="Jump to the message form"
              >
                <span>Write to us</span>
                <i aria-hidden="true">
                  <Arrow direction="down" />
                </i>
              </a>
            </div>
          </div>

          <div className="contact-hero__marquee" aria-hidden="true">
            <div className="contact-hero__marquee-track">
              {[0, 1].map((group) => (
                <span key={group}>
                  Let&apos;s talk <i>✦</i> Say hello <i>✦</i> Made for you <i>✦</i>&nbsp;
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="write" className="contact-body section-pad" aria-labelledby="write-title">
          <div className="contact-body__layout">
            <div className="contact-body__main">
              {receipt ? (
                <div className="contact-sent" key={receipt.reference}>
                  <div className="confirm__mark contact-sent__mark" aria-hidden="true">
                    <svg viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="30" />
                      <path d="M18 33.5l9.5 9.5L46 22" />
                    </svg>
                  </div>

                  <span className="kicker confirm__kicker">Message received</span>
                  <h2 className="contact-sent__title" id="write-title">
                    Thank you,
                    <br />
                    <em>{receipt.name.trim().split(" ")[0]}.</em>
                  </h2>
                  <p className="contact-sent__lede">
                    Your note is with the studio. We answer every message personally — usually the
                    same day, always within one.
                  </p>

                  <dl className="contact-sent__meta">
                    <div>
                      <dt>Reference</dt>
                      <dd>{receipt.reference}</dd>
                    </div>
                    <div>
                      <dt>About</dt>
                      <dd>{chosenTopic?.label ?? "Something else"}</dd>
                    </div>
                    <div>
                      <dt>Replying to</dt>
                      <dd>{receipt.email}</dd>
                    </div>
                  </dl>

                  <div className="contact-sent__actions">
                    <button className="btn btn--ghost" type="button" onClick={writeAnother}>
                      <span>Write another</span>
                    </button>
                    <Link className="btn btn--fill" href="/#lookbook" data-magnetic>
                      <span>Shop the lookbook</span>
                      <Arrow />
                    </Link>
                  </div>
                </div>
              ) : (
                <form className="contact-form" onSubmit={submit} noValidate>
                  <header className="contact-form__head reveal">
                    <span className="kicker">Write to the studio</span>
                    <h2 id="write-title">
                      Start the
                      <br />
                      <em>conversation.</em>
                    </h2>
                  </header>

                  <fieldset className="contact-form__block reveal" disabled={send.isPending}>
                    <legend>
                      <i>01</i>What is this about?
                    </legend>
                    <div className="topics">
                      {TOPICS.map((topic, index) => (
                        <label
                          className="topic"
                          key={topic.id}
                          data-active={values.topic === topic.id ? true : undefined}
                          style={{ "--i": index } as React.CSSProperties}
                        >
                          <input
                            type="radio"
                            name="topic"
                            value={topic.id}
                            checked={values.topic === topic.id}
                            onChange={() => set("topic")(topic.id)}
                          />
                          <span className="topic__mark" aria-hidden="true" />
                          <span className="topic__text">
                            <b>{topic.label}</b>
                            <i>{topic.note}</i>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="contact-form__block reveal" disabled={send.isPending}>
                    <legend>
                      <i>02</i>Who are we speaking with?
                    </legend>
                    <div className="contact-form__grid">
                      <div className="field" data-error={errors.name ? true : undefined}>
                        <label htmlFor="contact-name">Your name</label>
                        <input
                          id="contact-name"
                          name="name"
                          type="text"
                          value={values.name}
                          autoComplete="name"
                          placeholder="Afsana Mimi"
                          onChange={(event) => set("name")(event.target.value)}
                          aria-invalid={errors.name ? true : undefined}
                          aria-describedby={errors.name ? "contact-name-error" : undefined}
                        />
                        <i className="field__rule" aria-hidden="true" />
                        {errors.name && (
                          <small className="field__error" id="contact-name-error" role="alert">
                            {errors.name}
                          </small>
                        )}
                      </div>

                      <div className="field" data-error={errors.email ? true : undefined}>
                        <label htmlFor="contact-email">Email</label>
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          value={values.email}
                          autoComplete="email"
                          placeholder="you@example.com"
                          onChange={(event) => set("email")(event.target.value)}
                          aria-invalid={errors.email ? true : undefined}
                          aria-describedby={errors.email ? "contact-email-error" : undefined}
                        />
                        <i className="field__rule" aria-hidden="true" />
                        {errors.email && (
                          <small className="field__error" id="contact-email-error" role="alert">
                            {errors.email}
                          </small>
                        )}
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="contact-form__block reveal" disabled={send.isPending}>
                    <legend>
                      <i>03</i>The message
                    </legend>
                    <div className="field" data-error={errors.message ? true : undefined}>
                      <span className="contact-form__label-row">
                        <label htmlFor="contact-message">Tell us more</label>
                        <b
                          className="contact-form__count"
                          data-near={used > MESSAGE_LIMIT - 80 ? true : undefined}
                        >
                          {used} / {MESSAGE_LIMIT}
                        </b>
                      </span>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={6}
                        maxLength={MESSAGE_LIMIT}
                        value={values.message}
                        placeholder="Occasion, timeline, the piece you have your eye on…"
                        onChange={(event) => set("message")(event.target.value)}
                        aria-invalid={errors.message ? true : undefined}
                        aria-describedby={errors.message ? "contact-message-error" : undefined}
                      />
                      <i className="field__rule" aria-hidden="true" />
                      <span
                        className="contact-form__gauge"
                        aria-hidden="true"
                        style={
                          { "--fill": Math.min(1, used / MESSAGE_LIMIT) } as React.CSSProperties
                        }
                      />
                      {errors.message && (
                        <small className="field__error" id="contact-message-error" role="alert">
                          {errors.message}
                        </small>
                      )}
                    </div>
                  </fieldset>

                  {send.isError && (
                    <p className="checkout__error" role="alert">
                      That did not go through. Please try once more.
                    </p>
                  )}

                  <div className="contact-form__submit reveal">
                    <button
                      className="btn btn--fill contact-form__send"
                      type="submit"
                      disabled={send.isPending}
                      data-magnetic
                    >
                      <span>{send.isPending ? "Sending" : "Send message"}</span>
                      {send.isPending ? <i className="btn__spinner" aria-hidden="true" /> : <Arrow />}
                    </button>
                    <p className="contact-form__note">
                      We only ever use your address to reply. No lists, no forwarding.
                    </p>
                  </div>
                </form>
              )}
            </div>

            <aside className="contact-aside reveal" aria-labelledby="channels-title">
              <div className="contact-aside__inner">
                <h2 className="contact-aside__title" id="channels-title">
                  Or reach us
                  <br />
                  <em>directly.</em>
                </h2>

                <ul className="contact-aside__list">
                  {CHANNELS.map((channel, index) => {
                    const body = (
                      <>
                        <small>{channel.number}</small>
                        <span className="channel__text">
                          <i>{channel.label}</i>
                          <b>{channel.value}</b>
                          <em>{channel.note}</em>
                        </span>
                        {channel.href && <Arrow />}
                      </>
                    );

                    return (
                      <li
                        className="channel"
                        key={channel.label}
                        style={{ "--i": index } as React.CSSProperties}
                      >
                        {channel.href ? (
                          <a
                            className="channel__body"
                            href={channel.href}
                            target={channel.external ? "_blank" : undefined}
                            rel={channel.external ? "noreferrer" : undefined}
                          >
                            {body}
                          </a>
                        ) : (
                          <div className="channel__body">{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <div className="contact-aside__hours">
                  <span className="kicker">Studio hours</span>
                  <p>
                    <span>Sunday — Thursday</span>
                    <b>10:00 — 19:00</b>
                  </p>
                  <p>
                    <span>Friday — Saturday</span>
                    <b>By appointment</b>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="ticker" aria-label="Brand statement">
          <div className="ticker__track">
            {[0, 1].map((group) => (
              <span key={group}>
                Wear the moment <i>✦</i> Own the room <i>✦</i> Move like Mimi <i>✦</i>&nbsp;
              </span>
            ))}
          </div>
        </section>
      </main>

      <ShopFooter />
    </div>
  );
}
