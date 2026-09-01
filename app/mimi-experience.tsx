"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BagButton from "./shop/bag-button";
import ProductCard from "./shop/product-card";
import { formatPrice, products } from "./shop/products";

const chapters = [
  { number: "01", name: "Rouge Rhythm", note: "Lines that move before you do.", image: "/media/rouge-studio.webp", detail: "/media/rouge-detail.webp", alt: "Model wearing Mimi's red striped two-piece look", tone: "rouge" },
  { number: "02", name: "Glamour Drape", note: "Soft architecture in a deep plum tone.", image: "/media/plum-front.webp", detail: "/media/plum-back.webp", alt: "Model wearing Mimi's plum draped gown", tone: "plum" },
  { number: "03", name: "Mineral Ease", note: "Airy layers, grounded confidence.", image: "/media/blue-model.webp", detail: "/media/blue-product.webp", alt: "Model wearing Mimi's mineral blue layered set", tone: "mineral" },
  { number: "04", name: "Olive Hour", note: "Quiet colour with a decisive silhouette.", image: "/media/olive-full.webp", detail: "/media/olive-portrait.webp", alt: "Model wearing Mimi's olive relaxed set", tone: "olive" },
];

function Arrow({ direction = "right" }: { direction?: "right" | "left" | "down" }) {
  return (
    <svg className={`arrow arrow--${direction}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 10v4h4l5 4V6l-5 4H5Z" />
      {muted ? <path d="m17 10 4 4m0-4-4 4" /> : <path d="M17 9c1.3 1.8 1.3 4.2 0 6" />}
    </svg>
  );
}

function Loader({ progress, leaving }: { progress: number; leaving: boolean }) {
  return (
    <div className={`site-loader${leaving ? " is-leaving" : ""}`} aria-hidden="true">
      <div className="site-loader__top"><span>MIMI</span><span>DHAKA · 2026</span></div>
      <div className="site-loader__mark"><Image src="/media/mimi-logo.png" alt="" width={804} height={421} priority /></div>
      <div className="site-loader__bottom"><span>A collection in motion</span><span>{String(progress).padStart(2, "0")}%</span></div>
      <span className="site-loader__line" style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}

export default function MimiExperience() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderLeaving, setLoaderLeaving] = useState(false);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const filmRef = useRef<HTMLElement>(null);
  const runwayRef = useRef<HTMLVideoElement>(null);
  const editTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const visited = window.sessionStorage.getItem("mimi-intro-seen") === "1";
    const duration = reducedMotion || visited ? 180 : 1650;
    const start = performance.now();
    let frame = 0;
    let leaveTimer = 0;
    const tick = (now: number) => {
      const raw = Math.min(1, (now - start) / duration);
      setLoaderProgress(Math.round((1 - Math.pow(1 - raw, 3)) * 100));
      if (raw < 1) frame = requestAnimationFrame(tick);
      else {
        window.sessionStorage.setItem("mimi-intro-seen", "1");
        document.documentElement.classList.add("intro-complete");
        setLoaderLeaving(true);
        leaveTimer = window.setTimeout(() => setLoaderVisible(false), reducedMotion ? 20 : 650);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(leaveTimer); };
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (reducedMotion) { items.forEach((item) => item.classList.add("is-visible")); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]")).map((element) => ({
      element, amount: Number(element.dataset.parallax ?? 0), current: 0, target: 0,
    }));
    const zoomLayers = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-zoom]")).map((element) => ({
      element, current: 1.025, target: 1.025,
    }));
    const stackCards = Array.from(document.querySelectorAll<HTMLElement>("[data-stack-card]")).map((element) => ({
      element, current: 0, target: 0,
    }));
    let frame = 0;
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const smoothstep = (start: number, end: number, value: number) => {
      const x = clamp((value - start) / (end - start));
      return x * x * (3 - 2 * x);
    };
    const measure = () => {
      const viewport = window.innerHeight;
      const mobile = window.innerWidth < 768;
      const narrow = window.innerWidth <= 900;
      const docRange = Math.max(1, document.documentElement.scrollHeight - viewport);
      document.documentElement.style.setProperty("--page-progress", `${window.scrollY / docRange}`);
      document.documentElement.classList.toggle("header-solid", window.scrollY > viewport * 1.08);
      const hero = heroRef.current;
      if (hero) {
        const rect = hero.getBoundingClientRect();
        const progress = clamp(-rect.top / Math.max(1, hero.offsetHeight - viewport));
        const expansion = smoothstep(0, 0.72, progress);
        const exit = smoothstep(0.42, 0.94, progress);
        hero.style.setProperty("--hero-p", `${progress}`);
        // Compact widths (matching the 900px hero breakpoint) keep the film full-bleed — no letterboxed
        // frame to expand — so the scroll drives the type instead: opposing line drift and a slow push-in.
        hero.style.setProperty("--hero-scale", `${narrow ? 1.03 + progress * 0.09 : 1.12 - expansion * 0.12}`);
        hero.style.setProperty("--hero-copy-y", `${progress * (narrow ? -104 : -92)}px`);
        hero.style.setProperty("--hero-copy-opacity", `${1 - exit * (narrow ? 0.88 : 0.8)}`);
        hero.style.setProperty("--hero-clip-left", `${narrow ? 0 : (1 - expansion) * 34}vw`);
        hero.style.setProperty("--hero-clip-right", `${narrow ? 0 : (1 - expansion) * 4}vw`);
        hero.style.setProperty("--hero-clip-y", `${narrow ? 0 : (1 - expansion) * 9}vh`);
        hero.style.setProperty("--hero-radius", `${narrow ? 0 : (1 - expansion) * 34}px`);
        hero.style.setProperty("--hero-line-one-x", `${progress * (narrow ? -34 : -70)}px`);
        hero.style.setProperty("--hero-line-two-x", `${progress * (narrow ? 46 : 88)}px`);
        hero.style.setProperty("--hero-line-two-y", `${progress * (narrow ? 16 : 0)}px`);
        hero.style.setProperty("--hero-frame-opacity", `${1 - smoothstep(0.05, 0.46, progress)}`);
      }
      const film = filmRef.current;
      if (film) {
        const rect = film.getBoundingClientRect();
        const progress = clamp(-rect.top / Math.max(1, film.offsetHeight - viewport));
        film.style.setProperty("--film-p", `${progress}`);
        film.style.setProperty("--film-mask-x", `${(1 - progress) * (mobile ? 12 : 28)}%`);
        film.style.setProperty("--film-mask-y", `${(1 - progress) * (mobile ? 18 : 12)}%`);
        film.style.setProperty("--film-radius", `${(1 - progress) * (mobile ? 24 : 48)}px`);
      }
      layers.forEach((layer) => {
        const rect = layer.element.getBoundingClientRect();
        const offset = (viewport / 2 - (rect.top + rect.height / 2)) / viewport;
        layer.target = Math.min(1, Math.max(-1, offset)) * layer.amount * (mobile ? 0.68 : 1);
      });
      zoomLayers.forEach((layer) => {
        const rect = layer.element.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const proximity = clamp(1 - Math.abs(center - viewport / 2) / (viewport * 0.9));
        layer.target = 1.025 + proximity * (mobile ? 0.032 : 0.06);
      });
      stackCards.forEach((card, index) => {
        const nextCard = stackCards[index + 1];
        if (!nextCard) { card.target = 0; return; }
        const stackTop = mobile ? 70 : 54;
        const travel = Math.max(220, viewport * (mobile ? 0.38 : 0.5));
        const nextTop = nextCard.element.getBoundingClientRect().top;
        card.target = clamp((stackTop + travel - nextTop) / travel);
      });
    };
    const render = () => {
      let moving = false;
      layers.forEach((layer) => {
        const delta = layer.target - layer.current;
        layer.current = reducedMotion ? 0 : layer.current + delta * 0.13;
        layer.element.style.setProperty("--parallax-y", `${layer.current.toFixed(2)}px`);
        if (Math.abs(delta) > 0.08) moving = true;
      });
      zoomLayers.forEach((layer) => {
        const delta = layer.target - layer.current;
        layer.current = reducedMotion ? 1 : layer.current + delta * 0.11;
        layer.element.style.setProperty("--scroll-scale", layer.current.toFixed(4));
        if (Math.abs(delta) > 0.0005) moving = true;
      });
      stackCards.forEach((card) => {
        const delta = card.target - card.current;
        card.current = reducedMotion ? 0 : card.current + delta * 0.14;
        card.element.style.setProperty("--stack-scale", `${1 - card.current * (window.innerWidth < 768 ? 0.025 : 0.04)}`);
        card.element.style.setProperty("--stack-dim", `${card.current * 0.12}`);
        if (Math.abs(delta) > 0.002) moving = true;
      });
      frame = moving ? requestAnimationFrame(render) : 0;
    };
    const update = () => { measure(); if (!frame) frame = requestAnimationFrame(render); };
    measure();
    if (!reducedMotion) {
      layers.forEach((layer) => { layer.current = layer.target; layer.element.style.setProperty("--parallax-y", `${layer.current.toFixed(2)}px`); });
      zoomLayers.forEach((layer) => { layer.current = layer.target; layer.element.style.setProperty("--scroll-scale", layer.current.toFixed(4)); });
      stackCards.forEach((card) => {
        card.current = card.target;
        card.element.style.setProperty("--stack-scale", `${1 - card.current * (window.innerWidth < 768 ? 0.025 : 0.04)}`);
        card.element.style.setProperty("--stack-dim", `${card.current * 0.12}`);
      });
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.documentElement.classList.remove("header-solid");
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    const dot = document.querySelector<HTMLElement>(".cursor-dot");
    const ring = document.querySelector<HTMLElement>(".cursor-ring");
    const label = ring?.querySelector<HTMLElement>("span");
    if (!dot || !ring || !label) return;
    document.documentElement.classList.add("has-cursor");
    // Exponential smoothing: higher follow = snappier ring, still frame-rate independent.
    const follow = 45;
    let targetX = -100, targetY = -100, ringX = -100, ringY = -100, frame = 0, last = performance.now();
    const animate = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05); last = now;
      const ease = 1 - Math.exp(-follow * delta);
      ringX += (targetX - ringX) * ease; ringY += (targetY - ringY) * ease;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      frame = requestAnimationFrame(animate);
    };
    const track = (event: PointerEvent) => {
      targetX = event.clientX; targetY = event.clientY;
      dot.classList.add("is-visible"); ring.classList.add("is-visible");
    };
    const move = (event: PointerEvent) => {
      track(event);
      const interactive = (event.target as Element | null)?.closest<HTMLElement>("a, button, [data-cursor]");
      const text = interactive?.dataset.cursor ?? "";
      label.textContent = text;
      ring.classList.toggle("is-active", Boolean(interactive)); ring.classList.toggle("has-label", Boolean(text));
    };
    const leave = () => { dot.classList.remove("is-visible"); ring.classList.remove("is-visible"); };
    const down = () => ring.classList.add("is-down");
    const up = () => ring.classList.remove("is-down");
    // pointerrawupdate fires ahead of pointermove where supported, shaving a frame off the lag.
    const raw = "onpointerrawupdate" in window;
    frame = requestAnimationFrame(animate);
    if (raw) window.addEventListener("pointerrawupdate", track as EventListener, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    window.addEventListener("pointerdown", down); window.addEventListener("pointerup", up);
    return () => {
      document.documentElement.classList.remove("has-cursor"); cancelAnimationFrame(frame);
      if (raw) window.removeEventListener("pointerrawupdate", track as EventListener);
      window.removeEventListener("pointermove", move); document.documentElement.removeEventListener("mouseleave", leave);
      window.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", up);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", key);
    return () => { document.body.classList.remove("menu-open"); window.removeEventListener("keydown", key); };
  }, [menuOpen]);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-tilt]"));
    const cleanups = cards.map((card) => {
      const move = (event: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-x", `${y * -3.2}deg`); card.style.setProperty("--tilt-y", `${x * 4.2}deg`);
      };
      const leave = () => { card.style.setProperty("--tilt-x", "0deg"); card.style.setProperty("--tilt-y", "0deg"); };
      card.addEventListener("pointermove", move); card.addEventListener("pointerleave", leave);
      return () => { card.removeEventListener("pointermove", move); card.removeEventListener("pointerleave", leave); };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  const toggleVideo = async () => {
    const video = runwayRef.current; if (!video) return;
    if (video.paused) { await video.play(); setPlaying(true); } else { video.pause(); setPlaying(false); }
  };
  const toggleSound = () => {
    const video = runwayRef.current; if (!video) return;
    video.muted = !video.muted; setMuted(video.muted);
  };
  const moveEdit = (direction: number) => editTrackRef.current?.scrollBy({ left: direction * Math.min(window.innerWidth * 0.72, 520), behavior: "smooth" });

  return (
    <div id="top" className="mimi-site">
      {loaderVisible && <Loader progress={loaderProgress} leaving={loaderLeaving} />}
      <div className="cursor-dot" aria-hidden="true" />
      <div className="cursor-ring" aria-hidden="true"><span /></div>

      <header className={`site-header${menuOpen ? " menu-is-open" : ""}`}>
        <div className="site-header__bar">
          <a className="brand" href="#top" aria-label="Mimi home" data-cursor="Home"><Image src="/media/mimi-logo.png" alt="Mimi" width={804} height={421} priority /></a>
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#collection">Collection</a><a href="#campaign">Campaign</a><a href="#story">Our story</a>
          </nav>
          <div className="site-header__actions">
            <BagButton />
            <button className="menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-menu" data-cursor={menuOpen ? "Close" : "Menu"}>
              <span>{menuOpen ? "Close" : "Menu"}</span><i /><i />
            </button>
          </div>
        </div>
        <span className="page-progress" />
      </header>

      <div id="mobile-menu" className={`mobile-menu${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu__wash" />
        <nav aria-label="Mobile navigation">
          {[["01", "Collection", "#collection"], ["02", "Campaign", "#campaign"], ["03", "Lookbook", "#lookbook"], ["04", "Our story", "#story"]].map(([number, label, href]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}><small>{number}</small><span>{label}</span><Arrow /></a>
          ))}
        </nav>
        <div className="mobile-menu__foot"><span>Curated style for the conscious wardrobe.</span><a href="https://www.instagram.com/thebrand_mimi/" target="_blank" rel="noreferrer">Instagram ↗</a></div>
      </div>

      <main>
        <section className="hero" ref={heroRef} aria-labelledby="hero-title">
          <div className="hero__stage">
            <div className="hero__ghost" aria-hidden="true">MIMI</div>
            <div className="hero__media">
              <video ref={runwayRef} autoPlay muted loop playsInline preload="metadata" poster="/media/runway-poster.jpg" aria-label="Mimi runway presentation">
                <source src="/media/runway.mp4" type="video/mp4" />
              </video>
              <div className="hero__scrim" />
              <div className="hero__film-stamp" aria-hidden="true"><span>Runway film</span><b>00:28</b></div>
            </div>
            <div className="hero__copy">
              <p className="hero__eyebrow"><span /> The new collection · 2026</p>
              <h1 id="hero-title">
                <span className="hero__line hero__line--one"><i>A study</i></span>
                <span className="hero__line hero__line--two"><i>in <em>presence.</em></i></span>
              </h1>
              <div className="hero__lower">
                <p><small>Designed to be felt</small>Curated style for<br />the conscious wardrobe.</p>
                <a className="circle-link" href="#collection" data-cursor="Explore" aria-label="Explore the collection"><Arrow direction="down" /></a>
              </div>
            </div>
            <div className="hero__frame-index" aria-hidden="true"><strong>01</strong><span>OF 04<br />THE MIMI EDIT</span></div>
            <div className="hero__side-note" aria-hidden="true"><span>Scroll to expand the film</span><i /></div>
            <div className="hero__meta"><span>Fashion Runway · BUFT</span><span>Dhaka, Bangladesh</span><span>MMXXVI</span></div>
            <div className="video-controls">
              <button type="button" onClick={toggleVideo} aria-label={playing ? "Pause runway video" : "Play runway video"}>{playing ? "Pause" : "Play"}</button>
              <button type="button" onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Mute video"}><SoundIcon muted={muted} /></button>
            </div>
          </div>
        </section>

        <section className="manifesto section-pad" aria-labelledby="manifesto-title">
          <div className="manifesto__top reveal"><span className="kicker">Mimi, in her own words</span><p>Clothes can whisper<br />and still own the room.</p></div>
          <div className="manifesto__composition">
            <div className="manifesto__image manifesto__image--left parallax-layer" data-parallax="-50" data-scroll-zoom><Image src="/media/rouge-detail.webp" alt="Detail of red striped Mimi tailoring" fill sizes="(max-width: 900px) 46vw, 22vw" /></div>
            <h2 id="manifesto-title" className="reveal">Not made<br />to <em>blend in.</em></h2>
            <div className="manifesto__image manifesto__image--right parallax-layer" data-parallax="68" data-scroll-zoom><Image src="/media/olive-portrait.webp" alt="Portrait wearing Mimi olive top" fill sizes="(max-width: 900px) 46vw, 19vw" /></div>
            <p className="manifesto__note reveal">A wardrobe of fluid silhouettes, decisive colour and ease that never disappears into the background.</p>
          </div>
        </section>

        <section id="collection" className="collection" aria-labelledby="collection-title">
          <div className="collection__heading section-pad reveal">
            <div><span className="kicker">The collection · 01—04</span><h2 id="collection-title">Four moods.<br /><em>One point of view.</em></h2></div>
            <p>Each chapter shifts in colour and energy, but every silhouette is unmistakably Mimi.</p>
          </div>
          <div className="chapter-stack">
            {chapters.map((chapter, index) => (
              <article className={`chapter-card chapter-card--${chapter.tone}`} key={chapter.name} data-stack-card style={{ "--card-index": index } as React.CSSProperties}>
                <div className="chapter-card__copy">
                  <span className="chapter-card__number">Chapter {chapter.number}</span>
                  <div><h3>{chapter.name}</h3><p>{chapter.note}</p></div>
                  <a href="#edit" data-cursor="View">Explore this mood <Arrow /></a>
                </div>
                <div className="chapter-card__visual" data-tilt>
                  <div className="chapter-card__image parallax-layer" data-parallax="-32" data-scroll-zoom><Image src={chapter.image} alt={chapter.alt} fill sizes="(max-width: 767px) 100vw, 60vw" /></div>
                  <div className="chapter-card__detail parallax-layer" data-parallax="55"><Image src={chapter.detail} alt="" fill sizes="(max-width: 767px) 32vw, 16vw" /></div>
                  <span className="chapter-card__seal">M<br /><small>MMXXVI</small></span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="campaign" className="film-section" ref={filmRef} aria-labelledby="film-title">
          <div className="film-section__pin">
            <div className="film-section__media">
              <video autoPlay muted loop playsInline preload="metadata" poster="/media/campaign-poster.jpg"><source src="/media/plum-campaign.mp4" type="video/mp4" /></video>
              <div className="film-section__shade" />
            </div>
            <div className="film-section__title" id="film-title"><span>Campaign film · 00:10</span><h2>Glamour<br /><em>in motion.</em></h2></div>
            <span className="film-section__edge film-section__edge--left">02 / GLAMOUR</span><span className="film-section__edge film-section__edge--right">SCROLL TO UNFOLD</span>
          </div>
        </section>

        <section id="lookbook" className="lookbook section-pad" aria-labelledby="lookbook-title">
          <div className="lookbook__heading reveal"><span className="kicker">Shop the collection · 2026</span><h2 id="lookbook-title">The <em>lookbook</em></h2><p>Seven pieces. Seven different ways to arrive — each one ready to take home.</p></div>
          <div className="lookbook__grid">
            {products.map((product, index) => (
              <ProductCard className="lookbook-card reveal" product={product} index={index} key={product.slug} />
            ))}
          </div>
        </section>

        <section className="ticker" aria-label="Brand statement"><div className="ticker__track">{[0, 1].map((group) => <span key={group}>Wear the moment <i>✦</i> Own the room <i>✦</i> Move like Mimi <i>✦</i>&nbsp;</span>)}</div></section>

        <section id="story" className="story section-pad" aria-labelledby="story-title">
          <div className="story__visual">
            <div className="story__portrait parallax-layer" data-parallax="-56" data-scroll-zoom><Image src="/media/gold-portrait.webp" alt="Mimi evening portrait in a champagne look" fill sizes="(max-width: 767px) 90vw, 48vw" /></div>
            <div className="story__detail parallax-layer" data-parallax="72"><Image src="/media/gold-detail.webp" alt="Champagne fabric and trim detail" fill sizes="(max-width: 767px) 38vw, 18vw" /></div>
          </div>
          <div className="story__copy">
            <span className="kicker kicker--light reveal">The Mimi point of view</span>
            <h2 id="story-title" className="reveal">Style for the woman who is already becoming <em>her next self.</em></h2>
            <div className="story__body reveal"><p>Mimi explores contrast: softness with structure, ease with occasion, and statement colour with wearable calm.</p><p>Every edit is imagined as a feeling first — then translated into a silhouette you can make your own.</p></div>
            <a className="text-link reveal" href="https://www.instagram.com/thebrand_mimi/" target="_blank" rel="noreferrer" data-cursor="Follow">Follow the story on Instagram <Arrow /></a>
          </div>
        </section>

        <section id="edit" className="shop-edit" aria-labelledby="edit-title">
          <div className="shop-edit__head section-pad reveal">
            <div><span className="kicker">The current edit</span><h2 id="edit-title">Choose your <em>energy.</em></h2></div>
            <div className="shop-edit__arrows"><button type="button" onClick={() => moveEdit(-1)} aria-label="Previous looks"><Arrow direction="left" /></button><button type="button" onClick={() => moveEdit(1)} aria-label="Next looks"><Arrow /></button></div>
          </div>
          <div className="edit-track" ref={editTrackRef}>
            {products.map((product, index) => (
              <Link className="edit-card" href={`/product/${product.slug}`} key={product.slug} data-cursor="View">
                <span className="edit-card__visual"><Image className="edit-card__image edit-card__image--base" src={product.images[0].src} alt={product.name} fill sizes="(max-width: 767px) 78vw, 31vw" /><Image className="edit-card__image edit-card__image--alt" src={(product.images[1] ?? product.images[0]).src} alt="" fill sizes="(max-width: 767px) 78vw, 31vw" /><small>0{index + 1}</small></span>
                <span className="edit-card__caption"><b>{product.name}</b><i>{formatPrice(product.price)}</i></span>
              </Link>
            ))}
            <div className="edit-track__spacer" aria-hidden="true" />
          </div>
        </section>

        <section className="runway-note section-pad" aria-labelledby="runway-title">
          <div className="runway-note__line reveal"><span>BUFT · 2026</span><span>Dhaka · Bangladesh</span></div>
          <h2 id="runway-title" className="reveal">Beginning<br />of an <em>era.</em></h2>
          <div className="runway-note__bottom reveal"><p>Mimi took centre stage at the Fashion Runway 2026 — a first look at a newly launched dress collection and the energy behind it.</p><a className="circle-link circle-link--dark" href="#top" data-cursor="Top" aria-label="Back to top"><Arrow direction="down" /></a></div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer__top"><p>Ready for your<br />Mimi moment?</p><a href="https://www.instagram.com/thebrand_mimi/" target="_blank" rel="noreferrer" data-cursor="Hello">Let&apos;s talk <Arrow /></a></div>
        <div className="footer__word" aria-hidden="true">MIMI</div>
        <div className="footer__bottom"><span>© {new Date().getFullYear()} Mimi</span><span>Curated style for the conscious wardrobe.</span><a href="#top">Back to top ↑</a></div>
      </footer>
    </div>
  );
}
