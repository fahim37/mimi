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
  // Set by the visitor's own Pause tap, so the off-screen pause/resume never overrides it.
  const userPausedRef = useRef(false);
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
    const root = document.documentElement;
    // One style write per property, and only when the value actually changes. Outside the
    // hero's pin the sixteen hero variables are constant, and re-setting them every scroll
    // frame would still invalidate the whole subtree's style for nothing.
    const writer = (element: HTMLElement | null) => {
      const last = new Map<string, string>();
      return (name: string, value: string) => {
        if (!element || last.get(name) === value) return;
        last.set(name, value);
        element.style.setProperty(name, value);
      };
    };
    const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]")).map((element) => ({
      element, amount: Number(element.dataset.parallax ?? 0), inStack: element.closest(".chapter-card") !== null, current: 0, target: 0, set: writer(element),
    }));
    const zoomLayers = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-zoom]")).map((element) => ({
      element, inStack: element.closest(".chapter-card") !== null, current: 1.025, target: 1.025, set: writer(element),
    }));
    const stackCards = Array.from(document.querySelectorAll<HTMLElement>("[data-stack-card]")).map((element) => ({
      element, current: 0, target: 0, stickyTop: 0, set: writer(element),
    }));
    const scrubbedReveals = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-reveal]")).map((element) => ({
      element, progress: 0, set: writer(element),
    }));
    const hero = heroRef.current;
    const film = filmRef.current;
    const stack = document.querySelector<HTMLElement>(".chapter-stack");
    const setHero = writer(hero);
    const setFilm = writer(film);
    // --page-progress changes every scroll frame and exactly one element reads it. Set on
    // :root it invalidated the whole document's style on each of those frames, because custom
    // properties inherit; set on the bar itself the recalc stops at one element.
    const setProgress = writer(document.querySelector<HTMLElement>(".page-progress"));
    // Each card pins at its own sticky offset (staggered on mobile so the card below keeps a
    // visible edge), so read the resolved value instead of hard-coding the breakpoint here.
    const measureStackTops = () => {
      stackCards.forEach((card) => {
        card.stickyTop = Number.parseFloat(window.getComputedStyle(card.element).top) || 0;
      });
    };
    // Viewport metrics are cached on resize rather than read per frame. clientHeight, not
    // innerHeight: innerHeight shrinks by the height of the phone's address bar while the bar is
    // up, so every pin progress derived from it would remap the instant the bar retracts and the
    // choreography would jump a step. clientHeight is the large viewport the pins are sized to
    // (100lvh) and holds still through the bar, so the scrub stays continuous.
    const readViewport = () => document.documentElement.clientHeight || window.innerHeight;
    let viewport = readViewport();
    let width = window.innerWidth;
    // scrollHeight only moves when the content does — on resize, or as media finish loading —
    // and reading it costs a layout flush whenever anything above is dirty. Cached, not polled.
    let docRange = 1;
    const measureDoc = () => { docRange = Math.max(1, root.scrollHeight - viewport); };
    let frame = 0;
    let dirty = false;
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const smoothstep = (start: number, end: number, value: number) => {
      const x = clamp((value - start) / (end - start));
      return x * x * (3 - 2 * x);
    };
    // A film opened out to the edges of the screen shouldn't have the solid header parked on
    // it as a black slab. True while a pinned panel still covers the strip the bar sits in —
    // it keeps covering it as the section leaves, so the test is the bottom edge, not the
    // whole viewport.
    const coversChrome = (box: DOMRect) => box.top <= 1 && box.bottom >= 88;
    // Everything the scroll position decides, in two strict halves: every measurement first,
    // then every style write. A getBoundingClientRect that follows a style write forces the
    // browser to flush that write before answering, and with thirty-odd measured elements the
    // old interleaved loop paid for that flush many times per frame — the main-thread cost that
    // showed up as stutter on phones.
    const measure = () => {
      const mobile = width < 768;
      const narrow = width <= 900;
      // ---- reads ----
      const scrollY = window.scrollY;
      const heroRect = hero?.getBoundingClientRect();
      const heroRange = hero ? Math.max(1, hero.offsetHeight - viewport) : 1;
      const filmRect = film?.getBoundingClientRect();
      const filmRange = film ? Math.max(1, film.offsetHeight - viewport) : 1;
      // Below 900px the stylesheet retires the stack's own drift and push-in — a few pixels of
      // movement on a pinned card, for eight promoted layers. Easing them back to rest here
      // instead of measuring them saves twelve rect reads a frame and lets the writer fall
      // silent once they arrive.
      layers.forEach((layer) => {
        if (layer.inStack && narrow) { layer.target = 0; return; }
        const rect = layer.element.getBoundingClientRect();
        const offset = (viewport / 2 - (rect.top + rect.height / 2)) / viewport;
        layer.target = Math.min(1, Math.max(-1, offset)) * layer.amount * (mobile ? 0.68 : 1);
      });
      zoomLayers.forEach((layer) => {
        if (layer.inStack && narrow) { layer.target = 1.025; return; }
        const rect = layer.element.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const proximity = clamp(1 - Math.abs(center - viewport / 2) / (viewport * 0.9));
        layer.target = 1.025 + proximity * (mobile ? 0.032 : 0.06);
      });
      // Scrubbed entrances: --reveal-p is a pure function of where the element
      // sits, never a latched class, so the wipe opens on the way down and runs
      // backwards on the way up instead of staying played out. It starts as the
      // top edge crosses the fold and is settled by the time the element reaches
      // the lower middle — a short window, so the content is readable early
      // rather than still assembling halfway up the screen.
      scrubbedReveals.forEach((item) => {
        const top = item.element.getBoundingClientRect().top;
        item.progress = reducedMotion ? 1 : smoothstep(viewport * 1.0, viewport * 0.6, top);
      });
      stackCards.forEach((card, index) => {
        const nextCard = stackCards[index + 1];
        if (!nextCard) { card.target = 0; return; }
        const travel = Math.max(220, viewport * (narrow ? 0.38 : 0.5));
        const nextTop = nextCard.element.getBoundingClientRect().top;
        card.target = clamp((nextCard.stickyTop + travel - nextTop) / travel);
      });
      // ---- writes ----
      setProgress("--page-progress", (scrollY / docRange).toFixed(4));
      root.classList.toggle("header-solid", scrollY > viewport * 1.08);
      let immersive = false;
      if (hero && heroRect) {
        const progress = clamp(-heroRect.top / heroRange);
        const expansion = smoothstep(0, 0.72, progress);
        // Compact widths never letterbox the hero film, so it is full-bleed the whole pin.
        if (coversChrome(heroRect) && (narrow || expansion > 0.45)) immersive = true;
        // Staged exit: the eyebrow and lower copy clear out first, then the headline lifts word by word
        // behind each line's mask (--hero-word-p drives the stagger in CSS). Everything is gone by ~60%
        // of the pin, so the film finishes the section alone instead of the type hanging on to the end.
        const tail = smoothstep(0.03, 0.4, progress);
        const words = smoothstep(0.1, 0.8, progress);
        setHero("--hero-p", `${progress}`);
        // Compact widths (matching the 900px hero breakpoint) keep the film full-bleed — no letterboxed
        // frame to expand — so the scroll drives the type instead: opposing line drift and a slow push-in.
        setHero("--hero-scale", `${narrow ? 1.03 + progress * 0.09 : 1.12 - expansion * 0.12}`);
        // The block drifts slower than the film (parallax lag); the word lift supplies the acceleration.
        setHero("--hero-copy-y", `${progress * (narrow ? -96 : -120)}px`);
        setHero("--hero-copy-opacity", `${1 - smoothstep(0.68, 0.8, progress)}`);
        setHero("--hero-copy-events", tail > 0.85 ? "none" : "auto");
        setHero("--hero-tail-p", `${tail}`);
        setHero("--hero-word-p", `${words}`);
        // Phones never letterbox the film (the stylesheet drops the clip-path there entirely), so
        // these stay constant on compact widths and the writer skips them after the first frame.
        setHero("--hero-clip-left", `${narrow ? 0 : (1 - expansion) * 34}vw`);
        setHero("--hero-clip-right", `${narrow ? 0 : (1 - expansion) * 4}vw`);
        setHero("--hero-clip-y", `${narrow ? 0 : (1 - expansion) * 9}vh`);
        setHero("--hero-radius", `${narrow ? 0 : (1 - expansion) * 34}px`);
        setHero("--hero-line-one-x", `${progress * (narrow ? -40 : -78)}px`);
        setHero("--hero-line-two-x", `${progress * (narrow ? 56 : 100)}px`);
        setHero("--hero-line-two-y", `${progress * (narrow ? 14 : 0)}px`);
        setHero("--hero-frame-opacity", `${1 - smoothstep(0.05, 0.46, progress)}`);
      }
      if (film && filmRect) {
        const progress = clamp(-filmRect.top / filmRange);
        // The frame opens over the same scroll distance as the pin used to run for, then the extra
        // height added on the end holds it full-bleed for a beat before the lookbook takes over.
        const opening = clamp(progress / (mobile ? 0.62 : 0.63));
        // The plate comes off early in the opening rather than at the end: both pinned sections sit
        // on near-black, so the bar reads the same either way and the swap is finished well before
        // the frame slides up under it.
        if (coversChrome(filmRect) && opening > 0.32) immersive = true;
        setFilm("--film-p", `${progress}`);
        setFilm("--film-mask-x", `${(1 - opening) * (mobile ? 12 : 28)}%`);
        setFilm("--film-mask-y", `${(1 - opening) * (mobile ? 18 : 12)}%`);
        setFilm("--film-radius", `${(1 - opening) * (mobile ? 24 : 48)}px`);
      }
      root.classList.toggle("header-immersive", immersive);
      scrubbedReveals.forEach((item) => item.set("--reveal-p", item.progress.toFixed(4)));
    };
    // The eased layers: writes only, so it can share a frame with measure() without ever
    // forcing a flush. Returns whether anything is still settling toward its target.
    // A per-frame smoothing rate is only the rate you wrote at 60fps. A phone dropping to 45 or
    // 30 settles at half that speed for the same constant — the deck visibly trailing the finger,
    // which reads as lag even on frames that were never dropped. Converting each rate over the
    // frame's real duration keeps the feel identical at any refresh rate; the clamp stops a long
    // idle or a backgrounded tab from snapping everything into place at once on the way back.
    let lastFrame = 0;
    const render = (now = performance.now()) => {
      const narrow = width <= 900;
      const step = lastFrame ? Math.min(3, (now - lastFrame) / 16.667) : 1;
      lastFrame = now;
      const rate = (perFrame: number) => 1 - Math.pow(1 - perFrame, step);
      const parallaxRate = rate(0.13);
      const zoomRate = rate(0.11);
      const stackRate = rate(0.14);
      let moving = false;
      layers.forEach((layer) => {
        const delta = layer.target - layer.current;
        layer.current = reducedMotion ? 0 : layer.current + delta * parallaxRate;
        layer.set("--parallax-y", `${layer.current.toFixed(2)}px`);
        if (Math.abs(delta) > 0.08) moving = true;
      });
      zoomLayers.forEach((layer) => {
        const delta = layer.target - layer.current;
        layer.current = reducedMotion ? 1 : layer.current + delta * zoomRate;
        layer.set("--scroll-scale", layer.current.toFixed(4));
        if (Math.abs(delta) > 0.0005) moving = true;
      });
      stackCards.forEach((card) => {
        const delta = card.target - card.current;
        card.current = reducedMotion ? 0 : card.current + delta * stackRate;
        card.set("--stack-scale", (1 - card.current * (narrow ? 0.03 : 0.04)).toFixed(4));
        card.set("--stack-dim", (card.current * 0.12).toFixed(4));
        if (Math.abs(delta) > 0.002) moving = true;
      });
      // Reduced motion pins every layer at rest, so there is nothing to keep settling.
      return moving && !reducedMotion;
    };
    // The scroll listener only flags the frame; all work happens in one requestAnimationFrame
    // per frame, so a burst of scroll events never measures the page more than once.
    const tick = (now: number) => {
      frame = 0;
      if (dirty) { dirty = false; measure(); }
      if (render(now)) frame = requestAnimationFrame(tick);
    };
    // lastFrame resets only when the loop had gone quiet, so the first frame of a new burst is
    // one step rather than the whole idle gap.
    const schedule = () => { dirty = true; if (!frame) { lastFrame = 0; frame = requestAnimationFrame(tick); } };
    const onResize = () => {
      viewport = readViewport();
      width = window.innerWidth;
      measureDoc();
      measureStackTops();
      schedule();
    };
    measureDoc();
    measureStackTops();
    measure();
    if (!reducedMotion) {
      layers.forEach((layer) => { layer.current = layer.target; });
      zoomLayers.forEach((layer) => { layer.current = layer.target; });
      stackCards.forEach((card) => { card.current = card.target; });
    }
    render();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    // The stylesheet hangs the cards' will-change off .is-live. Half a viewport of margin means
    // the layers exist before the first card starts scaling and are handed back once the deck is
    // gone, so the rest of the page never carries their memory.
    const stackLive = new IntersectionObserver(([entry]) => {
      stack?.classList.toggle("is-live", entry.isIntersecting);
    }, { rootMargin: "50% 0px" });
    if (stack) stackLive.observe(stack);
    // Late-loading media change the document height without firing resize, and docRange is no
    // longer re-read every frame, so watch for it instead.
    const growth = new ResizeObserver(() => { measureDoc(); schedule(); });
    growth.observe(document.body);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      stackLive.disconnect();
      growth.disconnect();
      stack?.classList.remove("is-live");
      root.classList.remove("header-solid", "header-immersive");
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // A film that has scrolled out of view still decodes every frame on Android (WebKit already
  // pauses hidden autoplay video; Chrome does not), and that decode competes with the
  // manifesto's scroll work directly under the hero. Pause it off-screen and pick it back up
  // on the way in — unless the visitor paused it themselves.
  useEffect(() => {
    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>("video[autoplay]"));
    if (videos.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (!entry.isIntersecting) { video.pause(); return; }
        if (video === runwayRef.current && userPausedRef.current) return;
        video.play().catch(() => {});
      });
    }, { rootMargin: "20% 0px" });
    videos.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
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
    if (video.paused) { userPausedRef.current = false; await video.play(); setPlaying(true); }
    else { userPausedRef.current = true; video.pause(); setPlaying(false); }
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
            <a href="#collection">Collection</a><a href="#campaign">Campaign</a><a href="#story">Our story</a><Link href="/contact">Contact</Link>
          </nav>
          <div className="site-header__actions">
            <BagButton />
            <button className="menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? "Close menu" : "Open menu"} data-cursor={menuOpen ? "Close" : "Menu"}>
              <i /><i />
            </button>
          </div>
        </div>
        <span className="page-progress" />
      </header>

      <div id="mobile-menu" className={`mobile-menu${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu__wash" />
        <nav aria-label="Mobile navigation">
          {[["01", "Collection", "#collection"], ["02", "Campaign", "#campaign"], ["03", "Lookbook", "#lookbook"], ["04", "Our story", "#story"], ["05", "Contact", "/contact"]].map(([number, label, href]) => {
            const body = <><small>{number}</small><span>{label}</span><Arrow /></>;
            return href.startsWith("/")
              ? <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{body}</Link>
              : <a key={href} href={href} onClick={() => setMenuOpen(false)}>{body}</a>;
          })}
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
              <p className="hero__eyebrow"><span /> <i>The new collection · 2026</i></p>
              <h1 id="hero-title">
                <span className="hero__line hero__line--one">
                  <i><span className="hero__word">A</span> <span className="hero__word">study</span></i>
                </span>
                <span className="hero__line hero__line--two">
                  <i><span className="hero__word">in</span> <span className="hero__word"><em>presence.</em></span></i>
                </span>
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
          <div className="manifesto__top" data-scroll-reveal>
            <span className="kicker manifesto__mask manifesto__mask--line"><span>Mimi, in her own words</span></span>
            <p className="parallax-layer" data-parallax="16">
              <span className="manifesto__mask manifesto__mask--line"><span>Clothes can whisper</span></span>
              <span className="manifesto__mask manifesto__mask--line"><span>and still own the room.</span></span>
            </p>
          </div>
          <div className="manifesto__composition">
            <div className="manifesto__image manifesto__image--left parallax-layer" data-parallax="-50" data-scroll-reveal>
              <span className="manifesto__image-inner" data-scroll-zoom>
                <Image src="/media/rouge-detail.webp" alt="Detail of red striped Mimi tailoring" fill sizes="(max-width: 900px) 46vw, 22vw" />
              </span>
            </div>
            <h2 id="manifesto-title" className="parallax-layer" data-parallax="-30" data-scroll-reveal>
              <span className="manifesto__mask"><span>Not</span></span> <span className="manifesto__mask"><span>made</span></span>
              <br />
              <span className="manifesto__mask"><span>to</span></span> <span className="manifesto__mask"><span><em>blend in.</em></span></span>
            </h2>
            <div className="manifesto__image manifesto__image--right parallax-layer" data-parallax="68" data-scroll-reveal>
              <span className="manifesto__image-inner" data-scroll-zoom>
                <Image src="/media/olive-portrait.webp" alt="Portrait wearing Mimi olive top" fill sizes="(max-width: 900px) 46vw, 19vw" />
              </span>
            </div>
            <p className="manifesto__note" data-scroll-reveal>A wardrobe of fluid silhouettes, decisive colour and ease that never disappears into the background.</p>
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
            <div className="chapter-stack__tail" aria-hidden="true" />
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
        <div className="footer__top"><p>Ready for your<br />Mimi moment?</p><Link href="/contact" data-cursor="Hello">Let&apos;s talk <Arrow /></Link></div>
        <div className="footer__word" aria-hidden="true">MIMI</div>
        <div className="footer__bottom"><span>© {new Date().getFullYear()} Mimi</span><span>Curated style for the conscious wardrobe.</span><a href="#top">Back to top ↑</a></div>
      </footer>
    </div>
  );
}
