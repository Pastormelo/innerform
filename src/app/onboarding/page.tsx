"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Wordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input, Select, Textarea, Field } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Modal } from "@/components/ui/Modal";
import { GeneratingOverlay } from "@/components/ui/GeneratingOverlay";
import { useApp, uid } from "@/lib/store/AppStoreProvider";
import { computeTargets } from "@/lib/nutrition/calculations";
import type {
  ActivityLevel,
  BudgetPreference,
  CoachStyle,
  CookingSkill,
  DesiredPace,
  GoalType,
  HardGainerProfile,
  MealPrepPreference,
  MotivationProfile,
  Sex,
  Units,
} from "@/types";

/* ============================================================
   Onboarding — 7-step intake. Serious, personal, motivating.
   Core setup is required; deeper reflection is optional.
   ============================================================ */

const GOALS: { value: GoalType; label: string }[] = [
  { value: "lose_weight", label: "Lose weight" },
  { value: "gain_weight", label: "Gain weight" },
  { value: "maintain_weight", label: "Maintain weight" },
  { value: "body_recomposition", label: "Body recomposition" },
  { value: "build_muscle", label: "Build muscle" },
  { value: "improve_food_quality", label: "Improve food quality" },
  { value: "improve_consistency", label: "Improve consistency" },
  { value: "improve_meal_prep", label: "Improve meal prep" },
  { value: "improve_energy", label: "Improve energy" },
  { value: "improve_confidence", label: "Improve confidence" },
  { value: "improve_discipline", label: "Improve discipline" },
];

const BARRIERS = [
  "I forget to log.",
  "I get too busy.",
  "I eat out often.",
  "I snack at night.",
  "I do not plan ahead.",
  "I do not know what to eat.",
  "I get discouraged when progress is slow.",
  "I under-eat.",
  "I overeat.",
  "I skip meals.",
  "I do not get enough protein.",
  "I do not drink enough water.",
  "I do well during the week but fall off on weekends.",
  "I struggle with appetite.",
  "I need simpler meals.",
  "I need cheaper meals.",
  "I need food that is easier to prep.",
  "I travel or have an irregular schedule.",
];

const DIETS = ["No restrictions", "High protein", "Vegetarian", "Vegan", "Pescatarian", "Halal", "Kosher", "Gluten-free", "Dairy-free", "Low carb"];

const HG_QUESTIONS: { key: keyof HardGainerBools; label: string }[] = [
  { key: "believesFastMetabolism", label: "I feel like I have a fast metabolism" },
  { key: "strugglesToEatEnough", label: "I struggle to eat enough calories" },
  { key: "getsFullQuickly", label: "I get full quickly" },
  { key: "missesMealsDueToSchedule", label: "I skip meals because I'm busy" },
  { key: "willingToEatMore", label: "I'm willing to eat more, but unsure what foods get me there" },
  { key: "unsureWhichFoodsHelp", label: "I don't know which foods actually help me gain" },
  { key: "prefersLiquidCalories", label: "I like liquid calories (smoothies, shakes)" },
  { key: "needsPortableSnacks", label: "I need portable snacks" },
  { key: "strugglesWithBreakfast", label: "Breakfast is hard for me" },
  { key: "needsLateNightCalories", label: "I need late-night calories" },
  { key: "needsSimpleMeals", label: "I need simple meals" },
  { key: "willingToCookComplexMeals", label: "I'm willing to cook more complex meals" },
];

type HardGainerBools = Pick<
  HardGainerProfile,
  | "believesFastMetabolism"
  | "strugglesToEatEnough"
  | "getsFullQuickly"
  | "missesMealsDueToSchedule"
  | "willingToEatMore"
  | "unsureWhichFoodsHelp"
  | "prefersLiquidCalories"
  | "needsPortableSnacks"
  | "strugglesWithBreakfast"
  | "needsLateNightCalories"
  | "needsSimpleMeals"
  | "willingToCookComplexMeals"
