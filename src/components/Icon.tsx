import type { ReactNode } from "react";

const paths: Record<string, ReactNode> = {
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 11h18" /></>,
  pin: <><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  ticket: <><path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6Z" /><path d="M13 7v2M13 13v2M13 17v0" /></>,
  bookmark: <><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" /></>,
  bell: <><path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" /><path d="M10.5 20a2 2 0 0 0 3 0" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.3M8.2 13.2l7.6 4.3" /></>,
  flag: <><path d="M5 21V4M5 5h11l-1.5 3.5L16 12H5" /></>,
  chevronRight: <><path d="m9 5 7 7-7 7" /></>,
  chevronLeft: <><path d="m15 5-7 7 7 7" /></>,
  chevronDown: <><path d="m6 9 6 6 6-6" /></>,
  qr: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M14 14h3v3h-3zM20 14h1M14 20h1M18 18h3v3h-3z" /></>,
  download: <><path d="M12 3v12M7 11l5 5 5-5M5 21h14" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M17.5 14.2A6 6 0 0 1 21.5 20" /></>,
  check: <><path d="m4 12.5 5 5L20 6.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5Z" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" /></>,
  ball: <><circle cx="12" cy="12" r="9" /><path d="m12 7 3 2-1 4h-4l-1-4 3-2ZM12 16v5M6 9l3 4M18 9l-3 4" /></>,
  music: <><circle cx="7" cy="18" r="3" /><circle cx="18" cy="15" r="3" /><path d="M10 18V6l11-3v12" /></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /><circle cx="12" cy="12" r="2.5" /></>,
  star: <><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9Z" /></>,
  home: <><path d="m3 10.5 9-7 9 7V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15H4.5a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 11.5 4V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5.9Z" /></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 8l-4 4 4 4M6 12h10" /></>,
  scan: <><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M8 12h8" /></>,
  edit: <><path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" /></>,
  camera: <><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></>,
  phone: <><path d="M6 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3Z" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3 3.6M6.3 8.4A18 18 0 0 0 2 12s3.5 6 10 6a10 10 0 0 0 4.2-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  alert: <><path d="M12 3 2.5 20h19Z" /><path d="M12 9v5M12 17h.01" /></>,
  external: <><path d="M14 4h6v6M20 4l-8 8" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  whatsapp: <><path d="M20 12a8 8 0 0 1-11.9 7L4 20l1.1-3.9A8 8 0 1 1 20 12Z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.5 1-1l-1.6-.8-.9.9c-1-.4-1.8-1.2-2.2-2.2l.9-.9-.8-1.6c-.5 0-1 .4-1 1Z" /></>,
};

export type IconName = keyof typeof paths;

export function Icon({
  name,
  size = 20,
  className = "",
  strokeWidth = 1.8,
}: {
  name: IconName | string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name] ?? paths.star}
    </svg>
  );
}
