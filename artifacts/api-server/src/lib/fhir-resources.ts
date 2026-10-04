export interface FhirObservationSource {
  id: string;
  siteId: string;
  siteName?: string;
  createdAt: Date | string;
  responses?: unknown;
}

export interface FhirRiskAssessmentSource {
  id: string;
  name: string;
  risk: number;
  lastUpdated: Date | string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function toFhirObservation(observation: FhirObservationSource) {
  const responses = asRecord(observation.responses);
  const details = [
    ["Water appearance", textValue(responses.waterAppearance)],
    ["Unusual smell", textValue(responses.unusualSmell)],
    ["Visible pollution", textValue(responses.visiblePollution)],
  ].filter(([, value]) => value.length > 0) as [string, string][];
  const notes = textValue(responses.notes);

  return {
    resourceType: "Observation" as const,
    id: observation.id,
    status: "final",
    code: {
      coding: [{
        system: "https://aquasentinel.io/fhir/codes",
        code: "community-environmental-observation",
        display: "Community environmental observation",
      }],
      text: "Community stream quality observation",
    },
    subject: {
      reference: "Location/" + observation.siteId,
      display: observation.siteName || observation.siteId,
    },
    effectiveDateTime: new Date(observation.createdAt).toISOString(),
    valueString: details.map(([label, value]) => label + ": " + value).join("; ") || "Community field observation recorded.",
    ...(notes ? { note: [{ text: notes }] } : {}),
  };
}

export function toFhirRiskAssessment(site: FhirRiskAssessmentSource) {
  const risk = Number.isFinite(site.risk) ? Math.max(0, Math.min(100, site.risk)) : 0;
  const probabilityDecimal = Number((risk / 100).toFixed(2));
  const level = risk >= 75 ? "high" : risk >= 50 ? "moderate" : risk >= 25 ? "low" : "negligible";
  const display = level.charAt(0).toUpperCase() + level.slice(1);

  return {
    resourceType: "RiskAssessment" as const,
    id: "risk-" + site.id,
    status: "preliminary",
    code: {
      coding: [{
        system: "https://aquasentinel.io/fhir/codes",
        code: "watershed-ecosystem-stress-risk",
        display: "Watershed ecosystem stress risk assessment",
      }],
      text: "Watershed ecosystem stress assessment",
    },
    subject: {
      reference: "Location/" + site.id,
      display: site.name,
    },
    occurrenceDateTime: new Date(site.lastUpdated).toISOString(),
    prediction: [{
      outcome: { text: "Potential environmental ecosystem stress" },
      probabilityDecimal,
      qualitativeRisk: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/risk-probability",
          code: level,
          display,
        }],
        text: display + " likelihood",
      },
      rationale: "AquaSentinel risk score: " + Math.round(risk) + " out of 100.",
    }],
  };
}
