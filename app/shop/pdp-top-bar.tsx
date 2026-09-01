"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BagIcon, ShareIcon } from "./nav-icons";
import { useBagUI } from "./providers";
import { useBag } from "./use-bag";

/** Scroll depth (px) at which the bar turns solid and the title fades in. */
const SOLID_AT = 96;

/**
 * Mobile-only product page chrome. Starts as translucent chips floating over
 * the full-bleed gallery, then becomes a solid frosted bar carrying the
 * product name once the page scrolls.
 */
export default function PdpTopBar({ title }: { title: string }) {
  const { openBag } = useBagUI();
  const { count } = useBag();
  const [solid, setSolid] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > SOLID_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // The share sheet was dismissed, or the clipboard was blocked.
    }
  };

  return (
    <div className={`pdp-topbar${solid ? " is-solid" : ""}`}>
      <div className="pdp-topbar__row">
        <Link className="pdp-topbar__brand" href="/" aria-label="Mimi home">
          <Image src="/media/mimi-logo.png" alt="Mimi" width={804} height={421} priority />
        </Link>

        <p className="pdp-topbar__title" aria-hidden={!solid}>
          {title}
        </p>

        <button className="pdp-topbar__chip" type="button" onClick={share} aria-label="Share this piece">
          <ShareIcon />
        </button>

        <button
          className="pdp-topbar__chip"
          type="button"
          onClick={openBag}
          aria-label={count > 0 ? `Open bag, ${count} item${count === 1 ? "" : "s"}` : "Open bag"}
        >
          <BagIcon count={count} />
        </button>
      </div>

      <span className="pdp-topbar__toast" data-show={copied || undefined} role="status">
        Link copied
      </span>
    </div>
  );
}
