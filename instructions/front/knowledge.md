# React + Vite Frontend — guide for AI agents

## Quick overview
`@common/b24ui-react` is the integration layer between the React SPA and the Bitrix24 platform. It provides a `B24Provider` component, Jotai atoms for shared state, and React hooks for B24 frame initialization, API calls, and user/app settings. The app uses plain Tailwind CSS for UI — there is no B24 component library for React.

## Project layout
```
apps/front-end/
├── src/
│   ├── main.tsx              # entry point: B24Provider + React Router
│   ├── index.css             # Tailwind CSS imports
│   ├── pages/                # page components (index.tsx, install.tsx, ...)
│   └── env.d.ts              # Vite env types
├── vite.config.ts            # Vite + Tailwind + API proxy
├── index.html
├── package.json
└── tsconfig.json

packages/b24ui-react/
├── src/
│   ├── index.ts              # public API (re-exports)
│   ├── provider.tsx          # B24Provider component
│   ├── types.ts              # shared types
│   ├── atoms/                # Jotai atoms (b24-frame, api, user, app-settings, user-settings)
│   ├── hooks/                # React hooks
│   └── lib/                  # utilities (api-client, errors, sleep)
├── package.json
└── tsconfig.json
```

## Setup

### Entry point (`main.tsx`)
```tsx
import { B24Provider } from '@common/b24ui-react'
import { BrowserRouter, Routes, Route } from 'react-router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <B24Provider apiBaseUrl="" isDev={import.meta.env.DEV}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/install" element={<InstallPage />} />
        </Routes>
      </BrowserRouter>
    </B24Provider>
  </StrictMode>,
)
```

### Tailwind CSS 4
`vite.config.ts` uses `@tailwindcss/vite`:
```ts
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```
`index.css`:
```css
@import 'tailwindcss';
```

## Baseline rules
1. **Wrap the app in `<B24Provider>`** — provides Jotai store, API base URL, and dev mode flag.
2. **Use hooks from `@common/b24ui-react`** — never call `initializeB24Frame()` directly.
3. **Pages are `.tsx` components** in `src/pages/`, wired via React Router.
4. **Jotai atoms** for shared state — avoid prop drilling.
5. **Tailwind CSS** for styling — no B24-specific component library.

## Available hooks

| Hook | Purpose |
|------|---------|
| `useB24Init(options)` | Initialize B24 frame, load profile/app data, get JWT token |
| `useB24Frame()` | Get the initialized B24Frame instance (throws if not ready) |
| `useB24FrameOrNull()` | Get B24Frame or null (safe for conditional rendering) |
| `useApiClient()` | Get a configured API client with JWT auth |
| `useAppSettings()` | Read/write app-level settings via B24 options API |
| `useUserSettings()` | Read/write user-level settings via B24 options API |
| `usePullClient(options)` | Subscribe to B24 Pull (real-time) events |

### Typical page setup
```tsx
import { useB24Init } from '@common/b24ui-react'

export default function IndexPage() {
  const { isInitialized, error } = useB24Init({
    loadData: ['Profile', 'App'],
  })

  if (error) return <div>Error: {error.message}</div>
  if (!isInitialized) return <div>Loading...</div>

  return <div>App content</div>
}
```

## Available atoms

### B24 Frame
- `b24FrameAtom` — the B24Frame instance
- `langAtom` — portal language
- `appSidAtom` — application SID
- `isInstallModeAtom` — whether app is in install flow
- `placementAtom` — current placement info

### API
- `tokenJWTAtom` — JWT token for backend API calls
- `isInitTokenJWTAtom` — whether token has been fetched

### User
- `userIdAtom`, `userLoginAtom`, `userIsAdminAtom` — current user info
- `initUserFromBatchAtom` — action to load user data

### App settings
- `appVersionAtom`, `appStatusAtom`, `appIsTrialAtom` — app metadata
- `appConfigSettingsAtom` — app config (read/write via `useAppSettings`)

### User settings
- `userConfigSettingsAtom` — user config (read/write via `useUserSettings`)

## State management
Jotai drives shared state. Import atoms from `@common/b24ui-react` and use them with `useAtom` / `useAtomValue` / `useSetAtom` from `jotai`. For page-local state, use standard React `useState` / `useReducer`.

```tsx
import { useAtomValue } from 'jotai'
import { userIdAtom } from '@common/b24ui-react'

function UserBadge() {
  const userId = useAtomValue(userIdAtom)
  return <span>User #{userId}</span>
}
```

## Performance tips
- Use React Compiler (enabled via `babel-plugin-react-compiler` in Vite config) — auto-memoization.
- Prefer `useAtomValue` over `useAtom` when you only read (avoids unnecessary re-renders).
- Use `React.lazy()` for code-splitting heavy page components.
- Batch related B24 API calls with `callBatch` / `callBatchByChunk`.
- Debounce user inputs before triggering API calls.

## Best practices
1. Keep pages thin — extract logic into hooks, atoms, or utility functions.
2. Use Tailwind utility classes; avoid inline styles and CSS modules.
3. Handle loading/error states in every page that calls `useB24Init`.
4. Never call B24 SDK methods before initialization completes.
5. Use TypeScript strictly — leverage types from `@common/b24ui-react` and `@bitrix24/b24jssdk`.

## Resources
- B24 JS SDK: <https://github.com/bitrix24/b24jssdk>
- B24 REST API: <https://apidocs.bitrix24.com>
- React Router: <https://reactrouter.com>
- Jotai: <https://jotai.org>
- Tailwind CSS: <https://tailwindcss.com>
