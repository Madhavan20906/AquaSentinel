import { jsonb, pgTable, text, real, integer, timestamp } from "drizzle-orm/pg-core";

export const sitesTable = pgTable("sites", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  waterBody: text("water_body").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default("India"),
  region: text("region").notNull().default("Asia-Pacific"),
  status: text("status").notNull(),
  risk: integer("risk").notNull(),
  confidence: integer("confidence").notNull(),
  resilience: integer("resilience").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  lastUpdated: text("last_updated").notNull(),
  simulated: integer("simulated").notNull().default(1),
  description: text("description").notNull(),
  metrics: jsonb("metrics").notNull(),
  timeline: jsonb("timeline").notNull(),
  actions: jsonb("actions").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SiteRow = typeof sitesTable.$inferSelect;