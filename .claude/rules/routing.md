---
paths:
  - "apps/front-end/**/*.{ts,tsx}"
---

# Routing Rules (`apps/front-end/`)

Routing uses [`wouter`](https://github.com/molefrog/wouter) — a minimal, hook-based router. No `<BrowserRouter>` wrapper is needed; wouter reads the browser location by default.

## App composition (three files, one job each)

- `src/main.tsx` — **only** mounts the root: `createRoot(...).render(<App />)`. Nothing else lives here.
- `src/app.tsx` — the `App` component. Owns the provider stack (`<QueryClientProvider>`, `<B24Provider>`, …) and renders `<AppRouter />`.
- `src/router.tsx` — the **main router**. Owns the `<Switch>` and all `<Route>` definitions, exported as `AppRouter`. Add or change routes here.

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

```tsx
// src/app.tsx
import { B24Provider } from "@common/bitrix";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppRouter } from "@/router";
import { queryClient } from "@/lib/query-client";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <B24Provider apiBaseUrl="" isDev={import.meta.env.DEV}>
        <AppRouter />
      </B24Provider>
    </QueryClientProvider>
  );
}
```

```tsx
// src/router.tsx
import { Route, Switch } from "wouter";
import { HomePage } from "@/features/home";
import { InstallPage } from "@/features/install";

export function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/install" component={InstallPage} />
    </Switch>
  );
}
```

Pages live in `features/<name>/pages/` and are imported via each feature's barrel (`@/features/<name>`), then mounted in `src/router.tsx`. See [`docs/front-end/feature-structure.md`](../../docs/front-end/feature-structure.md).

`<Switch>` renders the **first** matching `<Route>`. Without it, every matching route renders.

For links and navigation use wouter's own primitives — `<Link>`, `useLocation()` (returns `[location, navigate]`; wouter has no `useNavigation`), `useParams()`, `useSearchParams()`. See the [wouter docs](https://github.com/molefrog/wouter).
