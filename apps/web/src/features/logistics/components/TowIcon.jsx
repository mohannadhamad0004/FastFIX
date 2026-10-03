// Line icons for the tow companies pages, drawn inline so they take the text color in both themes.
// 24x24 grid, 1.8 stroke.
const PATHS = {
  truck: (
    <>
      <path d="M2 16V8h11v8M13 11h4l3 3v2h-7" />
      <circle cx="6" cy="17" r="1.8" />
      <circle cx="17" cy="17" r="1.8" />
    </>
  ),
  heavy: (
    <>
      <path d="M1 16V7h13v9M14 10h4l4 4v2h-8" />
      <circle cx="5" cy="17" r="1.8" />
      <circle cx="10" cy="17" r="1.8" />
      <circle cx="18" cy="17" r="1.8" />
    </>
  ),
  wrench: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />,
  crash: (
    <>
      <path d="M3 17v-4l2-1 3-4h6l3 4" />
      <path d="M18 5l1 3 3-1-2 3 2 2-3 0-1 3-1-3" />
      <circle cx="7.5" cy="17.5" r="1.8" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </>
  ),
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  hazard: (
    <>
      <path d="M12 3l10 17H2z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  road: <path d="M8 3 4 21M16 3l4 18M12 5v2M12 11v2M12 17v2" />,
  phone: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  city: (
    <>
      <path d="M3 21V9l6-3v15M9 21V3l8 4v14M17 21v-9l4 2v7M2 21h20" />
      <path d="M12 9h2M12 13h2M12 17h2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
}

/** @param {{ name: string, size?: number, className?: string }} props */
export default function TowIcon({ name, size = 24, className }) {
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
      {PATHS[name] ?? PATHS.truck}
    </svg>
  )
}
