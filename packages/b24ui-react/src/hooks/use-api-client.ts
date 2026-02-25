import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { tokenJWTAtom } from "../atoms/api.js";
import { createApiClient } from "../lib/api-client.js";
import { useB24Config } from "../provider.js";

/**
 * Returns a memoized API client bound to the current JWT token and base URL.
 */
export function useApiClient() {
  const token = useAtomValue(tokenJWTAtom);
  const { apiBaseUrl } = useB24Config();

  return useMemo(
    () => createApiClient({ baseUrl: apiBaseUrl, token }),
    [apiBaseUrl, token],
  );
}
