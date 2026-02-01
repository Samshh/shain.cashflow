-- Cashflow entries backing table for the dashboard UI
create table if not exists public.cashflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null check (category in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount >= 0),
  date date not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists cashflows_user_id_date_idx
  on public.cashflows (user_id, date desc);

alter table public.cashflows enable row level security;

-- Allow authenticated users to manage their own entries
create policy "Users can view their cashflows"
  on public.cashflows for select
  using (auth.uid() = user_id);

create policy "Users can insert their cashflows"
  on public.cashflows for insert
  with check (auth.uid() = user_id);

create policy "Users can update their cashflows"
  on public.cashflows for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their cashflows"
  on public.cashflows for delete
  using (auth.uid() = user_id);
