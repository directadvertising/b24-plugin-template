import "./env";

import cors from "cors";
import express from "express";
import * as routers from "./features";
import { db } from "./lib/db";
import { contractErrorHandler } from "./middleware/contract";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

for (const [name, router] of Object.entries(routers)) {
  app.use(router);
  console.info(`Loaded '${name}' router`);
}

app.use(contractErrorHandler);

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});

process.on("SIGTERM", async () => {
  await db.destroy();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await db.destroy();
  process.exit(0);
});
