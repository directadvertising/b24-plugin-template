declare namespace Express {
  interface Request {
    user?: {
      bitrix24AccountId: string;
      userId: number;
      memberId: string;
      isAdmin: boolean;
    };
  }
}
