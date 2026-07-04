"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
  Badge,
  Challenge,
  CoachMessage,
  DailyTargets,
  DayStats,
  FoodLog,
  GroceryItem,
  GroceryList,
  HardGainerProfile,
  HealthIntegration,
  MealPlan,
  MotivationProfile,
  PlannedMeal,
  Recommendation,
  Streak,
  StreakType,
  UserProfile,
  WaterLog,
  WeighIn,
  WeightTrend,
} from "@/types";
import { computeTargets } from "@/lib/nutrition/calculations";
import { addDays, daysAgo, todayStr } from "@/lib/dates";
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
  logFood(entry: Omit<FoodLog, "id" | "userId" | "createdAt">): void;
  removeFoodLog(id: string): void;
  addWater(amountOz: number, date?: string): void;
  addWeighIn(weight: number, notes?: string, date?: string): void;
  todayStats(date?: string): DayStats;
  recentDays(count?: number): DayStats[];
  weightTrend(): WeightTrend;
  streakFor(type: StreakType): Streak | undefined;
  awardBadge(key: string, title: string, description: string): void;
}

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
      if (raw) return { ...EMPTY_DATA, ...(JSON.parse(raw) as AppData) };
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
    (entry: Omit<FoodLog, "id" | "userId" | "createdAt">) => {
      update((d0) => {
        const log: FoodLog = { ...entry, id: uid(), userId: userRef.current?.id ?? "", createdAt: new Date().toISOString() };
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
    }),
    [loading, user, data, supabaseMode, signUp, signIn, signOut, update, saveProfile, logFood, removeFoodLog, addWater, addWeighIn, todayStats, recentDays, weightTrend, streakFor, awardBadge],
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
  const t = data.targets;
  return {
    date,
    calories: Math.round(logs.reduce((s, l) => s + l.calories, 0)),
    protein: Math.round(logs.reduce((s, l) => s + l.protein, 0)),
    carbs: Math.round(logs.reduce((s, l) => s + l.carbs, 0)),
    fat: Math.round(logs.reduce((s, l) => s + l.fat, 0)),
    waterOz: water,
    mealsLogged: logs.length,
    loggedMealTypes: [...new Set(logs.map((l) => l.mealType))],
    targetCalories: t?.calories ?? 2000,
    targetProtein: t?.protein ?? 140,
    targetWaterOz: t?.waterOz ?? 80,
  };
}

export function useApp(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppStoreProvider");
  return ctx;
}
