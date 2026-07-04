"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TabBar } from "@/components/ui/TabBar";
import { useApp } from "@/lib/store/AppStoreProvider";
import { LogoMark } from "@/components/brand/Logo";

/** Protected app shell: auth guard, onboarding gate, bottom tab bar. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, data } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!data.profile?.onboardingCompleted && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [loading, user, data.profile?.onboardingCompleted, pathname, router]);

  if (loading || !user || !data.profile?.onboardingCompleted) {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="if-fade-in" style={{ textAlign: "center" }}>
          <LogoMark size={52} />
          <div className="if-overline" style={{ color: "var(--text-muted)", marginTop: 14 }}>
            InnerForm
          </div>
        </div>
      </main>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--surface-app)" }}>
      <main
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "20px 18px calc(96px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {children}
      </main>
      <TabBar />
    </div>
  );
}
