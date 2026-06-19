---
paths:
  - "apps/front-end/**/*.{ts,tsx}"
  - "packages/bitrix/**/*.{ts,tsx}"
---

# Frontend Rules (`apps/front-end/`)

React 19 + Vite + Tailwind CSS 4 + shadcn/ui + Jotai + TanStack Query + `@common/bitrix`.

- Wrap the app in `<B24Provider>` (from `@common/bitrix`) for B24 frame init, JWT, and Jotai atoms, and in `<QueryClientProvider>` for TanStack Query.
- Routing via `wouter` — pages live in `features/<name>/pages/` and are mounted in `router.tsx`.
- Hooks from `@common/bitrix`: `useB24Init`, `useApiClient`, `useB24Frame`, `useB24FrameOrNull`.
- State via Jotai atoms (exported from `@common/bitrix`); server state via TanStack Query.
- Add shadcn/ui components with `pnpm --filter front-end exec shadcn add <component>`.
- `@` alias resolves to `src/` (tsconfig.app.json + vite.config.ts).

## Feature-first structure

Code is grouped by feature, not by type. A feature owns its slice end-to-end:

```
src/
├── lib/                # shared, feature-agnostic utilities (utils.ts, query-client.ts)
├── components/ui/      # shared shadcn/ui primitives
└── features/<name>/
    ├── pages/          # route components, mounted in router.tsx
    ├── components/     # feature-specific components
    ├── lib/            # <name>-api.ts (backend/portal calls) + helpers
    ├── hooks/          # use-<thing>.ts — TanStack Query hooks over lib/
    ├── query-keys.ts   # all query keys for the feature (incl. `all` root)
    └── index.ts        # barrel — import features via `@/features/<name>`
```

- Create only the subfolders a feature needs; every folder + the feature root gets a barrel `index.ts`.
- Data flow: `lib/<name>-api.ts` (pure, takes the `ApiClient`) → `hooks/use-*.ts` (`useQuery`/`useMutation`, keyed by `query-keys.ts`) → components. Components never call api functions directly.
- `query-keys.ts` has an `all` root; every key extends it so one `invalidateQueries({ queryKey: <name>Keys.all })` refreshes the feature.
- Promote code to top-level `components/`/`lib/` only when a second feature needs it.

Full how-to: [`docs/front-end/feature-structure.md`](../../docs/front-end/feature-structure.md).

## Bitrix24 platform

- **JS SDK** `@bitrix24/b24jssdk` for client-side API calls / UI.
- Core CRM entities: Leads, Deals, Contacts, Companies, Activities.

## API targets & tokens (two — never conflate)

- **Portal** (CRM/UI) → the JS SDK frame (`useB24Frame`). The SDK supplies fresh B24 creds each load; the frontend **never** refreshes tokens itself.
- **Our backend** → `useApiClient()` — automatically carries our 1-hour **JWT** session token.

Which one: quick CRM reads/writes straight from the UI → **frame**. Anything needing the DB, secrets, or multi-step/background logic → **backend route** (which calls the portal via `b24Call` and handles OAuth refresh server-side).

## Going deeper

This rule is the always-loaded quick reference. When you're actually building or
debugging a Bitrix24 feature, **invoke the `bitrix` skill** for the full patterns
— it maps to the docs below.

## Docs — read the right one first

- [`docs/front-end/feature-structure.md`](../../docs/front-end/feature-structure.md) — read when adding a feature, page, or data hook: the `features/<name>/` layout, query keys, and TanStack Query data flow.
- [`docs/front-end/bitrix-package.md`](../../docs/front-end/bitrix-package.md) — using `@common/bitrix`: provider, hooks, atoms, lib. Read when wiring up the provider or picking a hook/atom.
- [`docs/front-end/calling-apis.md`](../../docs/front-end/calling-apis.md) — read before any API call: the portal (JS SDK frame) vs. our backend (`useApiClient`), and which to use.
- [`docs/front-end/installation.md`](../../docs/front-end/installation.md) — read when changing `features/install/`, adding an install step, or registering a placement / user-field widget.
- For server-side B24 REST calls, see [`docs/back-end/calling-apis.md`](../../docs/back-end/calling-apis.md) (covered by the backend rule).
