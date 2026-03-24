import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  bitrix24AccountId: string;
  userId: number;
  memberId: string;
  isAdmin: boolean;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ error: "JWT_SECRET is not configured" });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Authorization header missing" });
    return;
  }

  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    res.status(401).json({ error: "Invalid token format" });
    return;
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded.bitrix24AccountId || !decoded.userId || !decoded.memberId) {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    req.user = {
      bitrix24AccountId: decoded.bitrix24AccountId,
      userId: decoded.userId,
      memberId: decoded.memberId,
      isAdmin: decoded.isAdmin ?? false,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
