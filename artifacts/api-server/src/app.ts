import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./lib/auth";

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

import fs from "node:fs";

// Serve persistent uploaded observation photos
app.use("/uploads", express.static(path.resolve(process.cwd(), "public", "uploads")));

app.use("/api", authMiddleware, router);

// Serve static frontend build when present (unified single-service deployment)
const candidateDistDirs = [
  path.resolve(process.cwd(), "artifacts", "aquasentinel", "dist", "public"),
  path.resolve(process.cwd(), "..", "aquasentinel", "dist", "public"),
  path.resolve(process.cwd(), "dist", "public"),
  path.resolve(process.cwd(), "public"),
];

const clientDist = candidateDistDirs.find((dir) => fs.existsSync(path.join(dir, "index.html")));

if (clientDist) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

export default app;
