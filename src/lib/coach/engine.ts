import type { CoachContext, CoachMode, CoachReply, CoachStyle, DayStats } from "@/types";
import { goalDirection } from "@/lib/nutrition/calculations";

/* ============================================================
   Rule-based coach engine — the MVP "mock AI." Produces
   personal, goal-aware, style-correct coaching from real user
   data. When a real AI provider is configured the API route
   uses buildCoachSystemPrompt() instead; this engine remains
   the offline fallback and the pattern-detection layer.
   ============================================================ */

interface Assessment {
  daysLogged: number;
  daysTracked: number;
  avgCalories: number;
  avgGap: number; // actual - target (negative = under)
  proteinHitDays: number;
  loggingGapDays: number; // consecutive most-recent days with 0 meals
  weekendDrop: boolean;
  missedBreakfastDays: number;
  adherence: "strong" | "trying" | "drifting" | "off" | "new";
}

function assess(days: DayStats[]): Assessment {
  const tracked = days.slice(0, 7);
  const logged = tracked.filter((d) => d.mealsLogged > 0);
  const avgCalories = logged.length
    ? Math.round(logged.reduce((s, d) => s + d.calories, 0) / logged.length)
    : 0;
  const avgGap = logged.length
    ? Math.round(logged.reduce((s, d) => s + (d.calories - d.targetCalories), 0) / logged.length)
    : 0;
  const proteinHitDays = logged.filter((d) => d.protein >= d.targetProtein * 0.9).length;

  let loggingGapDays = 0;
  for (const d of tracked) {
    if (d.mealsLogged === 0) loggingGapDays++;
    else break;
  }

  const weekend = tracked.filter((d) => [0, 6].includes(new Date(d.date + "T12:00:00").getDay()) && d.mealsLogged > 0);
  const weekday = logged.filter((d) => ![0, 6].includes(new Date(d.date + "T12:00:00").getDay()));
  const weekendDrop =
    weekend.length > 0 &&
    weekday.length > 1 &&
    weekend.reduce((s, d) => s + Math.abs(d.calories - d.targetCalories), 0) / weekend.length >
      (weekday.reduce((s, d) => s + Math.abs(d.calories - d.targetCalories), 0) / weekday.length) * 1.5;

  const missedBreakfastDays = logged.filter((d) => !d.loggedMealTypes.includes("breakfast")).length;

  let adherence: Assessment["adherence"];
  if (tracked.length === 0 || logged.length === 0) adherence = tracked.length <= 1 ? "new" : "off";
  else if (loggingGapDays >= 3) adherence = "off";
  else if (loggingGapDays >= 1 || logged.length < tracked.length * 0.6) adherence = "drifting";
  else if (proteinHitDays >= logged.length * 0.7 && Math.abs(avgGap) < 200) adherence = "strong";
  else adherence = "trying";

  return { daysLogged: logged.length, daysTracked: tracked.length, avgCalories, avgGap, proteinHitDays, loggingGapDays, weekendDrop, missedBreakfastDays, adherence };
}

const MODE_BY_ADHERENCE: Record<Assessment["adherence"], CoachMode> = {
  strong: "celebrate",
  trying: "encourage",
  drifting: "nudge",
  off: "reset",
  new: "encourage",
};

/** Weave the user's own words in — respectfully, never as a weapon. */
function whyLine(ctx: CoachContext): string | null {
  const m = ctx.motivation;
  if (!m || !m.coachShouldRemindMeOfWhy) return null;
  const candidates = [
    m.reminderWhenQuitting && `You asked me to remind you: "${m.reminderWhenQuitting}"`,
    m.desiredIdentity && `You said you're becoming ${lc(m.desiredIdentity)}. Days like today are how that gets built.`,
    m.primaryWhy && `You told me this matters because ${lc(m.primaryWhy)}. That reason hasn't changed.`,
    m.dreamOutcome && `Remember the outcome you described: ${lc(m.dreamOutcome)}. Today is a brick in that wall.`,
  ].filter(Boolean) as string[];
  if (!candidates.length) return null;
  // Deterministic rotation by day so the coach doesn't repeat itself daily.
  return candidates[new Date().getDate() % candidates.length];
}

const lc = (s: string) => {
  const t = s.trim().replace(/\.$/, "");
  return t.charAt(0).toLowerCase() + t.slice(1);
};

