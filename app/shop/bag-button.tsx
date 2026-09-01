"use client";

import { useEffect, useRef, useState } from "react";
import { useBagUI } from "./providers";
import { useBag } from "./use-bag";

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 8h12l1 12H5L6 8Z" />
      <path d="M9.2 10.4V7.4a2.8 2.8 0 0 1 5.6 0v3" />
    </svg>
  );
}

export default function BagButton({ label = "Bag" }: { label?: string }) {
  const { openBag } = useBagUI();
  const { count } = useBag();
  const [bump, setBump] = useState(false);
  const previous = useRef(count);

  // Pulse the badge whenever the bag grows, wherever the add happened.
  useEffect(() => {
    const grew = count > previous.current;
    previous.current = count;
    if (!grew) return;
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 560);
    return () => window.clearTimeout(timer);
  }, [count]);

  return (
    <button
      className={`bag-button${bump ? " is-bumping" : ""}`}
      type="button"
      onClick={openBag}
      data-cursor="Bag"
      aria-label={count > 0 ? `Open bag, ${count} item${count === 1 ? "" : "s"}` : "Open bag"}
    >
      <span className="bag-button__icon">
        <BagIcon />
        <span className="bag-button__count" data-empty={count === 0 || undefined}>{count}</span>
      </span>
      <span className="bag-button__label">{label}</span>
    </button>
  );
}
