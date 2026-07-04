import React from "react";

/** The Heart Print mark — heart core wrapped in fingerprint contour ridges. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} aria-label="InnerForm">
      <defs>
        <linearGradient id="if-logo-grad" x1="0" y1="1" x2="0.7" y2="0">
          <stop offset="0" stopColor="#17493A" />
          <stop offset="1" stopColor="#3BAA74" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#if-logo-grad)" strokeLinecap="round">
        <path d="M28.5 9.3 C 14 12, 6.5 24, 9.5 36.5 C 11.5 44.5, 17.5 51, 26 53.5" strokeWidth="3" opacity="0.4" />
        <path d="M36 9.5 C 49 12.5, 57 24, 54.5 36 C 53 43.5, 48 49.5, 41 52.5" strokeWidth="3" opacity="0.4" />
        <path d="M37 16.8 C 45.5 19.5, 50 27, 48 35.5 C 46.3 42.5, 40.5 47, 33 47.3" strokeWidth="3.4" opacity="0.7" />
        <path d="M27.5 17.2 C 20.5 19.8, 16.2 26, 17.3 33.5 C 18.2 39.5, 22 44.2, 27.5 46.2" strokeWidth="3.4" opacity="0.7" />
      </g>
      <path
        d="M32 40.5 C 26.5 36.7, 23.3 33.6, 23.3 29.7 C 23.3 26.8, 25.5 24.7, 28.1 24.7 C 29.7 24.7, 31.2 25.5, 32 26.8 C 32.8 25.5, 34.3 24.7, 35.9 24.7 C 38.5 24.7, 40.7 26.8, 40.7 29.7 C 40.7 33.6, 37.5 36.7, 32 40.5 Z"
        fill="url(#if-logo-grad)"
      />
    </svg>
  );
}

/** INNER + green FORM lockup. */
export function Wordmark({ size = 22, withMark = true }: { size?: number; withMark?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      {withMark && <LogoMark size={size * 1.5} />}
      <span
        className="if-display"
        style={{ fontSize: size, letterSpacing: "0.02em", lineHeight: 1 }}
      >
        INNER
        <span style={{ color: "var(--forest-500)" }}>FORM</span>
      </span>
    </span>
  );
}
