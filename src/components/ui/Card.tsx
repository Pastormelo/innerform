import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: number | string;
}

/** Glass card — the InnerForm surface. Translucent fill, blur, hairline border, inner top highlight. */
export function Card({ children, interactive = false, padding = 20, className = "", style, ...rest }: CardProps) {
  return (
    <div
      className={`if-glass ${interactive ? "if-interactive" : ""} ${className}`}
      style={{ padding, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="if-overline" style={{ color: "var(--text-muted)", marginBottom: 12, ...style }}>
      {children}
    </div>
  );
}
