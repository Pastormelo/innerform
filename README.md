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
4. Restart the dev server. Auth now runs through Supabase (email/password).

**Note:** in this MVP, entity data (logs, plans, streaks…) persists to localStorage keyed by user id, while auth is real Supabase. The entity shapes in `src/types` mirror `schema.sql` column-for-column, so migrating persistence is mechanical: replace the `persist`/`loadData` calls in `lib/store/AppStoreProvider.tsx` with Supabase queries (RLS policies are already written). This was deliberate — it keeps the MVP runnable with zero setup while locking the schema in early.

## Connecting a real AI coach

The coach endpoint (`app/api/coach/route.ts`) is vendor-agnostic:

1. In `.env.local` set `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY=...` (or `openai` / `OPENAI_API_KEY`).
2. Done. The route builds a system prompt from the user's full motivation profile, hard-gainer profile, recent logs, and selected coach style (`lib/coach/prompts.ts`), including hard safety rules (challenge behavior, never identity; no shaming; no unsafe advice). The rule-based engine still computes the tone mode, suggested action, and challenge cards, and remains the fallback if the provider errors.

API keys are read only in server code — they are never shipped to the client.

## What's mocked (and where the real thing plugs in)

| Feature | MVP behavior | Upgrade path |
| --- | --- | --- |
| AI coach chat | Rule-based engine: adherence assessment → tone mode (celebrate/encourage/nudge/challenge/reset) → style-voiced message quoting the user's own "why" | Set `AI_PROVIDER` env vars (above) |
| Food search | 36-item seed catalog with macros + goal-aware quality scores | Implement `FoodDatabaseProvider` in `lib/food-db/provider.ts` for USDA FoodData Central / Open Food Facts / Nutritionix / FatSecret |
| Barcode scan | Placeholder (`lookupBarcode` returns null) | Same provider interface |
| Meal plan generation | Template-based generator with modes (meal prep / simple / high-calorie / fat-loss / budget) | Swap generator internals for an AI call; the UI contract stays |
| Health integrations | "Coming soon" cards on Profile; `health_integrations` table + types ready | Apple Health / Health Connect need a native wrapper (Capacitor is the pragmatic route for this codebase); Fitbit/Garmin are OAuth + REST and can be Edge Functions |
| Weekly review | Body Learning Engine insight card on the dashboard | Scheduled Supabase Edge Function writing to `recommendations` |

## Product notes

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
