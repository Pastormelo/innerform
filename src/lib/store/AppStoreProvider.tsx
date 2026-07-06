"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
  Badge,
  Challenge,
  CoachMessage,
  DailyNote,
  DailyTargets,
  DashboardWidget,
  DayStats,
  ExerciseLog,
  FoodLog,
  GroceryItem,
  GroceryList,
  HardGainerProfile,
  HealthIntegration,
  MealPlan,
  MotivationProfile,
  PlannedMeal,
  ProgressPhoto,
  Recipe,
  Recommendation,
  Reminder,
  SavedMeal,
  StepLog,
  Streak,
  StreakType,
  Theme,
  UserProfile,
  WaterLog,
  WeighIn,
  WeightTrend,
} from "@/types";
import { DEFAULT_WIDGETS } from "@/types";
import { computeTargets } from "@/lib/nutrition/calculations";
import { addDays, daysAgo, todayStr } from "@/lib/dates";
import { applyTheme } from "@/lib/theme";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

/* ============================================================
   App store — auth + all user data behind one hook.

   Persistence strategy (MVP): every entity is kept in React
   state and mirrored to localStorage per user. Supabase Auth is
   used when configured (demo email auth otherwise). Swapping
   localStorage for Supabase queries means reimplementing the
   `persist` calls with table writes — the entity shapes already
   mirror supabase/schema.sql.
   ============================================================ */

export interface AuthUser {
  id: string;
  email: string;
  isDemo: boolean;
}

export interface AppData {
  profile: UserProfile | null;
  motivation: MotivationProfile | null;
  hardGainer: HardGainerProfile | null;
  targets: DailyTargets | null; // current default targets
  foodLogs: FoodLog[];
  waterLogs: WaterLog[];
  weighIns: WeighIn[];
  mealPlans: MealPlan[];
  plannedMeals: PlannedMeal[];
  groceryLists: GroceryList[];
  groceryItems: GroceryItem[];
  coachMessages: CoachMessage[];
  challenges: Challenge[];
  badges: Badge[];
  streaks: Streak[];
  healthIntegrations: HealthIntegration[];
  recommendations: Recommendation[];
  frequentMealIds: string[];
  // Added features
  exerciseLogs: ExerciseLog[];
  stepLogs: StepLog[];
  dailyNotes: DailyNote[];
  savedMeals: SavedMeal[];
  reminders: Reminder[];
  favoriteFoodIds: string[];
  recipes: Recipe[];
  progressPhotos: ProgressPhoto[];
  streakFreezes: number;
}

const EMPTY_DATA: AppData = {
  profile: null,
  motivation: null,
  hardGainer: null,
  targets: null,
  foodLogs: [],
  waterLogs: [],
  weighIns: [],
  mealPlans: [],
  plannedMeals: [],
  groceryLists: [],
  groceryItems: [],
  coachMessages: [],
  challenges: [],
  badges: [],
  streaks: [],
  healthIntegrations: [],
  recommendations: [],
  frequentMealIds: [],
  exerciseLogs: [],
  stepLogs: [],
  dailyNotes: [],
  savedMeals: [],
  reminders: [],
  favoriteFoodIds: [],
  recipes: [],
  progressPhotos: [],
  streakFreezes: 2,
};

export const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

const AUTH_KEY = "innerform:auth";
const dataKey = (userId: string) => `innerform:data:${userId}`;
const usersKey = "innerform:demo-users";