interface StyleCopy {
  celebrate: string;
  encourage: string;
  nudge: string;
  challenge: string;
  reset: string;
}

function baseCopy(ctx: CoachContext, a: Assessment): StyleCopy {
  const dir = goalDirection(ctx.profile.primaryGoal);
  const gapAbs = Math.abs(a.avgGap);
  const underOver = a.avgGap < 0 ? "under" : "over";

  const gainDetail =
    a.avgGap < -300
      ? `You're averaging ${gapAbs} calories under your gain target. That gap is why the scale isn't moving.`
      : `Your surplus is close. Keep the calorie-dense choices consistent.`;
  const lossDetail =
    a.avgGap > 300
      ? `You're averaging ${gapAbs} calories over target. The deficit only works when it's consistent.`
      : `Your deficit is holding. Protein protection is the next lever: ${a.proteinHitDays}/${a.daysLogged} days hit.`;
  const detail = dir === "gain" ? gainDetail : dir === "loss" ? lossDetail : `You're averaging ${gapAbs} calories ${underOver} your range. Small corrections, not overhauls.`;

  return {
    celebrate:
      dir === "gain"
        ? `Rings closed where it counts. ${a.proteinHitDays}/${a.daysLogged} protein days and your surplus is showing up on schedule. This is what a gaining week is supposed to look like.`
        : `${a.daysLogged}/${a.daysTracked} days logged, ${a.proteinHitDays} protein targets hit. This is the pattern that gets results. Protect it.`,
    encourage: `You're showing up — ${a.daysLogged} of the last ${a.daysTracked} days logged. ${detail}`,
    nudge: `You've gone ${a.loggingGapDays} day${a.loggingGapDays === 1 ? "" : "s"} without logging. Unlogged days are guesses, and guesses don't move you toward ${ctx.profile.goalWeight ?? "your goal"}. One meal. Two taps. Back in.`,
    challenge: detail,
    reset: `It's been ${a.loggingGapDays} days. That's not failure — it's a gap. Gaps end the moment you log the next meal. Not yesterday's meals. The next one.`,
  };
}

function styled(style: CoachStyle, mode: CoachMode, copy: StyleCopy, ctx: CoachContext): string {
  const base = copy[mode];
  const why = whyLine(ctx);
  const name = ctx.profile.name?.split(" ")[0];

  if (style === "encouraging") {
    const soft: Record<CoachMode, string> = {
      celebrate: `${name ? name + ", t" : "T"}his week deserves a moment: ${lc(base)}`,
      encourage: `${base} Progress is rarely loud. Let's make today simple: one logged meal and one protein anchor.`,
      nudge: `No guilt — just a next step. ${base}`,
      challenge: `${base} You've done harder things than this. One adjustment today.`,
      reset: `${base} We don't restart from zero; we restart from experience.`,
    };
    return why ? `${soft[mode]}\n\n${why}` : soft[mode];
  }

  if (style === "no_excuses") {
    const hard: Record<CoachMode, string> = {
      celebrate: `${base} Don't get comfortable — consistency is only impressive when it survives a bad week.`,
      encourage: `${base} Close is not done. Finish the pattern.`,
      nudge: `${base} You said this goal mattered. Unlogged days say otherwise. Prove your own words right.`,
      challenge: `${base} You can have excuses or results. You cannot keep pretending they're the same thing. Next meal: log it, hit it.`,
      reset: `${base} No speeches, no shame, no waiting for Monday. The plan is already written. Execute it.`,
    };
    return why ? `${hard[mode]}\n\n${why}` : hard[mode];
  }

  // balanced
  const mid: Record<CoachMode, string> = {
    celebrate: base,
    encourage: `${base} Next lever: protein first, then the calories follow.`,
    nudge: `${base}`,
    challenge: `${base} That pattern needs attention this week, not next week.`,
    reset: `${base} Log the next meal, even if it's imperfect.`,
  };
  return why ? `${mid[mode]}\n\n${why}` : mid[mode];
}

