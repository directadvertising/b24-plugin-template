# Feature-first structure (front-end)

The front-end is organised **feature-first**: code is grouped by the product
capability it serves, not by technical type. A feature owns its pages,
components, data layer, and query keys in one folder. Only genuinely shared,
feature-agnostic code lives at the top level.

## `src/` layout

```
apps/front-end/src/
├── main.tsx            # React init: mounts <App/> (providers + router)
├── app.tsx             # providers (QueryClientProvider, B24Provider) wrapping <AppRouter/>
├── router.tsx          # wouter <Switch>/<Route> — pages imported from feature barrels
├── lib/                # shared utilities NOT tied to a feature (utils.ts, query-client.ts)
├── components/         # shared, feature-agnostic components
│   └── ui/             # shadcn/ui primitives (button, card, input, …)
└── features/
    └── <name>/         # one folder per feature
        ├── pages/          # route-level components, mounted in router.tsx
        ├── components/     # components specific to this feature
        ├── lib/            # <name>-api.ts (contract calls) + feature utilities
        ├── hooks/          # use-<name>.ts — TanStack Query hooks over lib/
        ├── query-keys.ts   # all query keys for this feature (incl. `all` root)
        └── index.ts        # barrel export — the feature's public surface
```

> `app.tsx` and `router.tsx` are owned by the routing setup; this doc covers the
> `features/` side. See [`routing.md`](../../.claude/rules/routing.md) for how
> pages get mounted.

## Anatomy of a feature

A feature folder is a small slice of the app. **Create only the subfolders you
need** — a display-only feature may have just `pages/`; a data-heavy one uses all
of them. Every folder gets a barrel `index.ts`, and the feature root `index.ts`
re-exports them so consumers import from `@/features/<name>`.

| File / folder    | Holds                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| `pages/`         | Route-level components (`<name>-page.tsx`), mounted in `router.tsx`.   |
| `components/`    | Components used only by this feature. Subfolders only if really needed. |
| `lib/`           | `<name>-api.ts` — backend/portal calls — plus feature-local helpers.  |
| `hooks/`         | `use-<thing>.ts` — TanStack Query hooks wrapping `lib/` functions.    |
| `query-keys.ts`  | Every query key for the feature, with an `all` root for invalidation. |
| `index.ts`       | Barrel: `export * from "./pages"`, `./components`, `./hooks`, etc.     |

### `query-keys.ts`

One source of truth for the feature's cache keys. `all` is the root; every key
extends it so a single `invalidateQueries({ queryKey: <name>Keys.all })` refreshes
the whole feature.

```ts
// features/home/query-keys.ts
export const homeKeys = {
  all: ["home"] as const,
  health: () => [...homeKeys.all, "health"] as const,
  // detail: (id: string) => [...homeKeys.all, "detail", id] as const,
};
```

### `lib/<name>-api.ts`

Pure, testable functions that perform the actual call. They **receive** the api
client (owned by the hook) and return typed data — no React, no hooks here.

```ts
// features/home/lib/home-api.ts
import type { ApiClient } from "@common/bitrix";

export interface HealthData { status: string; backend: string; timestamp: number }

export async function getHealth(client: ApiClient): Promise<HealthData> {
  const res = await client.get<{ success: boolean; data: HealthData }>("/api/health");
  return res.data;
}
```

When the route exists in the contract, type the response with
`$.Data<"routeName">` from `@common/contracts` instead of a hand-written shape.

### `hooks/use-<thing>.ts`

Hooks bind the api client to a query key. This is where `useQuery` / `useMutation`
live — components never call the api functions directly.

```ts
// features/home/hooks/use-health.ts
import { useApiClient } from "@common/bitrix";
import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../lib/home-api";
import { homeKeys } from "../query-keys";

export function useHealth() {
  const client = useApiClient();
  return useQuery({ queryKey: homeKeys.health(), queryFn: () => getHealth(client) });
}
```

A mutation invalidates by the feature root (or a narrower key):

```ts
const qc = useQueryClient();
useMutation({
  mutationFn: (body: CreateInput) => createThing(client, body),
  onSuccess: () => qc.invalidateQueries({ queryKey: homeKeys.all }),
});
```

### Barrels

Every subfolder and the feature root export through `index.ts`:

```ts
// features/home/index.ts
export * from "./components";
export * from "./hooks";
export * from "./lib";
export * from "./pages";
export * from "./query-keys";
```

`router.tsx` then mounts pages from the public surface:

```tsx
import { HomePage } from "@/features/home";
<Route path="/" component={HomePage} />;
```

## TanStack Query setup

The `QueryClient` lives in `src/lib/query-client.ts` and is provided once at the
app root:

```tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

<QueryClientProvider client={queryClient}>{/* B24Provider + router */}</QueryClientProvider>;
```

## Where does code go?

- **Used by one feature** → inside that feature (`features/<name>/…`).
- **Shared by many features, feature-agnostic** → top-level `components/` (UI
  primitives) or `lib/` (utilities, `query-client.ts`).
- **A new screen/capability** → a new `features/<name>/` folder; add its page to
  `router.tsx`.

Promote code out of a feature only when a second feature genuinely needs it.
Default to keeping things local — it's cheaper to move code out later than to
untangle premature shared modules.

## Worked example

The `home` feature demonstrates the full pattern end-to-end:

- `features/home/pages/home-page.tsx` — the landing page (`HomePage`).
- `features/home/components/backend-status.tsx` — reads backend health via the
  `useHealth()` hook (the query in action).
- `features/home/lib/home-api.ts` — `getHealth(client)`.
- `features/home/hooks/use-health.ts` — `useHealth()`.
- `features/home/query-keys.ts` — `homeKeys`.

The `install` feature is the minimal shape — `pages/` only — because the install
flow needs no shared data layer.

See also [`calling-apis.md`](./calling-apis.md) for portal-vs-backend call
targets and [`bitrix-package.md`](./bitrix-package.md) for the hooks/atoms.
