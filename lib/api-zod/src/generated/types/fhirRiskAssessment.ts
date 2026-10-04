import type { FhirCodeableConcept, FhirReference } from './fhirObservation';
import type { FhirRiskAssessmentPrediction } from './fhirRiskAssessmentPrediction';

export interface FhirRiskAssessment {
  resourceType: 'RiskAssessment';
  id: string;
  status: string;
  code: FhirCodeableConcept;
  subject: FhirReference;
  occurrenceDateTime: string;
  prediction: FhirRiskAssessmentPrediction[];
  basis?: FhirReference[];
}