function suggestedAction(ctx: CoachContext, a: Assessment, mode: CoachMode): string {
  const dir = goalDirection(ctx.profile.primaryGoal);
  if (mode === "reset" || mode === "nudge") return "Log your next meal";
  if (dir === "gain" && a.avgGap < -300) {
    return ctx.hardGainer?.prefersLiquidCalories
      ? "Add a 500-calorie smoothie before 2 PM"
      : "Add one calorie-dense addition: olive oil on rice, PB toast, or whole milk";
  }
  if (a.proteinHitDays < a.daysLogged * 0.6) return "Anchor your next meal with 35g of protein";
  if (dir === "loss" && a.weekendDrop) return "Plan Friday dinner before Friday arrives";
  return "Review today's plan and pre-log dinner";
}

function maybeChallenge(ctx: CoachContext, a: Assessment): CoachReply["challenge"] {
  if (ctx.activeChallenges.length > 0) return null;
  const dir = goalDirection(ctx.profile.primaryGoal);
  const today = new Date();
  const dstr = (d: Date) => d.toISOString().slice(0, 10);
  const plus = (n: number) => dstr(new Date(today.getTime() + n * 86400000));

  if (dir === "gain" && a.avgGap < -300)
    return {
      title: "Hard Gainer Challenge",
      description: "Add 500 calories before 2 PM for the next 3 days. Earlier calories beat one giant dinner.",
      challengeType: "hard_gainer",
      startDate: dstr(today),
      endDate: plus(3),
      targetValue: 3,
      rewardBadge: "hard_gainer_momentum",
    };
  if (a.proteinHitDays < Math.max(1, a.daysLogged) * 0.6)
    return {
      title: "Protein Discipline Challenge",
      description: "Hit 35g of protein in your first meal for 5 days straight.",
      challengeType: "protein",
      startDate: dstr(today),
      endDate: plus(5),
      targetValue: 5,
      rewardBadge: "protein_locked_in",
    };
  if (a.loggingGapDays >= 2 || a.adherence === "off")
    return {
      title: "No Mystery Meals Challenge",
      description: "Log every dinner this week, even if it's imperfect.",
      challengeType: "logging",
      startDate: dstr(today),
      endDate: plus(7),
      targetValue: 7,
      rewardBadge: "no_mystery_meals",
    };
  if (dir === "loss" && a.weekendDrop)
    return {
      title: "Weekend Control Challenge",
      description: "Plan Friday dinner before Friday arrives. Write it down by Thursday night.",
      challengeType: "weekend",
      startDate: dstr(today),
      endDate: plus(4),
      targetValue: 1,
      rewardBadge: "weekend_controlled",
    };
  return null;
}

/* ---- Question routing for chat ---- */