interface AppStore {
  loading: boolean;
  user: AuthUser | null;
  data: AppData;
  supabaseMode: boolean;
  signUp(email: string, password: string): Promise<string | null>;
  signIn(email: string, password: string): Promise<string | null>;
  signOut(): Promise<void>;
  update(mutator: (d: AppData) => AppData): void;
  saveProfile(p: Partial<UserProfile>): void;
  logFood(entry: FoodLogInput): void;
  removeFoodLog(id: string): void;
  addWater(amountOz: number, date?: string): void;
  addWeighIn(weight: number, notes?: string, date?: string): void;
  todayStats(date?: string): DayStats;
  recentDays(count?: number): DayStats[];
  weightTrend(): WeightTrend;
  streakFor(type: StreakType): Streak | undefined;
  awardBadge(key: string, title: string, description: string): void;
  // Added features
  logExercise(entry: Omit<ExerciseLog, "id" | "userId" | "createdAt" | "loggedAt">): void;
  removeExercise(id: string): void;
  setSteps(steps: number, date?: string): void;
  saveNote(body: string, date?: string): void;
  noteFor(date?: string): DailyNote | undefined;
  saveMeal(meal: Omit<SavedMeal, "id" | "userId" | "createdAt">): void;
  removeSavedMeal(id: string): void;
  logSavedMeal(meal: SavedMeal, date: string): void;
  toggleFavorite(foodId: string): void;
  isFavorite(foodId: string): boolean;
  setTheme(theme: Theme): void;
  setDashboardWidgets(widgets: DashboardWidget[]): void;
  markReminderRead(id: string): void;
  refreshReminders(): void;
  saveRecipe(recipe: Omit<Recipe, "id" | "userId">): void;
  removeRecipe(id: string): void;
  logRecipe(recipe: Recipe, servings: number, date: string, mealType: import("@/types").MealTypeKey): void;
  addProgressPhoto(imageUrl: string, weight: number | null, note: string | null, date?: string): void;
  removeProgressPhoto(id: string): void;
  applyStreakFreeze(type: StreakType): void;
  addCustomMealType(label: string, icon: string): void;
  removeCustomMealType(key: string): void;
  reorderCustomMealType(key: string, dir: -1 | 1): void;
}

/** logFood accepts an entry without server-managed fields; loggedAt/imageUrl are optional. */
export type FoodLogInput = Omit<FoodLog, "id" | "userId" | "createdAt" | "loggedAt" | "imageUrl"> & {
  loggedAt?: string | null;
  imageUrl?: string | null;
};

