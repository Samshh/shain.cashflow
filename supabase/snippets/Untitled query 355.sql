-- Branch table
CREATE TABLE public.branch (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  branch_name character varying,
  location character varying,
  status character varying,
  CONSTRAINT branch_pkey PRIMARY KEY (id)
);

-- Daily Cashflow table
CREATE TABLE public.daily_cashflow (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  branch_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  opening_cash double precision,
  total_income double precision,
  total_expense double precision,
  closing_cash double precision,
  net_cash_flow double precision,
  CONSTRAINT daily_cashflow_pkey PRIMARY KEY (id),
  CONSTRAINT daily_cashflow_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(id)
);

-- Expense Transaction
CREATE TABLE public.expense_transaction (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  branch_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  amount double precision,
  expense_category character varying,
  description text,
  cashflow_id bigint,
  CONSTRAINT expense_transaction_pkey PRIMARY KEY (id),
  CONSTRAINT expense_transaction_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(id),
  CONSTRAINT expense_transaction_cashflow_id_fkey FOREIGN KEY (cashflow_id) REFERENCES public.daily_cashflow(id)
);

-- Income Transaction
CREATE TABLE public.income_transaction (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  branch_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  amount double precision,
  income_type character varying,
  cashflow_id bigint,
  CONSTRAINT income_transaction_pkey PRIMARY KEY (id),
  CONSTRAINT income_transaction_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(id),
  CONSTRAINT income_transaction_cashflow_id_fkey FOREIGN KEY (cashflow_id) REFERENCES public.daily_cashflow(id)
);

-- Profiles table (single source of truth)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text DEFAULT 'user',
  branch_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(id)
);
