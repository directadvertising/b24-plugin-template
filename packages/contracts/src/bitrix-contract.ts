import { createContract, type InferContractBody } from "contracts";
import { z } from "zod";

/**
 * Bitrix24 auth/token routes — the install handshake and JWT session issuance.
 * Both are called by the frontend during the install flow / app init, before a
 * session token exists, so neither requires `authMiddleware`.
 */
export const BitrixContract = createContract({
  routes: {
    install: {
      method: "POST",
      name: "Install Application",
      description:
        "First-time install handshake: verifies B24 creds and seeds the account + tenant rows.",
      path: "/install",
      params: null,
      query: null,
      body: z.object({
        AUTH_ID: z.string(),
        AUTH_EXPIRES: z.number().optional(),
        REFRESH_ID: z.string(),
        member_id: z.string(),
        DOMAIN: z.string(),
        user_id: z.number(),
        status: z.string(),
        appVersion: z.number().optional(),
        LICENSE_FAMILY: z.string().optional(),
      }),
      data: z.object({ message: z.string() }),
      errorCodes: ["B24_MEMBER_MISMATCH"],
    },
    getToken: {
      method: "POST",
      name: "Get Session Token",
      description:
        "Exchanges B24 OAuth creds for a 1-hour JWT session token after verifying the portal install.",
      path: "/getToken",
      params: null,
      query: null,
      body: z.object({
        AUTH_ID: z.string(),
        REFRESH_ID: z.string().optional(),
        DOMAIN: z.string(),
        member_id: z.string(),
      }),
      data: z.object({ token: z.string() }),
      errorCodes: [
        "CONFIG_ERROR",
        "B24_MEMBER_MISMATCH",
        "ACCOUNT_NOT_FOUND",
        "B24_DOMAIN_MISMATCH",
      ],
    },
  },
});

export type InstallBody = InferContractBody<typeof BitrixContract, "install">;
export type GetTokenBody = InferContractBody<typeof BitrixContract, "getToken">;
