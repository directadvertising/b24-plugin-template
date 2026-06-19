# `@common/bitrix` (packages/bitrix)

Frontend React layer for Bitrix24: frame init, JWT session, Jotai state, and an
API client for our backend. Build output is `dist/` (run `pnpm --filter
@common/bitrix build`); consumed by `apps/front-end` as `@common/bitrix`.

## Provider

Wrap the app once. `apiBaseUrl` is the base for our backend (`""` = same origin
behind the proxy); it sets up the JWT context and a Jotai store.

```tsx
import { B24Provider } from "@common/bitrix";

<B24Provider apiBaseUrl="" isDev={import.meta.env.DEV}>
  <App />
</B24Provider>;
```

`useB24Config()` reads `{ apiBaseUrl, isDev }` inside the provider.

## Hooks

| Hook                  | Purpose                                                              |
| --------------------- | ------------------------------------------------------------------- |
| `useB24Init()`        | Orchestrator: init frame → batch-load → fill atoms → fetch JWT. Returns `{ initApp, isInitialized, isLoading, error, logger }`. Call `initApp()` yourself (e.g. in `useEffect`) to dodge StrictMode double-init. |
| `useB24Frame()`       | The live `B24Frame` (JS SDK). **Throws** if not initialized.        |
| `useB24FrameOrNull()` | Same, but `null` before init — use for "connected?" UI.             |
| `useApiClient()`      | Memoized client to **our backend**, JWT attached automatically.     |
| `useAppSettings()`    | `{ version, status, isTrial, configSettings, updateSettings, saveSettings }`. |
| `useUserSettings()`   | Per-user settings, same shape.                                      |
| `usePullClient()`     | Bitrix Pull (websocket) lifecycle; `{ moduleId?, onMessage?, enabled? }`. |

## Atoms (Jotai)

Read derived state directly when you don't need a hook: `tokenJWTAtom`,
`b24FrameAtom`, `langAtom`, `placementAtom`, `appSidAtom`, `isInstallModeAtom`,
`userIdAtom`, `userIsAdminAtom`, `userLoginAtom`, `appVersionAtom`,
`appStatusAtom`, plus `*ConfigSettingsAtom` / `init*`/`save*`/`update*` setters.

## Lib

- `createApiClient({ baseUrl, token })` — low-level client (prefer `useApiClient`).
- `ApiClient` (type) — the client shape `useApiClient()` returns; pass it to feature `lib/<name>-api.ts` functions so they stay pure/testable.
- `getToken(baseUrl, data)` / `postInstall(baseUrl, data)` — unauthenticated calls used during init/install.
- `classifyError(err)` → `B24Error { statusCode, statusMessage, message, cause }`.
- `sleepAction(ms)` — await delay.

See `front-end/calling-apis.md` for calling Bitrix and the backend, and
`front-end/installation.md` for the install flow.
