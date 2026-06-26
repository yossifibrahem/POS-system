# MHG POS

A V1 retail POS MVP built for Vercel and Supabase.

## Stack

- Next.js App Router + TypeScript
- Supabase Auth, Postgres, RLS, Storage, and RPC functions
- Tailwind CSS
- Server Actions for mutations
- Cash-only checkout for V1

## MVP Coverage

- Owner/admin and cashier login
- First-owner onboarding for business and store creation
- Product catalog with variants, SKU/barcode, images, pricing, and reorder levels
- Inventory balances, manual adjustments, low-stock reporting, and movement history
- Register open/close workflow with expected vs actual cash
- POS cart and atomic cash checkout through `complete_cash_sale`
- Sales list, receipt detail, and owner-only voids
- Daily sales overview and register report
- Staff creation through Supabase service-role API

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   SUPABASE_SECRET_KEY=...
   ```

   The app also supports the older Supabase names:
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.

3. Link the project to Supabase, then apply the migration.

   Run these once per machine/project checkout:

   ```bash
   npm run db:login
   npm run db:link -- --project-ref your-project-ref
   ```

   Then push the database migration:

   ```bash
   npm run db:push
   ```

   You can find the project ref in your Supabase project URL:
   `https://your-project-ref.supabase.co`.
   If the CLI asks for a password during linking, use the database password
   from Supabase, not the API secret key.

4. Run the app:

   ```bash
   npm run dev
   ```

5. Open `/login`, create the owner account, then finish onboarding.

## Deployment

- Create a Vercel project from this repository.
- Add the same environment variables in Vercel.
- Apply `supabase/migrations/0001_v1_pos_schema.sql` to the production Supabase project before first use.
- Keep `SUPABASE_SECRET_KEY` server-only; never expose it to the browser.

## Verification

```bash
npm run typecheck
npm run test
npm run build
```
