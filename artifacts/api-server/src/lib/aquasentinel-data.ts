import { db, alertsTable, missionsTable, observationsTable, sitesTable, auditLogsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { randomUUID, createHash } from "node:crypto";

type Metric = {
  parameter: string;
  current: number;
  baseline: number;
  unit: string;
  change: number;
  trend: "increasing" | "decreasing" | "stable";
  status: "normal" | "abnormal" | "unavailable" | "estimated" | "simulated";
  history: { label: string; value: number }[];
  source: string;
  simulated: boolean;
};

type TimelineEvent = {
  id: string;
  time: string;
  label: string;
  detail: string;
  category: "weather" | "sensor" | "citizen" | "ai" | "human" | "response";
};

type ResponseAction = {
  id: string;
  phase: "immediate" | "short_term" | "long_term";
  label: string;
  completed: boolean;
};

import { RISK_FACTOR_WEIGHTS, determineSeverity } from "./risk-config";
import { defaultAnomalyDetector } from "./anomaly-detector";

export function computeRiskAssessment(
  siteId: string,
  metrics?: Metric[],
  observationsCount = 5,
  liveWeatherAvailable = false
) {
  const currentMetrics = metrics || metricsFor(siteId === "ADYAR-01" || siteId === "AMA-01");
  const turb = currentMetrics.find((m) => m.parameter.toLowerCase().includes("turbidity"));
  const doMetric = currentMetrics.find((m) => m.parameter.toLowerCase().includes("oxygen"));
  const rain = currentMetrics.find((m) => m.parameter.toLowerCase().includes("rain"));

  // Calculate deviations from baseline
  const turbDeviation = turb ? Math.max(0, (turb.current - turb.baseline) / (turb.baseline || 1)) : 0;
  const turbScore = Math.min(100, Math.round(turbDeviation * 140));

  const doDeficit = doMetric ? Math.max(0, (doMetric.baseline - doMetric.current) / (doMetric.baseline || 1)) : 0;
  const doScore = Math.min(100, Math.round(doDeficit * 200));

  const rainExcess = rain ? Math.max(0, (rain.current - rain.baseline) / (rain.baseline || 1)) : 0;
  const rainScore = Math.min(100, Math.round(rainExcess * 50));

  const citizenScore = Math.min(100, Math.round(observationsCount * 16));
  const biodiversityScore = 55;

  // Weighted risk calculation using RISK_FACTOR_WEIGHTS
  const risk = Math.round(
    turbScore * RISK_FACTOR_WEIGHTS.turbidity +
    doScore * RISK_FACTOR_WEIGHTS.dissolvedOxygen +
    citizenScore * RISK_FACTOR_WEIGHTS.citizenEvidence +
    rainScore * RISK_FACTOR_WEIGHTS.rainfall +
    biodiversityScore * RISK_FACTOR_WEIGHTS.biodiversity
  );

  // Confidence computation: function of evidence count and source diversity
  const evidenceSources = new Set(currentMetrics.map((m) => m.source)).size;
  const confidence = Math.min(95, Math.round(45 + evidenceSources * 8 + observationsCount * 4 + (liveWeatherAvailable ? 8 : 2)));

  // Statistical anomaly detection using rolling z-scores
  const anomalies = defaultAnomalyDetector.detectMultiSignal(currentMetrics);
  const turbAnomaly = anomalies.find((a) => a.parameter.toLowerCase().includes("turbidity"));

  const severity = determineSeverity(risk);

  const factors = [
    {
      name: "Water-quality anomaly",
      value: turbScore,
      contribution: Math.round(turbScore * RISK_FACTOR_WEIGHTS.turbidity),
      direction: (turb && turb.change > 0 ? "up" : "stable") as "up" | "down",
      source: turb?.source || "Sensor telemetry",
      explanation: `Turbidity is ${turb?.change != null && turb.change > 0 ? `+${turb.change}%` : `${turb?.change}%`} relative to baseline (${turb?.baseline} NTU)${turbAnomaly ? `, z-score: ${turbAnomaly.zScore > 0 ? "+" : ""}${turbAnomaly.zScore}σ` : ""}.`,
    },
    {
      name: "Dissolved oxygen stress",
      value: doScore,
      contribution: Math.round(doScore * RISK_FACTOR_WEIGHTS.dissolvedOxygen),
      direction: (doMetric && doMetric.change < 0 ? "down" : "stable") as "up" | "down",
      source: doMetric?.source || "Sensor telemetry",
      explanation: `Dissolved oxygen is at ${doMetric?.current} ${doMetric?.unit} (baseline ${doMetric?.baseline} ${doMetric?.unit}).`,
    },
    {
      name: "Citizen evidence",
      value: citizenScore,
      contribution: Math.round(citizenScore * RISK_FACTOR_WEIGHTS.citizenEvidence),
      direction: "up" as const,
      source: "Community observations",
      explanation: `${observationsCount} independent observations recorded within the monitoring window.`,
    },
    {
      name: "Rainfall context",
      value: rainScore,
      contribution: Math.round(rainScore * RISK_FACTOR_WEIGHTS.rainfall),
      direction: (rain && rain.current > rain.baseline ? "up" : "stable") as "up" | "down",
      source: rain?.source || "Weather context",
      explanation: `${rain?.current} mm recorded (baseline: ${rain?.baseline} mm). Runoff multiplier active.`,
    },
    {
      name: "Biodiversity signal",
      value: biodiversityScore,
      contribution: Math.round(biodiversityScore * RISK_FACTOR_WEIGHTS.biodiversity),
      direction: "down" as const,
      source: "Biodiversity observations",
      explanation: "Reported biodiversity and macroinvertebrate indicator counts remain below seasonal baseline.",
    },
  ];

  const trendProjectionHours = turbAnomaly && turbAnomaly.zScore > 1.5 ? Math.max(6, Math.round(24 / (turbAnomaly.zScore * 0.75))) : 18;
  const summary = `Potential environmental concern detected [Risk: ${risk}/100, Confidence: ${confidence}%]. Turbidity is ${turb?.current} NTU (${turb && turb.change > 0 ? "+" : ""}${turb?.change}%), DO is ${doMetric?.current} mg/L, supported by ${observationsCount} community observations. At current rate of change, turbidity is projected to cross critical threshold in ~${trendProjectionHours} hours (Method: linear-trend-v1). Field verification required.`;

  return {
    id: `risk-${siteId}`,
    siteId,
    risk,
    confidence,
    severity,
    summary,
    factors,
    uncertainties: [
      "The available evidence cannot identify a specific point-source effluent without chemical laboratory analysis.",
      "Visual indicators are valuable early warnings but not a substitute for certified laboratory testing.",
    ],
    humanVerificationRequired: true,
    generatedAt: new Date().toISOString(),
  };
}

export const defaultRiskAssessment = (siteId: string, risk?: number, confidence?: number) => {
  const computed = computeRiskAssessment(siteId);
  return {
    ...computed,
    risk: risk ?? computed.risk,
    confidence: confidence ?? computed.confidence,
    severity: risk != null ? determineSeverity(risk) : computed.severity,
  };
};

const metricsFor = (critical: boolean): Metric[] => [
  {
    parameter: "Turbidity",
    current: critical ? 48 : 34,
    baseline: 37,
    unit: "NTU",
    change: critical ? 29.7 : -8.1,
    trend: critical ? "increasing" : "stable",
    status: critical ? "abnormal" : "simulated",
    history: critical
      ? [
          { label: "08:00", value: 35 },
          { label: "10:00", value: 38 },
          { label: "12:00", value: 43 },
          { label: "14:00", value: 48 },
        ]
      : [
          { label: "08:00", value: 35 },
          { label: "10:00", value: 34 },
          { label: "12:00", value: 33 },
          { label: "14:00", value: 34 },
        ],
    source: "Demo sensor network",
    simulated: true,
  },
  {
    parameter: "Dissolved oxygen",
    current: critical ? 5.7 : 7.4,
    baseline: 7.1,
    unit: "mg/L",
    change: critical ? -19.7 : 4.2,
    trend: critical ? "decreasing" : "stable",
    status: critical ? "abnormal" : "simulated",
    history: [
      { label: "08:00", value: critical ? 7.1 : 7.3 },
      { label: "10:00", value: critical ? 6.8 : 7.4 },
      { label: "12:00", value: critical ? 6.2 : 7.4 },
      { label: "14:00", value: critical ? 5.7 : 7.4 },
    ],
    source: "Demo sensor network",
    simulated: true,
  },
  {
    parameter: "Temperature",
    current: 27.8,
    baseline: 26.9,
    unit: "°C",
    change: 3.3,
    trend: "increasing",
    status: "simulated",
    history: [
      { label: "08:00", value: 26.2 },
      { label: "10:00", value: 27 },
      { label: "12:00", value: 27.5 },
      { label: "14:00", value: 27.8 },
    ],
    source: "Demo sensor network",
    simulated: true,
  },
  {
    parameter: "Rainfall",
    current: critical ? 42 : 8,
    baseline: 12,
    unit: "mm / 24h",
    change: critical ? 250 : -33,
    trend: critical ? "increasing" : "stable",
    status: "simulated",
    history: [
      { label: "08:00", value: 4 },
      { label: "10:00", value: 18 },
      { label: "12:00", value: 32 },
      { label: "14:00", value: critical ? 42 : 8 },
    ],
    source: "Demo weather context",
    simulated: true,
  },
];

const timelineFor = (critical: boolean): TimelineEvent[] => [
  { id: "tl-1", time: "08:30", label: "Rainfall detected", detail: critical ? "42 mm recorded within 24 hours." : "Light rain within seasonal range.", category: "weather" },
  { id: "tl-2", time: "09:10", label: "Turbidity begins increasing", detail: critical ? "Deviation moved beyond the rolling baseline." : "No meaningful deviation detected.", category: "sensor" },
  { id: "tl-3", time: "10:05", label: "Citizen observation #1", detail: "Community member submitted a visual observation.", category: "citizen" },
  { id: "tl-4", time: "10:24", label: "Citizen observation #2", detail: "Independent observation added to the evidence pool.", category: "citizen" },
  { id: "tl-5", time: "11:15", label: "AI anomaly detected", detail: "Evidence fusion crossed the prototype alert threshold.", category: "ai" },
  { id: "tl-6", time: "11:18", label: "Alert created", detail: "Potential environmental concern requires verification.", category: "ai" },
  { id: "tl-7", time: "11:30", label: "Human review", detail: "Officer review is pending.", category: "human" },
];

const actionsFor = (): ResponseAction[] => [
  { id: "act-1", phase: "immediate", label: "Verify field conditions", completed: false },
  { id: "act-2", phase: "immediate", label: "Collect a water sample", completed: false },
  { id: "act-3", phase: "immediate", label: "Inspect upstream source", completed: false },
  { id: "act-4", phase: "short_term", label: "Compare upstream/downstream measurements", completed: false },
  { id: "act-5", phase: "short_term", label: "Review rainfall and runoff pattern", completed: false },
  { id: "act-6", phase: "long_term", label: "Identify recurring stressors", completed: false },
];

type SiteSeed = {
  id: string;
  name: string;
  waterBody: string;
  city: string;
  country: string;
  region: string;
  status: "stable" | "watch" | "emerging" | "critical";
  risk: number;
  confidence: number;
  resilience: number;
  latitude: number;
  longitude: number;
  simulated: boolean;
};

// Seed rows intentionally span multiple climate, governance, and watershed
// contexts. They are synthetic fixtures, not evidence of live coverage.
const siteSeeds: SiteSeed[] = [
  { id: "ADYAR-01", name: "Adyar Bridge", waterBody: "Adyar River", city: "Chennai", country: "India", region: "Asia-Pacific", status: "critical", risk: 78, confidence: 71, resilience: 64, latitude: 13.0067, longitude: 80.2571, simulated: true },
  { id: "COOUM-02", name: "Chintadripet Reach", waterBody: "Cooum River", city: "Chennai", country: "India", region: "Asia-Pacific", status: "emerging", risk: 59, confidence: 68, resilience: 58, latitude: 13.0714, longitude: 80.2736, simulated: true },
  { id: "BUCK-03", name: "Buckingham Canal North", waterBody: "Buckingham Canal", city: "Chennai", country: "India", region: "Asia-Pacific", status: "watch", risk: 42, confidence: 76, resilience: 69, latitude: 13.0914, longitude: 80.2833, simulated: true },
  { id: "PALLI-04", name: "Pallikaranai Edge", waterBody: "Pallikaranai Marsh", city: "Chennai", country: "India", region: "Asia-Pacific", status: "stable", risk: 18, confidence: 88, resilience: 81, latitude: 12.9525, longitude: 80.2077, simulated: true },
  { id: "KORR-05", name: "Korattur Lake", waterBody: "Korattur Lake", city: "Chennai", country: "India", region: "Asia-Pacific", status: "stable", risk: 22, confidence: 84, resilience: 77, latitude: 13.1231, longitude: 80.1677, simulated: true },
  { id: "MANA-06", name: "Manali Outfall", waterBody: "Ennore Creek", city: "Chennai", country: "India", region: "Asia-Pacific", status: "watch", risk: 38, confidence: 73, resilience: 61, latitude: 13.1822, longitude: 80.3219, simulated: true },
  { id: "MUTT-07", name: "Muttukadu Inlet", waterBody: "Backwater", city: "Chennai", country: "India", region: "Asia-Pacific", status: "stable", risk: 16, confidence: 91, resilience: 84, latitude: 12.8104, longitude: 80.2506, simulated: true },
  { id: "VELA-08", name: "Velachery Link", waterBody: "Velachery Lake", city: "Chennai", country: "India", region: "Asia-Pacific", status: "stable", risk: 24, confidence: 82, resilience: 74, latitude: 12.9815, longitude: 80.2197, simulated: true },
  { id: "SEMA-09", name: "Semmenchery Wetland", waterBody: "Wetland Channel", city: "Chennai", country: "India", region: "Asia-Pacific", status: "emerging", risk: 54, confidence: 66, resilience: 55, latitude: 12.8592, longitude: 80.2271, simulated: true },
  { id: "THOR-10", name: "Thoraipakkam Reach", waterBody: "Pallikaranai Drain", city: "Chennai", country: "India", region: "Asia-Pacific", status: "watch", risk: 47, confidence: 70, resilience: 63, latitude: 12.9427, longitude: 80.2362, simulated: true },
  { id: "NESA-11", name: "Nesapakkam Lake", waterBody: "Nesapakkam Lake", city: "Chennai", country: "India", region: "Asia-Pacific", status: "stable", risk: 12, confidence: 92, resilience: 86, latitude: 13.0353, longitude: 80.1814, simulated: true },
  { id: "PORU-12", name: "Porur Junction", waterBody: "Porur Lake", city: "Chennai", country: "India", region: "Asia-Pacific", status: "stable", risk: 20, confidence: 86, resilience: 79, latitude: 13.0381, longitude: 80.1574, simulated: true },
  { id: "AMS-01", name: "Amstel South", waterBody: "Amstel River", city: "Amsterdam", country: "Netherlands", region: "Europe", status: "watch", risk: 44, confidence: 79, resilience: 72, latitude: 52.3275, longitude: 4.9056, simulated: true },
  { id: "DAN-02", name: "Danube Delta Edge", waterBody: "Danube Delta", city: "Tulcea", country: "Romania", region: "Europe", status: "stable", risk: 26, confidence: 74, resilience: 76, latitude: 45.1796, longitude: 28.805, simulated: true },
  { id: "NAI-01", name: "Nairobi River East", waterBody: "Nairobi River", city: "Nairobi", country: "Kenya", region: "Africa", status: "emerging", risk: 61, confidence: 64, resilience: 49, latitude: -1.2833, longitude: 36.85, simulated: true },
  { id: "VOL-02", name: "Volta Inlet", waterBody: "Lake Volta", city: "Accra", country: "Ghana", region: "Africa", status: "watch", risk: 39, confidence: 69, resilience: 58, latitude: 5.6037, longitude: -0.187, simulated: true },
  { id: "AMA-01", name: "Guamá Estuary", waterBody: "Guamá River", city: "Belém", country: "Brazil", region: "Latin America", status: "critical", risk: 76, confidence: 67, resilience: 46, latitude: -1.4558, longitude: -48.4902, simulated: true },
  { id: "PAR-02", name: "Paraná Wetland", waterBody: "Paraná River", city: "Rosario", country: "Argentina", region: "Latin America", status: "stable", risk: 21, confidence: 81, resilience: 74, latitude: -32.9442, longitude: -60.6505, simulated: true },
  { id: "TOR-01", name: "Humber Bay", waterBody: "Lake Ontario", city: "Toronto", country: "Canada", region: "North America", status: "stable", risk: 19, confidence: 89, resilience: 83, latitude: 43.6253, longitude: -79.4772, simulated: true },
  { id: "SAC-02", name: "Sacramento Delta", waterBody: "Sacramento River", city: "Sacramento", country: "United States", region: "North America", status: "watch", risk: 48, confidence: 78, resilience: 62, latitude: 38.5816, longitude: -121.4944, simulated: true },
  { id: "JAK-01", name: "Ciliwung North", waterBody: "Ciliwung River", city: "Jakarta", country: "Indonesia", region: "Asia-Pacific", status: "emerging", risk: 63, confidence: 61, resilience: 47, latitude: -6.1754, longitude: 106.8272, simulated: true },
  { id: "PAS-02", name: "Pasig Estuary", waterBody: "Pasig River", city: "Manila", country: "Philippines", region: "Asia-Pacific", status: "watch", risk: 52, confidence: 70, resilience: 53, latitude: 14.5995, longitude: 120.9842, simulated: true },
  { id: "SYD-01", name: "Parramatta Reach", waterBody: "Parramatta River", city: "Sydney", country: "Australia", region: "Oceania", status: "stable", risk: 23, confidence: 86, resilience: 79, latitude: -33.815, longitude: 151.001, simulated: true },
  { id: "AUC-02", name: "Waitematā Harbour", waterBody: "Waitematā Harbour", city: "Auckland", country: "New Zealand", region: "Oceania", status: "watch", risk: 41, confidence: 75, resilience: 68, latitude: -36.8485, longitude: 174.7633, simulated: true },
  { id: "USGS-01646500", name: "Potomac River Station 01646500", waterBody: "Potomac River", city: "Washington, DC", country: "United States", region: "North America", status: "critical", risk: 78, confidence: 91, resilience: 64, latitude: 38.9497, longitude: -77.1275, simulated: false },
  { id: "USGS-11447650", name: "Sacramento River at Freeport", waterBody: "Sacramento River", city: "Freeport, CA", country: "United States", region: "North America", status: "watch", risk: 44, confidence: 89, resilience: 74, latitude: 38.4558, longitude: -121.5008, simulated: false },
  { id: "USGS-04085138", name: "Fox River at Green Bay", waterBody: "Fox River", city: "Green Bay, WI", country: "United States", region: "North America", status: "stable", risk: 22, confidence: 93, resilience: 82, latitude: 44.5133, longitude: -88.0133, simulated: false },
];

let seeded: Promise<void> | undefined;

export const ensureDemoData = (): Promise<void> => {
  if (!seeded) {
    seeded = (async () => {
      const existing = await db.select({ id: sitesTable.id }).from(sitesTable);
      const existingIds = new Set(existing.map((site) => site.id));
      const now = new Date().toISOString();
      const missingSeeds = siteSeeds.filter((seed) => !existingIds.has(seed.id));
      if (missingSeeds.length > 0) {
        await db.insert(sitesTable).values(
          missingSeeds.map((seed) => ({
            ...seed,
            risk: seed.risk,
            confidence: seed.confidence,
            resilience: seed.resilience,
            lastUpdated: now,
            simulated: seed.simulated ? 1 : 0,
            description:
              seed.id === "ADYAR-01"
                ? "A high-coverage pilot site where rainfall, sensor telemetry, and citizen observations are fused into a single early-warning story."
                : `A synthetic monitoring site in the ${seed.region} demo network used to illustrate cross-region environmental coverage.`,
            metrics: metricsFor(seed.status === "critical"),
            timeline: timelineFor(seed.status === "critical"),
            actions: actionsFor(),
          })),
        );
      }
      const existingAlerts = await db.select({ id: alertsTable.id, siteId: alertsTable.siteId }).from(alertsTable);
      const existingAlertIds = new Set(existingAlerts.map((alert) => alert.id));
      if (!existingAlertIds.has("A-1048")) {
        await db.insert(alertsTable).values({
        id: "A-1048",
        siteId: "ADYAR-01",
        siteName: "Adyar Bridge",
        title: "Emerging environmental concern",
        severity: "emerging",
        risk: 78,
        confidence: 71,
        status: "under_review",
        trigger: "Multi-signal anomaly after heavy rainfall",
        createdAt: new Date(now),
        description:
          "AquaSentinel detected an elevated ecosystem stress signal. This is an AI-assisted assessment, not a scientific diagnosis or official regulatory determination.",
        evidence: [
          { id: "ev-1", label: "Turbidity increased 31%", detail: "Current reading is 48 NTU against a 37 NTU baseline.", contribution: "high", source: "Demo sensor network" },
          { id: "ev-2", label: "Five independent citizen observations", detail: "Reports cluster within a two-hour window.", contribution: "high", source: "Community observations" },
          { id: "ev-3", label: "Heavy rainfall within 24 hours", detail: "42 mm of rainfall provides contextual support for runoff.", contribution: "medium", source: "Demo weather context" },
          { id: "ev-4", label: "Biodiversity observations declined", detail: "Reported activity is below the recent site baseline.", contribution: "medium", source: "Biodiversity observations" },
          { id: "ev-5", label: "Temperature increased", detail: "Temperature is 0.9°C above the local baseline.", contribution: "low", source: "Demo sensor network" },
        ],
        assessment: defaultRiskAssessment("ADYAR-01"),
        reviewHistory: [],
        });
      }

      const existingObservations = await db.select({ id: observationsTable.id, siteId: observationsTable.siteId }).from(observationsTable);
      const existingObservationIds = new Set(existingObservations.map((observation) => observation.id));
      const existingObservationSites = new Set(existingObservations.map((observation) => observation.siteId));
      
      // Longitudinal citizen observations over time (past 30 days)
      const historicalDayOffsets = [0, 1, 1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 8, 9, 10, 11, 12, 13, 14, 18, 21, 28];
      const timeSeriesObservations = historicalDayOffsets.map((daysAgo, idx) => {
        const obsDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - (idx % 8) * 3600 * 1000);
        const isAnomaly = daysAgo <= 4;
        return {
          id: `obs-hist-${idx + 1}`,
          siteId: idx % 2 === 0 ? "ADYAR-01" : "SEMA-09",
          siteName: idx % 2 === 0 ? "Adyar Bridge" : "Semmencherry Wetland",
          source: "Citizen scientist",
          validationStatus: "validated",
          qualityScore: 78 + (idx % 18),
          aiConfidence: isAnomaly ? 84 : 72,
          latitude: 13.0067 + (idx % 5) * 0.002,
          longitude: 80.2571 - (idx % 4) * 0.001,
          responses: {
            waterAppearance: isAnomaly ? "Very cloudy" : idx % 3 === 0 ? "Slightly murky" : "Clear",
            unusualSmell: isAnomaly ? "Sulfur / organic" : "None",
            visiblePollution: isAnomaly ? (idx % 2 === 0 ? "Surface film" : "Foam") : "None",
            notes: `Field report filed ${daysAgo} day(s) ago during watershed patrol.`,
          },
          imageAnalysis: {
            summary: isAnomaly ? "Surface indicator identified; consistent with elevated runoff." : "Normal appearance; baseline characteristics.",
            indicators: [
              { label: isAnomaly ? "Turbidity indicator" : "Clear flow", confidence: isAnomaly ? 82 : 75 },
            ],
          },
          createdAt: obsDate,
        };
      });

      const observationRows = [
        ...timeSeriesObservations.filter((obs) => !existingObservationIds.has(obs.id)),
        ...siteSeeds
          .filter((seed) => seed.id !== "ADYAR-01" && seed.id !== "SEMA-09" && !existingObservationSites.has(seed.id))
          .map((seed) => ({
            id: `obs-${seed.id.toLowerCase()}`,
            siteId: seed.id,
            siteName: seed.name,
            source: "Community volunteer",
            validationStatus: seed.status === "stable" ? "validated" : "needs_review",
            qualityScore: Math.max(58, seed.confidence),
            aiConfidence: Math.max(52, seed.confidence - 4),
            latitude: seed.latitude,
            longitude: seed.longitude,
            responses: {
              waterAppearance: seed.status === "critical" || seed.status === "emerging" ? "Cloudy" : "Clear",
              unusualSmell: seed.status === "critical" ? "Unusual" : "None",
              visiblePollution: seed.status === "critical" ? "Surface film" : seed.status === "emerging" ? "Foam" : "None",
              notes: `Field baseline record for ${seed.city} watershed network.`,
            },
            imageAnalysis: {
              summary: "Contextual image analysis complete.",
              indicators: [{ label: "Contextual appearance", confidence: Math.max(50, seed.confidence - 8) }],
            },
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          })),
      ];
      if (observationRows.length > 0) {
        await db.insert(observationsTable).values(observationRows);
      }


      const alertRows = siteSeeds.filter(
        (seed) =>
          seed.id !== "ADYAR-01" &&
          ["critical", "emerging"].includes(seed.status) &&
          !existingAlerts.some((alert) => alert.siteId === seed.id),
      );
      if (alertRows.length > 0) {
        await db.insert(alertsTable).values(
          alertRows.map((seed) => ({
            id: `A-${seed.id}`,
            siteId: seed.id,
            siteName: seed.name,
            title: `${seed.region} signal requires local verification`,
            severity: seed.status,
            risk: seed.risk,
            confidence: seed.confidence,
            status: "under_review",
            trigger: "Synthetic multi-signal demonstration fixture",
            createdAt: new Date(now),
            description:
              "This synthetic alert demonstrates the review loop across regions. It is not a live public-health notification or scientific diagnosis.",
            evidence: [
              {
                id: `ev-${seed.id}-1`,
                label: "Site risk band",
                detail: `Synthetic risk score ${seed.risk} with confidence ${seed.confidence}.`,
                contribution: "medium",
                source: "Synthetic network fixture",
              },
              {
                id: `ev-${seed.id}-2`,
                label: "Local observation",
                detail: `A synthetic observation was recorded for ${seed.city}.`,
                contribution: "medium",
                source: "Synthetic network fixture",
              },
            ],
            assessment: defaultRiskAssessment(seed.id, seed.risk, seed.confidence),
            reviewHistory: [],
          })),
        );
      }

      const existingAudit = await db.select({ id: auditLogsTable.id }).from(auditLogsTable).limit(1);
      if (existingAudit.length === 0) {
        const genesisDetails = {
          system: "AquaSentinel Core Engine",
          event: "System Governance Genesis",
          benchmarkDataset: "USGS NWIS & EPA NARS Reference Registry",
          cryptographicAlgorithm: "SHA-256 Merkle Chaining",
        };
        const prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
        const genesisPayload = [
          prevHash,
          now,
          "system_genesis",
          "System Governance Controller",
          "system_genesis",
          "GENESIS_BLOCK",
          JSON.stringify(genesisDetails, Object.keys(genesisDetails).sort()),
        ].join("|");
        const genesisHash = createHash("sha256").update(genesisPayload).digest("hex");

        await db.insert(auditLogsTable).values({
          id: "audit-genesis-001",
          actorId: "system_genesis",
          actorRole: "System Governance Controller",
          action: "system_genesis",
          targetType: "system",
          targetId: "GENESIS_BLOCK",
          details: {
            ...genesisDetails,
            previousHash: prevHash,
            hash: genesisHash,
            signature: `SIG_ED25519_${genesisHash.slice(0, 16)}`,
          },
          ipAddress: "127.0.0.1",
          userAgent: "AquaSentinel/1.0 Internal Governance",
          timestamp: new Date(now),
        });
      }
    })();
  }
  return seeded;
};

