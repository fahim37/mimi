"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ProductImage } from "./products";

/** Scale a double-tap (or the zoom button) settles on. */
const TAP_ZOOM = 2.5;
/** Ceiling a pinch can reach before it rubber-bands back. */
const MAX_ZOOM = 4;
/** Horizontal drag (px) past which a release changes image. */
const SWIPE_NAV = 56;
/** Downward drag (px) past which a release closes the viewer. */
const SWIPE_CLOSE = 96;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Fullscreen image viewer — the touch zoom path for the product gallery.
 *
 * Pinch to zoom about the fingers' midpoint, double-tap to zoom into a spot,
 * drag to pan while zoomed, wheel/trackpad to zoom about the cursor. At 1x,
 * swipe left/right to change image and swipe down to close. Arrow keys and
 * the thumbnail strip also navigate; Escape closes.
 *
 * Gestures write the transform straight to the stage element so tracking
 * stays at native frame rate instead of going through React on every move.
 */
export default function ImageViewer({
  images,
  index,
  onIndex,
  onClose,
  title,
}: {
  images: ProductImage[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  title: string;
}) {
  const [zoomed, setZoomed] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const view = useRef({ scale: 1, x: 0, y: 0 });
  const swipe = useRef({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mid: { x: number; y: number }; raw: number } | null>(null);
  const drag = useRef<{ x: number; y: number; bx: number; by: number; moved: boolean } | null>(null);
  const pinched = useRef(false);
  const lastTapAt = useRef(0);

  const apply = useCallback((transition = "none") => {
    const stage = stageRef.current;
    if (!stage) return;
    const { scale, x, y } = view.current;
    stage.style.transition = transition;
    stage.style.transform = `translate3d(${x + swipe.current.x}px, ${y + swipe.current.y}px, 0) scale(${scale})`;
    setZoomed(scale > 1.01);
  }, []);

  const reset = useCallback(
    (animate = false) => {
      view.current = { scale: 1, x: 0, y: 0 };
      swipe.current = { x: 0, y: 0 };
      apply(animate ? `transform 320ms ${EASE}` : "none");
    },
    [apply],
  );

  // Keep panning inside the image bounds as the scale changes.
  const clampPan = useCallback(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const { scale } = view.current;
    const maxX = (surface.clientWidth * (scale - 1)) / 2;
    const maxY = (surface.clientHeight * (scale - 1)) / 2;
    view.current.x = clamp(view.current.x, -maxX, maxX);
    view.current.y = clamp(view.current.y, -maxY, maxY);
  }, []);

  /** Zoom about a viewport point, keeping that point visually fixed. */
  const zoomTo = useCallback(
    (nextScale: number, clientX: number, clientY: number, animate = true) => {
      const surface = surfaceRef.current;
      if (!surface) return;
      const box = surface.getBoundingClientRect();
      const cx = clientX - box.left - box.width / 2;
      const cy = clientY - box.top - box.height / 2;
      const from = view.current.scale;
      const to = clamp(nextScale, 1, MAX_ZOOM);
      const ratio = to / from;
      view.current.scale = to;
      if (to === 1) {
        view.current.x = 0;
        view.current.y = 0;
      } else {
        view.current.x = cx - (cx - view.current.x) * ratio;
        view.current.y = cy - (cy - view.current.y) * ratio;
        clampPan();
      }
      apply(animate ? `transform 300ms ${EASE}` : "none");
    },
    [apply, clampPan],
  );

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= images.length) {
        swipe.current = { x: 0, y: 0 };
        apply(`transform 280ms ${EASE}`);
        return;
      }
      onIndex(next);
    },
    [apply, images.length, onIndex],
  );

  // Lock the page behind the viewer.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // The image remounts per index, so re-assert the (reset) transform.
  useLayoutEffect(() => {
    reset();
  }, [index, reset]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(index + 1);
      if (event.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, onClose]);

  // Keep the active thumbnail centred in the strip.
  useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.querySelector<HTMLElement>(`[data-thumb="${index}"]`);
    if (!strip || !active) return;
    strip.scrollTo({
      left: active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [index]);

  const midpoint = () => {
    const list = [...pointers.current.values()];
    return {
      x: (list[0].x + list[1].x) / 2,
      y: (list[0].y + list[1].y) / 2,
      dist: Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y),
    };
  };

  const onPointerDown = (event: React.PointerEvent) => {
    (event.target as Element).setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2) {
      pinched.current = true;
      const mid = midpoint();
      pinch.current = { dist: mid.dist, mid: { x: mid.x, y: mid.y }, raw: view.current.scale };
      drag.current = null;
      return;
    }

    drag.current = {
      x: event.clientX,
      y: event.clientY,
      bx: view.current.x,
      by: view.current.y,
      moved: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const mid = midpoint();
      const raw = pinch.current.raw * (mid.dist / pinch.current.dist);
      view.current.scale = clamp(raw, 1, MAX_ZOOM);
      view.current.x += mid.x - pinch.current.mid.x;
      view.current.y += mid.y - pinch.current.mid.y;
      pinch.current.mid = { x: mid.x, y: mid.y };
      clampPan();
      apply();
      return;
    }

    const state = drag.current;
    if (!state) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) state.moved = true;

    if (view.current.scale > 1.01) {
      view.current.x = state.bx + dx;
      view.current.y = state.by + dy;
      clampPan();
      apply();
    } else {
      // At 1x the drag is a navigation / dismiss gesture.
      swipe.current = { x: dx, y: Math.max(0, dy) };
      apply();
    }
  };

  const onPointerUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);
    const state = drag.current;

    if (pointers.current.size < 2) pinch.current = null;

    if (pointers.current.size === 0) {
      const wasPinched = pinched.current;
      pinched.current = false;

      if (view.current.scale <= 1.01 && state) {
        const { x, y } = swipe.current;
        swipe.current = { x: 0, y: 0 };

        if (y > SWIPE_CLOSE) {
          onClose();
          return;
        }
        if (Math.abs(x) > SWIPE_NAV) {
          go(index + (x < 0 ? 1 : -1));
          apply(`transform 280ms ${EASE}`);
          return;
        }
        apply(`transform 280ms ${EASE}`);

        // A clean tap (no drag, no pinch) toggles zoom at that point.
        if (!state.moved && !wasPinched) {
          const now = Date.now();
          const isDouble = now - lastTapAt.current < 300;
          lastTapAt.current = now;
          if (isDouble) zoomTo(TAP_ZOOM, event.clientX, event.clientY);
        }
        return;
      }

      // Released a pinch below 1x — spring back.
      if (view.current.scale <= 1.01) reset(true);
      else {
        clampPan();
        apply(`transform 240ms ${EASE}`);
      }
    }

    drag.current = null;
  };

  const onWheel = (event: React.WheelEvent) => {
    if (!event.ctrlKey && Math.abs(event.deltaY) < 2) return;
    const factor = event.deltaY < 0 ? 1.18 : 1 / 1.18;
    zoomTo(view.current.scale * factor, event.clientX, event.clientY, false);
  };

  const image = images[index];

  return createPortal(
    <div className="viewer" role="dialog" aria-modal="true" aria-label={`${title} images`}>
      <div className="viewer__bar">
        <span className="viewer__count">
          {index + 1} / {images.length}
        </span>
        <div className="viewer__tools">
          <button
            type="button"
            onClick={() => {
              const box = surfaceRef.current?.getBoundingClientRect();
              if (!box) return;
              zoomTo(
                view.current.scale > 1.01 ? 1 : TAP_ZOOM,
                box.left + box.width / 2,
                box.top + box.height / 2,
              );
            }}
            aria-label={zoomed ? "Zoom out" : "Zoom in"}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="9" cy="9" r="6" />
              <path d="M13.5 13.5L17 17" />
              <path d="M6.5 9h5" />
              {!zoomed && <path d="M9 6.5v5" />}
            </svg>
          </button>
          <button className="viewer__close" type="button" onClick={onClose} aria-label="Close viewer">
            Close
          </button>
        </div>
      </div>

      <div
        className={`viewer__surface${zoomed ? " is-zoomed" : ""}`}
        ref={surfaceRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div className="viewer__stage" ref={stageRef}>
          <Image
            key={image.src}
            src={image.src}
            alt={image.alt}
            fill
            sizes="100vw"
            priority
            draggable={false}
          />
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            className="viewer__nav viewer__nav--prev"
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Previous image"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            className="viewer__nav viewer__nav--next"
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === images.length - 1}
            aria-label="Next image"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>

          <div className="viewer__strip" ref={stripRef}>
            <div className="viewer__strip-inner">
              {images.map((item, i) => (
                <button
                  className={`viewer__thumb${i === index ? " is-active" : ""}`}
                  key={item.src}
                  data-thumb={i}
                  type="button"
                  onClick={() => onIndex(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={i === index}
                >
                  <Image src={item.src} alt="" fill sizes="60px" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
