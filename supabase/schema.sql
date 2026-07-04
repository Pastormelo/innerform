-- ============================================================
-- InnerForm — Supabase schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- Every user-owned table has RLS restricting rows to the owner.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default '',
  age int,
  sex text check (sex in ('male','female')),
  height_in numeric,                -- inches
  current_weight numeric,           -- lbs
  goal_weight numeric,              -- lbs
  activity_level text not null default 'moderate'
    check (activity_level in ('sedentary','light','moderate','active','very_active')),
  primary_goal text not null default 'maintain_weight',
  secondary_goals text[] not null default '{}',
  desired_pace text not null default 'moderate' check (desired_pace in ('slow','moderate','aggressive')),
  goal_date date,
  goal_context text,
  tried_before text,
  coach_style text not null default 'balanced' check (coach_style in ('encouraging','balanced','no_excuses')),
  dietary_preferences text[] not null default '{}',
  allergies text[] not null default '{}',
  foods_to_avoid text[] not null default '{}',
  cooking_skill text not null default 'intermediate' check (cooking_skill in ('beginner','intermediate','advanced')),
  meal_prep_preference text not null default 'some' check (meal_prep_preference in ('none','some','heavy')),
  budget_preference text not null default 'moderate' check (budget_preference in ('tight','moderate','flexible')),
  measurement_units text not null default 'imperial' check (measurement_units in ('imperial','metric')),
  meals_per_day int not null default 3,
  wake_time time,
  sleep_time time,
  daily_rhythm text,
  onboarding_completed boolean not null default false,
  motivation_profile_completed boolean not null default false,
  hard_gainer_profile_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- motivation profiles ----------
create table if not exists user_motivation_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  primary_why text,
  deeper_why text,
  dream_outcome text,
  desired_identity text,
  life_change_goal text,
  confidence_goal text,
  energy_goal text,
  strength_goal text,
  frustration_statement text,
  tired_of_statement text,
  proud_moment_goal text,
  people_or_purpose text,
  reminder_when_quitting text,
  past_attempts text,
  past_failure_patterns text,
  known_excuses text,
  biggest_barriers text[],
  motivation_style text,
  accountability_preference text,
  reminders_that_help text,
  reminders_that_annoy text,
  topics_to_handle_carefully text,
  coach_should_remind_me_of_why boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- hard gainer profiles ----------
create table if not exists user_hard_gainer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  believes_fast_metabolism boolean not null default false,
  struggles_to_eat_enough boolean not null default false,
  gets_full_quickly boolean not null default false,
  misses_meals_due_to_schedule boolean not null default false,
  willing_to_eat_more boolean not null default false,
  unsure_which_foods_help boolean not null default false,
  prefers_liquid_calories boolean not null default false,
  needs_portable_snacks boolean not null default false,
  struggles_with_breakfast boolean not null default false,
  struggles_with_lunch boolean not null default false,
  needs_late_night_calories boolean not null default false,
  needs_simple_meals boolean not null default false,
  willing_to_cook_complex_meals boolean not null default false,
  preferred_high_calorie_foods text[] not null default '{}',
  foods_that_are_hard_to_eat text[] not null default '{}',
  appetite_pattern text,
  biggest_gain_barrier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- food items (shared catalog + user-created) ----------
create table if not exists food_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  serving_size numeric not null default 1,
  serving_unit text not null default 'serving',
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  fiber numeric not null default 0,
  sugar numeric not null default 0,
  sodium numeric,
  base_quality int not null default 60,
  gain_categories text[] not null default '{}',
  grocery_category text not null default 'other',
  source text not null default 'seed',
  barcode text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- logs ----------
create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack','pre_workout','post_workout','custom')),
  food_item_id uuid references food_items(id) on delete set null,
  custom_name text,
  quantity numeric not null default 1,
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  fiber numeric not null default 0,
  sugar numeric not null default 0,
  sodium numeric,
  food_quality_score int,
  food_quality_label text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists food_logs_user_date on food_logs (user_id, log_date);

create table if not exists daily_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_date date not null,
  calories int not null,
  protein int not null,
  carbs int not null,
  fat int not null,
  fiber int not null default 30,
  water_oz int not null default 80,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, target_date)
);

create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  amount_oz numeric not null,
  created_at timestamptz not null default now()
);
create index if not exists water_logs_user_date on water_logs (user_id, log_date);

create table if not exists weigh_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric not null,
  log_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

