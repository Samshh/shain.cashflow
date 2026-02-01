# Cashflow Dashboard

React + TypeScript + Vite front-end that talks to Supabase for auth and cashflow CRUD.

## Prerequisites

- Node.js 20+
- pnpm / npm (instructions below use npm)
- Supabase project with the auth schema enabled

## Environment Variables

Create an `.env.local` file (Vite loads it automatically) with the following keys:

```
VITE_SUPABASE_URL=...your project url...
VITE_SUPABASE_ANON_KEY=...your anon key...
```

## Database Setup

The frontend works with the existing schema already present in your Supabase project:

- `profiles` — must contain the logged-in user with a non-null `branch_id`.
- `income_transaction` — records incoming cash (fields: `id`, `branch_id`, `income_type`, `amount`, `created_at`, `cashflow_id`).
- `expense_transaction` — records expenses (fields: `id`, `branch_id`, `expense_category`, `amount`, `description`, `created_at`, `cashflow_id`).

The dashboard combines both transaction tables (filtered by the user's branch) to render totals, charts, and CRUD screens. Make sure row-level security allows authenticated users to read/write the rows for their branch, and that every auth user has a corresponding row in `profiles`.

## Local Development

```bash
npm install
npm run dev
```

Navigate to `http://localhost:5173` and log in with a Supabase user. All CRUD operations now go against the configured Supabase table.

## Linting & Build

```bash
npm run lint
npm run build
```

## Troubleshooting

- **"Could not find the table 'public.cashflows'"** – The app now reads from `income_transaction`/`expense_transaction`, so this warning only appears if the database schema is missing those tables or policies. Verify your Supabase project matches the schema described above.
- **Auth redirects back to login** – Make sure the Supabase project has email/password auth enabled and that the browser receives a valid session token.
