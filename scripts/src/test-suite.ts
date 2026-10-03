process.env.DATABASE_URL ||= "postgresql://postgres:postgres@localhost:5432/aquasentinel";

import assert from "node:assert/strict";
import { RollingZScoreAnomalyDetector } from "../../artifacts/api-server/src/lib/anomaly-detector";
import { getHistoricalStormBacktest } from "../../artifacts/api-server/src/lib/backtest-service";
import { validateFhirResource } from "../../artifacts/api-server/src/lib/fhir-validator";
import { dispatchAlertNotifications, notificationHistory } from "../../artifacts/api-server/src/lib/notifications";
import { SimulatedDataSource } from "../../artifacts/api-server/src/lib/environmental-data-source";

async function runTestSuite() {
  const { computeRiskAssessment } = await import("../../artifacts/api-server/src/lib/aquasentinel-data");

  console.log("================================================================================");
  console.log("                  AQUASENTINEL AUTOMATED TEST SUITE                             ");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    return (async () => {
      try {
        await fn();
        console.log(`  ✓ PASS: ${name}`);
        passed++;
      } catch (err: any) {
        console.error(`  ✗ FAIL: ${name}`);
        console.error(`    ${err.message}`);
        failed++;
      }
    })();
  }

  // 1. Risk Engine Determinism & Input Sensitivity
  await test("Risk Engine: Deterministic for identical inputs", () => {
    const res1 = computeRiskAssessment("ADYAR-01");
    const res2 = computeRiskAssessment("ADYAR-01");
    assert.equal(res1.risk, res2.risk, "Risk scores should match identically");
    assert.equal(res1.confidence, res2.confidence, "Confidence scores should match identically");
    assert.equal(res1.factors.length, res2.factors.length, "Factor counts should match");
  });

  await test("Risk Engine: Changes dynamically with metric excursions", () => {
    const normalMetrics: any = [
      { parameter: "Turbidity", current: 12, baseline: 12, change: 0, unit: "NTU", trend: "stable", status: "normal", history: [{ label: "08:00", value: 12 }] },
      { parameter: "Dissolved oxygen", current: 8.5, baseline: 8.5, change: 0, unit: "mg/L", trend: "stable", status: "normal", history: [{ label: "08:00", value: 8.5 }] },
      { parameter: "Rainfall", current: 2, baseline: 10, change: -80, unit: "mm", trend: "stable", status: "normal", history: [{ label: "08:00", value: 2 }] },
    ];
    const stressedMetrics: any = [
      { parameter: "Turbidity", current: 75, baseline: 12, change: 525, unit: "NTU", trend: "increasing", status: "abnormal", history: [{ label: "08:00", value: 12 }] },
      { parameter: "Dissolved oxygen", current: 3.2, baseline: 8.5, change: -62, unit: "mg/L", trend: "decreasing", status: "abnormal", history: [{ label: "08:00", value: 8.5 }] },
      { parameter: "Rainfall", current: 55, baseline: 10, change: 450, unit: "mm", trend: "increasing", status: "abnormal", history: [{ label: "08:00", value: 55 }] },
    ];

    const lowRisk = computeRiskAssessment("TEST-LOW", normalMetrics, 0, false);
    const highRisk = computeRiskAssessment("TEST-HIGH", stressedMetrics, 8, true);

    assert(highRisk.risk > lowRisk.risk, "Stressed conditions must produce strictly higher risk");
    assert(highRisk.confidence > lowRisk.confidence, "Higher evidence density must increase confidence");
    assert.equal(lowRisk.severity, "stable");
    assert.equal(highRisk.severity, "critical");
  });

  // 2. Rolling Z-Score Anomaly Detector
  await test("Anomaly Detector: Accurately identifies statistical spikes (>2.5σ)", () => {
    const detector = new RollingZScoreAnomalyDetector();
    const history = [10, 11, 10, 12, 11, 10]; // mean ~10.66, stddev ~0.74
    const normalReading = detector.detect("Turbidity", 11, history);
    assert.equal(normalReading.isAnomaly, false);

    const spikeReading = detector.detect("Turbidity", 24, history);
    assert.equal(spikeReading.isAnomaly, true);
    assert(spikeReading.zScore > 2.5, "Excursion should exceed +2.5σ threshold");
    assert.equal(spikeReading.severity, "critical");
  });

  // 3. EnvironmentalDataSource Seam
  await test("EnvironmentalDataSource: Simulated provider delivers structured metrics", async () => {
    const ds = new SimulatedDataSource();
    const metrics = await ds.fetchSiteMetrics("ADYAR-01", 13.0067, 80.2571, true);
    assert(metrics.length >= 4, "Must supply at least 4 core parameters");
    const turb = metrics.find((m) => m.parameter === "Turbidity");
    assert(turb != null, "Must include Turbidity");
    assert.equal(turb.simulated, true, "Must flag simulated data accurately");
  });

  // 4. HL7 FHIR R4 Validation
  await test("HL7 FHIR R4 Validator: Observation conforms strictly to R4 schema", async () => {
    const validObservation = {
      resourceType: "Observation",
      id: "obs-test-01",
      status: "final",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "activity" }] }],
      code: {
        coding: [{ system: "http://loinc.org", code: "14788-4", display: "Water turbidity" }],
        text: "Turbidity observation",
      },
      subject: { reference: "Location/ADYAR-01", display: "Adyar Bridge" },
      effectiveDateTime: new Date().toISOString(),
      valueQuantity: { value: 84, unit: "%", system: "http://unitsofmeasure.org", code: "%" },
    };

    const result = await validateFhirResource(validObservation);
    assert.equal(result.valid, true, "Resource must pass R4 validation");
    assert.equal(result.fhirVersion, "4.0.1");
  });

  await test("HL7 FHIR R4 Validator: Catches non-conformant resource", async () => {
    const invalidObservation = {
      resourceType: "Observation",
      id: "bad-obs",
      status: "non-standard-status", // Invalid status code
    };
    const result = await validateFhirResource(invalidObservation);
    assert.equal(result.valid, false, "Must reject invalid status and missing fields");
  });

  // 5. Historical Storm Dataset Back-Test
  await test("Historical Back-Test: Validates against USGS NWIS Potomac storm event", () => {
    const backtest = getHistoricalStormBacktest();
    assert.equal(backtest.totalHours, 48);
    assert(backtest.concordanceScore >= 90, "Concordance score must exceed 90%");
    assert(backtest.earlyWarningLeadTimeHours >= 4.0, "Early warning lead time must be at least 4.0 hours");
    assert(backtest.series.length > 10, "Time-series must contain granular points");
  });

  // 6. Multi-Channel Notification Dispatch
  await test("Notification Engine: Formats and dispatches across channels", async () => {
    const initialCount = notificationHistory.length;
    const results = await dispatchAlertNotifications({
      alertId: "A-TEST-99",
      siteId: "ADYAR-01",
      siteName: "Adyar Bridge",
      severity: "critical",
      summary: "Severe turbidity pulse confirmed by officer review.",
      recipientEmail: "test@watershed.gov",
    });

    assert(results.length >= 2, "Should dispatch across multiple active/simulated channels");
    assert(notificationHistory.length > initialCount, "Notification history must record dispatched payloads");
  });

  console.log("\n--------------------------------------------------------------------------------");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed out of ${passed + failed} tests.`);
  console.log("--------------------------------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
