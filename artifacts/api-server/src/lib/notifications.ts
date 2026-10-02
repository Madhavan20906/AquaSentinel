import { logger } from "./logger";

export interface AlertNotificationPayload {
  alertId: string;
  siteId: string;
  siteName: string;
  severity: "critical" | "emerging" | "watch" | "stable";
  summary: string;
  recipientPhone?: string;
  recipientEmail?: string;
}

export interface NotificationResult {
  channel: "sms" | "email" | "webhook" | "mock";
  status: "delivered" | "simulated" | "failed";
  timestamp: string;
  details: string;
}

// In-memory record of dispatched notifications for UI review and auditing
export const notificationHistory: NotificationResult[] = [];

export async function dispatchAlertNotifications(
  payload: AlertNotificationPayload
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];
  const now = new Date().toISOString();

  // 1. SMS Dispatch via Twilio if env vars are configured
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;
  const targetPhone = payload.recipientPhone || process.env.ALERT_RECIPIENT_PHONE;

  if (twilioSid && twilioToken && twilioFrom && targetPhone) {
    try {
      const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const body = new URLSearchParams({
        To: targetPhone,
        From: twilioFrom,
        Body: `[AquaSentinel ALERT - ${payload.severity.toUpperCase()}] ${payload.siteName}: ${payload.summary}`,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }
      );

      if (response.ok) {
        results.push({
          channel: "sms",
          status: "delivered",
          timestamp: now,
          details: `Twilio SMS delivered to ${targetPhone}`,
        });
      } else {
        const errorText = await response.text();
        results.push({
          channel: "sms",
          status: "failed",
          timestamp: now,
          details: `Twilio returned HTTP ${response.status}: ${errorText}`,
        });
      }
    } catch (err: any) {
      results.push({
        channel: "sms",
        status: "failed",
        timestamp: now,
        details: `Twilio request failed: ${err.message}`,
      });
    }
  } else {
    // Record mock SMS dispatch with diagnostic setup guidance
    const mockResult: NotificationResult = {
      channel: "mock",
      status: "simulated",
      timestamp: now,
      details: `[SMS Mock Dispatch] To: ${targetPhone || "+1-555-0199"} | Severity: ${payload.severity.toUpperCase()} | Message: "${payload.siteName}: ${payload.summary}" (Provide TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN to enable real SMS)`,
    };
    results.push(mockResult);
    logger.info(mockResult, "SMS notification dispatched (development fallback)");
  }

  // 2. Email Dispatch via Resend / Webhook if configured
  const resendApiKey = process.env.RESEND_API_KEY;
  const targetEmail = payload.recipientEmail || process.env.ALERT_RECIPIENT_EMAIL || "officer@watershed.gov";

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "alerts@aquasentinel.io",
          to: [targetEmail],
          subject: `[AquaSentinel ALERT: ${payload.severity.toUpperCase()}] ${payload.siteName}`,
          html: `<h2>Environmental Alert: ${payload.severity.toUpperCase()}</h2>
                 <p><strong>Site:</strong> ${payload.siteName} (${payload.siteId})</p>
                 <p><strong>Summary:</strong> ${payload.summary}</p>
                 <p><strong>Timestamp:</strong> ${now}</p>`,
        }),
      });

      if (response.ok) {
        results.push({
          channel: "email",
          status: "delivered",
          timestamp: now,
          details: `Resend Email delivered to ${targetEmail}`,
        });
      } else {
        results.push({
          channel: "email",
          status: "failed",
          timestamp: now,
          details: `Resend HTTP error ${response.status}`,
        });
      }
    } catch (err: any) {
      results.push({
        channel: "email",
        status: "failed",
        timestamp: now,
        details: `Resend error: ${err.message}`,
      });
    }
  } else {
    const mockEmailResult: NotificationResult = {
      channel: "mock",
      status: "simulated",
      timestamp: now,
      details: `[Email Mock Dispatch] To: ${targetEmail} | Subject: [AquaSentinel: ${payload.severity}] ${payload.siteName} (Provide RESEND_API_KEY to enable real Email delivery)`,
    };
    results.push(mockEmailResult);
    logger.info(mockEmailResult, "Email notification dispatched (development fallback)");
  }

  // 3. Webhook Dispatch if configured
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "alert_notification", payload, timestamp: now }),
      });
      results.push({
        channel: "webhook",
        status: "delivered",
        timestamp: now,
        details: `Webhook sent to ${webhookUrl}`,
      });
    } catch (err: any) {
      results.push({
        channel: "webhook",
        status: "failed",
        timestamp: now,
        details: `Webhook error: ${err.message}`,
      });
    }
  }

  notificationHistory.unshift(...results);
  return results;
}
