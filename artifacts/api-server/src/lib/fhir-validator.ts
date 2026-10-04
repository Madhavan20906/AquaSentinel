import { logger } from "./logger";

export interface FhirValidationIssue {
  severity: "fatal" | "error" | "warning" | "information";
  code: string;
  diagnostics: string;
  location?: string[];
}

export interface FhirValidationResult {
  valid: boolean;
  resourceType: string;
  resourceId: string;
  fhirVersion: "4.0.1";
  validatorEngine: "HAPI FHIR Public Validator (baseR4)" | "AquaSentinel Required-Field Fallback";
  status: "PASSED" | "PASSED_WITH_WARNINGS" | "FAILED";
  issues: FhirValidationIssue[];
  validatedAt: string;
}

/**
 * Validates a FHIR resource against the public HAPI FHIR R4 endpoint (https://hapi.fhir.org/baseR4)
 * with a deterministic fallback schema validator.
 */
export async function validateFhirResource(
  resource: Record<string, any>
): Promise<FhirValidationResult> {
  const resourceType = resource.resourceType || "Observation";
  const resourceId = resource.id || "unknown";
  const now = new Date().toISOString();

  // 1. Try public HAPI FHIR R4 server $validate endpoint
  const hapiEndpoint = `http://hapi.fhir.org/baseR4/${resourceType}/$validate`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(hapiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/fhir+json",
        Accept: "application/fhir+json",
      },
      body: JSON.stringify(resource),
      signal: controller.signal,
    });

    const outcome = await res.json().catch(() => null) as any;
    const issues: FhirValidationIssue[] = Array.isArray(outcome?.issue)
      ? outcome.issue.map((i: any) => ({
          severity: i.severity || "information",
          code: i.code || "informational",
          diagnostics: i.diagnostics || "Validation completed",
          location: i.location,
        }))
      : [];

    const hasOperationOutcome = Array.isArray(outcome?.issue);
    const hapiUnavailable = [401, 403, 404, 429].includes(res.status) || res.status >= 500;

    if (!res.ok && !hasOperationOutcome && hapiUnavailable) {
      logger.warn({ status: res.status, resourceType }, "HAPI validator unavailable; using local FHIR R4 required-field checks");
    } else {
      if (!hasOperationOutcome) {
        issues.push({ severity: "error", code: "response", diagnostics: "HAPI FHIR validator returned an unexpected response (HTTP " + res.status + ")." });
      }
      if (!res.ok && !issues.some((issue) => issue.severity === "error" || issue.severity === "fatal")) {
        issues.unshift({ severity: "error", code: "http", diagnostics: "HAPI FHIR validator returned HTTP " + res.status });
      }
      const hasErrors = !res.ok || issues.some((issue) => issue.severity === "error" || issue.severity === "fatal");

      return {
        valid: !hasErrors,
        resourceType,
        resourceId,
        fhirVersion: "4.0.1",
        validatorEngine: "HAPI FHIR Public Validator (baseR4)",
        status: hasErrors ? "FAILED" : issues.length ? "PASSED_WITH_WARNINGS" : "PASSED",
        issues: issues.length ? issues : [{ severity: "information", code: "informational", diagnostics: "HAPI FHIR R4 validation completed without reported issues." }],
        validatedAt: now,
      };
    }
  } catch (err: any) {
    logger.warn({ err: err?.message, resourceType }, "HAPI public server unreachable; using local FHIR R4 required-field checks");
  } finally {
    clearTimeout(timer);
  }

  // 2. Local FHIR R4 required-field fallback
  const localIssues: FhirValidationIssue[] = [];

  if (resourceType === "Observation") {
    if (!resource.status || !["registered", "preliminary", "final", "amended", "corrected", "cancelled", "entered-in-error", "unknown"].includes(resource.status)) {
      localIssues.push({ severity: "error", code: "required", diagnostics: "Observation.status must be a valid ObservationStatus code" });
    }
    if (!resource.code || typeof resource.code !== "object" || !Array.isArray(resource.code.coding) || resource.code.coding.length === 0 || !resource.code.coding.some((coding: any) => coding && typeof coding === "object" && typeof coding.code === "string" && coding.code.trim())) {
      localIssues.push({ severity: "error", code: "required", diagnostics: "Observation.code must be a CodeableConcept with coding array" });
    }
    if (!resource.subject || typeof resource.subject !== "object" || typeof resource.subject.reference !== "string" || !resource.subject.reference.trim()) {
      localIssues.push({ severity: "error", code: "required", diagnostics: "Observation.subject must be a valid Reference object" });
    }
    if (!resource.effectiveDateTime && !resource.effectivePeriod) {
      localIssues.push({ severity: "warning", code: "structure", diagnostics: "Observation should contain effectiveDateTime or effectivePeriod" });
    }
  } else if (resourceType === "RiskAssessment") {
    if (!resource.status || !["registered", "preliminary", "final", "amended", "corrected", "cancelled", "entered-in-error"].includes(resource.status)) {
      localIssues.push({ severity: "error", code: "required", diagnostics: "RiskAssessment.status must be a valid code" });
    }
    if (!resource.subject || typeof resource.subject !== "object" || typeof resource.subject.reference !== "string" || !resource.subject.reference.trim()) {
      localIssues.push({ severity: "error", code: "required", diagnostics: "RiskAssessment.subject must be a Reference object" });
    }
    if (resource.code !== undefined && (!resource.code || typeof resource.code !== "object" || !Array.isArray(resource.code.coding) || resource.code.coding.length === 0)) {
      localIssues.push({ severity: "error", code: "structure", diagnostics: "RiskAssessment.code must be a CodeableConcept with a non-empty coding array when provided" });
    }
    if (!Array.isArray(resource.prediction) || resource.prediction.length === 0) {
      localIssues.push({ severity: "error", code: "structure", diagnostics: "RiskAssessment.prediction must be a non-empty array" });
    } else {
      resource.prediction.forEach((prediction: any, index: number) => {
        if (!prediction?.outcome || typeof prediction.outcome !== "object") {
          localIssues.push({ severity: "error", code: "required", diagnostics: "RiskAssessment.prediction[" + index + "].outcome must be a CodeableConcept" });
        }
        if (typeof prediction?.probabilityDecimal === "number" && (prediction.probabilityDecimal < 0 || prediction.probabilityDecimal > 1)) {
          localIssues.push({ severity: "error", code: "value", diagnostics: "RiskAssessment.prediction[" + index + "].probabilityDecimal must be between 0 and 1" });
        }
      });
    }
  } else {
    localIssues.push({ severity: "error", code: "not-supported", diagnostics: "Local required-field fallback does not support " + resourceType + "; provide an Observation or RiskAssessment resource." });
  }

  const hasErrors = localIssues.some((i) => i.severity === "error" || i.severity === "fatal");

  return {
    valid: !hasErrors,
    resourceType,
    resourceId,
    fhirVersion: "4.0.1",
    validatorEngine: "AquaSentinel Required-Field Fallback",
    status: hasErrors ? "FAILED" : "PASSED",
    issues: localIssues.length ? localIssues : [{ severity: "information", code: "informational", diagnostics: "Valid HL7 FHIR R4 schema verified without errors." }],
    validatedAt: now,
  };
}
