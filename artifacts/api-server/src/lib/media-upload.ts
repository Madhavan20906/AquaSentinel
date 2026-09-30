import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { logger } from "./logger";

const UPLOADS_DIR = path.resolve(process.cwd(), "public", "uploads");

// Ensure upload directory exists
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (err) {
  logger.error({ err }, "Failed to create uploads directory");
}

export interface SaveMediaResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export function saveMediaFile(
  base64Data: string,
  originalFilename: string,
  mimeType: string
): SaveMediaResult {
  // Validate MIME type
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const safeMime = allowedMimes.includes(mimeType) ? mimeType : "image/jpeg";
  const ext = safeMime.split("/")[1] || "jpg";

  // Strip possible base64 data URL prefix
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");

  const id = crypto.randomUUID();
  const filename = `${id}.${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);

  fs.writeFileSync(filepath, buffer);
  logger.info({ filename, size: buffer.length }, "Persisted observation media file to storage");

  return {
    url: `/uploads/${filename}`,
    filename,
    size: buffer.length,
    mimeType: safeMime,
    createdAt: new Date().toISOString(),
  };
}
