import Link from "next/link";

export default function ShopFooter() {
  return (
    <footer className="shop-footer">
      <div className="shop-footer__top">
        <p>
          Ready for your<br />Mimi moment?
        </p>
        <a
          href="https://www.instagram.com/thebrand_mimi/"
          target="_blank"
          rel="noreferrer"
          data-cursor="Hello"
        >
          Let&apos;s talk
          <svg className="arrow" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>

      <div className="shop-footer__word" aria-hidden="true">MIMI</div>

      <div className="shop-footer__bottom">
        <span>© {new Date().getFullYear()} Mimi</span>
        <Link href="/#lookbook">Shop the lookbook</Link>
        <Link href="/">Back to home ↑</Link>
      </div>
    </footer>
  );
}
