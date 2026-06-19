import { Provider as JotaiProvider } from "jotai";
import { createContext, type ReactNode, useContext } from "react";
import type { B24InitConfig } from "./types.js";

const B24ConfigContext = createContext<B24InitConfig | null>(null);

export function useB24Config(): B24InitConfig {
  const config = useContext(B24ConfigContext);
  if (!config) {
    throw new Error("useB24Config must be used within a <B24Provider>");
  }
  return config;
}

interface B24ProviderProps {
  apiBaseUrl: string;
  isDev?: boolean;
  children: ReactNode;
}

export function B24Provider({ apiBaseUrl, isDev, children }: B24ProviderProps) {
  const config: B24InitConfig = { apiBaseUrl, isDev };

  return (
    <B24ConfigContext value={config}>
      <JotaiProvider>{children}</JotaiProvider>
    </B24ConfigContext>
  );
}