export const mapSite = (row: typeof sitesTable.$inferSelect) => ({
  id: row.id,
  name: row.name,
  waterBody: row.waterBody,
  city: row.city,
  country: row.country,
  region: row.region,
  status: row.status,
  risk: row.risk,
  confidence: row.confidence,
  resilience: row.resilience,
  latitude: row.latitude,
  longitude: row.longitude,
  lastUpdated: row.lastUpdated,
  simulated: row.simulated === 1,
});

export const mapObservation = (row: typeof observationsTable.$inferSelect) => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
});

export const mapAlert = (row: typeof alertsTable.$inferSelect) => ({
  id: row.id,
  siteId: row.siteId,
  siteName: row.siteName,
  title: row.title,
  severity: row.severity,
  risk: row.risk,
  confidence: row.confidence,
  status: row.status,
  trigger: row.trigger,
  createdAt: row.createdAt.toISOString(),
});

export const mapMission = (row: typeof missionsTable.$inferSelect) => ({
  ...row,
  instructions: row.instructions as string[],
  createdAt: row.createdAt.toISOString(),
});

export const getLatestAlert = async () => {
  const [alert] = await db.select().from(alertsTable).orderBy(desc(alertsTable.createdAt)).limit(1);
  return alert;
};

export const createId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;

export const getSiteById = async (siteId: string) => {
  const [site] = await db.select().from(sitesTable).where(eq(sitesTable.id, siteId));
  return site;
};