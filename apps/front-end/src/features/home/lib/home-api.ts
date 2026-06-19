import type { ApiClient } from "@common/bitrix";

export interface HealthData {
  status: string;
  backend: string;
  timestamp: number;
}

interface HealthEnvelope {
  success: boolean;
  data: HealthData;
}

/**
 * `GET /api/health` — backend liveness probe.
 *
 * API functions are pure and testable: they receive the client (owned by the
 * hook via `useApiClient()`) and return typed data. When a contract route
 * exists, type the response with
 * `InferContractData<typeof SomeContract, "routeName">` from `@common/contracts`
 * instead of the hand-written envelope above.
 */
export async function getHealth(client: ApiClient): Promise<HealthData> {
  const res = await client.get<HealthEnvelope>("/api/health");
  return res.data;
}
