import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, alertsTable, missionsTable, observationsTable, sitesTable, auditLogsTable } from "@workspace/db";
import { fetchLiveWeather } from "../lib/weather-service";
import { dispatchAlertNotifications, notificationHistory } from "../lib/notifications";
import { saveMediaFile } from "../lib/media-upload";
import {
  AnalyzeObservationParams,
  AnalyzeObservationResponse,
  AnalyzeRiskBody,
  AnalyzeRiskResponse,
  CompleteMissionBody,
  CompleteMissionParams,
  CompleteMissionResponse,
  CreateMissionBody,
  CreateMissionResponse,
  CreateObservationBody,
  CreateObservationResponse,
  GetAlertParams,
  GetAlertResponse,
  GetDashboardResponse,
  GetObservationParams,
  GetObservationResponse,
  GetSiteMetricsParams,
  GetSiteMetricsResponse,
  GetSiteParams,
  GetSiteResponse,
  GetSiteRiskParams,
  GetSiteRiskResponse,
  GetSiteTimelineParams,
  GetSiteTimelineResponse,
  ListAlertsQueryParams,
  ListAlertsResponse,
  ListFhirObservationsResponse,
  ListFhirRiskAssessmentsResponse,
  ListMissionsResponse,
  ListObservationsQueryParams,
  ListObservationsResponse,
  ListSitesQueryParams,
  ListSitesResponse,
  ReviewAlertBody,
  ReviewAlertParams,
  ReviewAlertResponse,
} from "@workspace/api-zod";
import {
  createId,
  defaultRiskAssessment,
  ensureDemoData,
  getLatestAlert,
  getSiteById,
  mapAlert,
  mapMission,
  mapObservation,
  mapSite,
} from "../lib/aquasentinel-data";

const router: IRouter = Router();

const asRecord = (value: unknown): Record<string, unknown> => (value && typeof value === "object" ? value as Record<string, unknown> : {});

router.get("/dashboard", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const sites = await db.select().from(sitesTable);
  const alerts = await db.select().from(alertsTable);
  const observations = await db.select().from(observationsTable);
  const latest = await getLatestAlert();
  const summary = {
    activeSites: sites.length,
    statusCounts: {
      stable: sites.filter((site) => site.status === "stable").length,
      watch: sites.filter((site) => site.status === "watch").length,
      emerging: sites.filter((site) => site.status === "emerging").length,
      critical: sites.filter((site) => site.status === "critical").length,
    },
    observationsToday: observations.length,
    anomalies: alerts.length,
    pendingReviews: alerts.filter((alert) => ["new", "under_review"].includes(alert.status)).length,
    verifiedAlerts: alerts.filter((alert) => alert.status === "verified").length,
    activeInvestigations: alerts.filter((alert) => ["verified", "escalated"].includes(alert.status)).length,
    averageResponseHours: 3.4,
    latestAlert: latest ? mapAlert(latest) : null,
    coverage: {
      regions: new Set(sites.map((site) => site.region)).size,
      countries: new Set(sites.map((site) => site.country)).size,
      cities: new Set(sites.map((site) => site.city)).size,
      simulatedSites: sites.filter((site) => site.simulated === 1).length,
    },
  };
  res.json(GetDashboardResponse.parse(summary));
});

router.get("/sites", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = ListSitesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, search, country, region } = parsed.data;
  const filters = [];
  if (status) filters.push(eq(sitesTable.status, status));
  if (country) filters.push(eq(sitesTable.country, country));
  if (region) filters.push(eq(sitesTable.region, region));
  if (search) {
    filters.push(
      or(
        ilike(sitesTable.name, `%${search}%`),
        ilike(sitesTable.city, `%${search}%`),
        ilike(sitesTable.country, `%${search}%`),
        ilike(sitesTable.region, `%${search}%`),
      ),
    );
  }
  const rows = filters.length > 0 ? await db.select().from(sitesTable).where(and(...filters)) : await db.select().from(sitesTable);
  res.json(ListSitesResponse.parse(rows.map(mapSite)));
});

router.get("/sites/:siteId", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = GetSiteParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const site = await getSiteById(parsed.data.siteId);
  if (!site) {
    res.status(404).json({ error: "Site not found" });
    return;
  }
  const observations = await db.select().from(observationsTable).where(eq(observationsTable.siteId, site.id)).orderBy(desc(observationsTable.createdAt)).limit(8);
  const detail = {
    ...mapSite(site),
    description: site.description,
    currentMetrics: site.metrics,
    riskAssessment: defaultRiskAssessment(site.id, site.risk, site.confidence),
    observations: observations.map(mapObservation),
    timeline: site.timeline,
    actions: site.actions,
  };
  res.json(GetSiteResponse.parse(detail));
});

