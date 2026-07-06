# InnerForm

**Built from the inside out.**

InnerForm is an AI nutrition coach that learns your body, plans your meals, tracks your food, and holds you accountable to the habits your goal requires. Built for weight loss, weight gain, hard gainers, maintenance, meal prep, and disciplined follow-through.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. **No configuration is required** — with no env vars the app runs in **local demo mode**: accounts and data are stored in the browser's localStorage and the coach runs on the built-in rule-based engine. Sign up, complete the onboarding intake, and everything works end-to-end on your machine.

## Stack

- **Next.js 16** (App Router) · React 19 · TypeScript
- **Tailwind CSS v4** + the InnerForm design system (tokens ported into `globals.css`; glass cards, Big Shoulders Display + Hanken Grotesk, Apple-Fitness-style activity rings)
- **Supabase** — auth + Postgres + RLS (optional; schema included)
- **Recharts** — progress charts · **lucide-react** — icons
- PWA-ready (`public/manifest.webmanifest`)

## Project structure

```
src/
  app/                    # routes: landing, login/signup, onboarding, (app)/dashboard|log|coach|meal-plan|progress|profile
  app/api/coach/          # vendor-agnostic coach endpoint (keys stay server-side)
  components/ui/          # design-system primitives (Button, Card, ActivityRing, MacroBar, TabBar…)
  components/brand/       # LogoMark / Wordmark ("Heart Print")
  data/                   # seed food database, meal-plan templates
  lib/nutrition/          # BMR/TDEE + goal-aware calorie & macro targets
  lib/food-quality/       # goal-aware 0–100 food scoring ("Useful for gaining" ≠ "Low satiety for cutting")
  lib/coach/              # rule-based coach engine + AI system-prompt builder + safety rules
  lib/body-learning/      # Body Learning Engine v1 (trend-first target adjustments, hard-gainer diagnostics)
  lib/ai/                 # AI provider abstraction (mock / Anthropic / OpenAI)
  lib/food-db/            # food database provider abstraction (seed now; USDA/OFF later)
  lib/supabase/           # browser + server clients (null when unconfigured → demo mode)
  lib/store/              # app store: auth + all entities, localStorage persistence
  types/                  # domain types mirroring the SQL schema
supabase/
  schema.sql              # full schema + Row Level Security
  seed.sql                # seed food catalog
```

## Going live with Supabase

