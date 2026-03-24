import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../db";
import { ContractError } from "../middleware/contract";
import { verifyB24Token } from "../services/b24-auth";

const getTokenBody = z.object({
  AUTH_ID: z.string(),
  REFRESH_ID: z.string().optional(),
  DOMAIN: z.string(),
  member_id: z.string(),
});

export const authRouter = Router();

authRouter.post("/getToken", async (req, res, next) => {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ContractError(
        500,
        "CONFIG_ERROR",
        "JWT_SECRET is not configured",
      );
    }

    const parsed = getTokenBody.safeParse(req.body);
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

    // Verify the app is installed for this portal
    const installation = await db
      .selectFrom("bitrix24account")
      .innerJoin(
        "application_installation",
        "application_installation.bitrix_24_account_id",
        "bitrix24account.id",
      )
      .select([
        "bitrix24account.member_id",
        "bitrix24account.status",
        "bitrix24account.application_version",
        "bitrix24account.domain_url",
      ])
      .where("bitrix24account.member_id", "=", memberId)
      .executeTakeFirst();

    if (!installation) {
      throw new ContractError(
        401,
        "ACCOUNT_NOT_FOUND",
        "Application not installed for this portal",
      );
    }

    // Domain consistency check: stored domain must match client-supplied domain
    if (installation.domain_url && installation.domain_url !== body.DOMAIN) {
      throw new ContractError(
        401,
        "B24_DOMAIN_MISMATCH",
        "Portal domain mismatch",
      );
    }

    // Upsert the user's bitrix24account row
    const now = new Date();
    const account = await db
      .insertInto("bitrix24account")
      .values({
        b24_user_id: userId,
        is_b24_user_admin: isAdmin,
        member_id: memberId,
        domain_url: body.DOMAIN,
        status: installation.status,
        application_version: installation.application_version,
        access_token: body.AUTH_ID,
        refresh_token: body.REFRESH_ID ?? null,
        created_at_utc: now,
        updated_at_utc: now,
      })
      .onConflict((oc) =>
        oc.constraint("unique_b24_user_domain").doUpdateSet({
          is_b24_user_admin: isAdmin,
          access_token: body.AUTH_ID,
          refresh_token: body.REFRESH_ID ?? null,
          updated_at_utc: now,
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    const token = jwt.sign(
      {
        bitrix24AccountId: account.id,
        userId,
        memberId,
        isAdmin,
      },
      jwtSecret,
      { expiresIn: "1h" },
    );

    console.log(
      `[auth] Token issued user=${userId} domain=${body.DOMAIN} memberId=${memberId}`,
    );
    res.json({ token });
  } catch (err) {
    next(err);
  }
});