router.get("/sites/:siteId/metrics", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = GetSiteMetricsParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const site = await getSiteById(parsed.data.siteId);
  if (!site) {
    res.status(404).json({ error: "Site not found" });
    return;
  }
  res.json(GetSiteMetricsResponse.parse(site.metrics));
});

router.get("/sites/:siteId/timeline", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = GetSiteTimelineParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const site = await getSiteById(parsed.data.siteId);
  if (!site) {
    res.status(404).json({ error: "Site not found" });
    return;
  }
  res.json(GetSiteTimelineResponse.parse(site.timeline));
});

router.get("/observations", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = ListObservationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { siteId, limit } = parsed.data;
  const rows = siteId
    ? await db.select().from(observationsTable).where(eq(observationsTable.siteId, siteId)).orderBy(desc(observationsTable.createdAt)).limit(limit)
    : await db.select().from(observationsTable).orderBy(desc(observationsTable.createdAt)).limit(limit);
  res.json(ListObservationsResponse.parse(rows.map(mapObservation)));
});

router.post("/observations", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = CreateObservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const site = await getSiteById(parsed.data.siteId);
  if (!site) {
    res.status(404).json({ error: "Site not found" });
    return;
  }
  const id = createId("obs");
  const qualityScore = parsed.data.imageName ? 91 : 82;
  const aiConfidence = parsed.data.visiblePollution === "No" && parsed.data.waterAppearance === "Clear" ? 74 : 84;
  const observation = {
    id,
    siteId: site.id,
    siteName: site.name,
    source: "Citizen scientist",
    validationStatus: "validated",
    qualityScore,
    aiConfidence,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    responses: {
      waterAppearance: parsed.data.waterAppearance,
      unusualSmell: parsed.data.unusualSmell,
      visiblePollution: parsed.data.visiblePollution,
      notes: parsed.data.notes ?? "",
    },
    imageAnalysis: {
      summary: "AI-assisted visual indicator review complete. This is contextual evidence, not scientifically confirmed pollution.",
      indicators: [
        { label: parsed.data.visiblePollution === "No" ? "Normal water appearance" : "Visible surface indicator", confidence: aiConfidence },
        { label: parsed.data.waterAppearance === "Clear" ? "Clear appearance" : "Sediment/turbidity appearance", confidence: Math.max(52, aiConfidence - 8) },
      ],
    },
    createdAt: new Date(),
  };
  const [created] = await db.insert(observationsTable).values(observation).returning();

  try {
    await db.insert(auditLogsTable).values({
      id: createId("audit"),
      actorId: req.authContext?.userId || "citizen_user",
      actorRole: req.authContext?.role || "Citizen scientist",
      action: "observation_submitted",
      targetType: "observation",
      targetId: created.id,
      details: {
        siteId: site.id,
        siteName: site.name,
        waterAppearance: parsed.data.waterAppearance,
        aiConfidence,
        hasPhoto: Boolean(parsed.data.imageName),
      },
      ipAddress: req.ip || "127.0.0.1",
      userAgent: (req.headers["user-agent"] as string) || "unknown",
    });
  } catch (err) {
    // Non-blocking audit error
  }

  res.status(201).json(CreateObservationResponse.parse(mapObservation(created)));
});

router.get("/observations/:observationId", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = GetObservationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [observation] = await db.select().from(observationsTable).where(eq(observationsTable.id, parsed.data.observationId));
  if (!observation) {
    res.status(404).json({ error: "Observation not found" });
    return;
  }
  res.json(GetObservationResponse.parse(mapObservation(observation)));
});

router.post("/observations/:observationId/analyze", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = AnalyzeObservationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [observation] = await db.update(observationsTable).set({ validationStatus: "validated", aiConfidence: 86 }).where(eq(observationsTable.id, parsed.data.observationId)).returning();
  if (!observation) {
    res.status(404).json({ error: "Observation not found" });
    return;
  }
  res.json(AnalyzeObservationResponse.parse(mapObservation(observation)));
});

router.get("/alerts", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = ListAlertsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rows = parsed.data.status
    ? await db.select().from(alertsTable).where(eq(alertsTable.status, parsed.data.status)).orderBy(desc(alertsTable.createdAt))
    : await db.select().from(alertsTable).orderBy(desc(alertsTable.createdAt));
  res.json(ListAlertsResponse.parse(rows.map(mapAlert)));
});

router.get("/alerts/:alertId", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = GetAlertParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [alert] = await db.select().from(alertsTable).where(eq(alertsTable.id, parsed.data.alertId));
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(GetAlertResponse.parse({ ...mapAlert(alert), description: alert.description, evidence: alert.evidence, assessment: alert.assessment, reviewHistory: alert.reviewHistory }));
});

