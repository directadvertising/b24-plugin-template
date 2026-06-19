import { db } from "../lib/db";
import { ContractError } from "../middleware/contract";
import { type B24Creds, refreshAccessToken } from "./b24-oauth";

export type { B24Creds };

/**
 * Resolve stored Bitrix24 credentials for a single account row by its
 * internal id (e.g. `req.user.bitrix24AccountId` from the JWT).
 */
export async function getB24CredsById(
  bitrix24AccountId: string,
): Promise<B24Creds> {
  const row = await db
    .selectFrom("bitrix_user")
    .select(["id", "access_token", "refresh_token", "domain"])
    .where("id", "=", bitrix24AccountId)
    .executeTakeFirst();
  if (!row?.access_token || !row?.domain) {
    throw new ContractError(
      500,
      "NO_B24_CREDS",
      "No Bitrix24 credentials found for this account",
    );
  }
  return {
    bitrix24AccountId: row.id,
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    domain: row.domain,
  };
}

/**
 * Resolve credentials for a portal (tenant) by member_id. Prefers an admin
 * account, falls back to the most recently updated account with a token.
 */
export async function getPortalCreds(memberId: string): Promise<B24Creds> {
  const adminRow = await db
    .selectFrom("bitrix_user")
    .select(["id", "access_token", "refresh_token", "domain"])
    .where("member_id", "=", memberId)
    .where("is_admin", "=", true)
    .where("access_token", "is not", null)
    .orderBy("updated_at", "desc")
    .limit(1)
    .executeTakeFirst();
  if (adminRow?.access_token && adminRow.domain) {
    return {
      bitrix24AccountId: adminRow.id,
      access_token: adminRow.access_token,
      refresh_token: adminRow.refresh_token,
      domain: adminRow.domain,
    };
  }

  const anyRow = await db
    .selectFrom("bitrix_user")
    .select(["id", "access_token", "refresh_token", "domain"])
    .where("member_id", "=", memberId)
    .where("access_token", "is not", null)
    .orderBy("updated_at", "desc")
    .limit(1)
    .executeTakeFirst();
  if (!anyRow?.access_token || !anyRow.domain) {
    throw new ContractError(
      500,
      "NO_B24_CREDS",
      "No Bitrix24 credentials found for this portal",
    );
  }
  return {
    bitrix24AccountId: anyRow.id,
    access_token: anyRow.access_token,
    refresh_token: anyRow.refresh_token,
    domain: anyRow.domain,
  };
}

/**
 * Call a Bitrix24 REST method against the portal using stored OAuth tokens.
 *
 * On HTTP 401 it runs the shared refresh ladder (DB re-read →
 * oauth.bitrix.info, serialized per account) once and retries. Always route
 * server-side B24 REST calls through this so token refresh stays uniform.
 */
export async function b24Call(
  creds: B24Creds,
  method: string,
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const attempt = (): Promise<Response> => {
    const url = `https://${creds.domain}/rest/${method}?auth=${creds.access_token}`;
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(30_000),
    });
  };

  let res = await attempt();

  if (res.status === 401) {
    const refreshed = await refreshAccessToken(creds);
    if (refreshed) {
      res = await attempt();
    }
    if (res.status === 401) {
      throw new ContractError(
        500,
        "B24_AUTH_EXPIRED",
        "Bitrix24 token expired",
      );
    }
  }

  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok || body.error) {
    throw new ContractError(
      500,
      "B24_API_ERROR",
      `B24 ${method}: ${body.error ?? res.status} — ${body.error_description ?? ""}`,
    );
  }
  return body;
}
