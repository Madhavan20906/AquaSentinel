export interface FhirCoding {
  system?: string;
  code: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding: FhirCoding[];
  text?: string;
}

export interface FhirReference {
  reference: string;
  display?: string;
}

export interface FhirObservation {
  resourceType: 'Observation';
  id: string;
  status: string;
  code: FhirCodeableConcept;
  subject: FhirReference;
  effectiveDateTime: string;
  valueString: string;
  note?: { text: string }[];
}
