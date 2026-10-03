// Line icons for the catalogue (groups, categories, part placeholders), drawn inline so they take
// the text color in both themes. 24x24 grid, 1.8 stroke. Names are the `icon` values in catalog.js.
const PATHS = {
  engine: (
    <>
      <path d="M4 10h2V8h3V6h6v2h2l2 2h1v6h-1l-2 2H9l-2-2H4z" />
      <path d="M9 12h6M12 9v6" />
    </>
  ),
  brake: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M16.5 5.5a8 8 0 0 1 2 3.5" strokeWidth="3" />
    </>
  ),
  filter: (
    <>
      <path d="M7 4h10v3H7zM7 17h10v3H7z" />
      <path d="M8 7v10M11 7v10M13 7v10M16 7v10" />
    </>
  ),
  suspension: (
    <>
      <path d="M12 2v3M12 19v3M9 5h6M9 19h6" />
      <path d="M9 7l6 2-6 2 6 2-6 2 6 2" />
    </>
  ),
  battery: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M7 7V5h3v2M14 7V5h3v2M7 13h3M15.5 11.5v3M14 13h3" />
    </>
  ),
  light: (
    <>
      <path d="M13 6c-4 0-7 2.5-7 6s3 6 7 6V6z" />
      <path d="M16 8l4-1M16 12h5M16 16l4 1" />
    </>
  ),
  body: (
    <>
      <path d="M3 16v-4l2-1 3-4h8l3 4 2 1v4z" />
      <circle cx="7.5" cy="16.5" r="1.8" />
      <circle cx="16.5" cy="16.5" r="1.8" />
      <path d="M9 7v4M15 7v4M5 11h14" />
    </>
  ),
  cooling: (
    <>
      <path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0z" />
      <path d="M12 9v7" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </>
  ),
  oil: (
    <>
      <path d="M4 10h9l3-3 4 2-5 9H5a1 1 0 0 1-1-1z" />
      <path d="M7 10V8h4v2M20 14c0 1.5-1 2.5-1 2.5s-1-1-1-2.5 1-2.5 1-2.5 1 1 1 2.5z" />
    </>
  ),
  drop: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  tire: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </>
  ),
  wheel: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10V4M13.9 11.4l5.7-1.9M13.2 13.6l3.5 4.9M10.8 13.6l-3.5 4.9M10.1 11.4 4.4 9.5" />
    </>
  ),
  accessories: (
    <>
      <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" />
    </>
  ),
  roof: (
    <>
      <path d="M3 17v-4l2-1 3-4h8l3 4 2 1v4z" />
      <path d="M7 5h10M9 5v3M15 5v3" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="7" width="13" height="10" rx="2" />
      <path d="M16 11l5-3v8l-5-3" />
      <circle cx="9.5" cy="12" r="2.5" />
    </>
  ),
  seat: (
    <>
      <path d="M8 3h5l-1 9H7z" />
      <path d="M7 12h9l2 5H6zM8 17v4M16 17v4" />
    </>
  ),
  wrench: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />,
  jack: (
    <>
      <path d="M3 20h18M6 20v-3h12v3" />
      <path d="M12 17V8M9 8h6M10 5h4v3h-4z" />
    </>
  ),
  scanner: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M9 7h6v5H9zM9 15h2M13 15h2M9 18h6" />
    </>
  ),
  cube: (
    <>
      <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
      <path d="m3 7 9 5 9-5M12 12v10" />
    </>
  ),
  car: (
    <>
      <path d="M3 16v-4l2-1 3-4h8l3 4 2 1v4z" />
      <circle cx="7.5" cy="16.5" r="1.8" />
      <circle cx="16.5" cy="16.5" r="1.8" />
    </>
  ),
  shop: (
    <>
      <path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12V4h8l10 10-8 8z" />
      <circle cx="7.5" cy="8.5" r="1.5" />
    </>
  ),
}

/**
 * @param {Object} props
 * @param {string} props.name   an icon name from catalog.js (unknown names fall back to "engine")
 * @param {number} [props.size] in px
 */
export default function CatalogIcon({ name, size = 24, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name] ?? PATHS.engine}
    </svg>
  )
}
