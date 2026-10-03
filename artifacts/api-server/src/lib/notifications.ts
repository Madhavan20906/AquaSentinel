import { logger } from "./logger";

export interface AlertNotificationPayload {
  alertId: string;
  siteId: string;
  siteName: string;
  severity: "critical" | "emerging" | "watch" | "stable";
  summary: string;
  recipientPhone?: string;
  recipientEmail?: string;
  telegramChatId?: string;
}

export interface NotificationResult {
  channel: "sms" | "email" | "telegram" | "webhook" | "mock";
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

  // 1. Telegram Dispatch
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = payload.telegramChatId || process.env.TELEGRAM_CHAT_ID;

  if (telegramBotToken && telegramChatId) {
    try {
      const tgText = `🚨 *AquaSentinel Alert Escalation*\n\n*Site:* ${payload.siteName} (\`${payload.siteId}\`)\n*Severity:* ${payload.severity.toUpperCase()}\n*Summary:* ${payload.summary}\n*Timestamp:* ${now}\n\n_Verified by Watershed Environmental Officer_`;
      const tgRes = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: tgText,
          parse_mode: "Markdown",
        }),
      });

      if (tgRes.ok) {
        results.push({
          channel: "telegram",
          status: "delivered",
          timestamp: now,
          details: `Telegram alert delivered to chat ${telegramChatId}`,
        });
      } else {
        const errorText = await tgRes.text();
        results.push({
          channel: "telegram",
          status: "failed",
          timestamp: now,
          details: `Telegram API error: ${errorText}`,
        });
      }
    } catch (err: any) {
      results.push({
        channel: "telegram",
        status: "failed",
        timestamp: now,
        details: `Telegram request failed: ${err.message}`,
      });
    }
  } else {
    results.push({
      channel: "telegram",
      status: "simulated",
      timestamp: now,
      details: `[Telegram Dispatch] Chat: ${telegramChatId || "@aquasentinel_alerts"} | Alert: [${payload.severity.toUpperCase()}] ${payload.siteName}: ${payload.summary} (Set TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID for live delivery)`,
    });
  }

  // 2. Email Dispatch via Resend
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
    results.push({
      channel: "email",
      status: "simulated",
      timestamp: now,
      details: `[Email Dispatch] To: ${targetEmail} | Subject: [AquaSentinel: ${payload.severity}] ${payload.siteName} (Provide RESEND_API_KEY for live Email)`,
    });
  }

  // 3. SMS Dispatch via Twilio
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
    results.push({
      channel: "sms",
      status: "simulated",
      timestamp: now,
      details: `[SMS Dispatch] To: ${targetPhone || "+1-555-0199"} | Message: "${payload.siteName}: ${payload.summary}" (Provide TWILIO credentials for live SMS)`,
    });
  }

  // 4. Webhook Dispatch if configured
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
  logger.info({ alertId: payload.alertId, channelCount: results.length }, "Dispatched alert notifications across active channels");
  return results;
}