const Ctx = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const userRef = useRef<AuthUser | null>(null);
  userRef.current = user;
  const supabaseMode = isSupabaseConfigured();

  /* ---- boot: restore session ---- */
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user: su } }) => {
        if (su) {
          const u = { id: su.id, email: su.email ?? "", isDemo: false };
          setUser(u);
          setData(loadData(u.id));
        }
        setLoading(false);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        const su = session?.user;
        if (su) {
          const u = { id: su.id, email: su.email ?? "", isDemo: false };
          setUser(u);
          setData(loadData(u.id));
        } else {
          setUser(null);
          setData(EMPTY_DATA);
        }
      });
      return () => sub.subscription.unsubscribe();
    }
    // Demo mode — restore the local session asynchronously (external-system sync).
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (raw) {
          const u = JSON.parse(raw) as AuthUser;
          setUser(u);
          setData(loadData(u.id));
        }
      } catch {}
      setLoading(false);
    });
  }, []);

  function loadData(userId: string): AppData {
    try {
      const raw = localStorage.getItem(dataKey(userId));
      if (raw) {
        const parsed = { ...EMPTY_DATA, ...(JSON.parse(raw) as AppData) };
        // Backfill fields added after a profile was first created.
        if (parsed.profile) {
          const p = parsed.profile;
          parsed.profile = {
            ...p,
            theme: p.theme ?? "basic",
            dashboardWidgets: p.dashboardWidgets ?? DEFAULT_WIDGETS,
            stepsGoal: p.stepsGoal ?? 8000,
            exerciseAddsToBudget: p.exerciseAddsToBudget ?? true,
            timestampsEnabled: p.timestampsEnabled ?? true,
            weighInSchedule: p.weighInSchedule ?? { enabled: false, days: [1], time: "07:00" },
            photoUrl: p.photoUrl ?? null,
            macroCycling: p.macroCycling ?? { enabled: false, trainingDays: [1, 3, 5], trainingCalorieDelta: 250, restCalorieDelta: -150 },
            hydrationReminders: p.hydrationReminders ?? true,
            customMealTypes: p.customMealTypes ?? [],
          };
          if (parsed.streakFreezes == null) parsed.streakFreezes = 2;
          applyTheme(parsed.profile.theme);
        }
        return parsed;
      }
    } catch {}
    return EMPTY_DATA;
  }

  const persist = useCallback((userId: string, d: AppData) => {
    try {
      localStorage.setItem(dataKey(userId), JSON.stringify(d));
    } catch {}
  }, []);

  const update = useCallback(
    (mutator: (d: AppData) => AppData) => {
      setData((prev) => {
        const next = mutator(prev);
        const u = userRef.current;
        if (u) persist(u.id, next);
        return next;
      });
    },
    [persist],
  );

  /* ---- auth ---- */

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data: res, error } = await supabase.auth.signUp({ email, password });
      if (error) return error.message;
      if (res.user) {
        const u = { id: res.user.id, email, isDemo: false };
        setUser(u);
        setData(loadData(u.id));
      }
      return null;
    }
    // Demo signup.
    if (password.length < 6) return "Password must be at least 6 characters.";
    const users: Record<string, { id: string; password: string }> = JSON.parse(localStorage.getItem(usersKey) ?? "{}");
    if (users[email]) return "An account with that email already exists.";
    const u: AuthUser = { id: uid(), email, isDemo: true };
    users[email] = { id: u.id, password };
    localStorage.setItem(usersKey, JSON.stringify(users));
    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
    setData(EMPTY_DATA);
    return null;
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data: res, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return error.message;
      if (res.user) {
        const u = { id: res.user.id, email, isDemo: false };
        setUser(u);
        setData(loadData(u.id));
      }
      return null;
    }
    const users: Record<string, { id: string; password: string }> = JSON.parse(localStorage.getItem(usersKey) ?? "{}");
    const rec = users[email];
    if (!rec || rec.password !== password) return "Invalid email or password.";
    const u: AuthUser = { id: rec.id, email, isDemo: true };
    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
    setData(loadData(u.id));
    return null;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    setData(EMPTY_DATA);
  }, []);

  /* ---- streaks & badges ---- */

  const bumpStreak = useCallback((d: AppData, type: StreakType, date: string): AppData => {
    const existing = d.streaks.find((s) => s.streakType === type);
    if (!existing) {
      const s: Streak = { id: uid(), userId: userRef.current?.id ?? "", streakType: type, currentCount: 1, bestCount: 1, lastUpdatedDate: date };
      return { ...d, streaks: [...d.streaks, s] };
    }
    if (existing.lastUpdatedDate === date) return d;
    const continued = existing.lastUpdatedDate === addDays(date, -1);
    const currentCount = continued ? existing.currentCount + 1 : 1;
    return {
      ...d,
      streaks: d.streaks.map((s) =>
        s.streakType === type ? { ...s, currentCount, bestCount: Math.max(s.bestCount, currentCount), lastUpdatedDate: date } : s,
      ),
    };
  }, []);

  const grantBadge = useCallback((d: AppData, key: string, title: string, description: string): AppData => {
    if (d.badges.some((b) => b.badgeKey === key)) return d;
    const b: Badge = { id: uid(), userId: userRef.current?.id ?? "", badgeKey: key, title, description, earnedAt: new Date().toISOString() };
    return { ...d, badges: [...d.badges, b] };
  }, []);

  const awardBadge = useCallback(
    (key: string, title: string, description: string) => update((d) => grantBadge(d, key, title, description)),
    [update, grantBadge],
  );

  /* ---- domain actions ---- */

  const saveProfile = useCallback(
    (p: Partial<UserProfile>) => {
      update((d) => {
        const now = new Date().toISOString();
        const existing = d.profile;
        const profile: UserProfile = existing
          ? { ...existing, ...p, updatedAt: now }
          : {
              id: uid(),
              authUserId: userRef.current?.id ?? "",
              name: "",
              age: null,
              sex: null,
              heightIn: null,
              currentWeight: null,
              goalWeight: null,
              activityLevel: "moderate",
              primaryGoal: "maintain_weight",
              secondaryGoals: [],
              desiredPace: "moderate",
              goalDate: null,
              goalContext: null,
              triedBefore: null,
              coachStyle: "balanced",
              dietaryPreferences: [],
              allergies: [],
              foodsToAvoid: [],
              cookingSkill: "intermediate",
              mealPrepPreference: "some",
              budgetPreference: "moderate",
              measurementUnits: "imperial",
              mealsPerDay: 3,
              wakeTime: null,
              sleepTime: null,
              dailyRhythm: null,
              onboardingCompleted: false,
              motivationProfileCompleted: false,
              hardGainerProfileCompleted: false,
              photoUrl: null,
              theme: "basic",
              dashboardWidgets: DEFAULT_WIDGETS,
              stepsGoal: 8000,
              exerciseAddsToBudget: true,
              timestampsEnabled: true,
              weighInSchedule: { enabled: false, days: [1], time: "07:00" },
              macroCycling: { enabled: false, trainingDays: [1, 3, 5], trainingCalorieDelta: 250, restCalorieDelta: -150 },
              hydrationReminders: true,
              customMealTypes: [],
              createdAt: now,
              updatedAt: now,
              ...p,
            };
        const t = computeTargets(profile);
        const targets: DailyTargets = {
          id: d.targets?.id ?? uid(),
          userId: userRef.current?.id ?? "",
          targetDate: todayStr(),
          calories: t.calories,
          protein: t.protein,
          carbs: t.carbs,
          fat: t.fat,
          fiber: t.fiber,
          waterOz: t.waterOz,
        };
        return { ...d, profile, targets };
      });
    },
    [update],
  );

  const logFood = useCallback(
    (entry: FoodLogInput) => {
      update((d0) => {
        const nowIso = new Date().toISOString();
        const log: FoodLog = {
          ...entry,
          loggedAt: entry.loggedAt ?? (d0.profile?.timestampsEnabled !== false ? nowIso : null),
          imageUrl: entry.imageUrl ?? null,
          id: uid(),
          userId: userRef.current?.id ?? "",
          createdAt: nowIso,
        };
        let d = { ...d0, foodLogs: [...d0.foodLogs, log] };
        d = bumpStreak(d, "logging", entry.logDate);

        // Badge triggers.
        const dayLogs = d.foodLogs.filter((l) => l.logDate === entry.logDate);
        const types = new Set(dayLogs.map((l) => l.mealType));
        if (types.has("breakfast") && types.has("lunch") && types.has("dinner"))
          d = grantBadge(d, "first_full_day", "First Full Day Logged", "Breakfast, lunch, and dinner — all on the record.");
        const streak = d.streaks.find((s) => s.streakType === "logging");
        if (streak && streak.currentCount >= 3)
          d = grantBadge(d, "logging_3day", "3-Day Logging Streak", "Three consecutive days logged. The chain has begun.");

        // Protein streak check.
        const dayProtein = dayLogs.reduce((s, l) => s + l.protein, 0);
        if (d.targets && dayProtein >= d.targets.protein) {
          d = bumpStreak(d, "protein", entry.logDate);
          const ps = d.streaks.find((s) => s.streakType === "protein");
          if (ps && ps.currentCount >= 3) d = grantBadge(d, "protein_locked_in", "Protein Locked In", "Protein target hit three days running.");
        }

        // Frequent meals memory.
        if (entry.foodItemId) {
          const ids = [entry.foodItemId, ...d.frequentMealIds.filter((x) => x !== entry.foodItemId)].slice(0, 12);
          d = { ...d, frequentMealIds: ids };
        }

        // Challenge progress (logging-type challenges tick on any log).
        d = {
          ...d,
          challenges: d.challenges.map((c) =>
            c.status === "active" && c.challengeType === "logging" && entry.logDate >= c.startDate && entry.logDate <= c.endDate
              ? tickChallenge(c, d)
              : c,
          ),
        };
        return d;
      });
    },
    [update, bumpStreak, grantBadge],
  );

  const removeFoodLog = useCallback(
    (id: string) => update((d) => ({ ...d, foodLogs: d.foodLogs.filter((l) => l.id !== id) })),
    [update],
  );

  const addWater = useCallback(
    (amountOz: number, date?: string) => {
      update((d0) => {
        const logDate = date ?? todayStr();
        const w: WaterLog = { id: uid(), userId: userRef.current?.id ?? "", logDate, amountOz, createdAt: new Date().toISOString() };
        let d = { ...d0, waterLogs: [...d0.waterLogs, w] };
        const total = d.waterLogs.filter((x) => x.logDate === logDate).reduce((s, x) => s + x.amountOz, 0);
        if (d.targets && total >= d.targets.waterOz) {
          d = bumpStreak(d, "water", logDate);
          const ws = d.streaks.find((s) => s.streakType === "water");
          if (ws && ws.currentCount >= 4) d = grantBadge(d, "hydration_streak", "Hydration Streak", "Water target hit four days in a row.");
        }
        return d;
      });
    },
    [update, bumpStreak, grantBadge],
  );

  const addWeighIn = useCallback(
    (weight: number, notes?: string, date?: string) => {
      update((d0) => {
        const logDate = date ?? todayStr();
        const w: WeighIn = { id: uid(), userId: userRef.current?.id ?? "", weight, logDate, notes: notes ?? null, createdAt: new Date().toISOString() };
        let d = { ...d0, weighIns: [...d0.weighIns.filter((x) => x.logDate !== logDate), w] };
        d = bumpStreak(d, "weigh_in", logDate);
        if (d.profile) d = { ...d, profile: { ...d.profile, currentWeight: weight, updatedAt: new Date().toISOString() } };
        return d;
      });
    },
    [update, bumpStreak],
  );

  /* ---- exercise / steps / notes / saved meals / favorites / theme / reminders ---- */

  const logExercise = useCallback(
    (entry: Omit<ExerciseLog, "id" | "userId" | "createdAt" | "loggedAt">) => {
      update((d0) => {
        const nowIso = new Date().toISOString();
        const ex: ExerciseLog = {
          ...entry,
          id: uid(),
          userId: userRef.current?.id ?? "",
          loggedAt: d0.profile?.timestampsEnabled !== false ? nowIso : null,
          createdAt: nowIso,
        };
        return { ...d0, exerciseLogs: [...d0.exerciseLogs, ex] };
      });
    },
    [update],
  );

  const removeExercise = useCallback(
    (id: string) => update((d) => ({ ...d, exerciseLogs: d.exerciseLogs.filter((e) => e.id !== id) })),
    [update],
  );

  const setSteps = useCallback(
    (steps: number, date?: string) => {
      update((d0) => {
        const logDate = date ?? todayStr();
        const existing = d0.stepLogs.find((s) => s.logDate === logDate);
        const entry: StepLog = {
          id: existing?.id ?? uid(),
          userId: userRef.current?.id ?? "",
          logDate,
          steps,
          source: "manual",
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        };
        return { ...d0, stepLogs: [...d0.stepLogs.filter((s) => s.logDate !== logDate), entry] };
      });
    },
    [update],
  );

  const saveNote = useCallback(
    (body: string, date?: string) => {
      update((d0) => {
        const logDate = date ?? todayStr();
        const note: DailyNote = { id: uid(), userId: userRef.current?.id ?? "", logDate, body, updatedAt: new Date().toISOString() };
        return { ...d0, dailyNotes: [...d0.dailyNotes.filter((n) => n.logDate !== logDate), note] };
      });
    },
    [update],
  );

  const noteFor = useCallback((date?: string) => data.dailyNotes.find((n) => n.logDate === (date ?? todayStr())), [data]);

  const saveMeal = useCallback(
    (meal: Omit<SavedMeal, "id" | "userId" | "createdAt">) => {
      update((d0) => ({
        ...d0,
        savedMeals: [...d0.savedMeals, { ...meal, id: uid(), userId: userRef.current?.id ?? "", createdAt: new Date().toISOString() }],
      }));
    },
    [update],
  );

  const removeSavedMeal = useCallback(
    (id: string) => update((d) => ({ ...d, savedMeals: d.savedMeals.filter((m) => m.id !== id) })),
    [update],
  );

  const logSavedMeal = useCallback(
    (meal: SavedMeal, date: string) => {
      for (const it of meal.items) {
        logFood({
          logDate: date,
          mealType: meal.mealType,
          foodItemId: it.foodItemId,
          customName: it.customName,
          quantity: it.quantity,
          calories: it.calories,
          protein: it.protein,
          carbs: it.carbs,
          fat: it.fat,
          fiber: it.fiber,
          sugar: it.sugar,
          sodium: it.sodium,
          foodQualityScore: null,
          foodQualityLabel: null,
          notes: `From saved meal: ${meal.name}`,
        });
      }
    },
    [logFood],
  );

  const toggleFavorite = useCallback(
    (foodId: string) =>
      update((d) => ({
        ...d,
        favoriteFoodIds: d.favoriteFoodIds.includes(foodId)
          ? d.favoriteFoodIds.filter((x) => x !== foodId)
          : [...d.favoriteFoodIds, foodId],
      })),
    [update],
  );

  const isFavorite = useCallback((foodId: string) => data.favoriteFoodIds.includes(foodId), [data]);

  const setTheme = useCallback(
    (theme: Theme) => {
      applyTheme(theme);
      update((d) => (d.profile ? { ...d, profile: { ...d.profile, theme, updatedAt: new Date().toISOString() } } : d));
    },
    [update],
  );

  const setDashboardWidgets = useCallback(
    (widgets: DashboardWidget[]) =>
      update((d) => (d.profile ? { ...d, profile: { ...d.profile, dashboardWidgets: widgets, updatedAt: new Date().toISOString() } } : d)),
    [update],
  );

  const markReminderRead = useCallback(
    (id: string) => update((d) => ({ ...d, reminders: d.reminders.map((r) => (r.id === id ? { ...r, read: true } : r)) })),
    [update],
  );

  const refreshReminders = useCallback(() => {
    update((d0) => {
      const generated = generateReminders(d0);
      if (!generated.length) return d0;
      // Dedupe against reminders already created today of the same kind.
      const today = todayStr();
      const existingKinds = new Set(
        d0.reminders.filter((r) => r.createdAt.slice(0, 10) === today).map((r) => r.kind),
      );
      const fresh = generated
        .filter((r) => !existingKinds.has(r.kind))
        .map((r) => ({ ...r, id: uid(), userId: userRef.current?.id ?? "", createdAt: new Date().toISOString(), read: false }));
      if (!fresh.length) return d0;
      return { ...d0, reminders: [...fresh, ...d0.reminders].slice(0, 40) };
    });
  }, [update]);

  /* ---- recipes / progress photos / streak freezes ---- */

  const saveRecipe = useCallback(
    (recipe: Omit<Recipe, "id" | "userId">) =>
      update((d) => ({ ...d, recipes: [...d.recipes, { ...recipe, id: uid(), userId: userRef.current?.id ?? "" }] })),
    [update],
  );

  const removeRecipe = useCallback(
    (id: string) => update((d) => ({ ...d, recipes: d.recipes.filter((r) => r.id !== id) })),
    [update],
  );

  const logRecipe = useCallback(
    (recipe: Recipe, servings: number, date: string, mealType: import("@/types").MealTypeKey) => {
      logFood({
        logDate: date,
        mealType,
        foodItemId: null,
        customName: `${recipe.title} (${servings} serving${servings === 1 ? "" : "s"})`,
        quantity: servings,
        calories: recipe.caloriesPerServing * servings,
        protein: recipe.proteinPerServing * servings,
        carbs: recipe.carbsPerServing * servings,
        fat: recipe.fatPerServing * servings,
        fiber: 0,
        sugar: 0,
        sodium: null,
        foodQualityScore: null,
        foodQualityLabel: null,
        notes: null,
      });
    },
    [logFood],
  );

  const addProgressPhoto = useCallback(
    (imageUrl: string, weight: number | null, note: string | null, date?: string) =>
      update((d) => ({
        ...d,
        progressPhotos: [
          { id: uid(), userId: userRef.current?.id ?? "", logDate: date ?? todayStr(), imageUrl, weight, note, createdAt: new Date().toISOString() },
          ...d.progressPhotos,
        ],
      })),
    [update],
  );

  const removeProgressPhoto = useCallback(
    (id: string) => update((d) => ({ ...d, progressPhotos: d.progressPhotos.filter((p) => p.id !== id) })),
    [update],
  );

  /** Spend a freeze to bridge a one-day gap so the streak survives (#streak recovery). */
  const applyStreakFreeze = useCallback(
    (type: StreakType) =>
      update((d) => {
        if (d.streakFreezes <= 0) return d;
        return {
          ...d,
          streakFreezes: d.streakFreezes - 1,
          streaks: d.streaks.map((s) => (s.streakType === type ? { ...s, lastUpdatedDate: daysAgo(1) } : s)),
        };
      }),
    [update],
  );

  /* ---- custom meal types (#21) ---- */

  const addCustomMealType = useCallback(
    (label: string, icon: string) =>
      update((d) => {
        if (!d.profile) return d;
        const key = `custom:${uid()}`;
        const next = [...d.profile.customMealTypes, { key, label: label.trim(), icon }];
        return { ...d, profile: { ...d.profile, customMealTypes: next, updatedAt: new Date().toISOString() } };
      }),
    [update],
  );

  const removeCustomMealType = useCallback(
    (key: string) =>
      update((d) =>
        d.profile ? { ...d, profile: { ...d.profile, customMealTypes: d.profile.customMealTypes.filter((c) => c.key !== key) } } : d,
      ),
    [update],
  );

  const reorderCustomMealType = useCallback(
    (key: string, dir: -1 | 1) =>
      update((d) => {
        if (!d.profile) return d;
        const arr = [...d.profile.customMealTypes];
        const i = arr.findIndex((c) => c.key === key);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= arr.length) return d;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        return { ...d, profile: { ...d.profile, customMealTypes: arr } };
      }),
    [update],
  );

  /* ---- selectors ---- */

  const todayStats = useCallback(
    (date?: string): DayStats => dayStatsFor(data, date ?? todayStr()),
    [data],
  );

  const recentDays = useCallback(
    (count = 14): DayStats[] => {
      const days: DayStats[] = [];
      for (let i = 0; i < count; i++) days.push(dayStatsFor(data, daysAgo(i)));
      return days;
    },
    [data],
  );

  const weightTrend = useCallback((): WeightTrend => {
    const entries = [...data.weighIns].sort((a, b) => a.logDate.localeCompare(b.logDate));
    if (entries.length < 2)
      return { direction: "unknown", weeklyRateLbs: null, latestWeight: entries[0]?.weight ?? data.profile?.currentWeight ?? null, entries: entries.length };
    const first = entries[0];
    const last = entries[entries.length - 1];
    const daysSpan = Math.max(1, (new Date(last.logDate).getTime() - new Date(first.logDate).getTime()) / 86400000);
    const rate = ((last.weight - first.weight) / daysSpan) * 7;
    const direction = Math.abs(rate) < 0.25 ? "flat" : rate > 0 ? "up" : "down";
    return { direction, weeklyRateLbs: Math.round(rate * 100) / 100, latestWeight: last.weight, entries: entries.length };
  }, [data]);

  const streakFor = useCallback((type: StreakType) => data.streaks.find((s) => s.streakType === type), [data]);

  const store = useMemo<AppStore>(
    () => ({
      loading,
      user,
      data,
      supabaseMode,
      signUp,
      signIn,
      signOut,
      update,
      saveProfile,
      logFood,
      removeFoodLog,
      addWater,
      addWeighIn,
      todayStats,
      recentDays,
      weightTrend,
      streakFor,
      awardBadge,
      logExercise,
      removeExercise,
      setSteps,
      saveNote,
      noteFor,
      saveMeal,
      removeSavedMeal,
      logSavedMeal,
      toggleFavorite,
      isFavorite,
      setTheme,
      setDashboardWidgets,
      markReminderRead,
      refreshReminders,
      saveRecipe,
      removeRecipe,
      logRecipe,
      addProgressPhoto,
      removeProgressPhoto,
      applyStreakFreeze,
      addCustomMealType,
      removeCustomMealType,
      reorderCustomMealType,
    }),
    [loading, user, data, supabaseMode, signUp, signIn, signOut, update, saveProfile, logFood, removeFoodLog, addWater, addWeighIn, todayStats, recentDays, weightTrend, streakFor, awardBadge, logExercise, removeExercise, setSteps, saveNote, noteFor, saveMeal, removeSavedMeal, logSavedMeal, toggleFavorite, isFavorite, setTheme, setDashboardWidgets, markReminderRead, refreshReminders, saveRecipe, removeRecipe, logRecipe, addProgressPhoto, removeProgressPhoto, applyStreakFreeze, addCustomMealType, removeCustomMealType, reorderCustomMealType],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

function tickChallenge(c: Challenge, d: AppData): Challenge {
  const currentValue = Math.min(c.targetValue, c.currentValue + 1);
  const status = currentValue >= c.targetValue ? "completed" : c.status;
  void d;
  return { ...c, currentValue, status };
}

function dayStatsFor(data: AppData, date: string): DayStats {
  const logs = data.foodLogs.filter((l) => l.logDate === date);
  const water = data.waterLogs.filter((w) => w.logDate === date).reduce((s, w) => s + w.amountOz, 0);
  const steps = data.stepLogs.filter((s) => s.logDate === date).reduce((m, s) => Math.max(m, s.steps), 0);
  const caloriesBurned = Math.round(data.exerciseLogs.filter((e) => e.logDate === date).reduce((s, e) => s + e.caloriesBurned, 0));
  const t = data.targets;
  let targetCalories = t?.calories ?? 2000;
  // Macro cycling: shift the day's target on training vs rest days.
  const mc = data.profile?.macroCycling;
  if (mc?.enabled) {
    const dow = new Date(date + "T12:00:00").getDay();
    targetCalories += mc.trainingDays.includes(dow) ? mc.trainingCalorieDelta : mc.restCalorieDelta;
  }
  const exerciseAdds = data.profile?.exerciseAddsToBudget ?? false;
  return {
    date,
    calories: Math.round(logs.reduce((s, l) => s + l.calories, 0)),
    protein: Math.round(logs.reduce((s, l) => s + l.protein, 0)),
    carbs: Math.round(logs.reduce((s, l) => s + l.carbs, 0)),
    fat: Math.round(logs.reduce((s, l) => s + l.fat, 0)),
    fiber: Math.round(logs.reduce((s, l) => s + l.fiber, 0)),
    sugar: Math.round(logs.reduce((s, l) => s + l.sugar, 0)),
    sodium: Math.round(logs.reduce((s, l) => s + (l.sodium ?? 0), 0)),
    waterOz: water,
    steps,
    caloriesBurned,
    mealsLogged: logs.length,
    loggedMealTypes: [...new Set(logs.map((l) => l.mealType))],
    targetCalories,
    targetProtein: t?.protein ?? 140,
    targetWaterOz: t?.waterOz ?? 80,
    effectiveTargetCalories: exerciseAdds ? targetCalories + caloriesBurned : targetCalories,
  };
}

/* ============================================================
   In-app reminder generation (#6). Pure function over current
   data + wall-clock time; emits encouragement/nudges the UI
   shows in a feed and on app open. Real background push comes
   with the native wrapper — see README.
   ============================================================ */
function generateReminders(d: AppData): Omit<Reminder, "id" | "userId" | "createdAt" | "read">[] {
  const out: Omit<Reminder, "id" | "userId" | "createdAt" | "read">[] = [];
  if (!d.profile || !d.targets) return out;
  const today = todayStr();
  const hour = new Date().getHours();
  const logs = d.foodLogs.filter((l) => l.logDate === today);
  const eaten = logs.reduce((s, l) => s + l.calories, 0);
  const target = d.targets.calories;
  const water = d.waterLogs.filter((w) => w.logDate === today).reduce((s, w) => s + w.amountOz, 0);
  const dir = d.profile.primaryGoal;
  const gaining = dir === "gain_weight" || dir === "build_muscle";
  const name = d.profile.name?.split(" ")[0];

  // Behind on calories by mid-afternoon.
  if (hour >= 14 && logs.length > 0) {
    const expected = target * (Math.min(hour, 21) / 21);
    if (gaining && eaten < expected - 400) {
      out.push({
        kind: "behind_nudge",
        message: `You're ${Math.round(expected - eaten)} calories behind pace for a gaining day. A shake or a calorie-dense snack now beats trying to cram it at 9pm.`,
        actionHref: "/log",
      });
    } else if (!gaining && eaten > target + 300 && hour < 19) {
      out.push({
        kind: "behind_nudge",
        message: `You're over target with the evening still ahead. Not a failure — just plan a lighter dinner and pre-log it.`,
        actionHref: "/log",
      });
    }
  }

  // No meals logged yet, and it's past mid-morning.
  if (hour >= 11 && logs.length === 0) {
    out.push({
      kind: "log_nudge",
      message: `${name ? name + ", n" : "N"}othing logged yet today. Two taps gets you back on the board — start with whatever you already ate.`,
      actionHref: "/log",
    });
  }

  // Water behind in the afternoon (if hydration reminders are on).
  if (d.profile.hydrationReminders !== false && hour >= 15 && water < d.targets.waterOz * 0.5) {
    out.push({
      kind: "water_nudge",
      message: `Hydration's lagging — ${water}/${d.targets.waterOz} oz. Knock out a glass now and tap +16.`,
      actionHref: "/dashboard",
    });
  }

  // Haven't weighed in for a while (independent of scheduled days).
  const lastWeigh = [...d.weighIns].sort((a, b) => b.logDate.localeCompare(a.logDate))[0];
  if (lastWeigh && lastWeigh.logDate <= addDays(today, -5)) {
    out.push({
      kind: "weigh_in",
      message: `It's been since ${lastWeigh.logDate} since your last weigh-in. The trend needs fresh data — step on today.`,
      actionHref: "/progress",
    });
  }

  // Scheduled weigh-in day.
  const sched = d.profile.weighInSchedule;
  if (sched?.enabled && sched.days.includes(new Date().getDay())) {
    const weighedToday = d.weighIns.some((w) => w.logDate === today);
    if (!weighedToday && hour >= Number(sched.time.split(":")[0])) {
      out.push({
        kind: "weigh_in",
        message: `It's a scheduled weigh-in day. Same time, same conditions — step on and log it. The trend needs the data point.`,
        actionHref: "/progress",
      });
    }
  }

  // Encouragement when things are going well.
  if (logs.length >= 2 && ((gaining && eaten >= target * 0.8) || (!gaining && Math.abs(eaten - target) < target * 0.15))) {
    out.push({
      kind: "encouragement",
      message: `On pace and logging consistently today. This is exactly the pattern that moves the needle — keep stacking it.`,
      actionHref: null,
    });
  }

  return out;
}

export function useApp(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppStoreProvider");
  return ctx;
}
