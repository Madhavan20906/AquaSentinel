import { Router, type IRouter, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// 1. Request presigned upload URL
router.post("/storage/uploads/request-url", async (req: Request, res: Response): Promise<void> => {
  const { name, size, contentType } = req.body;
  if (!name) {
    res.status(400).json({ error: "Missing file name" });
    return;
  }

  const ext = path.extname(name) || (contentType?.includes("png") ? ".png" : ".jpg");
  const fileId = crypto.randomUUID();
  const filename = `${fileId}${ext}`;
  const objectPath = `/uploads/${filename}`;
  const uploadURL = `/api/storage/uploads/direct/${filename}`;

  logger.info({ name, size, contentType, objectPath }, "Generated presigned storage upload ticket");

  res.json({
    uploadURL,
    objectPath,
    metadata: {
      name,
      size: Number(size) || 0,
      contentType: contentType || "image/jpeg",
    },
    humanVerificationRequired: false,
    generatedAt: new Date().toISOString(),
  });
});

// 2. Direct binary upload endpoint that saves to persistent storage
router.put("/storage/uploads/direct/:filename", (req: Request, res: Response): void => {
  const filename = String(req.params.filename || "upload.bin");
  const safeFilename = path.basename(filename);
  const targetPath = path.join(UPLOADS_DIR, safeFilename);

  const writeStream = fs.createWriteStream(targetPath);
  req.pipe(writeStream);

  writeStream.on("finish", () => {
    logger.info({ filename: safeFilename, targetPath }, "Binary media successfully written to persistent disk");
    res.status(200).json({ success: true, objectPath: `/uploads/${safeFilename}` });
  });

  writeStream.on("error", (err) => {
    logger.error({ err, filename: safeFilename }, "Error writing media file to disk");
    res.status(500).json({ error: "Failed to persist file" });
  });
});

export default router;
