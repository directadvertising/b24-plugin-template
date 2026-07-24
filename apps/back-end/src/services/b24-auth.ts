import { db } from "../lib/db";
import { ContractError } from "../middleware/contract";

const B24_OAUTH_HOST = "oauth.bitrix.info";

interface B24UserResponse {
  result?: {
    ID: string;
    [key: string]: unknown;
  };
}

interface B24AdminResponse {
  result?: boolean;
}

interface B24AppInfoResponse {
  result?: {
    MEMBER_ID?: string;
    [key: string]: unknown;
  };
}

/**
 * Resolve the portal identity (`member_id`) for a token via the central OAuth
 * server. `app.info` is portal-agnostic — the central server maps the token to
 * the portal that issued it — so this is the one fact a client cannot forge by
 * pointing us at a domain it controls.
 */
async function resolveMemberId(auth: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(
      `https://${B24_OAUTH_HOST}/rest/app.info?auth=${auth}`,
    );
  } catch {
    throw new ContractError(
      401,
      "B24_VERIFICATION_FAILED",
      "Failed to reach Bitrix24 server",
    );
  }

  if (!response.ok) {
    throw new ContractError(
      401,
      "B24_VERIFICATION_FAILED",
      "Bitrix24 token verification failed",
    );
  }

  const data = (await response.json()) as B24AppInfoResponse;
  const memberId = data.result?.MEMBER_ID;

  if (!memberId) {
    throw new ContractError(
      401,
      "B24_VERIFICATION_FAILED",
      "Could not verify portal identity",
    );
  }

  return memberId;
}

/**
 * Pick the domain to run portal REST calls against. Prefer the domain already
 * stored for this portal — it was recorded at install time and the client can't
 * influence it. Only fall back to the client-supplied domain on first install,
 * when there is nothing on file yet.
 */
async function resolvePortalDomain(
  memberId: string,
  claimedDomain: string,
): Promise<string> {
  const row = await db
    .selectFrom("bitrix_user")
    .select("domain")
    .where("member_id", "=", memberId)
    .orderBy("updated_at", "desc")
    .limit(1)
    .executeTakeFirst();

  return row?.domain ?? claimedDomain;
}

/**
 * Verify Bitrix24 credentials and return the calling user's identity.
 *
 * `member_id` comes from the central OAuth server; the user lookup runs against
 * the portal instance itself, since `user.current` / `user.admin` are
 * portal-scoped methods that the central server does not serve.
 *
 * These are raw fetches rather than `b24Call` on purpose: this runs before we
 * have (or trust) a stored account row, so there is no credential set to
 * refresh against.
 */
export async function verifyB24Token(
  authId: string,
  claimedDomain: string,
): Promise<{ userId: number; isAdmin: boolean; memberId: string }> {
  const auth = encodeURIComponent(authId);

  const memberId = await resolveMemberId(auth);
  const domain = await resolvePortalDomain(memberId, claimedDomain);

  let userResponse: Response;
  let adminResponse: Response;
  try {
    [userResponse, adminResponse] = await Promise.all([
      fetch(`https://${domain}/rest/user.current?auth=${auth}`),
      fetch(`https://${domain}/rest/user.admin?auth=${auth}`),
    ]);
  } catch {
    throw new ContractError(
      401,
      "B24_VERIFICATION_FAILED",
      "Failed to reach Bitrix24 portal",
    );
  }

  if (!userResponse.ok) {
    throw new ContractError(
      401,
      "B24_VERIFICATION_FAILED",
      "Bitrix24 token verification failed",
    );
  }

  const userData = (await userResponse.json()) as B24UserResponse;

  if (!userData.result?.ID) {
    throw new ContractError(
      401,
      "B24_VERIFICATION_FAILED",
      "Invalid Bitrix24 response",
    );
  }

  let isAdmin = false;
  if (adminResponse.ok) {
    const adminData = (await adminResponse.json()) as B24AdminResponse;
    isAdmin = adminData.result === true;
  }

  return {
    userId: Number(userData.result.ID),
    isAdmin,
    memberId,
  };
}