-- ---------- meal planning ----------
create table if not exists meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  title text not null default '',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  instructions text[],
  prep_time_minutes int,
  cook_time_minutes int,
  servings int not null default 1,
  calories_per_serving numeric,
  protein_per_serving numeric,
  carbs_per_serving numeric,
  fat_per_serving numeric,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists planned_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_plan_id uuid not null references meal_plans(id) on delete cascade,
  planned_date date not null,
  meal_type text not null,
  title text not null,
  description text,
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  recipe_id uuid references recipes(id) on delete set null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists planned_meals_user_date on planned_meals (user_id, planned_date);

-- ---------- groceries ----------
create table if not exists grocery_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  week_start_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists grocery_items (
  id uuid primary key default gen_random_uuid(),
  grocery_list_id uuid not null references grocery_lists(id) on delete cascade,
  name text not null,
  category text not null default 'other',
  quantity text,
  unit text,
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- coaching ----------
create table if not exists coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'coach' check (role in ('coach','user')),
  message text not null,
  coach_style text,
  mode text,
  source text not null default 'chat',
  suggested_action text,
  created_at timestamptz not null default now()
);
create index if not exists coach_messages_user on coach_messages (user_id, created_at);

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  challenge_type text not null,
  start_date date not null,
  end_date date not null,
  target_value numeric not null default 1,
  current_value numeric not null default 0,
  status text not null default 'active' check (status in ('active','completed','failed','skipped')),
  reward_badge text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null,
  title text not null,
  description text,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

create table if not exists streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  streak_type text not null,
  current_count int not null default 0,
  best_count int not null default 0,
  last_updated_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, streak_type)
);

create table if not exists health_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  connected boolean not null default false,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recommendation_type text not null,
  title text not null,
  description text,
  priority int not null default 2,
  status text not null default 'new' check (status in ('new','seen','applied','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table user_profiles enable row level security;
alter table user_motivation_profiles enable row level security;
alter table user_hard_gainer_profiles enable row level security;
alter table food_items enable row level security;
alter table food_logs enable row level security;
alter table daily_targets enable row level security;
alter table water_logs enable row level security;
alter table weigh_ins enable row level security;
alter table meal_plans enable row level security;
alter table planned_meals enable row level security;
alter table recipes enable row level security;
alter table grocery_lists enable row level security;
alter table grocery_items enable row level security;
alter table coach_messages enable row level security;
alter table challenges enable row level security;
alter table badges enable row level security;
alter table streaks enable row level security;
alter table health_integrations enable row level security;
alter table recommendations enable row level security;

-- user_profiles keys off auth_user_id
create policy "own profile" on user_profiles for all
  using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- generic owner policies (user_id column)
create policy "own rows" on user_motivation_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on user_hard_gainer_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on food_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on daily_targets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on water_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on weigh_ins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on meal_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on planned_meals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on coach_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on challenges for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on badges for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on streaks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on health_integrations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on recommendations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- recipes: own rows OR shared seed recipes (user_id null → readable by all)
create policy "read shared or own recipes" on recipes for select using (user_id is null or auth.uid() = user_id);
create policy "write own recipes" on recipes for insert with check (auth.uid() = user_id);
create policy "update own recipes" on recipes for update using (auth.uid() = user_id);
create policy "delete own recipes" on recipes for delete using (auth.uid() = user_id);

-- food_items: seed catalog readable by everyone; users manage their own entries
create policy "read catalog" on food_items for select using (true);
create policy "insert own foods" on food_items for insert with check (auth.uid() = created_by_user_id);
create policy "update own foods" on food_items for update using (auth.uid() = created_by_user_id);
create policy "delete own foods" on food_items for delete using (auth.uid() = created_by_user_id);

-- grocery_items: owned through the parent list
create policy "own grocery items" on grocery_items for all
  using (exists (select 1 from grocery_lists gl where gl.id = grocery_list_id and gl.user_id = auth.uid()))
  with check (exists (select 1 from grocery_lists gl where gl.id = grocery_list_id and gl.user_id = auth.uid()));
create policy "own rows" on grocery_lists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array[
    'user_profiles','user_motivation_profiles','user_hard_gainer_profiles','food_items','food_logs',
    'daily_targets','meal_plans','planned_meals','recipes','grocery_lists','grocery_items',
    'challenges','streaks','health_integrations','recommendations'
  ] loop
    execute format('drop trigger if exists %I_updated_at on %I', t, t);
    execute format('create trigger %I_updated_at before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
end $$;
