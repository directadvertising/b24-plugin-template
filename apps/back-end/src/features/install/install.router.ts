import { BitrixContract } from "@common/contracts";
import { Router } from "express";
import { contractMiddleware } from "../../middleware/contract";
import { installApplication } from "./install.service";

export const installRouter = Router();

installRouter.post(
  BitrixContract.routes.install.pathTemplate,
  contractMiddleware(BitrixContract.routes.install),
  async (req, res, next) => {
    try {
      await installApplication(req.body);
      res.json({ message: "All success" });
    } catch (err) {
      next(err);
    }
  },
);
