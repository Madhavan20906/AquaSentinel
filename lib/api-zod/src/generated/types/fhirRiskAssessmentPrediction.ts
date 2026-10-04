import type { FhirCodeableConcept } from './fhirObservation';

export type FhirRiskAssessmentPrediction = {
  outcome: FhirCodeableConcept;
  probabilityDecimal: number;
  qualitativeRisk: FhirCodeableConcept;
  rationale?: string;
};
