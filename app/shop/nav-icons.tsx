/** Line icons drawn to match the site's 1.5-weight stroke vocabulary. */

export function ShopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 6.4a1.7 1.7 0 1 1 1.7-1.7" />
      <path d="M12 6.4v1.9l7.4 4.6a1.3 1.3 0 0 1-.7 2.4H5.3a1.3 1.3 0 0 1-.7-2.4L12 8.3" />
      <path d="M4 15.3h16V19H4z" />
    </svg>
  );
}

/** The bag carries its own count, set inside the glyph rather than on a corner badge. */
export function BagIcon({ count = 0 }: { count?: number }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 8h12l1 12H5L6 8Z" />
      <path d="M9 10.5V6.8a3 3 0 0 1 6 0v3.7" />
      {count > 0 && (
        <text key={count} x="12" y="17.2" textAnchor="middle">
          {count > 9 ? "9+" : count}
        </text>
      )}
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="18" cy="5.5" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="18.5" r="2.6" />
      <path d="m8.4 10.8 7.3-4M8.4 13.2l7.3 4" />
    </svg>
  );
}
