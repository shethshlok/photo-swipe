type P = { size?: number; className?: string; stroke?: number };

export const Heart = ({ size = 24, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 21s-7.5-4.6-10-9.3C.6 8.5 2 5 5.3 5c2 0 3.3 1.2 4.2 2.4.5.7 1.5.7 2 0C12.4 6.2 13.7 5 15.7 5 19 5 20.4 8.5 19 11.7 16.5 16.4 12 21 12 21z" />
  </svg>
);

export const Close = ({ size = 24, className, stroke = 2.6 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const ArrowUp = ({ size = 24, className, stroke = 2.6 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

export const Undo = ({ size = 24, className, stroke = 2.2 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h11a5 5 0 015 5v1" />
  </svg>
);

export const Check = ({ size = 24, className, stroke = 3 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12l5 5 9-11" />
  </svg>
);

export const Trash = ({ size = 24, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9z" />
  </svg>
);

export const Shield = ({ size = 24, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 1l9 4v6c0 5-3.8 9.4-9 11-5.2-1.6-9-6-9-11V5l9-4z" />
  </svg>
);

export const Pin = ({ size = 24, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
  </svg>
);

export const Bolt = ({ size = 24, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
  </svg>
);

export const EyeOff = ({ size = 24, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0116 0z" />
  </svg>
);

export const Apple = ({ size = 20, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16.5 12.4c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.5-.1-2.8.9-3.5.9s-1.9-.9-3.1-.8c-1.6 0-3 .9-3.8 2.4-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.4-1-2.4-3.7zM14.3 5.3c.6-.8 1-1.9.9-3-1 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-.9 2.9 1.1 0 2.2-.6 2.8-1.3z" />
  </svg>
);

export const Download = ({ size = 20, className, stroke = 2.6 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

