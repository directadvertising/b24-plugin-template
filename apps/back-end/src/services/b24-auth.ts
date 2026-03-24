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

export async function verifyB24Token(
  authId: string,
): Promise<{ userId: number; isAdmin: boolean; memberId: string }> {
  const auth = encodeURIComponent(authId);

  let userResponse: Response;
  let adminResponse: Response;
  let appInfoResponse: Response;
  try {
    [userResponse, adminResponse, appInfoResponse] = await Promise.all([
      fetch(`https://${B24_OAUTH_HOST}/rest/user.current?auth=${auth}`),
      fetch(`https://${B24_OAUTH_HOST}/rest/user.admin?auth=${auth}`),
      fetch(`https://${B24_OAUTH_HOST}/rest/app.info?auth=${auth}`),
    ]);
  } catch {
    throw new ContractError(
      401,
      "B24_VERIFICATION_FAILED",
      "Failed to reach Bitrix24 server",
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

  const appInfoData = (await appInfoResponse.json()) as B24AppInfoResponse;
  const memberId = appInfoData.result?.MEMBER_ID;

  if (!memberId) {
    throw new ContractError(
      401,
      "B24_VERIFICATION_FAILED",
      "Could not verify portal identity",
    );
  }

  return {
    userId: Number(userData.result.ID),
    isAdmin,
    memberId,
  };
}
