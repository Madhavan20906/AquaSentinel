import { jsonb, pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const alertsTable = pgTable("alerts", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull(),
  siteName: text("site_name").notNull(),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  risk: integer("risk").notNull(),
  confidence: integer("confidence").notNull(),
  status: text("status").notNull(),
  trigger: text("trigger").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  description: text("description").notNull(),
  evidence: jsonb("evidence").notNull(),
  assessment: jsonb("assessment").notNull(),
  reviewHistory: jsonb("review_history").notNull(),
});

export type AlertRow = typeof alertsTable.$inferSelect;