function answerQuestion(q: string, ctx: CoachContext, a: Assessment): string | null {
  const s = q.toLowerCase();
  const dir = goalDirection(ctx.profile.primaryGoal);
  const hg = ctx.hardGainer;

  if (/(what|which).*(eat|meal|food)|meal idea|dinner|breakfast|lunch/.test(s)) {
    if (dir === "gain")
      return `Build every plate around three things: a protein anchor, a calorie-dense carb base, and a fat booster.\n\nTonight, that could be ground beef over rice with olive oil stirred in, plus a glass of whole milk. Roughly 900 calories without a huge volume of food. ${hg?.getsFullQuickly ? "Since you fill up fast, drink the milk with the meal — liquid calories don't compete for space the way solid food does." : ""}`;
    if (dir === "loss")
      return `Aim for high-volume, high-protein plates: chicken breast or salmon, a big serving of broccoli or potatoes, and go light on added fats. You get fullness without spending your calorie budget. Protein first — it protects muscle and kills the 9 PM snack urge.`;
    return `Keep it balanced and repeatable: a protein anchor (chicken, eggs, Greek yogurt), a whole-grain base, and produce. Maintenance is won with boring consistency, not perfect variety.`;
  }

  if (/gain|surplus|bulk|hard ?gainer|metabolism|full/.test(s) && dir === "gain") {
    return `Here's the hard-gainer playbook, in order:\n\n1. Calorie density beats volume — olive oil, peanut butter, whole milk, granola, avocado.\n2. Liquid calories don't fight your appetite — one smoothie can carry 500+ calories.\n3. Front-load the day. Missing breakfast puts you 500 calories behind before noon.\n4. Repeatable meals win. Pick 2–3 you can execute on autopilot.\n\nYou're averaging ${Math.abs(a.avgGap)} calories ${a.avgGap < 0 ? "under" : "over"} target. ${a.avgGap < -300 ? "Fix execution before touching the target." : "Execution looks solid — if the scale stays flat for 2 more weeks, we raise the target."}`;
  }

  if (/protein/.test(s))
    return `Your target is ${ctx.recentDays[0]?.targetProtein ?? "—"}g. You've hit 90%+ on ${a.proteinHitDays} of your last ${a.daysLogged} logged days. The easiest fix is a protein anchor in meal one: eggs, Greek yogurt, or a whey shake — 25–35g before the day gets busy.`;

  if (/water|hydrat/.test(s))
    return `Target is ${ctx.recentDays[0]?.targetWaterOz ?? 64}oz. Tie it to existing habits: a glass when you wake, one with each meal, one at your desk. Use the quick-add buttons on the dashboard — friction kills hydration streaks.`;

  if (/weekend/.test(s))
    return `Weekends fall apart when they're unplanned, not because you lack discipline. Two rules: plan Friday dinner before Friday, and log everything Saturday even if it's ugly. Data beats amnesia.`;

  if (/(fell|fall) off|restart|start over|messed up|bad (day|week)|quit/.test(s)) {
    const reminder = ctx.motivation?.reminderWhenQuitting;
    return `One messy day is a data point, not a verdict. The plan doesn't restart — it continues at the next meal.${reminder ? `\n\nAnd you asked me to remind you of this when it gets hard: "${reminder}"` : ""}`;
  }

  if (/weigh|scale|trend/.test(s)) {
    const t = ctx.weightTrend;
    if (t.entries < 3) return `You have ${t.entries} weigh-in${t.entries === 1 ? "" : "s"} logged — not enough for a trend. Weigh in 3–4 times a week, same time of day, and judge the weekly average, never a single reading.`;
    return `Your trend is ${t.direction}${t.weeklyRateLbs ? ` at about ${Math.abs(t.weeklyRateLbs).toFixed(1)} lb/week` : ""}. One day's number is noise — water, sodium, and timing swing it 2–4 lbs. The weekly average is the truth.`;
  }

  if (/meal prep|prep/.test(s))
    return `Start smaller than you think: two meals prepped before Monday. A protein cooked in bulk (chicken thighs, ground beef) plus a carb base (rice, pasta) covers 4+ meals with one cleanup. ${ctx.profile.budgetPreference === "tight" ? "It's also the single biggest lever on food cost." : ""}`;

  return null;
}

/* ---- Public API ---- */

export function generateCoachReply(ctx: CoachContext): CoachReply {
  const a = assess(ctx.recentDays);

  if (ctx.userQuestion) {
    const answer = answerQuestion(ctx.userQuestion, ctx, a);
    if (answer)
      return { message: answer, mode: MODE_BY_ADHERENCE[a.adherence], suggestedAction: suggestedAction(ctx, a, MODE_BY_ADHERENCE[a.adherence]), challenge: null };
    // Generic but personal fallback.
    const copy = baseCopy(ctx, a);
    const mode = MODE_BY_ADHERENCE[a.adherence];
    return {
      message: `${styled(ctx.profile.coachStyle, mode, copy, ctx)}\n\n(For deeper questions, connect a real AI provider in settings — I'm running on the built-in engine right now.)`,
      mode,
      suggestedAction: suggestedAction(ctx, a, mode),
      challenge: null,
    };
  }

  // Repeated ignoring → challenge mode overrides.
  const mode: CoachMode =
    a.adherence === "drifting" && a.daysLogged > 0 && Math.abs(a.avgGap) > 400
      ? "challenge"
      : MODE_BY_ADHERENCE[a.adherence];

  const copy = baseCopy(ctx, a);
  return {
    message: styled(ctx.profile.coachStyle, mode, copy, ctx),
    mode,
    suggestedAction: suggestedAction(ctx, a, mode),
    challenge: maybeChallenge(ctx, a),
  };
}

/** Daily headline for the dashboard card. */
export function dailyCoachMessage(ctx: CoachContext): CoachReply {
  return generateCoachReply({ ...ctx, userQuestion: undefined });
}

export const SUGGESTED_PROMPTS = [
  "What should I eat for dinner tonight?",
  "How do I hit my protein target?",
  "I fell off this week. Help me restart.",
  "Why isn't the scale moving?",
  "Give me a weekend plan",
  "How do I start meal prepping?",
];
