import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";

export const healthRouter = Router();

healthRouter.get("/health", authMiddleware, (_req, res) => {
  res.json({
    status: "healthy",
    backend: "express",
    timestamp: Math.floor(Date.now() / 1000),
  });
});
