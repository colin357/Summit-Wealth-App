-- Summit Wealth full schema + RLS
create extension if not exists pgcrypto;

create table if not exists public.loan_officers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  company text,
  nmls text,
  phone text,
  email text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  loan_officer_id uuid not null references public.loan_officers(id),
  created_at timestamptz not null default now()
);

create table if not exists public.plaid_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text unique not null,
  institution_name text,
  status text default 'connected',
  created_at timestamptz not null default now()
);

create table if not exists public.plaid_item_secrets (
  plaid_item_id uuid primary key references public.plaid_items(id) on delete cascade,
  access_token text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.plaid_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plaid_account_id text unique not null,
  name text,
  type text,
  subtype text,
  mask text,
  current_balance numeric,
  available_balance numeric,
  iso_currency_code text,
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plaid_transaction_id text unique,
  account_id uuid references public.plaid_accounts(id) on delete set null,
  name text not null,
  merchant_name text,
  amount numeric not null,
  iso_currency_code text,
  date date not null,
  category_primary text,
  category_detailed text,
  user_category_override text,
  pending boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  category text not null,
  limit_amount numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null,
  cadence text not null,
  next_bill_date date,
  source text default 'manual',
  created_at timestamptz not null default now()
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  balance numeric not null,
  apr numeric,
  minimum_payment numeric not null,
  due_day integer,
  is_mortgage boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.payoff_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method text not null,
  extra_monthly numeric not null,
  snapshot jsonb not null,
  schedule jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.risk_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  message text not null,
  severity text not null,
  effective_date date not null,
  computed jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  dismissed_at timestamptz
);

create table if not exists public.eligibility_flags (
  user_id uuid primary key references auth.users(id) on delete cascade,
  eligible_buy boolean default false,
  eligible_heloc boolean default false,
  eligible_refi boolean default false,
  computed jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loan_officer_id uuid not null references public.loan_officers(id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text unique not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.loan_officers enable row level security;
alter table public.profiles enable row level security;
alter table public.plaid_items enable row level security;
alter table public.plaid_item_secrets enable row level security;
alter table public.plaid_accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.subscriptions enable row level security;
alter table public.debts enable row level security;
alter table public.payoff_plans enable row level security;
alter table public.risk_alerts enable row level security;
alter table public.eligibility_flags enable row level security;
alter table public.lead_events enable row level security;
alter table public.push_tokens enable row level security;

-- Profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

create policy "loan_officers_read_authenticated" on public.loan_officers
  for select using (auth.role() = 'authenticated');

-- user-owned table policies
create policy "plaid_items_own" on public.plaid_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "plaid_accounts_own" on public.plaid_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_own" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets_own" on public.budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subscriptions_own" on public.subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "debts_own" on public.debts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "payoff_plans_own" on public.payoff_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "risk_alerts_own" on public.risk_alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "eligibility_flags_own" on public.eligibility_flags for select using (auth.uid() = user_id);
create policy "eligibility_flags_own_upsert" on public.eligibility_flags for insert with check (auth.uid() = user_id);
create policy "eligibility_flags_own_update" on public.eligibility_flags for update using (auth.uid() = user_id);
create policy "lead_events_select_own" on public.lead_events for select using (auth.uid() = user_id);
create policy "lead_events_insert_own" on public.lead_events for insert with check (auth.uid() = user_id);
create policy "push_tokens_own" on public.push_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- No client access to secrets.
revoke all on public.plaid_item_secrets from anon, authenticated;

-- Helpful indexes.
create index if not exists idx_transactions_user_date on public.transactions(user_id, date desc);
create index if not exists idx_accounts_user on public.plaid_accounts(user_id);
create index if not exists idx_risk_alerts_user_date on public.risk_alerts(user_id, created_at desc);

-- Service-role helper function used by delete_account edge function
create or replace function public.delete_user_data(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.push_tokens where user_id = target_user;
  delete from public.lead_events where user_id = target_user;
  delete from public.eligibility_flags where user_id = target_user;
  delete from public.risk_alerts where user_id = target_user;
  delete from public.payoff_plans where user_id = target_user;
  delete from public.debts where user_id = target_user;
  delete from public.subscriptions where user_id = target_user;
  delete from public.budgets where user_id = target_user;
  delete from public.transactions where user_id = target_user;
  delete from public.plaid_accounts where user_id = target_user;
  delete from public.plaid_item_secrets
    where plaid_item_id in (select id from public.plaid_items where user_id = target_user);
  delete from public.plaid_items where user_id = target_user;
  delete from public.profiles where id = target_user;
end;
$$;

revoke all on function public.delete_user_data(uuid) from anon, authenticated;
