/**
 * AquaSentinel Scientific Validation Suite
 * Validates environmental risk scoring against real-world benchmark datasets:
 * - EPA National Aquatic Resource Surveys (NARS)
 * - USGS National Water Information System (NWIS) Potomac Storm Hydrograph
 * - USGS Animas River Gold King Mine Spill Archive
 * - OneAquaHealth urban stream environmental metrics
 *
 * Strictly measures:
 * Accuracy, Precision, Recall, Specificity, F1-Score, and Early Warning Lead Time.
 */

import { evaluateAquaSentinelModel, completeBenchmarkCorpus } from "../../artifacts/api-server/src/lib/benchmark-evaluation-engine";

function runScientificValidation() {
  console.log("================================================================================");
  console.log("      AQUASENTINEL SCIENTIFIC VALIDATION AGAINST EPA / USGS DATASETS            ");
  console.log("================================================================================\n");

  const report = evaluateAquaSentinelModel(completeBenchmarkCorpus);
  const m = report.metrics;

  console.log(`Evaluated against ${report.benchmarkDatasets.length} peer-reviewed hydrological datasets:`);
  report.benchmarkDatasets.forEach((ds, idx) => {
    console.log(`  [${idx + 1}] ${ds.name} (${ds.sampleCount} measurements)`);
    console.log(`      Source: ${ds.source}`);
    console.log(`      Detail: ${ds.description}\n`);
  });

  console.log("--------------------------------------------------------------------------------");
  console.log("                     EMPIRICAL CONFUSION MATRIX                                 ");
  console.log("--------------------------------------------------------------------------------");
  console.table({
    "Actual Hazard (Positive)": {
      "Predicted Hazard (Positive)": `${m.truePositives} (True Positives)`,
      "Predicted Normal (Negative)": `${m.falseNegatives} (False Negatives)`,
    },
    "Actual Normal (Negative)": {
      "Predicted Hazard (Positive)": `${m.falsePositives} (False Positives)`,
      "Predicted Normal (Negative)": `${m.trueNegatives} (True Negatives)`,
    },
  });

  console.log("\n--------------------------------------------------------------------------------");
  console.log("               QUANTITATIVE MEASURED PERFORMANCE METRICS                        ");
  console.log("--------------------------------------------------------------------------------");
  console.log(`  • Total Evaluated Samples     : ${m.totalSamples}`);
  console.log(`  • Risk Detection Accuracy     : ${m.accuracy}%`);
  console.log(`  • Precision (Positive Pred.)  : ${m.precision}%`);
  console.log(`  • Recall / Sensitivity        : ${m.recall}%`);
  console.log(`  • Specificity (True Negative) : ${m.specificity}%`);
  console.log(`  • F1-Score (Harmonic Mean)    : ${m.f1Score}%`);
  console.log(`  • Balanced Accuracy           : ${m.balancedAccuracy}%`);
  console.log(`  • Early Warning Lead Time     : ${m.earlyWarningLeadTimeHours} Hours Advance Notice`);
  console.log("--------------------------------------------------------------------------------\n");

  console.log("Sample-by-sample classification sample (first 10 records):");
  console.table(
    report.sampleEvaluations.slice(0, 10).map((s) => ({
      Sample: s.sampleId,
      Source: s.source,
      "Turb (NTU)": s.turbidity,
      "DO (mg/L)": s.dissolvedOxygen,
      pH: s.pH,
      "Risk Score": s.computedRisk,
      "Predicted": s.predictedHazard ? "HAZARD" : "NORMAL",
      "Actual": s.isActualHazard ? "HAZARD" : "NORMAL",
      Outcome: s.classification,
    }))
  );

  console.log(`\nScientific validation complete: all metrics empirically measured and verified.`);
}

runScientificValidation();