router.post("/alerts/:alertId/review", async (req, res): Promise<void> => {
  await ensureDemoData();
  const params = ReviewAlertParams.safeParse(req.params);
  const body = ReviewAlertBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [alert] = await db.select().from(alertsTable).where(eq(alertsTable.id, params.data.alertId));
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  const statusByDecision = {
    verify: "verified",
    request_evidence: "under_review",
    dismiss: "dismissed",
    escalate: "escalated",
    monitor: "monitoring",
  } as const;
  const nextStatus = statusByDecision[body.data.decision];
  const review = {
    id: createId("review"),
    action: body.data.decision,
    actor: "Demo environmental officer",
    timestamp: new Date().toISOString(),
    note: body.data.note ?? "",
  };
  const history = [...(alert.reviewHistory as unknown[]), review];
  const [updated] = await db.update(alertsTable).set({ status: nextStatus, reviewHistory: history }).where(eq(alertsTable.id, alert.id)).returning();

  try {
    await db.insert(auditLogsTable).values({
      id: createId("audit"),
      actorId: req.authContext?.userId || "officer_user",
      actorRole: req.authContext?.role || "Environmental officer",
      action: `alert_${body.data.decision}`,
      targetType: "alert",
      targetId: alert.id,
      details: {
        siteId: alert.siteId,
        siteName: alert.siteName,
        decision: body.data.decision,
        note: body.data.note ?? "",
        previousStatus: alert.status,
        nextStatus,
      },
      ipAddress: req.ip || "127.0.0.1",
      userAgent: (req.headers["user-agent"] as string) || "unknown",
    });

    if (body.data.decision === "verify" || body.data.decision === "escalate") {
      await dispatchAlertNotifications({
        alertId: alert.id,
        siteId: alert.siteId,
        siteName: alert.siteName,
        severity: alert.severity as any,
        summary: `${alert.title} [Status: ${nextStatus.toUpperCase()}]${body.data.note ? ` - Note: ${body.data.note}` : ""}`,
      });
    }
  } catch (err) {
    // Non-blocking notification/audit error
  }

  let mission = null;
  if (body.data.decision === "request_evidence") {
    const [createdMission] = await db.insert(missionsTable).values({
      id: createId("mission"),
      siteId: alert.siteId,
      siteName: alert.siteName,
      alertId: alert.id,
      title: "Verify stream condition",
      reason: "AquaSentinel detected an unusual environmental pattern and needs additional community evidence.",
      instructions: ["Visit the marked location.", "Photograph the water.", "Answer four simple questions.", "Submit your observation."],
      estimatedMinutes: 3,
      status: "available",
      createdAt: new Date(),
    }).returning();
    mission = mapMission(createdMission);
  }
  const response = {
    alert: mapAlert(updated),
    mission,
    investigationCreated: body.data.decision === "verify" || body.data.decision === "escalate",
    responsePlan: [
      { id: "act-1", phase: "immediate", label: "Verify field conditions", completed: false },
      { id: "act-2", phase: "immediate", label: "Collect a water sample", completed: false },
      { id: "act-3", phase: "short_term", label: "Compare upstream/downstream measurements", completed: false },
      { id: "act-4", phase: "long_term", label: "Review resilience indicators", completed: false },
    ],
  };
  res.json(ReviewAlertResponse.parse(response));
});

router.get("/missions", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const rows = await db.select().from(missionsTable).orderBy(desc(missionsTable.createdAt));
  res.json(ListMissionsResponse.parse(rows.map(mapMission)));
});

router.post("/missions", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = CreateMissionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const site = await getSiteById(parsed.data.siteId);
  if (!site) {
    res.status(404).json({ error: "Site not found" });
    return;
  }
  const [created] = await db.insert(missionsTable).values({
    id: createId("mission"),
    siteId: site.id,
    siteName: site.name,
    alertId: parsed.data.alertId,
    title: "Verify stream condition",
    reason: "Additional evidence was requested by a human reviewer.",
    instructions: ["Visit the marked location.", "Photograph the water.", "Answer four simple questions.", "Submit your observation."],
    estimatedMinutes: 3,
    status: "available",
    createdAt: new Date(),
  }).returning();
  res.status(201).json(CreateMissionResponse.parse(mapMission(created)));
});

router.post("/missions/:missionId/complete", async (req, res): Promise<void> => {
  await ensureDemoData();
  const params = CompleteMissionParams.safeParse(req.params);
  const body = CompleteMissionBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [updated] = await db.update(missionsTable).set({ status: "completed" }).where(eq(missionsTable.id, params.data.missionId)).returning();
  if (!updated) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }
  res.json(CompleteMissionResponse.parse(mapMission(updated)));
});

router.get("/risk/:siteId", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = GetSiteRiskParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const site = await getSiteById(parsed.data.siteId);
  if (!site) {
    res.status(404).json({ error: "Site not found" });
    return;
  }
  res.json(GetSiteRiskResponse.parse(defaultRiskAssessment(site.id, site.risk, site.confidence)));
});

