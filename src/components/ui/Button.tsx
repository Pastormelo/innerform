"use client";

import React from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, React.CSSProperties> = {
  sm: { height: 36, padding: "0 16px", fontSize: 14, gap: 6 },
  md: { height: 46, padding: "0 22px", fontSize: 16, gap: 8 },
  lg: { height: 56, padding: "0 30px", fontSize: 18, gap: 10 },
};

const VARIANTS: Record<Variant, React.CSSProperties> = {
  primary: { background: "var(--forest-500)", color: "var(--text-on-forest)", border: "1px solid transparent" },
  secondary: { background: "var(--surface-card)", color: "var(--text-primary)", border: "1px solid var(--border-strong)" },
  outline: { background: "transparent", color: "var(--text-primary)", border: "1.5px solid var(--border-strong)" },
  ghost: { background: "transparent", color: "var(--text-primary)", border: "1px solid transparent" },
  danger: { background: "var(--danger-500)", color: "#fff", border: "1px solid transparent" },
  gold: { background: "var(--grad-gold)", color: "var(--ink-950)", border: "1px solid transparent" },
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  style,
  ...rest
}: ButtonProps) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const s = SIZES[size];
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPress(false);
      }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      onTouchStart={() => setPress(true)}
      onTouchEnd={() => setPress(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        width: fullWidth ? "100%" : "auto",
        height: s.height,
        padding: s.padding,
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        fontSize: s.fontSize,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        borderRadius: "var(--radius-pill)",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.45 : 1,
        transform: press && !isDisabled ? "scale(0.965)" : "scale(1)",
        filter: hover && !isDisabled && (variant === "primary" || variant === "danger") ? "brightness(1.06)" : "none",
        boxShadow: hover && !isDisabled && variant === "primary" ? "var(--glow-forest)" : "none",
        transition:
          "transform var(--dur-fast) var(--ease-spring), box-shadow var(--dur-base) var(--ease-out), filter var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)",
        WebkitTapHighlightColor: "transparent",
        ...VARIANTS[variant],
        ...(variant === "ghost" && hover && !isDisabled ? { background: "var(--border-subtle)" } : {}),
        ...style,
      }}
      {...rest}
    >
      {loading ? <Spinner /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
}

function Spinner() {
  return (
    <span
      style={{
        width: 16,
        height: 16,
        border: "2px solid currentColor",
        borderTopColor: "transparent",
        borderRadius: "50%",
        display: "inline-block",
        animation: "if-spin 0.7s linear infinite",
      }}
    />
  );
}
