"use client";

import { useEffect } from "react";

/**
 * Mirrors the scroll reveal on the home page so `.reveal` behaves the same
 * across routes. Re-runs whenever `key` changes (e.g. a new product slug).
 */
export function useReveal(key?: string) {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)"));
    if (items.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [key]);
}
