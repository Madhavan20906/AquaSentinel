export interface AnomalyResult {
  parameter: string;
  currentValue: number;
  rollingMean: number;
  rollingStdDev: number;
  zScore: number;
  isAnomaly: boolean;
  severity: "normal" | "watch" | "emerging" | "critical";
  direction: "up" | "down" | "stable";
  confidence: number;
  explanation: string;
}

export interface AnomalyDetector {
  readonly name: string;
  detect(parameter: string, currentValue: number, history: number[]): AnomalyResult;
  detectMultiSignal(metrics: { parameter: string; current: number; history: { value: number }[] }[]): AnomalyResult[];
}

/**
 * Rolling Z-Score Anomaly Detector
 * Statistically identifies sensor excursions exceeding ±2.0σ (watch/emerging) and ±2.5σ (critical)
 * relative to a rolling window of historical baselines.
 */
export class RollingZScoreAnomalyDetector implements AnomalyDetector {
  readonly name = "Rolling Z-Score Anomaly Detector (v1.0)";
  private warningThreshold = 2.0;
  private criticalThreshold = 2.5;

  detect(parameter: string, currentValue: number, history: number[]): AnomalyResult {
    const values = [...history];
    if (values.length === 0) {
      return {
        parameter,
        currentValue,
        rollingMean: currentValue,
        rollingStdDev: 0,
        zScore: 0,
        isAnomaly: false,
        severity: "normal",
        direction: "stable",
        confidence: 50,
        explanation: "Insufficient historical observations for statistical z-score evaluation.",
      };
    }

    const n = values.length;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    // Population variance / standard deviation
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Guard against zero division when variance is near zero
    const effectiveStdDev = stdDev < 0.0001 ? 0.01 : stdDev;
    const zScore = parseFloat(((currentValue - mean) / effectiveStdDev).toFixed(2));
    const absZ = Math.abs(zScore);

    const isAnomaly = absZ >= this.warningThreshold;
    const direction = zScore > 0.5 ? "up" : zScore < -0.5 ? "down" : "stable";

    let severity: "normal" | "watch" | "emerging" | "critical" = "normal";
    if (absZ >= this.criticalThreshold) {
      severity = "critical";
    } else if (absZ >= this.warningThreshold) {
      severity = "emerging";
    } else if (absZ >= 1.5) {
      severity = "watch";
    }

    const confidence = Math.min(95, Math.max(60, 65 + n * 4));

    let explanation = `${parameter} is within expected seasonal bounds (z-score: ${zScore > 0 ? "+" : ""}${zScore}σ).`;
    if (severity === "critical") {
      explanation = `CRITICAL ANOMALY: ${parameter} spiked to ${currentValue} (${zScore > 0 ? "+" : ""}${zScore}σ deviation from rolling baseline of ${mean.toFixed(1)}). Exceeds ±${this.criticalThreshold}σ threshold.`;
    } else if (severity === "emerging") {
      explanation = `ELEVATED DEVIATION: ${parameter} registered ${currentValue} (${zScore > 0 ? "+" : ""}${zScore}σ from baseline ${mean.toFixed(1)}). Exceeds ±${this.warningThreshold}σ alert threshold.`;
    }

    return {
      parameter,
      currentValue,
      rollingMean: parseFloat(mean.toFixed(2)),
      rollingStdDev: parseFloat(stdDev.toFixed(2)),
      zScore,
      isAnomaly,
      severity,
      direction,
      confidence,
      explanation,
    };
  }

  detectMultiSignal(
    metrics: { parameter: string; current: number; history: { value: number }[] }[]
  ): AnomalyResult[] {
    return metrics.map((m) => {
      const hist = (m.history || []).map((h) => h.value);
      return this.detect(m.parameter, m.current, hist);
    });
  }
}

export const defaultAnomalyDetector: AnomalyDetector = new RollingZScoreAnomalyDetector();
