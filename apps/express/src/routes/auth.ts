import { Router } from "express";
import jwt from "jsonwebtoken";

export const authRouter = Router();

authRouter.post("/getToken", (req, res) => {
  console.log("/api/getToken", req.body);

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ error: "JWT_SECRET is not configured" });
    return;
  }

  const userId = req.body.USER_ID;
  const appInfo = { id: userId || 1 };
  const token = jwt.sign(appInfo, jwtSecret, { expiresIn: "1h" });

  res.json({ token });
});
