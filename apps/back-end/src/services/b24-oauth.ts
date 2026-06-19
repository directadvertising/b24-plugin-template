import { sql } from "kysely";
import { db } from "../lib/db";

export interface B24Creds {
  bitrix24AccountId: string;
  access_token: string;
  refresh_token: string | null;
  domain: string;
}

export interface B24OAuthLogger {
  info: (obj: Record<string, unknown>, msg: string) => void;
  warn: (obj: Record<string, unknown>, msg: string) => void;
}

const consoleLogger: B24OAuthLogger = {
  info: (obj, msg) => console.log(`[b24-oauth] ${msg}`, obj),
  warn: (obj, msg) => console.warn(`[b24-oauth] ${msg}`, obj),
};

/**
 * Old method: recover from a 401 by re-reading the latest token from the DB.
 * The frontend updates it on every page load via getToken, so a different
 * session may have already refreshed it. No advisory lock / transaction —
 * without CLIENT_ID/CLIENT_SECRET there's no single-use OAuth refresh token
 * to serialize against, so the locking machinery would be pure overhead.
 */
async function adoptFresherTokenFromDb(
  creds: B24Creds,
  log: B24OAuthLogger,
): Promise<boolean> {
  const fresh = await db
    .selectFrom("bitrix_user")
    .select(["access_token", "refresh_token"])
    .where("id", "=", creds.bitrix24AccountId)
    .executeTakeFirst();

  if (fresh?.access_token && fresh.access_token !== creds.access_token) {
    creds.access_token = fresh.access_token;
    creds.refresh_token = fresh.refresh_token ?? creds.refresh_token;
    log.info({ domain: creds.domain }, "picked up fresher token from DB");
    return true;
  }

  return false;
}

/**
 * Refresh an expired Bitrix24 access token for a single bitrix_user row.
 *
 * Mutates `creds.access_token`/`refresh_token` in place on success so the
 * same object reference, threaded through nested callers, picks up the new
 * token without further plumbing.
 *
 * When CLIENT_ID/CLIENT_SECRET are configured, the refresh is serialized per
 * row via pg_advisory_xact_lock(hashtext(bitrix24AccountId)) — concurrent
 * callers for the same row queue up, and the loser re-reads the winner's
 * persisted token from the DB instead of burning the (single-use)
 * refresh_token at oauth.bitrix.info.
 *
 * Without those credentials we can't reach the OAuth server at all, so we fall
 * back to the old method: a plain DB re-read, no lock or transaction.
 */
export async function refreshAccessToken(
  creds: B24Creds,
  log: B24OAuthLogger = consoleLogger,
): Promise<boolean> {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  // No client credentials → can't hit oauth.bitrix.info. Fall back to the old
  // method: just re-read whatever the frontend may have refreshed into the DB.
  if (!clientId || !clientSecret) {
    const adopted = await adoptFresherTokenFromDb(creds, log);
    if (!adopted) {
      log.warn(
        { domain: creds.domain },
        "token expired and CLIENT_ID/CLIENT_SECRET not set — cannot refresh server-side",
      );
    }
    return adopted;
  }

  return db.transaction().execute(async (trx) => {
    await sql`SELECT pg_advisory_xact_lock(hashtext(${creds.bitrix24AccountId}))`.execute(
      trx,
    );

    // Re-read inside the lock — if a concurrent caller already refreshed,
    // we pick up its fresher token and skip the OAuth call entirely.
    const fresh = await trx
      .selectFrom("bitrix_user")
      .select(["access_token", "refresh_token"])
      .where("id", "=", creds.bitrix24AccountId)
      .executeTakeFirst();

    if (fresh?.access_token && fresh.access_token !== creds.access_token) {
      creds.access_token = fresh.access_token;
      creds.refresh_token = fresh.refresh_token ?? creds.refresh_token;
      log.info({ domain: creds.domain }, "picked up fresher token from DB");
      return true;
    }

    if (!creds.refresh_token) {
      log.warn({ domain: creds.domain }, "no refresh_token available");
      return false;
    }

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: creds.refresh_token,
    });

    const res = await fetch(
      `https://oauth.bitrix.info/oauth/token/?${params.toString()}`,
      { signal: AbortSignal.timeout(30_000) },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      log.warn(
        { status: res.status, body: text },
        "OAuth token refresh failed",
      );
      return false;
    }

    const body = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };

    if (!body.access_token) return false;

    creds.access_token = body.access_token;
    creds.refresh_token = body.refresh_token ?? creds.refresh_token;

    await trx
      .updateTable("bitrix_user")
      .set({
        access_token: creds.access_token,
        refresh_token: creds.refresh_token,
        expires_in: body.expires_in ?? null,
        updated_at: new Date(),
      })
      .where("id", "=", creds.bitrix24AccountId)
      .execute();

    log.info({ domain: creds.domain }, "token refreshed via OAuth");
    return true;
  });
}
