-- Destiny Lines core schema.
-- Apply with `supabase db push` or paste into the SQL editor of project hbozjbhfpxsiazkbdkqr.
-- If earlier ad-hoc versions of these tables exist remotely with different
-- columns, reconcile or drop them first (see SUBMISSION_CHECKLIST.md).

-- === Tables =================================================================

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  summary text,
  heart_line text,
  head_line text,
  life_line text,
  fate_line text,
  marks text,
  deeper_insights text,
  prompts jsonb,
  practices jsonb,
  is_premium boolean not null default false
);

create index if not exists readings_user_created_idx
  on public.readings (user_id, created_at desc);

create table if not exists public.usage_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reads_used integer not null default 0,
  period_start date not null default current_date,
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tier text not null check (tier in ('standard', 'premium')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- === Signup bootstrap =======================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usage_stats (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- === Quota logic (single source of truth for client + edge function) =======
-- Free tier: 3 lifetime readings. Standard: 20/month. Premium: 100/month.
-- Monthly reset happens lazily inside get_reading_quota.

create or replace function public.get_reading_quota(p_user_id uuid default null)
returns table (tier text, reads_used integer, reads_limit integer, remaining integer)
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid;
  v_tier text := 'free';
  v_limit integer;
  v_used integer;
  v_period date;
begin
  v_user := coalesce(p_user_id, auth.uid());
  if v_user is null then
    raise exception 'Not authenticated';
  end if;
  -- Only the service role may query another user's quota.
  if p_user_id is not null and p_user_id <> auth.uid()
     and coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Not authorized';
  end if;

  select s.tier into v_tier
  from public.subscriptions s
  where s.user_id = v_user
    and s.status = 'active'
    and (s.expires_at is null or s.expires_at > now());
  v_tier := coalesce(v_tier, 'free');

  v_limit := case v_tier
    when 'premium' then 100
    when 'standard' then 20
    else 3
  end;

  insert into public.usage_stats (user_id) values (v_user)
  on conflict (user_id) do nothing;

  select u.reads_used, u.period_start into v_used, v_period
  from public.usage_stats u where u.user_id = v_user;

  -- Paid tiers reset monthly; free readings are lifetime.
  if v_tier <> 'free' and date_trunc('month', v_period) <> date_trunc('month', current_date) then
    update public.usage_stats
      set reads_used = 0, period_start = current_date, updated_at = now()
      where user_id = v_user;
    v_used := 0;
  end if;

  return query select v_tier, v_used, v_limit, greatest(0, v_limit - v_used);
end;
$$;

create or replace function public.consume_reading(p_user_id uuid)
returns table (remaining integer)
language plpgsql
security definer set search_path = public
as $$
declare
  q record;
begin
  -- Service role only: quota consumption happens in the analyze-palm function.
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Not authorized';
  end if;

  select * into q from public.get_reading_quota(p_user_id);
  if q.remaining <= 0 then
    raise exception 'Reading limit reached';
  end if;

  update public.usage_stats
    set reads_used = reads_used + 1, updated_at = now()
    where user_id = p_user_id;

  return query select q.remaining - 1;
end;
$$;

-- === Row Level Security =====================================================

alter table public.readings enable row level security;
alter table public.usage_stats enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Users can view own readings" on public.readings;
create policy "Users can view own readings"
  on public.readings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own readings" on public.readings;
create policy "Users can delete own readings"
  on public.readings for delete
  using (auth.uid() = user_id);

-- Readings are inserted by the analyze-palm edge function (service role);
-- clients have no insert/update policy on purpose.

drop policy if exists "Users can view own usage" on public.usage_stats;
create policy "Users can view own usage"
  on public.usage_stats for select
  using (auth.uid() = user_id);

-- usage_stats is mutated only via security-definer functions.

drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Subscriptions are written only by the sync-subscription edge function
-- (service role), which verifies entitlements against the RevenueCat API.
-- Clients deliberately have no insert/update policy here.

grant execute on function public.get_reading_quota(uuid) to authenticated, service_role;
grant execute on function public.consume_reading(uuid) to service_role;
