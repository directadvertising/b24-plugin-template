import { QueryClient } from "@tanstack/react-query";

/**
 * App-wide TanStack Query client. Lives in `lib/` (not tied to a feature) and is
 * provided once at the app root via `<QueryClientProvider>`. Features consume it
 * through their hooks (`useQuery`/`useMutation`) and their `query-keys.ts`.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
