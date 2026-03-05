import { Router } from "express";

export const installRouter = Router();

installRouter.post("/install", (req, res) => {
  console.log("/api/install", req.body);
  res.json({ message: "All success" });
});
