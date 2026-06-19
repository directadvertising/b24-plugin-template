import { B24Provider } from "@common/bitrix";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { AppRouter } from "@/router";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <B24Provider apiBaseUrl="" isDev={import.meta.env.DEV}>
        <AppRouter />
      </B24Provider>
    </QueryClientProvider>
  );
}
