import { jsonb, pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const missionsTable = pgTable("missions", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull(),
  siteName: text("site_name").notNull(),
  alertId: text("alert_id").notNull(),
  title: text("title").notNull(),
  reason: text("reason").notNull(),
  instructions: jsonb("instructions").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MissionRow = typeof missionsTable.$inferSelect;