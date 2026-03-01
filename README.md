# Summit Wealth (Expo + Supabase + Plaid)

MVP mobile app for budgeting + finance tracking with Loan Officer referral linking.

## Implemented Phases
- ✅ Phase 1: Expo Router + TypeScript scaffold, React Query, React Native Paper UI.
- ✅ Phase 2: Complete Supabase schema, seed data, and RLS policies.
- ✅ Phase 3: Auth flow with required Loan Officer code validation at signup.
- ✅ Phase 4: Plaid Link + token exchange + account/transaction import and display.
- 🟨 Phases 5-7 are scaffolded with TODO screens/comments.

## Project Structure
- `app/` expo-router screens
- `components/` reusable UI building blocks
- `lib/` API wrappers, Supabase client, auth context
- `supabase/migrations/` SQL schema + RLS
- `supabase/seed/` demo seed data
- `supabase/functions/` edge functions

## 1) Local App Run
```bash
npm install
cp .env.example .env
npm run start
```

Required client env vars:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_PLAID_CLIENT_NAME` (optional)

## 2) Supabase Setup
```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed/seed.sql
```

Seed creates loan officers with these codes:
- `DREW123`
- `FAIRWAY77`

## 3) Edge Functions Deploy
Set secrets:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... PLAID_CLIENT_ID=... PLAID_SECRET=... PLAID_ENV=sandbox EXPO_PUSH_ACCESS_TOKEN=...
```

Deploy:
```bash
supabase functions deploy sign_up_with_code
supabase functions deploy create_link_token
supabase functions deploy exchange_public_token
supabase functions deploy sync_transactions
supabase functions deploy compute_risk_and_notify
supabase functions deploy delete_account
```

## 4) Scheduled jobs
Create schedules in Supabase dashboard:
- `sync_transactions`: daily
- `compute_risk_and_notify`: daily/nightly

## 5) Plaid Sandbox Notes
Use Plaid sandbox institution in Link and test credentials:
- Username: `user_good`
- Password: `pass_good`

This will return test accounts and transactions for development.

## Phase 4 Functional Notes
- Signup is blocked without a valid Loan Officer code by `sign_up_with_code`.
- Profile displays the linked LO card (name/company/NMLS/call/email).
- Transactions tab:
  - Creates Plaid link token via `create_link_token`
  - Exchanges `public_token` server-side via `exchange_public_token`
  - Imports accounts + recent transactions and renders list
  - Shows last sync time

## Next Steps (stubbed)
- Budgets CRUD + progress bars.
- Debts CRUD + payoff schedule generator.
- Push toggle persistence + lead popup impressions/dismiss/click logging.
- Advanced transaction sync cursoring + Plaid webhooks.
