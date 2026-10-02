import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  actorId: text("actor_id").notNull(),
  actorRole: text("actor_role").notNull(),
  action: text("action").notNull(), // 'alert_verified' | 'alert_dismissed' | 'alert_escalated' | 'observation_submitted' | 'mission_completed'
  targetType: text("target_type").notNull(), // 'alert' | 'observation' | 'mission' | 'site'
  targetId: text("target_id").notNull(),
  details: jsonb("details").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export type AuditLogRow = typeof auditLogsTable.$inferSelect;
export type InsertAuditLog = typeof auditLogsTable.$inferInsert;
