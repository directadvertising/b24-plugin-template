# Calling APIs from the frontend

Two distinct targets — don't confuse them:

- **Bitrix portal** (CRM data, UI) → the JS SDK frame.
- **Our backend** (your routes) → the API client (`useApiClient`), JWT attached.

## Bitrix portal — the frame

Get the frame with `useB24Frame()` (after `useB24Init().initApp()` has run).
Prefer `callBatch` to bundle calls into one round-trip.

```tsx
const $b24 = useB24Frame();

// Single method
const deal = await $b24.callMethod("crm.deal.get", { id: 42 });

// Batch (object keys map to results)
const res = await $b24.callBatch({
  deal: { method: "crm.deal.get", params: { id: 42 } },
  profile: { method: "profile" },
});
const data = res.getData();
```

Notes:
- `callBatch` **halts on first error** unless you pass `false` as the 2nd arg.
- Frame also gives `$b24.auth.getAuthData()`, `$b24.getLang()`, `$b24.placement`,
  `$b24.parent.setTitle(...)`, `$b24.installFinish()`.
- Real-time events: `usePullClient({ onMessage })`.

The frontend never refreshes tokens itself — the SDK supplies fresh creds each
load. Server-side refresh is the backend's job (see `back-end/calling-apis.md`).

## Our backend — the API client

```tsx
const api = useApiClient(); // GET/POST/PUT/DELETE, JWT header set for you

const health = await api.get("/health");
const created = await api.post("/items", { title: "Hi" });
const filtered = await api.get("/items", { status: "open" }); // query params
```

Responses are unwrapped from the `{ success, data }` envelope by the route
contract on the server. Non-2xx throws — wrap calls and surface
`classifyError(err).message`.

### Layer it inside a feature

Don't call the client straight from a component. Put the call in the feature's
`lib/<name>-api.ts` (a pure function taking the `ApiClient`), then expose it
through a TanStack Query hook keyed by `query-keys.ts`:

```ts
// features/items/lib/items-api.ts
import type { ApiClient } from "@common/bitrix";
export const getItems = (client: ApiClient) => client.get<Item[]>("/items");

// features/items/hooks/use-items.ts
export function useItems() {
  const client = useApiClient();
  return useQuery({ queryKey: itemKeys.list(), queryFn: () => getItems(client) });
}
```

See [`feature-structure.md`](./feature-structure.md) for the full layout.

## When to use which

- Reading/writing CRM directly from the UI, quick lookups → **frame**.
- Anything needing your DB, secrets, multi-step logic, or background work →
  **backend route**, which calls Bitrix via `b24Call`.
