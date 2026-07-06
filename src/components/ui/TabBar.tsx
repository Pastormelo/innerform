"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, UtensilsCrossed, Sparkles, CalendarRange, TrendingUp, User } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Today", Icon: Activity },
  { href: "/log", label: "Log", Icon: UtensilsCrossed },
  { href: "/coach", label: "Coach", Icon: Sparkles },
  { href: "/meal-plan", label: "Plan", Icon: CalendarRange },
  { href: "/progress", label: "Progress", Icon: TrendingUp },
  { href: "/profile", label: "Profile", Icon: User },
];

/** Fixed frosted bottom tab bar. */
export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="if-glass-strong"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: "var(--z-nav)" as unknown as number,
        display: "grid",
        gridTemplateColumns: `repeat(${TABS.length}, 1fr)`,
        alignItems: "center",
        padding: "8px 8px calc(8px + env(safe-area-inset-bottom, 8px))",
        maxWidth: 640,
        margin: "0 auto",
        borderTopLeftRadius: "var(--radius-lg)",
        borderTopRightRadius: "var(--radius-lg)",
      }}
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="if-tab"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "8px 0",
              textDecoration: "none",
              color: active ? "var(--forest-500)" : "var(--text-muted)",
              WebkitTapHighlightColor: "transparent",
              borderRadius: "var(--radius-md)",
            }}
          >
            <Icon size={23} strokeWidth={active ? 2.4 : 2} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 600, letterSpacing: "0.01em" }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