>;

const STEP_TITLES = ["Your body", "Your goal", "Your why", "Your dream outcome", "What breaks you", "Your coach", "Hard gainer intake"];

export default function OnboardingPage() {
  const { loading, user, data, saveProfile, update } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);

  // Step 1 — basic profile
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>("male");
  const [units, setUnits] = useState<Units>("imperial");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");
  const [heightCm, setHeightCm] = useState("175");
  const [currentWeight, setCurrentWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [diets, setDiets] = useState<string[]>([]);
  const [allergies, setAllergies] = useState("");
  const [avoid, setAvoid] = useState("");
  const [cooking, setCooking] = useState<CookingSkill>("intermediate");
  const [budget, setBudget] = useState<BudgetPreference>("moderate");
  const [mealsPerDay, setMealsPerDay] = useState("3");
  const [wake, setWake] = useState("");
  const [sleep, setSleep] = useState("");
  const [rhythm, setRhythm] = useState("");

  // Step 2 — goals
  const [primaryGoal, setPrimaryGoal] = useState<GoalType | null>(null);
  const [secondaryGoals, setSecondaryGoals] = useState<GoalType[]>([]);
  const [pace, setPace] = useState<DesiredPace>("moderate");
  const [goalContext, setGoalContext] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [triedBefore, setTriedBefore] = useState("");
  const [getsInWay, setGetsInWay] = useState("");

  // Step 3 — motivation
  const [primaryWhy, setPrimaryWhy] = useState("");
  const [lifeChange, setLifeChange] = useState("");
  const [tiredOf, setTiredOf] = useState("");
  const [sixMonths, setSixMonths] = useState("");
  const [identity, setIdentity] = useState("");
  const [proudOf, setProudOf] = useState("");
  const [forWho, setForWho] = useState("");
  const [notCarrying, setNotCarrying] = useState("");
  const [deeperWhy, setDeeperWhy] = useState("");
  const [quittingReminder, setQuittingReminder] = useState("");

  // Step 4 — dream outcome
  const [dreamSelf, setDreamSelf] = useState("");
  const [dreamFeel, setDreamFeel] = useState("");
  const [dreamHabits, setDreamHabits] = useState("");
  const [dreamWorthIt, setDreamWorthIt] = useState("");

  // Step 5 — barriers
  const [barriers, setBarriers] = useState<string[]>([]);
  const [pastFailures, setPastFailures] = useState("");
  const [excuses, setExcuses] = useState("");
  const [callOut, setCallOut] = useState("");
  const [remindersHelp, setRemindersHelp] = useState("");
  const [remindersAnnoy, setRemindersAnnoy] = useState("");

  // Step 6 — coach style
  const [coachStyle, setCoachStyle] = useState<CoachStyle>("balanced");
  const [noExcusesModal, setNoExcusesModal] = useState<0 | 1 | 2>(0);
  const [motivationStyle, setMotivationStyle] = useState("");
  const [accountabilityNo, setAccountabilityNo] = useState("");
  const [carefulTopics, setCarefulTopics] = useState("");
  const [remindWhy, setRemindWhy] = useState(true);

  // Step 7 — hard gainer
  const [hg, setHg] = useState<HardGainerBools>({
    believesFastMetabolism: false,
    strugglesToEatEnough: false,
    getsFullQuickly: false,
    missesMealsDueToSchedule: false,
    willingToEatMore: false,
    unsureWhichFoodsHelp: false,
    prefersLiquidCalories: false,
    needsPortableSnacks: false,
    strugglesWithBreakfast: false,
    needsLateNightCalories: false,
    needsSimpleMeals: false,
    willingToCookComplexMeals: false,
  });
  const [hgEasyFoods, setHgEasyFoods] = useState("");
  const [hgHardFoods, setHgHardFoods] = useState("");
  const [hgBarrier, setHgBarrier] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && data.profile?.onboardingCompleted) router.replace("/dashboard");
  }, [loading, user, data.profile?.onboardingCompleted, router]);

  const isHardGainerPath = useMemo(
    () =>
      primaryGoal === "gain_weight" ||
      primaryGoal === "build_muscle" ||
      secondaryGoals.includes("gain_weight") ||
      secondaryGoals.includes("build_muscle"),
    [primaryGoal, secondaryGoals],
  );

  const totalSteps = isHardGainerPath ? 7 : 6;
  const heightInches = units === "imperial" ? Number(heightFt || 0) * 12 + Number(heightIn || 0) : Number(heightCm || 0) * 0.393701;

  const step1Valid = name.trim() && Number(age) > 12 && Number(currentWeight) > 50 && heightInches > 36;
  const step2Valid = primaryGoal !== null;

  function toggle<T>(list: T[], item: T, set: (v: T[]) => void, max = 99) {
    if (list.includes(item)) set(list.filter((x) => x !== item));
    else if (list.length < max) set([...list, item]);
  }

  function finish() {
    const now = new Date().toISOString();
    const motivation: MotivationProfile = {
      id: uid(),
      userId: user?.id ?? "",
      primaryWhy,
      deeperWhy,
      dreamOutcome: [dreamSelf, dreamFeel, dreamHabits, dreamWorthIt].filter(Boolean).join(" "),
      desiredIdentity: identity || dreamSelf,
      lifeChangeGoal: [lifeChange, sixMonths].filter(Boolean).join(" "),
      frustrationStatement: getsInWay,
      tiredOfStatement: [tiredOf, notCarrying].filter(Boolean).join(" "),
      proudMomentGoal: proudOf,
      peopleOrPurpose: forWho,
      reminderWhenQuitting: quittingReminder,
      pastAttempts: triedBefore,
      pastFailurePatterns: pastFailures,
      knownExcuses: excuses,
      biggestBarriers: barriers,
      motivationStyle,
      accountabilityPreference: callOut,
      remindersThatHelp: remindersHelp,
      remindersThatAnnoy: remindersAnnoy || accountabilityNo,
      topicsToHandleCarefully: carefulTopics,
      coachShouldRemindMeOfWhy: remindWhy,
      createdAt: now,
      updatedAt: now,
    };

    const hardGainer: HardGainerProfile | null = isHardGainerPath
      ? {
          id: uid(),
          userId: user?.id ?? "",
          ...hg,
          preferredHighCalorieFoods: hgEasyFoods.split(",").map((s) => s.trim()).filter(Boolean),
          foodsThatAreHardToEat: hgHardFoods.split(",").map((s) => s.trim()).filter(Boolean),
          appetitePattern: hg.getsFullQuickly ? "fills up quickly" : hg.strugglesWithBreakfast ? "slow morning appetite" : "normal",
          biggestGainBarrier: hgBarrier,
          createdAt: now,
          updatedAt: now,
        }
      : null;

    saveProfile({
      name: name.trim(),
      age: Number(age),
      sex,
      heightIn: Math.round(heightInches * 10) / 10,
      currentWeight: Number(currentWeight),
      goalWeight: goalWeight ? Number(goalWeight) : null,
      activityLevel: activity,
      primaryGoal: primaryGoal!,
      secondaryGoals,
      desiredPace: pace,
      goalDate: goalDate || null,
      goalContext: goalContext || null,
      triedBefore: triedBefore || null,
      coachStyle,
      dietaryPreferences: diets,
      allergies: allergies.split(",").map((s) => s.trim()).filter(Boolean),
      foodsToAvoid: avoid.split(",").map((s) => s.trim()).filter(Boolean),
      cookingSkill: cooking,
      mealPrepPreference: "some" as MealPrepPreference,
      budgetPreference: budget,
      measurementUnits: units,
      mealsPerDay: Number(mealsPerDay) || 3,
      wakeTime: wake || null,
      sleepTime: sleep || null,
      dailyRhythm: rhythm || null,
      onboardingCompleted: true,
      motivationProfileCompleted: true,
      hardGainerProfileCompleted: Boolean(hardGainer),
    });
    update((d) => ({ ...d, motivation, hardGainer }));
    // Branded generating sequence (#4) before landing on the dashboard.
    setGenerating(true);
    setTimeout(() => router.replace("/dashboard"), 8200);
  }

  const targetsPreview = step >= 1 && step1Valid && primaryGoal
    ? computeTargets({
        sex,
        age: Number(age),
        heightIn: heightInches,
        currentWeight: Number(currentWeight),
        activityLevel: activity,
        primaryGoal,
        desiredPace: pace,
      })
    : null;

  if (loading || !user) return null;

  return (
    <main style={{ minHeight: "100dvh", background: "var(--grad-hero)" }}>
      <GeneratingOverlay
        key={generating ? "gen-on" : "gen-off"}
        open={generating}
        steps={[
          "Reading your profile…",
          "Calculating your metabolism…",
          "Setting your calorie & macro targets…",
          `Tuning for your goal: ${primaryGoal?.replace(/_/g, " ") ?? "your goal"}…`,
          "Priming your coach with your why…",
          "Building your plan…",
        ]}
      />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 64px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <Wordmark size={16} />
          <span className="if-overline" style={{ color: "var(--text-muted)" }}>
            Step {step + 1} / {totalSteps}
          </span>
        </div>

        {/* progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 999,
                background: i <= step ? "var(--forest-500)" : "var(--border-subtle)",
                transition: "background var(--dur-base) var(--ease-out)",
              }}
            />
          ))}
        </div>

        <div className="if-overline" style={{ color: "var(--forest-500)", marginBottom: 8 }}>
          {STEP_TITLES[step]}
        </div>

        {/* ============ STEP 1: Basic profile ============ */}
        {step === 0 && (
          <section className="if-fade-up" style={{ display: "grid", gap: 16 }}>
            <h1 className="if-display" style={{ fontSize: 36, margin: 0 }}>
              Let&apos;s learn your body.
            </h1>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 4px" }}>
              Just the basics to start — this takes about a minute. Everything after this is optional, and you can skip
              straight into the app whenever you want.
            </p>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="What should the coach call you?" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="34" />
              <Field label="Sex">
                <SegmentedControl
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                  ]}
                  value={sex}
                  onChange={setSex}
                />
              </Field>
            </div>
            <Field label="Units">
              <SegmentedControl
                options={[
                  { value: "imperial", label: "lb / ft" },
                  { value: "metric", label: "kg / cm" },
                ]}
                value={units}
                onChange={setUnits}
              />
            </Field>
            {units === "imperial" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label="Height (ft)" type="number" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} />
                <Input label="Height (in)" type="number" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} />
              </div>
            ) : (
              <Input label="Height (cm)" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label={`Current weight (${units === "imperial" ? "lb" : "kg"})`}
                type="number"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(units === "metric" ? String(Math.round(Number(e.target.value) * 2.20462 * 10) / 10 || "") : e.target.value)}
                placeholder={units === "imperial" ? "170" : "77"}
              />
              <Input
                label={`Goal weight (${units === "imperial" ? "lb" : "kg"})`}
                type="number"
                optional
                value={goalWeight}
                onChange={(e) => setGoalWeight(units === "metric" ? String(Math.round(Number(e.target.value) * 2.20462 * 10) / 10 || "") : e.target.value)}
              />
            </div>
            <Select
              label="Activity level"
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityLevel)}
              options={[
                { value: "sedentary", label: "Sedentary — desk life, little exercise" },
                { value: "light", label: "Light — 1–3 workouts a week" },
                { value: "moderate", label: "Moderate — 3–5 workouts a week" },
                { value: "active", label: "Active — 6–7 workouts a week" },
                { value: "very_active", label: "Very active — physical job + training" },
              ]}
            />
            <Field label="Dietary preferences" optional>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DIETS.map((d) => (
                  <Chip key={d} label={d} size="sm" selected={diets.includes(d)} onClick={() => toggle(diets, d, setDiets)} />
                ))}
              </div>
            </Field>
            <Input label="Allergies" optional value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Peanuts, shellfish… (comma-separated)" />
            <Input label="Foods to avoid" optional value={avoid} onChange={(e) => setAvoid(e.target.value)} placeholder="Cilantro, mushrooms…" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select
                label="Cooking skill"
                value={cooking}
                onChange={(e) => setCooking(e.target.value as CookingSkill)}
                options={[
                  { value: "beginner", label: "Beginner" },
                  { value: "intermediate", label: "Intermediate" },
                  { value: "advanced", label: "Advanced" },
                ]}
              />
              <Select
                label="Food budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value as BudgetPreference)}
                options={[
                  { value: "tight", label: "Tight" },
                  { value: "moderate", label: "Moderate" },
                  { value: "flexible", label: "Flexible" },
                ]}
              />
            </div>
            <Select
              label="Meals per day (usually)"
              value={mealsPerDay}
              onChange={(e) => setMealsPerDay(e.target.value)}
              options={["2", "3", "4", "5", "6"].map((n) => ({ value: n, label: `${n} meals` }))}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Wake time" optional type="time" value={wake} onChange={(e) => setWake(e.target.value)} />
              <Input label="Sleep time" optional type="time" value={sleep} onChange={(e) => setSleep(e.target.value)} />
            </div>
            <Input label="Work schedule / daily rhythm" optional value={rhythm} onChange={(e) => setRhythm(e.target.value)} placeholder="e.g. 9–5 desk, gym at 6 PM, busy weekends" />
          </section>
        )}

        {/* ============ STEP 2: Goal ============ */}
        {step === 1 && (
          <section className="if-fade-up" style={{ display: "grid", gap: 16 }}>
            <h1 className="if-display" style={{ fontSize: 36, margin: 0 }}>
              What are we building?
            </h1>
            <Field label="Primary goal — pick one">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {GOALS.map((g) => (
                  <Chip
                    key={g.value}
                    label={g.label}
                    selected={primaryGoal === g.value}
                    onClick={() => {
                      setPrimaryGoal(g.value);
                      setSecondaryGoals(secondaryGoals.filter((s) => s !== g.value));
                    }}
                  />
                ))}
              </div>
            </Field>
            <Field label="Secondary goals" optional>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {GOALS.filter((g) => g.value !== primaryGoal).map((g) => (
                  <Chip
                    key={g.value}
                    label={g.label}
                    size="sm"
                    color="var(--navy-400)"
                    selected={secondaryGoals.includes(g.value)}
                    onClick={() => toggle(secondaryGoals, g.value, setSecondaryGoals, 4)}
                  />
                ))}
              </div>
            </Field>
            <Field label="How fast do you want to move?">
              <SegmentedControl
                options={[
                  { value: "slow", label: "Steady" },
                  { value: "moderate", label: "Moderate" },
                  { value: "aggressive", label: "Aggressive" },
                ]}
                value={pace}
                onChange={setPace}
              />
            </Field>
            {targetsPreview && (
              <div className="if-glass" style={{ padding: 16 }}>
                <div className="if-overline" style={{ color: "var(--text-muted)", marginBottom: 8 }}>
                  Your starting targets
                </div>
                <div className="if-num" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34 }}>
                  {targetsPreview.calories.toLocaleString()} <span style={{ fontSize: 16, color: "var(--text-muted)" }}>kcal/day</span>
                </div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
                  {targetsPreview.protein}g protein · {targetsPreview.carbs}g carbs · {targetsPreview.fat}g fat · {targetsPreview.waterOz}oz water
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 8 }}>
                  Estimated maintenance: {targetsPreview.maintenance.toLocaleString()} kcal. The Body Learning Engine will tune this as it learns how you respond.
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Target date" optional type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} />
              <Input
                label="Event or season"
                optional
                value={goalContext}
                onChange={(e) => setGoalContext(e.target.value)}
                placeholder="Wedding, summer…"
              />
            </div>
            <Textarea label="Have you tried this before? How did it go?" optional value={triedBefore} onChange={(e) => setTriedBefore(e.target.value)} />
            <Textarea label="What usually gets in the way?" optional value={getsInWay} onChange={(e) => setGetsInWay(e.target.value)} />
          </section>
        )}

        {/* ============ STEP 3: Motivation ============ */}
        {step === 2 && (
          <section className="if-fade-up" style={{ display: "grid", gap: 16 }}>
            <h1 className="if-display" style={{ fontSize: 36, margin: 0 }}>
              Why does this matter?
            </h1>
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>
              A normal calorie app skips this part. Your coach won&apos;t. Answer what resonates — skip what doesn&apos;t. Your words
              come back when you need them most.
            </p>
            <Textarea label="Why does this goal matter to you right now?" optional value={primaryWhy} onChange={(e) => setPrimaryWhy(e.target.value)} />
            <Textarea label="What will be different in your life if you actually reach it?" optional value={lifeChange} onChange={(e) => setLifeChange(e.target.value)} />
            <Textarea label="What are you tired of feeling, repeating, or dealing with?" optional value={tiredOf} onChange={(e) => setTiredOf(e.target.value)} />
            <Textarea label="What would success look like 6 months from now?" optional value={sixMonths} onChange={(e) => setSixMonths(e.target.value + "")} />
            <Textarea label="What kind of person are you trying to become?" optional value={identity} onChange={(e) => setIdentity(e.target.value)} />
            <Textarea label="What would make you proud of yourself?" optional value={proudOf} onChange={(e) => setProudOf(e.target.value)} />
            <Textarea label="Who or what are you doing this for?" optional value={forWho} onChange={(e) => setForWho(e.target.value)} />
            <Textarea
              label="What is one thing you do not want to carry into the next season of life?"
              optional
              value={notCarrying}
              onChange={(e) => setNotCarrying(e.target.value)}
            />
            <Textarea
              label="What's the deeper reason a normal calorie app wouldn't understand?"
              optional
              value={deeperWhy}
              onChange={(e) => setDeeperWhy(e.target.value)}
            />
            <Textarea
              label="When you feel like quitting, what do you need to be reminded of?"
              optional
              value={quittingReminder}
              onChange={(e) => setQuittingReminder(e.target.value)}
              hint="The coach will quote this back to you — your words, not platitudes."
            />
          </section>
        )}

        {/* ============ STEP 4: Dream outcome ============ */}
        {step === 3 && (
          <section className="if-fade-up" style={{ display: "grid", gap: 16 }}>
            <h1 className="if-display" style={{ fontSize: 36, margin: 0 }}>
              Describe the person you&apos;re building.
            </h1>
            <Textarea label="Describe the version of yourself you are trying to build." optional value={dreamSelf} onChange={(e) => setDreamSelf(e.target.value)} />
            <Textarea label="How do you want to feel in your body?" optional value={dreamFeel} onChange={(e) => setDreamFeel(e.target.value)} />
            <Textarea
              label="What would your daily habits look like if you were already that person?"
              optional
              value={dreamHabits}
              onChange={(e) => setDreamHabits(e.target.value)}
            />
            <Textarea label="What outcome would make all of this worth it?" optional value={dreamWorthIt} onChange={(e) => setDreamWorthIt(e.target.value)} />
          </section>
        )}

        {/* ============ STEP 5: Barriers ============ */}
        {step === 4 && (
          <section className="if-fade-up" style={{ display: "grid", gap: 16 }}>
            <h1 className="if-display" style={{ fontSize: 36, margin: 0 }}>
              What usually breaks your consistency?
            </h1>
            <Field label="Select everything that applies">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {BARRIERS.map((b) => (
                  <Chip key={b} label={b} size="sm" selected={barriers.includes(b)} onClick={() => toggle(barriers, b, setBarriers)} />
                ))}
              </div>
            </Field>
            <Textarea label="What has caused you to fail in the past?" optional value={pastFailures} onChange={(e) => setPastFailures(e.target.value)} />
            <Textarea label="What excuses do you usually make?" optional value={excuses} onChange={(e) => setExcuses(e.target.value)} hint="Be honest. The coach will notice the pattern either way." />
            <Textarea label="What should the coach call out when it sees the pattern?" optional value={callOut} onChange={(e) => setCallOut(e.target.value)} />
            <Input label="What kind of reminders actually help you?" optional value={remindersHelp} onChange={(e) => setRemindersHelp(e.target.value)} />
            <Input label="What kind of reminders annoy you?" optional value={remindersAnnoy} onChange={(e) => setRemindersAnnoy(e.target.value)} />
          </section>
        )}

        {/* ============ STEP 6: Coach style ============ */}
        {step === 5 && (
          <section className="if-fade-up" style={{ display: "grid", gap: 16 }}>
            <h1 className="if-display" style={{ fontSize: 36, margin: 0 }}>
              Choose your coach.
            </h1>
            <div style={{ display: "grid", gap: 12 }}>
              <CoachOption
                title="Encouraging Coach"
                accent="var(--forest-500)"
                body="Warm, patient, supportive. Honest, but leads with what's working."
                selected={coachStyle === "encouraging"}
                onClick={() => setCoachStyle("encouraging")}
              />
              <CoachOption
                title="Balanced Coach"
                accent="var(--navy-400)"
                body="Encouraging and direct. Names the pattern, gives you the next action. The default for a reason."
                selected={coachStyle === "balanced"}
                onClick={() => setCoachStyle("balanced")}
              />
              <CoachOption
                title="No Excuses Coach"
                accent="var(--danger-500)"
                dark
                body="Blunt, intense, data-driven. Quotes your own goals back to you. No cursing, no shaming — but it may hurt your feelings."
                selected={coachStyle === "no_excuses"}
                onClick={() => setNoExcusesModal(1)}
              />
            </div>
            <Input label="What kind of motivation works best for you?" optional value={motivationStyle} onChange={(e) => setMotivationStyle(e.target.value)} />
            <Input label="What kind of accountability do you NOT respond well to?" optional value={accountabilityNo} onChange={(e) => setAccountabilityNo(e.target.value)} />
            <Input label="Any topics the coach should be careful with?" optional value={carefulTopics} onChange={(e) => setCarefulTopics(e.target.value)} />
            <Field label="Remind you of your deeper why when you drift?">
              <SegmentedControl
                options={[
                  { value: "yes", label: "Yes — use my words" },
                  { value: "no", label: "No — keep it tactical" },
                ]}
                value={remindWhy ? "yes" : "no"}
                onChange={(v) => setRemindWhy(v === "yes")}
              />
            </Field>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0 }}>
              InnerForm provides nutrition, habit, and wellness coaching. It is not medical advice and does not diagnose, treat,
              or prevent any disease. Consult a qualified healthcare professional before making major changes to your diet,
              exercise, or health routine, especially if you have a medical condition, eating disorder history, are pregnant, or
              are taking medication.
            </p>
          </section>
        )}

        {/* ============ STEP 7: Hard gainer ============ */}
        {step === 6 && isHardGainerPath && (
          <section className="if-fade-up" style={{ display: "grid", gap: 16 }}>
            <h1 className="if-display" style={{ fontSize: 36, margin: 0 }}>
              Gaining is a skill. Let&apos;s diagnose yours.
            </h1>
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>
              Hard gainers don&apos;t fail from lack of willingness. They fail on calorie strategy — density, timing, and appetite.
              Check what&apos;s true for you.
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              {HG_QUESTIONS.map((q) => (
                <Chip
                  key={q.key}
                  label={q.label}
                  selected={hg[q.key]}
                  onClick={() => setHg({ ...hg, [q.key]: !hg[q.key] })}
                  color="var(--goal-gain)"
                />
              ))}
            </div>
            <Input
              label="Foods you enjoy that are easy to eat consistently"
              optional
              value={hgEasyFoods}
              onChange={(e) => setHgEasyFoods(e.target.value)}
              placeholder="Rice, smoothies, peanut butter… (comma-separated)"
            />
            <Input label="Foods that make you too full too fast" optional value={hgHardFoods} onChange={(e) => setHgHardFoods(e.target.value)} />
            <Textarea label="What's your biggest challenge with gaining weight?" optional value={hgBarrier} onChange={(e) => setHgBarrier(e.target.value)} />
          </section>
        )}

        {/* nav buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <div style={{ flex: 1 }} />
          {step < totalSteps - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={(step === 0 && !step1Valid) || (step === 1 && !step2Valid)}
            >
              Continue
            </Button>
          ) : (
            <Button size="lg" onClick={finish} disabled={!step1Valid || !step2Valid}>
              Build my plan
            </Button>
          )}
        </div>

        {/* Skip the rest — core setup (steps 1–2) is all that's required (#3) */}
        {step >= 1 && step < totalSteps - 1 && step1Valid && step2Valid && (
          <button
            type="button"
            onClick={finish}
            style={{
              display: "block",
              margin: "16px auto 0",
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Skip the rest — take me in now
          </button>
        )}
        {step >= 2 && (
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>
            These reflection questions are optional. You can complete or edit them anytime from your profile.
          </p>
        )}
      </div>

      {/* No Excuses double confirmation */}
      <Modal open={noExcusesModal === 1} onClose={() => setNoExcusesModal(0)} title="Are you sure?">
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <ShieldAlert size={28} color="var(--danger-500)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>
              No Excuses Coach is direct, intense, and confrontational. It will challenge your excuses, call out inconsistent
              behavior, and tell you when your actions do not match your stated goals. It will not curse at you, insult you,
              shame your body, or recommend unsafe behavior. But it may hurt your feelings. Choose this mode only if you want
              hard accountability.
            </p>
          </div>
          <Button variant="danger" fullWidth onClick={() => setNoExcusesModal(2)}>
            I want the hard truth.
          </Button>
          <Button variant="outline" fullWidth onClick={() => setNoExcusesModal(0)}>
            Choose a gentler coach.
          </Button>
        </div>
      </Modal>
      <Modal open={noExcusesModal === 2} onClose={() => setNoExcusesModal(0)} title="Last check">
        <div style={{ display: "grid", gap: 16 }}>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            No Excuses Coach is not here to flatter you. It is here to help you follow through. You can change this setting
            anytime.
          </p>
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              setCoachStyle("no_excuses");
              setNoExcusesModal(0);
            }}
          >
            Yes. Hold me accountable.
          </Button>
        </div>
      </Modal>
    </main>
  );
}

function CoachOption({
  title,
  body,
  accent,
  selected,
  onClick,
  dark = false,
}: {
  title: string;
  body: string;
  accent: string;
  selected: boolean;
  onClick: () => void;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="if-glass"
      style={{
        textAlign: "left",
        padding: 18,
        cursor: "pointer",
        background: dark ? "var(--ink-900)" : selected ? "var(--surface-card-2)" : "var(--glass-bg)",
        border: `1.5px solid ${selected ? accent : "var(--glass-border)"}`,
        borderRadius: "var(--radius-lg)",
        color: "var(--text-primary)",
        transition: "border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: accent }} />
        <strong style={{ fontSize: 16 }}>{title}</strong>
        {selected && (
          <span className="if-overline" style={{ color: accent, marginLeft: "auto" }}>
            Selected
          </span>
        )}
      </div>
      <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{body}</span>
    </button>
  );
}
