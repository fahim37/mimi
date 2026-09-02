"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import BagButton from "./bag-button";

export default function ShopHeader() {
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`shop-header${lifted ? " is-lifted" : ""}`}>
      <Link className="shop-header__brand" href="/" aria-label="Mimi home" data-cursor="Home">
        <Image src="/media/mimi-logo.png" alt="Mimi" width={804} height={421} priority />
      </Link>

      <nav className="shop-header__nav" aria-label="Shop navigation">
        <Link href="/#lookbook">Shop</Link>
        <Link href="/#collection">Collection</Link>
        <Link href="/#story">Our story</Link>
        <Link href="/contact">Contact</Link>
      </nav>

      <div className="shop-header__actions">
        <BagButton />
      </div>
    </header>
  );
}
