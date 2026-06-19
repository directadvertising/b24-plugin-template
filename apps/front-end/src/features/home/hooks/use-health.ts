import { useApiClient } from "@common/bitrix";
import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../lib/home-api";
import { homeKeys } from "../query-keys";

/**
 * Reads backend health via TanStack Query. The hook owns the api client and
 * wires the query key; the lib function (`getHealth`) does the actual call.
 */
export function useHealth() {
  const client = useApiClient();

  return useQuery({
    queryKey: homeKeys.health(),
    queryFn: () => getHealth(client),
  });
}