router.post("/risk/analyze", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = AnalyzeRiskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const site = await getSiteById(parsed.data.siteId);
  if (!site) {
    res.status(404).json({ error: "Site not found" });
    return;
  }
  res.json(AnalyzeRiskResponse.parse(defaultRiskAssessment(site.id, site.risk, site.confidence)));
});

router.get("/fhir/Observation", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const observations = await db.select().from(observationsTable).orderBy(desc(observationsTable.createdAt));
  const resources = observations.map((observation) => {
    const responses = asRecord(observation.responses);
    return {
      resourceType: "Observation" as const,
      id: observation.id,
      status: "final",
      code: "environmental-observation",
      subject: "citizen-scientist",
      effectiveDateTime: observation.createdAt.toISOString(),
      value: observation.aiConfidence,
      unit: "confidence-score",
      location: observation.siteId,
      interpretation: String(responses.waterAppearance ?? "unclassified"),
    };
  });
  res.json(ListFhirObservationsResponse.parse(resources));
});

router.get("/fhir/RiskAssessment", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const sites = await db.select().from(sitesTable);
  const resources = sites.map((site) => ({
    resourceType: "RiskAssessment" as const,
    id: `risk-${site.id}`,
    status: "preliminary",
    subject: site.id,
    occurrenceDateTime: site.lastUpdated,
    prediction: {
      outcome: "Potential environmental ecosystem stress",
      probability: site.risk / 100,
      qualitativeRisk: site.status,
    },
    basis: ["Environmental anomaly", "Citizen evidence", "Weather context", "Biodiversity signal"],
  }));
  res.json(ListFhirRiskAssessmentsResponse.parse(resources));
});

// 1. Real Weather API (Open-Meteo Integration)
router.get("/sites/:siteId/live-weather", async (req, res): Promise<void> => {
  await ensureDemoData();
  const site = await getSiteById(req.params.siteId);
  if (!site) {
    res.status(404).json({ error: "Site not found" });
    return;
  }
  const liveWeather = await fetchLiveWeather(site.latitude, site.longitude);
  res.json({
    siteId: site.id,
    siteName: site.name,
    coordinates: { latitude: site.latitude, longitude: site.longitude },
    weather: liveWeather || {
      temperature: 28.5,
      humidity: 72,
      precipitation: 0,
      rain: 0,
      windSpeed: 12,
      weatherCode: 0,
      timestamp: new Date().toISOString(),
      source: "Open-Meteo Fallback Model",
      simulated: true,
    },
  });
});

// 2. Full Audit Log Query
router.get("/audit-logs", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const logs = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.timestamp)).limit(50);
  res.json(logs);
});

// 3. Media Upload Endpoint (Base64 file receiver)
router.post("/upload", async (req, res): Promise<void> => {
  try {
    const { base64, filename, mimeType } = req.body;
    if (!base64) {
      res.status(400).json({ error: "Missing base64 media data" });
      return;
    }
    const result = saveMediaFile(base64, filename || "observation.jpg", mimeType || "image/jpeg");
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: `Upload failed: ${err.message}` });
  }
});

// 4. Alert Notification Dispatch (Twilio SMS / Email / Webhook / Mock)
router.post("/alerts/:alertId/notify", async (req, res): Promise<void> => {
  await ensureDemoData();
  const [alert] = await db.select().from(alertsTable).where(eq(alertsTable.id, req.params.alertId));
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  const results = await dispatchAlertNotifications({
    alertId: alert.id,
    siteId: alert.siteId,
    siteName: alert.siteName,
    severity: alert.severity as any,
    summary: alert.title,
    recipientEmail: req.body?.email,
    recipientPhone: req.body?.phone,
  });
  res.json({ success: true, dispatched: results });
});

router.get("/notifications/history", async (_req, res): Promise<void> => {
  res.json(notificationHistory);
});

// 5. FHIR Capability Statement
router.get("/fhir/metadata", async (_req, res): Promise<void> => {
  res.json({
    resourceType: "CapabilityStatement",
    status: "active",
    date: new Date().toISOString(),
    publisher: "AquaSentinel Environmental Intelligence Network",
    kind: "capability",
    software: {
      name: "AquaSentinel Municipal Watershed Interoperability Engine",
      version: "1.0.0",
    },
    fhirVersion: "4.0.1",
    format: ["json"],
    rest: [
      {
        mode: "server",
        resource: [
          {
            type: "Observation",
            interaction: [{ code: "read" }, { code: "search-type" }],
          },
          {
            type: "RiskAssessment",
            interaction: [{ code: "read" }, { code: "search-type" }],
          },
        ],
      },
    ],
  });
});

export default router;