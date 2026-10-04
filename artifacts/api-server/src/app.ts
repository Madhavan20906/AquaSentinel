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

// Health check route for cloud infrastructure (Render, ALB, etc.)
app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", authMiddleware, router);

function findClientDist(): string | undefined {
  const candidateDistDirs = [
    path.resolve(process.cwd(), "artifacts", "aquasentinel", "dist", "public"),
    path.resolve(process.cwd(), "..", "aquasentinel", "dist", "public"),
    path.resolve(import.meta.dirname, "..", "..", "aquasentinel", "dist", "public"),
    path.resolve(import.meta.dirname, "..", "..", "..", "artifacts", "aquasentinel", "dist", "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
  ];
  return candidateDistDirs.find((dir) => fs.existsSync(path.join(dir, "index.html")));
}

const clientDist = findClientDist();
if (clientDist) {
  app.use(express.static(clientDist));
}

app.use((req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path === "/healthz") {
    return next();
  }
  const dist = clientDist || findClientDist();
  if (dist && fs.existsSync(path.join(dist, "index.html"))) {
    return res.sendFile(path.join(dist, "index.html"));
  }
  next();
});

export default app;
