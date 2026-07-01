## Goal

Bring the uploaded `cargo-trackr-plus` app (driver + ops cargo trip tracker) into this TanStack Start project, preserving features and visual design while adapting routing, the design system, and the backend integration to this stack.

## Source app summary

- 4 pages: `Index` (landing), `Auth` (sign in / sign up with driver vs ops account types), `DriverDashboard` (log trips, upload receipt, view own history), `OpsDashboard` (manage vehicles, view all trips, see receipts).
- Auth context via `useAuth` + `ProtectedRoute` wrapper that enforces `driver` / `ops` role via `user_roles` table.
- Supabase schema: `app_role` enum, `user_roles`, `profiles`, `vehicles`, `trips` (+ destination), `has_role()` SECURITY DEFINER, trip rate-limit + dedupe trigger, `handle_new_user()` trigger, `receipts` storage bucket policies.
- Tailwind v3 + custom HSL tokens, fonts Outfit + Inter, navy + amber palette.

## Step 1 — Enable Lovable Cloud (Supabase)

Required so we can run the schema and use auth/storage. Once enabled, run the 4 migrations from the upload (combined into one new migration so the file timestamps are valid), plus create the `receipts` storage bucket.

## Step 2 — Design system

Rewrite `src/styles.css` to keep the navy + amber identity using oklch tokens (background, foreground, primary navy, accent amber, success, sidebar tokens, gradients/shadows). Add `--color-success` / sidebar tokens via `@theme inline` so `bg-success` etc. keep working. Load Outfit + Inter via `<link>` in `__root.tsx` head (per Tailwind v4 rules), and add `font-display` / `font-sans` utilities via `@theme inline`.

## Step 3 — File-based routes

Create:

```
src/routes/
  __root.tsx          (already exists — extend with fonts + auth listener + Sonner + TooltipProvider)
  index.tsx           (landing page, replace placeholder)
  auth.tsx            (sign in / sign up form)
  _authenticated/
    route.tsx         (gate: redirect to /auth if no user; ssr:false)
    driver.tsx        (DriverDashboard)
    ops.tsx           (OpsDashboard)
```

Role enforcement (driver-only vs ops-only) is done inside each dashboard component via a `useRole` hook that reads `user_roles` and redirects with `<Navigate>` when the role doesn't match. This avoids a second layout level and matches the source `ProtectedRoute` behavior.

## Step 4 — Port app code

- `src/integrations/supabase/client.ts` already exists in this template — keep ours and adapt the uploaded code to use it.
- Port `src/hooks/useAuth.tsx` as a lightweight hook (no provider needed; uses `supabase.auth.onAuthStateChange` + `getSession`).
- Port `AppHeader`, `NavLink` (rewritten with TanStack `<Link>` + `activeProps`).
- Port `Auth.tsx`, `DriverDashboard.tsx`, `OpsDashboard.tsx`, `Index.tsx` — swap `react-router-dom` imports for `@tanstack/react-router`, replace `useNavigate()`/`<Navigate>` accordingly, and replace `useToast` calls with `sonner` (already in template) where appropriate (or keep `use-toast` shim).
- Copy `src/integrations/supabase/types.ts` from the upload so typed selects keep working.
- Remove `react-router-dom` and other already-present deps; do not re-add.

## Step 5 — Final wiring & cleanup

- Update `__root.tsx`: keep shell, add `<Toaster />` (sonner), `TooltipProvider`, mount auth state listener with `router.invalidate()` + `queryClient.invalidateQueries()` on `SIGNED_IN`/`SIGNED_OUT`.
- Update `src/routes/index.tsx` to render the ported landing page (remove placeholder).
- Update meta titles per route ("Sign in — Cargo Trackr", "Driver dashboard — Cargo Trackr", etc.).
- Keep existing `not-found` / error boundaries in `__root.tsx`.

## What I will NOT bring over

- `BrowserRouter`, `ProtectedRoute` wrapper component (replaced by `_authenticated` layout + per-route role check).
- `next-themes` light/dark toggle (instructions: don't add).
- `App.tsx`, `main.tsx`, `index.html`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `vitest` config — TanStack Start owns these.
- The uploaded `supabase/config.toml` (Lovable Cloud manages this).

## Technical notes

- Tailwind v4 in this template: `@theme inline` + `oklch` tokens in `src/styles.css`. No `tailwind.config.ts`.
- `src/routeTree.gen.ts` regenerates automatically.
- Receipts upload uses `supabase.storage.from('receipts').upload(...)` from the browser client (RLS-enforced) — same code as the upload, no server function needed.
- Sign-up via `supabase.auth.signUp({ options: { data: { account_type, driver_id, full_name } } })` so the `handle_new_user` trigger reads the metadata.

Ready to execute end-to-end on approval.