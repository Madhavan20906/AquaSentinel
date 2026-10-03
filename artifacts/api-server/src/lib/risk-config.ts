/**
 * AquaSentinel Risk Scoring & Anomaly Weight Configuration
 * References documented risk weights in docs/risk-methodology.md
 */

export interface RiskFactorWeights {
  turbidity: number;
  dissolvedOxygen: number;
  citizenEvidence: number;
  rainfall: number;
  biodiversity: number;
}

export const RISK_FACTOR_WEIGHTS: RiskFactorWeights = {
  turbidity: 0.30,
  dissolvedOxygen: 0.25,
  citizenEvidence: 0.20,
  rainfall: 0.15,
  biodiversity: 0.10,
};

export const RISK_THRESHOLDS = {
  STABLE: 25,
  WATCH: 50,
  EMERGING: 75,
  CRITICAL: 100,
} as const;

export type RiskSeverity = "stable" | "watch" | "emerging" | "critical";

export function determineSeverity(riskScore: number): RiskSeverity {
  if (riskScore >= RISK_THRESHOLDS.EMERGING) return "critical";
  if (riskScore >= RISK_THRESHOLDS.WATCH) return "emerging";
  if (riskScore >= RISK_THRESHOLDS.STABLE) return "watch";
  return "stable";
}
