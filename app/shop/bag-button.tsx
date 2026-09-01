"use client";

import { useEffect, useRef, useState } from "react";
import { useBagUI } from "./providers";
import { useBag } from "./use-bag";

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
      className="bag-button"
      type="button"
      onClick={openBag}
      data-cursor="Bag"
      aria-label={count > 0 ? `Open bag, ${count} item${count === 1 ? "" : "s"}` : "Open bag"}
    >
      <span className="bag-button__label">{label}</span>
      <span className={`bag-button__count${bump ? " is-bumping" : ""}`} data-empty={count === 0 || undefined}>
        {count}
      </span>
    </button>
  );
}
