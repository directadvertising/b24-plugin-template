import type { GetTokenBody } from "@common/contracts";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";
import { ContractError } from "../../middleware/contract";
import { verifyB24Token } from "../../services/b24-auth";

/** Verifies B24 creds against the central OAuth server, confirms the app is
 * installed for the portal, upserts the account row, and issues a 1-hour JWT. */
export async function issueSessionToken(body: GetTokenBody): Promise<string> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new ContractError(
      500,
      "CONFIG_ERROR",
      "JWT_SECRET is not configured",
    );
  }

  const { userId, isAdmin, memberId } = await verifyB24Token(body.AUTH_ID);

  // Cross-check: central server member_id must match client-supplied member_id
  if (memberId !== body.member_id) {
    throw new ContractError(
      401,
      "B24_MEMBER_MISMATCH",
      "Portal identity mismatch",
    );
  }

  // Verify the app is installed for this portal
  const installation = await db
    .selectFrom("bitrix_user")
    .innerJoin(
      "bitrix_tenant",
      "bitrix_tenant.bitrix_user_id",
      "bitrix_user.id",
    )
    .select([
      "bitrix_user.member_id",
      "bitrix_user.status",
      "bitrix_user.app_version",
      "bitrix_user.domain",
    ])
    .where("bitrix_user.member_id", "=", memberId)
    .executeTakeFirst();

  if (!installation) {
    throw new ContractError(
      401,
      "ACCOUNT_NOT_FOUND",
      "Application not installed for this portal",
    );
  }

  // Domain consistency check: stored domain must match client-supplied domain
  if (installation.domain && installation.domain !== body.DOMAIN) {
    throw new ContractError(
      401,
      "B24_DOMAIN_MISMATCH",
      "Portal domain mismatch",
    );
  }

  // Upsert the user's bitrix_user row
  const now = new Date();
  const account = await db
    .insertInto("bitrix_user")
    .values({
      bitrix_id: userId,
      is_admin: isAdmin,
      member_id: memberId,
      domain: body.DOMAIN,
      status: installation.status,
      app_version: installation.app_version,
      access_token: body.AUTH_ID,
      refresh_token: body.REFRESH_ID ?? null,
      created_at: now,
      updated_at: now,
    })
    .onConflict((oc) =>
      oc.constraint("unique_bitrix_user_domain").doUpdateSet({
        is_admin: isAdmin,
        access_token: body.AUTH_ID,
        refresh_token: body.REFRESH_ID ?? null,
        updated_at: now,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();

  const token = jwt.sign(
    { bitrix24AccountId: account.id, userId, memberId, isAdmin },
    jwtSecret,
    { expiresIn: "1h" },
  );

  console.log(
    `[auth] Token issued user=${userId} domain=${body.DOMAIN} memberId=${memberId}`,
  );
  return token;
}
