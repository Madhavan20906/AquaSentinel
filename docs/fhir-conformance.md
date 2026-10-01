# AquaSentinel HL7® FHIR® R4 Conformance & Interoperability Specification

## 1. Conformance Statement Overview

AquaSentinel provides healthcare and environmental health interoperability through **HL7® Fast Healthcare Interoperability Resources (FHIR®) Release 4.0.1**.

Environmental hazards (cyanobacterial blooms, heavy sediment plumes, high microbial contamination) directly impact municipal drinking water supplies and recreational bathing waters. Publishing structured FHIR resources enables regional health networks, municipal epidemiologists, and EHR systems to ingest environmental exposure data alongside patient health indicators.

The live server CapabilityStatement is exposed at:
```http
GET /api/fhir/metadata
```

---

## 2. Supported FHIR Resources

| FHIR Resource | Supported Interactions | Profiling & US Core Alignment |
| :--- | :--- | :--- |
| **`CapabilityStatement`** | `read` | Outlines RESTful capabilities, formats (`application/fhir+json`), and profile definitions. |
| **`Observation`** | `read`, `search-type` | Conforms to FHIR R4 `Observation` with LOINC environmental terminology bindings. |
| **`RiskAssessment`** | `read`, `search-type` | Standard risk assessment representation tying sensor/citizen evidence to exposure probability. |

---

## 3. Standard Vocabulary & Terminology Bindings

AquaSentinel binds environmental telemetry to international standard coding systems:

### Water Quality Analytes (LOINC)

| Environmental Metric | LOINC Code | LOINC Display Name | Units |
| :--- | :--- | :--- | :--- |
| **Dissolved Oxygen** | `2710-2` | Oxygen [Partial pressure] in Water | $\text{mg/L}$ |
| **pH** | `2744-1` | pH of Water | `[pH]` |
| **Turbidity** | `4485-9` | Turbidity of Water | `[NTU]` |
| **Specific Conductance** | `2965-2` | Specific conductance of Water | $\mu\text{S/cm}$ |
| **Water Temperature** | `8310-5` | Body temperature (Water temperature) | `°C` |
| **Microcystins / Cyanotoxins** | `78452-0` | Microcystins in Water by Immunoassay | $\mu\text{g/L}$ |
| **Escherichia coli** | `56475-7` | Escherichia coli [Presence] in Water | `CFU/100mL` |

### Qualitative Observations (SNOMED CT)

| Qualitative Indicator | SNOMED CT Code | Description |
| :--- | :--- | :--- |
| **Clear Water Appearance** | `260385009` | Clear (qualifier value) |
| **Turbid / Murky Water** | `260387001` | Cloudy (qualifier value) |
| **Visible Algal Scum** | `840539006` | Algal bloom (finding) |
| **Petroleum Sheen / Oil** | `102434005` | Hydrocarbon contamination (finding) |

---

## 4. Example FHIR Observation Resource

```json
{
  "resourceType": "Observation",
  "id": "obs-turbidity-001",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "laboratory",
          "display": "Laboratory"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "4485-9",
        "display": "Turbidity of Water"
      }
    ],
    "text": "Water Turbidity"
  },
  "subject": {
    "reference": "Location/site-hudson-01",
    "display": "Hudson River Mid-Reach Estuary"
  },
  "effectiveDateTime": "2026-10-03T16:00:00Z",
  "valueQuantity": {
    "value": 14.8,
    "unit": "NTU",
    "system": "http://unitsofmeasure.org",
    "code": "[NTU]"
  },
  "interpretation": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
          "code": "N",
          "display": "Normal"
        }
      ]
    }
  ]
}
```

---

## 5. Certification & Conformance Testing

To achieve formal ONC or ISO 27799 / HL7 certification:
1. **FHIR Validator**: Validate responses against the official `org.hl7.fhir.core` validator CLI.
2. **SMART on FHIR**: Implement OAuth 2.0 / OpenID Connect authorization scopes (`system/Observation.rs`).
3. **AuditEvent Tracking**: All FHIR read and query events are captured in the immutable audit log table.
