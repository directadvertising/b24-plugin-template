import type { InstallBody } from "@common/contracts";
import { db } from "../../lib/db";
import { ContractError } from "../../middleware/contract";
import { verifyB24Token } from "../../services/b24-auth";

/** Verifies B24 creds, then upserts the account and its installation row.
 * Returns the account id. */
export async function installApplication(
  body: InstallBody,
): Promise<{ accountId: string }> {
  const { userId, isAdmin, memberId } = await verifyB24Token(body.AUTH_ID);

  // Cross-check: central server member_id must match client-supplied member_id
  if (memberId !== body.member_id) {
    throw new ContractError(
      401,
      "B24_MEMBER_MISMATCH",
      "Portal identity mismatch",
    );
  }

  const now = new Date();

  const account = await db
    .insertInto("bitrix_user")
    .values({
      bitrix_id: userId,
      is_admin: isAdmin,
      member_id: memberId,
      domain: body.DOMAIN,
      status: body.status,
      app_version: body.appVersion ?? 1,
      access_token: body.AUTH_ID,
      refresh_token: body.REFRESH_ID,
      expires_in: body.AUTH_EXPIRES ?? null,
      created_at: now,
      updated_at: now,
    })
    .onConflict((oc) =>
      oc.constraint("unique_bitrix_user_domain").doUpdateSet({
        is_admin: isAdmin,
        member_id: memberId,
        status: body.status,
        app_version: body.appVersion ?? 1,
        access_token: body.AUTH_ID,
        refresh_token: body.REFRESH_ID,
        expires_in: body.AUTH_EXPIRES ?? null,
        updated_at: now,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();

  await db
    .insertInto("bitrix_tenant")
    .values({
      bitrix_user_id: account.id,
      status: body.status,
      license_family: body.LICENSE_FAMILY ?? "unknown",
      created_at: now,
      updated_at: now,
    })
    .onConflict((oc) =>
      oc.column("bitrix_user_id").doUpdateSet({
        status: body.status,
        license_family: body.LICENSE_FAMILY ?? "unknown",
        updated_at: now,
      }),
    )
    .execute();

  console.log(
    `[install] domain=${body.DOMAIN} member_id=${memberId} user=${userId} account=${account.id}`,
  );
  return { accountId: account.id };
}
