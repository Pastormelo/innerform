import Link from "next/link";
import {
  CalendarRange,
  Flame,
  HeartPulse,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { Wordmark, LogoMark } from "@/components/brand/Logo";

/* ============================================================
   Marketing landing page — dark hero with forest spotlight,
   feature glass cards, coach-mode section, safety footer.
   ============================================================ */

const FEATURES = [
  {
    Icon: HeartPulse,
    title: "Learns your body",
    body: "Targets built from your stats, then tuned by how your body actually responds — not a static formula.",
  },
  {
    Icon: UtensilsCrossed,
    title: "Tracks food and macros",
    body: "Two-tap logging, goal-aware food quality scores, and macro rings that tell you exactly where you stand.",
  },
  {
    Icon: CalendarRange,
    title: "Plans meals and groceries",
    body: "A weekly meal plan matched to your goal, budget, and cooking skill — with the grocery list generated for you.",
  },
  {
    Icon: TrendingUp,
    title: "Coaches weight loss and weight gain",
    body: "Deficit consistency for cutting. Surplus engineering for gaining. The dashboard speaks your goal's language.",
  },
  {
    Icon: Sparkles,
    title: "Coaching that knows your why",
    body: "InnerForm does not just ask what you want to weigh. It learns why the goal matters, what keeps getting in the way, and what kind of accountability helps you follow through.",
  },
  {
    Icon: Flame,
    title: "Built for hard gainers too",
    body: "Trying to gain weight is not always about willingness. Sometimes you need smarter calorie strategy, higher-density foods, liquid calories, better meal timing, and a plan that respects your metabolism.",
  },
];

export default function LandingPage() {
  return (
    <main style={{ background: "var(--grad-hero)", minHeight: "100dvh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 0" }}>
          <Wordmark size={20} />
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/login" style={navBtn(false)}>
              Log in
            </Link>
            <Link href="/signup" style={navBtn(true)}>
              Start building
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "72px 0 64px" }}>
          <div className="if-overline" style={{ color: "var(--forest-500)", marginBottom: 20 }}>
            AI Nutrition Coach
          </div>
          <h1 className="if-display" style={{ fontSize: "clamp(52px, 9vw, 88px)", margin: "0 auto 20px", maxWidth: 800 }}>
            Built from the
            <br />
            <span style={{ color: "var(--forest-400)" }}>inside out.</span>
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 620, margin: "0 auto 36px" }}>
            InnerForm is an AI nutrition coach that learns your body, plans your meals, tracks your food, and holds you
            accountable to the habits your goal requires.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" style={cta(true)}>
              Start building
            </Link>
            <a href="#how" style={cta(false)}>
              See how it works
            </a>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>
            Weight loss · Weight gain · Hard gainers · Maintenance · Meal prep · Follow-through
          </p>
        </section>

        {/* Features */}
        <section id="how" style={{ padding: "24px 0 40px" }}>
          <div className="if-overline" style={{ color: "var(--text-muted)", textAlign: "center", marginBottom: 28 }}>
            How it works
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {FEATURES.map(({ Icon, title, body }) => (
              <div key={title} className="if-glass" style={{ padding: 24 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    background: "var(--grad-forest)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Icon size={22} color="var(--ink-950)" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{title}</h3>
                <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Coach modes */}
        <section style={{ padding: "48px 0 64px" }}>
          <div
            className="if-glass"
            style={{ padding: "40px 32px", textAlign: "center", background: "var(--grad-navy)", border: "1px solid var(--glass-border)" }}
          >
            <ShieldAlert size={28} color="var(--gold-500)" style={{ marginBottom: 14 }} />
            <h2 className="if-display" style={{ fontSize: 34, margin: "0 0 12px" }}>
              No Excuses Coach for serious accountability
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto 24px" }}>
              Choose your coaching style. Encouraging, Balanced, or No Excuses. If you want the hard truth, InnerForm
              will give it to you.
            </p>
            <Link href="/signup" style={cta(true)}>
              Choose your coach
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "32px 0 44px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <LogoMark size={32} />
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", maxWidth: 640, margin: "0 auto 10px" }}>
            InnerForm provides nutrition, habit, and wellness coaching. It is not medical advice and does not diagnose,
            treat, or prevent any disease. Consult a qualified healthcare professional before making major changes to
            your diet, exercise, or health routine.
          </p>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            AI coaching can make mistakes. Review recommendations carefully and use your judgment.
          </p>
        </footer>
      </div>
    </main>
  );
}

function navBtn(primary: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    height: 40,
    padding: "0 18px",
    borderRadius: "var(--radius-pill)",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    background: primary ? "var(--forest-500)" : "transparent",
    color: primary ? "var(--ink-950)" : "var(--text-primary)",
    border: primary ? "1px solid transparent" : "1px solid var(--border-strong)",
  };
}

function cta(primary: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    height: 54,
    padding: "0 32px",
    borderRadius: "var(--radius-pill)",
    fontWeight: 700,
    fontSize: 17,
    textDecoration: "none",
    background: primary ? "var(--forest-500)" : "transparent",
    color: primary ? "var(--ink-950)" : "var(--text-primary)",
    border: primary ? "1px solid transparent" : "1.5px solid var(--border-strong)",
    boxShadow: primary ? "var(--glow-forest)" : "none",
  };
}
