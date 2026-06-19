import { BitrixContract } from "@common/contracts";
import { Router } from "express";
import { contractMiddleware } from "../../middleware/contract";
import { issueSessionToken } from "./auth.service";

export const authRouter = Router();

authRouter.post(
  BitrixContract.routes.getToken.pathTemplate,
  contractMiddleware(BitrixContract.routes.getToken),
  async (req, res, next) => {
    try {
      const token = await issueSessionToken(req.body);
      res.json({ token });
    } catch (err) {
      next(err);
    }
  },
);
