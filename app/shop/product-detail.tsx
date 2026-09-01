"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ShopHeader from "./shop-header";
import ShopFooter from "./shop-footer";
import ProductCard from "./product-card";
import ImageViewer from "./image-viewer";
import PdpTopBar from "./pdp-top-bar";
import { BagIcon, ShopIcon } from "./nav-icons";
import { formatPrice, type Product } from "./products";
import { useAddToBag, useBag } from "./use-bag";
import { useBagUI } from "./providers";
import { useReveal } from "./use-reveal";

const SIZE_TABLE = [
  { label: "XS", bust: "32", waist: "25", hip: "35" },
  { label: "S", bust: "34", waist: "27", hip: "37" },
  { label: "M", bust: "36", waist: "29", hip: "39" },
  { label: "L", bust: "38", waist: "31", hip: "41" },
  { label: "XL", bust: "40", waist: "33", hip: "43" },
];

function Chevron() {
  return (
    <svg className="chev" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 6l5 5 5-5" />
    </svg>
  );
}

function ZoomGlyph() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="9" cy="9" r="6" />
      <path d="M13.5 13.5L17 17" />
      <path d="M6.5 9h5M9 6.5v5" />
    </svg>
  );
}

export default function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const router = useRouter();
  const { openBag } = useBagUI();
  const addToBag = useAddToBag();
  const { count: bagCount } = useBag();
  useReveal(product.slug);

  const [color, setColor] = useState(product.colors[0].name);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const [openPanel, setOpenPanel] = useState<string | null>("details");
  const [viewerOpen, setViewerOpen] = useState(false);

  const sizesRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const soldOut = product.sizes.every((option) => !option.available);

  // The mobile carousel drives the active index; the desktop rail sets it directly.
  const onTrackScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const next = Math.round(track.scrollLeft / track.clientWidth);
    if (next !== active) setActive(next);
  };

  // Keep the active thumbnail centred in the mobile strip while swiping.
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.querySelector<HTMLElement>(`[data-thumb="${active}"]`);
    if (!strip || !thumb) return;
    strip.scrollTo({
      left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [active]);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 2200);
    return () => window.clearTimeout(timer);
  }, [added]);

  const chooseSize = (label: string) => {
    setSize(label);
    setSizeError(false);
  };

  const openViewer = (index: number) => {
    setActive(index);
    setViewerOpen(true);
  };

  /** Mobile: glide the carousel to a slide. Desktop: swap the hero outright. */
  const goToImage = (index: number) => {
    setActive(index);
    const track = trackRef.current;
    if (track && track.clientWidth > 0) {
      track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
    }
  };

  /**
   * Desktop hover zoom: move the transform origin to the cursor so the image
   * magnifies about the point being inspected. Written straight to the node —
   * a state update per mousemove would re-render the whole page.
   */
  const onHeroMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const hero = heroRef.current;
    if (!hero) return;
    const box = hero.getBoundingClientRect();
    hero.style.setProperty("--zx", `${((event.clientX - box.left) / box.width) * 100}%`);
    hero.style.setProperty("--zy", `${((event.clientY - box.top) / box.height) * 100}%`);
  };

  const submit = useCallback(
    async (thenCheckout: boolean) => {
      if (soldOut || addToBag.isPending) return;
      if (!size) {
        setSizeError(true);
        sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      try {
        await addToBag.mutateAsync({ slug: product.slug, size, color, qty });
        if (thenCheckout) {
          router.push("/checkout");
          return;
        }
        setAdded(true);
        openBag();
      } catch {
        /* the bag write is local; a failure just leaves the bag unchanged */
      }
    },
    [addToBag, color, openBag, product.slug, qty, router, size, soldOut],
  );

  const panels = [
    {
      id: "details",
      title: "Details",
      body: (
        <ul className="pdp-panel__list">
          {product.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ),
    },
    {
      id: "fabric",
      title: "Fabric & care",
      body: (
        <div className="pdp-panel__text">
          <p>
            <b>Fabric</b>
            {product.fabric}
          </p>
          <p>
            <b>Care</b>
            {product.care}
          </p>
        </div>
      ),
    },
    {
      id: "size",
      title: "Size & fit",
      body: (
        <div className="pdp-table" role="table" aria-label="Size guide in inches">
          <div className="pdp-table__row pdp-table__row--head" role="row">
            <span role="columnheader">Size</span>
            <span role="columnheader">Bust</span>
            <span role="columnheader">Waist</span>
            <span role="columnheader">Hip</span>
          </div>
          {SIZE_TABLE.map((row) => (
            <div className="pdp-table__row" role="row" key={row.label} data-current={row.label === size || undefined}>
              <span role="cell">{row.label}</span>
              <span role="cell">{row.bust}&quot;</span>
              <span role="cell">{row.waist}&quot;</span>
              <span role="cell">{row.hip}&quot;</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "delivery",
      title: "Delivery & returns",
      body: (
        <div className="pdp-panel__text">
          <p>
            <b>Inside Dhaka</b>2–3 working days. Free above ৳15,000.
          </p>
          <p>
            <b>Outside Dhaka</b>3–5 working days via courier.
          </p>
          <p>
            <b>Exchanges</b>Within 7 days, unworn and with tags attached.
          </p>
        </div>
      ),
    },
  ];

  const addLabel = addToBag.isPending ? "Adding" : added ? "Added to bag" : "Add to bag";

  return (
    <div className={`pdp pdp--${product.tone}`}>
      <ShopHeader />
      <PdpTopBar title={product.name} />

      <main className="pdp__main">
        <nav className="pdp__crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <i aria-hidden="true">/</i>
          <Link href="/#lookbook">Lookbook</Link>
          <i aria-hidden="true">/</i>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="pdp__layout">
          <div className="pdp__gallery">
            {/* Mobile: full-bleed swipe carousel with a thumbnail strip beneath. */}
            <div className="pdp-mgallery">
              <div className="pdp-mgallery__stage">
                <div className="pdp-mgallery__track" ref={trackRef} onScroll={onTrackScroll}>
                  {product.images.map((image, index) => (
                    <button
                      className="pdp-mgallery__slide"
                      key={image.src}
                      type="button"
                      onClick={() => openViewer(index)}
                      aria-label={`Zoom ${image.alt}`}
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        priority={index === 0}
                        sizes="100vw"
                      />
                    </button>
                  ))}
                </div>

                {product.badge && <span className="pdp-gallery__badge">{product.badge}</span>}

                {product.images.length > 1 && (
                  <span className="pdp-mgallery__count" aria-hidden="true">
                    {active + 1} / {product.images.length}
                  </span>
                )}

                <span className="pdp-mgallery__zoom" aria-hidden="true">
                  <ZoomGlyph />
                </span>
              </div>

              {product.images.length > 1 && (
                <div className="pdp-thumbs" ref={stripRef}>
                  <div className="pdp-thumbs__inner">
                    {product.images.map((image, index) => (
                      <button
                        className={`pdp-thumb${index === active ? " is-active" : ""}`}
                        key={image.src}
                        data-thumb={index}
                        type="button"
                        onClick={() => goToImage(index)}
                        aria-label={`View image ${index + 1} of ${product.images.length}`}
                        aria-pressed={index === active}
                      >
                        <Image src={image.src} alt="" fill sizes="64px" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop: thumbnail rail beside a hero that magnifies on hover. */}
            <div className="pdp-dgallery">
              {product.images.length > 1 && (
                <div className="pdp-thumbs pdp-thumbs--rail" role="tablist" aria-label="Product images">
                  {product.images.map((image, index) => (
                    <button
                      className={`pdp-thumb${index === active ? " is-active" : ""}`}
                      key={image.src}
                      type="button"
                      role="tab"
                      aria-selected={index === active}
                      aria-label={`View image ${index + 1} of ${product.images.length}`}
                      onClick={() => setActive(index)}
                      onMouseEnter={() => setActive(index)}
                    >
                      <Image src={image.src} alt="" fill sizes="88px" />
                    </button>
                  ))}
                </div>
              )}

              <div
                className="pdp-hero"
                ref={heroRef}
                role="button"
                tabIndex={0}
                aria-label="Open image viewer"
                onMouseMove={onHeroMove}
                onClick={() => openViewer(active)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openViewer(active);
                  }
                }}
              >
                <Image
                  key={product.images[active].src}
                  src={product.images[active].src}
                  alt={product.images[active].alt}
                  fill
                  priority
                  sizes="52vw"
                />
                {product.badge && <span className="pdp-gallery__badge">{product.badge}</span>}
                <span className="pdp-hero__hint" aria-hidden="true">
                  <ZoomGlyph />
                </span>
              </div>
            </div>
          </div>

          <div className="pdp__info">
            <div className="pdp__info-inner">
              <span className="kicker pdp__chapter">
                Chapter {product.chapter}<i />{product.type}
              </span>

              <h1 className="pdp__title">{product.name}</h1>
              <p className="pdp__tagline">{product.tagline}</p>

              <div className="pdp__price">
                <b>{formatPrice(product.price)}</b>
                {product.compareAt && <s>{formatPrice(product.compareAt)}</s>}
                {product.compareAt && (
                  <em>Save {formatPrice(product.compareAt - product.price)}</em>
                )}
              </div>

              <p className="pdp__description">{product.description}</p>

              <div className="pdp__option">
                <div className="pdp__option-head">
                  <span className="kicker">Colour</span>
                  <b>{color}</b>
                </div>
                <div className="pdp__swatches">
                  {product.colors.map((option) => (
                    <button
                      className={`pdp-swatch${option.name === color ? " is-active" : ""}`}
                      key={option.name}
                      type="button"
                      onClick={() => setColor(option.name)}
                      aria-pressed={option.name === color}
                      aria-label={option.name}
                      title={option.name}
                    >
                      <i style={{ background: option.hex }} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pdp__option" ref={sizesRef}>
                <div className="pdp__option-head">
                  <span className="kicker">Size</span>
                  <button
                    className="pdp__size-guide"
                    type="button"
                    onClick={() => {
                      setOpenPanel("size");
                      document.getElementById("panel-size")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  >
                    Size guide
                  </button>
                </div>
                <div className={`pdp__sizes${sizeError ? " has-error" : ""}`}>
                  {product.sizes.map((option) => (
                    <button
                      className={`pdp-size${option.label === size ? " is-active" : ""}`}
                      key={option.label}
                      type="button"
                      disabled={!option.available}
                      onClick={() => chooseSize(option.label)}
                      aria-pressed={option.label === size}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="pdp__size-note" data-error={sizeError || undefined} role={sizeError ? "alert" : undefined}>
                  {sizeError ? "Choose a size to continue" : "Fits true to size — take your usual."}
                </p>
              </div>

              <div className="pdp__actions">
                <div className="pdp__qty">
                  <button
                    type="button"
                    onClick={() => setQty((value) => Math.max(1, value - 1))}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                  >
                    <svg viewBox="0 0 12 12" aria-hidden="true">
                      <path d="M2.5 6h7" />
                    </svg>
                  </button>
                  <span aria-live="polite">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((value) => Math.min(9, value + 1))}
                    disabled={qty >= 9}
                    aria-label="Increase quantity"
                  >
                    <svg viewBox="0 0 12 12" aria-hidden="true">
                      <path d="M6 2.5v7M2.5 6h7" />
                    </svg>
                  </button>
                </div>

                <button
                  className={`btn btn--fill pdp__add${added ? " is-added" : ""}`}
                  type="button"
                  onClick={() => submit(false)}
                  disabled={soldOut || addToBag.isPending}
                  data-cursor={soldOut ? undefined : "Add"}
                >
                  <span>{soldOut ? "Sold out" : addLabel}</span>
                  {addToBag.isPending && <i className="btn__spinner" aria-hidden="true" />}
                  {added && !addToBag.isPending && (
                    <svg className="btn__tick" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M4 10.5l4 4 8-9" />
                    </svg>
                  )}
                </button>
              </div>

              <button
                className="btn btn--ghost pdp__buy"
                type="button"
                onClick={() => submit(true)}
                disabled={soldOut || addToBag.isPending}
              >
                Buy it now
              </button>

              <ul className="pdp__assurances">
                <li>Free delivery over ৳15,000</li>
                <li>7-day exchange</li>
                <li>Made in Dhaka</li>
              </ul>

              <div className="pdp__panels">
                {panels.map((panel) => {
                  const isOpen = openPanel === panel.id;
                  return (
                    <div className="pdp-panel" key={panel.id} id={`panel-${panel.id}`} data-open={isOpen || undefined}>
                      <button
                        className="pdp-panel__trigger"
                        type="button"
                        onClick={() => setOpenPanel(isOpen ? null : panel.id)}
                        aria-expanded={isOpen}
                        aria-controls={`panel-body-${panel.id}`}
                      >
                        {panel.title}
                        <Chevron />
                      </button>
                      <div className="pdp-panel__wrap" id={`panel-body-${panel.id}`} role="region" inert={!isOpen}>
                        <div className="pdp-panel__inner">{panel.body}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="pdp-related" aria-labelledby="related-title">
            <div className="pdp-related__head reveal">
              <span className="kicker">Styled alongside</span>
              <h2 id="related-title">
                Complete the <em>look.</em>
              </h2>
            </div>
            <div className="pdp-related__grid">
              {related.map((item, index) => (
                <ProductCard product={item} key={item.slug} index={index} />
              ))}
            </div>
          </section>
        )}
      </main>

      <ShopFooter />

      <div className="pdp-bar">
        <Link className="pdp-bar__tab" href="/#lookbook" aria-label="Back to the lookbook">
          <span className="pdp-bar__icon">
            <ShopIcon />
          </span>
          <span>Shop</span>
        </Link>

        <button
          className="pdp-bar__tab"
          type="button"
          onClick={openBag}
          aria-label={bagCount > 0 ? `Open bag, ${bagCount} item${bagCount === 1 ? "" : "s"}` : "Open bag"}
        >
          <span className="pdp-bar__icon">
            <BagIcon count={bagCount} />
          </span>
          <span>Bag</span>
        </button>

        {soldOut ? (
          <button className="btn btn--ghost pdp-bar__cta" type="button" disabled>
            <span>Sold out</span>
          </button>
        ) : (
          <>
            <button
              className={`btn btn--ghost pdp-bar__cta${added ? " is-added" : ""}`}
              type="button"
              onClick={() => submit(false)}
              disabled={addToBag.isPending}
            >
              <span>{addToBag.isPending ? "Adding" : added ? "Added" : "Add to bag"}</span>
              {addToBag.isPending && <i className="btn__spinner" aria-hidden="true" />}
            </button>
            <button
              className="btn btn--fill pdp-bar__cta"
              type="button"
              onClick={() => submit(true)}
              disabled={addToBag.isPending}
            >
              <span>Buy now</span>
            </button>
          </>
        )}
      </div>

      {viewerOpen && (
        <ImageViewer
          images={product.images}
          index={active}
          onIndex={goToImage}
          onClose={() => setViewerOpen(false)}
          title={product.name}
        />
      )}
    </div>
  );
}