1. Create a project at supabase.com.
2. Run `supabase/schema.sql` in the SQL editor (and optionally `seed.sql`).
3. Copy `.env.example` → `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Restart the dev server. Auth runs through Supabase (email/password) **and your data syncs to the cloud**.

### Persistence & cloud sync

With Supabase configured, the app **syncs across devices**. Persistence uses a **document-sync** model: the whole per-user data object is stored as one JSONB row in the `app_state` table (RLS: each user sees only their row). On login the app loads the cloud document (falling back to the localStorage cache, and migrating any local-only data up on the first cloud login); every change writes localStorage immediately and pushes to the cloud on a short debounce. A sync indicator (Saving / Synced / Offline) shows in the Today header. With no Supabase keys, the app runs exactly as before in local demo mode.

Why document-sync and not per-table writes: the store holds all data in one object mutated as a unit, so a JSONB document is the clean, low-risk fit. The normalized tables in `schema.sql` remain the target for server-side queries and sharing — migrate incrementally when a feature needs it:
- **Social / accountability partner** should expose a narrow shared slice (e.g. a `connections` table + a `shared_stats` row a partner can read via RLS), not the whole document — a focused next step on top of this.
- **Photos** currently ride inside the synced document as compressed data URLs (fine for MVP volumes). Move them to **Supabase Storage** (store URLs) once the document grows large.

## Connecting a real AI coach

The coach endpoint (`app/api/coach/route.ts`) is vendor-agnostic:

1. In `.env.local` set `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY=...` (or `openai` / `OPENAI_API_KEY`).
2. Done. The route builds a system prompt from the user's full motivation profile, hard-gainer profile, recent logs, and selected coach style (`lib/coach/prompts.ts`), including hard safety rules (challenge behavior, never identity; no shaming; no unsafe advice). The rule-based engine still computes the tone mode, suggested action, and challenge cards, and remains the fallback if the provider errors.

API keys are read only in server code — they are never shipped to the client.

## What's mocked (and where the real thing plugs in)

| Feature | MVP behavior | Upgrade path |
| --- | --- | --- |
| AI coach chat | Rule-based engine: adherence assessment → tone mode (celebrate/encourage/nudge/challenge/reset) → style-voiced message quoting the user's own "why" | Set `AI_PROVIDER` env vars (above) |
| Food search | Seed catalog **+ live Open Food Facts** full-text search (`search.openfoodfacts.org`) via `/api/food/search`, mapped to macros, micros, Nutri-Score grade, ingredients, and product photo | Add a paid provider (Nutritionix/FatSecret) behind the same `/api/food/*` contract if you outgrow OFF |
| Barcode scan | Live: native `BarcodeDetector` + camera where supported (Chrome/Android), manual entry fallback (iOS Safari); both resolve against Open Food Facts via `/api/food/barcode` | — |
| Food label | Full FDA-style nutrition-facts panel with letter grade + ingredients, shown on tap | — |
| Meal plan generation | Template-based generator with modes (meal prep / simple / high-calorie / fat-loss / budget), behind a branded ~8s generating animation | Swap generator internals for an AI call; the UI contract stays |
| Steps & calories burned | **Manual + editable** entry, step goal, and charts. Exercise optionally adds to the calorie budget | Automatic **Apple Health / Health Connect** sync needs a native wrapper — see below |
| Reminders / encouragement (#6) | **In-app** feed + on-open nudges generated from the day's data (behind, un-logged, hydration, scheduled weigh-in, encouragement) | Background push every 2–3 hrs needs the native wrapper (service worker web-push is unreliable on iOS) |
| Health integrations | "Coming soon" cards on Profile; `health_integrations` table + types ready | Apple Health / Health Connect need a native wrapper (Capacitor is the pragmatic route for this codebase); Fitbit/Garmin are OAuth + REST and can be Edge Functions |
| Weekly review | Body Learning Engine insight card on the dashboard | Scheduled Supabase Edge Function writing to `recommendations` |

### Native wrapper (Apple Health, background push)

Two requested features can't be delivered by a browser app and are intentionally built as manual/in-app versions now:

- **Apple Health / Health Connect** step & calorie-burn sync — a browser can't read HealthKit. Wrap the app with **Capacitor** and use a HealthKit plugin; the `stepLogs` / `exerciseLogs` shapes and the Steps/Calories cards are already there to receive synced data (`source: "apple_health"` is reserved).
- **Background reminders every 2–3 hours** — reliable scheduled notifications need native. The in-app reminder engine (`generateReminders` in the store) already produces the messages; a native layer would deliver them as push. iOS Safari web-push is too limited to rely on.

Everything else on the roadmap runs today in the web app.

## Product notes

- **Accountability sharing (social).** In Profile → Accountability, turn on sharing to get a private link (`/shared/<slug>`). A coach, spouse, or friend opens it — no login — and sees a **read-only** snapshot (streaks, weight trend, weekly consistency) and can send an encouragement that lands in your app. They never see your full diary. Backed by `shared_progress` + `partner_notes` (RLS: owner manages; anyone may read an *enabled* share and send a note; only the owner reads their notes). Hardening options for later: gate reads behind a security-definer RPC and rate-limit note inserts.
- **Editable serving size.** When logging a food you can type a serving count *or* a weight (g/oz/lb) with unit chips; calories and macros update live (MyNetDiary-style).
- **Food label.** Tap any food for a full nutrition-facts panel: goal-aware letter grade ("cutting C" / "gaining B"), a toggleable % Daily Value column, Net Carbs, Added Sugars, Cholesterol, Calcium, Iron, and ingredients.
- **Custom meal types.** Beyond the 12 built-ins, users add their own meal types (name + icon) and reorder them in Profile → Meal types; they appear across logging.
- **Recipes.** Build a recipe from ingredients once (auto per-serving macros) and log a serving anytime, in the Log → Recipes tab.
- **Macro cycling.** Optional training-day vs rest-day calorie targets (Profile → Macro cycling); the Today target shifts automatically by weekday.
- **Streak freezes.** A small pool of freezes protects a streak through one missed day (Progress → Streak freezes) so one off-day doesn't erase weeks.
- **Weekly review.** The coach generates an end-of-week report (adherence, averages, protein/water consistency, trend, wins, and the single most useful fix) — Coach → This week's review.
- **Photo journal.** Per-meal photos plus a dedicated progress-photo timeline on Progress.
- **Themes.** Basic (dark slate), Light, and Dark, switchable in Profile → Appearance; everything themes through CSS variables in `globals.css`.
- **Customizable Today screen.** Users pick which cards/metrics show (rings, macros, coach, steps, calories burned, water, weight, plan, body-learning, fiber, sugar, sodium, net calories) in Profile.
- **Rich food logging.** Category icons, tap-to-view nutrition label with grade + ingredients, per-item photo upload, favorites, reusable saved meals, 12 meal types, auto timestamps, exercise entry, daily notes, and water — all on the Log screen.
- **Goal-aware everything.** Dashboard copy, food quality labels, meal templates, and coach language all pivot on the goal direction (loss / gain / maintain). Calorie-dense food scores *up* for hard gainers.
- **Coach styles.** Encouraging / Balanced / No Excuses. No Excuses requires the double confirmation ("I want the hard truth." → "Yes. Hold me accountable.") both in onboarding and settings.
- **Safety rails.** The coach challenges behavior, never identity; never recommends skipping meals, punishment, or compensatory behavior. Rules are enforced in the rule engine copy and injected into the AI system prompt (`COACH_SAFETY_RULES`). Wellness + AI disclaimers appear in onboarding, profile, coach page, and landing footer.
- **Body Learning Engine v1** (`lib/body-learning/engine.ts`): trend-first (never reacts to one weigh-in), separates execution problems from target problems, and for hard gainers diagnoses *which* problem — calorie density, missed windows, appetite, or a target that's genuinely too low.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm start       # serve production build
npm run lint    # eslint
```
