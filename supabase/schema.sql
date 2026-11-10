-- ==============================================================================
-- CaptionCraft Database Schema & Security Setup (Supabase / PostgreSQL)
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. ENUMS & DOMAINS
-- We use text checks for flexibility and easy querying across API layers.

-- 3. PROFILES TABLE
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    full_name text default '',
    role text not null default 'user' check (role in ('user', 'admin')),
    status text not null default 'active' check (status in ('active', 'suspended')),
    created_at timestamptz not null default now()
);

-- Index for email lookups and role queries
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_status on public.profiles(status);

-- 4. USAGE & SUBSCRIPTIONS
create table if not exists public.usage (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    plan text not null default 'free',
    count_this_month int not null default 0,
    reset_at timestamptz not null default (date_trunc('month', now()) + interval '1 month')
);

-- 5. PLANS TABLE (Admin Configurable)
create table if not exists public.plans (
    id text primary key,
    name text not null,
    price_inr int not null default 0,
    monthly_limit int not null default 5, -- -1 denotes unlimited
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

-- Seed Default Plans
insert into public.plans (id, name, price_inr, monthly_limit, is_active)
values 
    ('free', 'Free Creator', 0, 5, true),
    ('pro', 'Pro Creator', 199, -1, true)
on conflict (id) do nothing;

-- 6. GENERATIONS TABLE
create table if not exists public.generations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    topic text not null,
    video_url text,
    transcript text,
    tone text not null default 'professional',
    language text not null default 'English',
    hook text not null,
    caption text not null,
    hashtags jsonb not null default '{"high":[],"medium":[],"niche":[]}'::jsonb,
    is_flagged boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists idx_generations_user_created on public.generations(user_id, created_at desc);
create index if not exists idx_generations_flagged on public.generations(is_flagged);

-- 7. SAVED SETS TABLE
create table if not exists public.saved_sets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    name text not null,
    hashtags jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_saved_sets_user on public.saved_sets(user_id);

-- 8. HASHTAGS LIBRARY TABLE
create table if not exists public.hashtags (
    id uuid primary key default gen_random_uuid(),
    tag text unique not null,
    niche text not null,
    size text not null check (size in ('high', 'medium', 'niche')),
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

create index if not exists idx_hashtags_niche_size on public.hashtags(niche, size, is_active);

-- 9. PAYMENTS TABLE
create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    razorpay_order_id text,
    razorpay_payment_id text,
    amount int not null,
    status text not null default 'created', -- created | captured | failed
    created_at timestamptz not null default now()
);

create index if not exists idx_payments_user on public.payments(user_id);

-- 10. ASYNC JOBS TABLE (Video processing queue)
create table if not exists public.jobs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    status text not null default 'processing' check (status in ('processing', 'done', 'failed')),
    result jsonb,
    error text,
    created_at timestamptz not null default now()
);

create index if not exists idx_jobs_user_status on public.jobs(user_id, status);

-- 11. ADMIN AUDIT LOGS TABLE
create table if not exists public.admin_logs (
    id uuid primary key default gen_random_uuid(),
    admin_id uuid references public.profiles(id) on delete set null,
    action text not null,
    target text not null,
    meta jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_admin_logs_created on public.admin_logs(created_at desc);

-- ==============================================================================
-- SECURITY DEFINER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Function to check if the caller is an active admin (Bypasses RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

-- Trigger function: Automatically create profile & usage records upon user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_full_name text;
begin
  raw_full_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '');
  
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    raw_full_name,
    'user',
    'active'
  )
  on conflict (id) do nothing;

  insert into public.usage (user_id, plan, count_this_month, reset_at)
  values (
    new.id,
    'free',
    0,
    date_trunc('month', now()) + interval '1 month'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Drop trigger if existing and attach to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.usage enable row level security;
alter table public.plans enable row level security;
alter table public.generations enable row level security;
alter table public.saved_sets enable row level security;
alter table public.hashtags enable row level security;
alter table public.payments enable row level security;
alter table public.jobs enable row level security;
alter table public.admin_logs enable row level security;

-- PROFILES POLICIES
-- 1. Read own profile OR admin can read all
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- 2. Users can only update their own full_name (NEVER role or status)
create policy "Users can update own profile name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id 
    and role = (select role from public.profiles where id = auth.uid())
    and status = (select status from public.profiles where id = auth.uid())
  );

-- 3. Admins can update any profile (role, status, etc.)
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- USAGE POLICIES
create policy "Users can view own usage"
  on public.usage for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins can update usage"
  on public.usage for update
  using (public.is_admin())
  with check (public.is_admin());

-- PLANS POLICIES
create policy "Anyone can view active plans"
  on public.plans for select
  using (is_active = true or public.is_admin());

create policy "Admins can insert plans"
  on public.plans for insert
  with check (public.is_admin());

create policy "Admins can update plans"
  on public.plans for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete plans"
  on public.plans for delete
  using (public.is_admin());

-- GENERATIONS POLICIES
create policy "Users can view own generations"
  on public.generations for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own generations"
  on public.generations for delete
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins can update generations flag"
  on public.generations for update
  using (public.is_admin())
  with check (public.is_admin());

-- SAVED SETS POLICIES
create policy "Users can view own saved sets"
  on public.saved_sets for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert own saved sets"
  on public.saved_sets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own saved sets"
  on public.saved_sets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own saved sets"
  on public.saved_sets for delete
  using (auth.uid() = user_id or public.is_admin());

-- HASHTAGS POLICIES
create policy "Authenticated users can view active hashtags"
  on public.hashtags for select
  using (is_active = true or public.is_admin());

create policy "Admins can insert hashtags"
  on public.hashtags for insert
  with check (public.is_admin());

create policy "Admins can update hashtags"
  on public.hashtags for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete hashtags"
  on public.hashtags for delete
  using (public.is_admin());

-- PAYMENTS POLICIES
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins can insert payments"
  on public.payments for insert
  with check (public.is_admin());

create policy "Admins can update payments"
  on public.payments for update
  using (public.is_admin())
  with check (public.is_admin());

-- JOBS POLICIES
create policy "Users can view own jobs"
  on public.jobs for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert own jobs"
  on public.jobs for insert
  with check (auth.uid() = user_id);

create policy "Admins can manage jobs"
  on public.jobs for all
  using (public.is_admin());

-- ADMIN LOGS POLICIES
create policy "Only admins can view admin logs"
  on public.admin_logs for select
  using (public.is_admin());

create policy "Only admins can insert admin logs"
  on public.admin_logs for insert
  with check (public.is_admin());

-- ==============================================================================
-- STORAGE SETUP (Run in Supabase SQL editor)
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do nothing;

create policy "Users can upload their own videos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'videos' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read their own videos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'videos' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own videos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'videos' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ==============================================================================
-- ADMIN PROMOTION HELPER SNIPPET
-- Replace '<MY_EMAIL>' with your registered user's email:
-- UPDATE public.profiles SET role = 'admin' WHERE email = '<MY_EMAIL>';
-- ==============================================================================
