import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { ContractError } from "../middleware/contract";
import { verifyB24Token } from "../services/b24-auth";

const installBody = z.object({
  AUTH_ID: z.string(),
  AUTH_EXPIRES: z.number().optional(),
  REFRESH_ID: z.string(),
  member_id: z.string(),
  DOMAIN: z.string(),
  user_id: z.number(),
  status: z.string(),
  appVersion: z.number().optional(),
  LICENSE_FAMILY: z.string().optional(),
});

export const installRouter = Router();

installRouter.post("/install", async (req, res, next) => {
  try {
    const parsed = installBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const body = parsed.data;

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
      .insertInto("bitrix24account")
      .values({
        b24_user_id: userId,
        is_b24_user_admin: isAdmin,
        member_id: memberId,
        domain_url: body.DOMAIN,
        status: body.status,
        application_version: body.appVersion ?? 1,
        access_token: body.AUTH_ID,
        refresh_token: body.REFRESH_ID,
        expires_in: body.AUTH_EXPIRES ?? null,
        created_at_utc: now,
        updated_at_utc: now,
      })
      .onConflict((oc) =>
        oc.constraint("unique_b24_user_domain").doUpdateSet({
          is_b24_user_admin: isAdmin,
          member_id: memberId,
          status: body.status,
          application_version: body.appVersion ?? 1,
          access_token: body.AUTH_ID,
          refresh_token: body.REFRESH_ID,
          expires_in: body.AUTH_EXPIRES ?? null,
          updated_at_utc: now,
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    await db
      .insertInto("application_installation")
      .values({
        bitrix_24_account_id: account.id,
        status: body.status,
        portal_license_family: body.LICENSE_FAMILY ?? "unknown",
        created_at_utc: now,
        update_at_utc: now,
      })
      .onConflict((oc) =>
        oc.column("bitrix_24_account_id").doUpdateSet({
          status: body.status,
          portal_license_family: body.LICENSE_FAMILY ?? "unknown",
          update_at_utc: now,
        }),
      )
      .execute();

    console.log(
      `[install] domain=${body.DOMAIN} member_id=${memberId} user=${userId} account=${account.id}`,
    );
    res.json({ message: "All success" });
  } catch (err) {
    next(err);
  }
});
