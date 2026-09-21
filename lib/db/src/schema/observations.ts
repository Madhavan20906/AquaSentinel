import { jsonb, pgTable, text, real, integer, timestamp } from "drizzle-orm/pg-core";

export const observationsTable = pgTable("observations", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull(),
  siteName: text("site_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  source: text("source").notNull(),
  validationStatus: text("validation_status").notNull(),
  qualityScore: integer("quality_score").notNull(),
  aiConfidence: integer("ai_confidence").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  responses: jsonb("responses").notNull(),
  imageAnalysis: jsonb("image_analysis").notNull(),
});

export type ObservationRow = typeof observationsTable.$inferSelect;