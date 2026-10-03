# AquaSentinel Architecture & Technical Design

## System Overview

AquaSentinel provides an explainable intelligence loop designed to connect community ground observations with water sensor telemetry, producing human-reviewable early warnings without false precision.

```mermaid
flowchart TD
    subgraph Data Sources [Data Ingestion Layer]
        S1["Simulated Sensor Telemetry (DO, Turbidity, Temp)"]
        S2["Community Observations (Water Quality, Odor, Photos)"]
        S3["Weather & Storm Signals"]
    end

    subgraph Seams [Pluggable Abstraction Seams]
        DS["EnvironmentalDataSource Interface"]
    end

    subgraph Core [Risk & Evidence Engine]
        EF["Evidence Fusion Engine"]
        AD["Anomaly Detection"]
        RM["Explainable Risk Model (Factors, Weights, Confidence)"]
    end

    subgraph API [Contract-First API (Express 5 + OpenAPI)]
        EP1["/api/dashboard"]
        EP2["/api/sites/:id/risk"]
        EP3["/api/observations"]
        EP4["/api/alerts"]
        EP5["/api/fhir (R4 Observation & RiskAssessment)"]
    end

    subgraph UI [Frontend Workspace (React + Vite + Tailwind)]
        W1["Intelligence Dashboard"]
        W2["Site Dossiers & Metric Trends"]
        W3["Citizen Observation Workflow"]
        W4["Human-in-the-Loop Alert Review Queue"]
        W5["Data Exchange (FHIR-Compatible JSON)"]
    end

    Data Sources --> Seams
    Seams --> Core
    Core --> API
    API --> UI
```

---

## Technical Seams & Architecture Boundaries

To ensure that the system remains viable for real-world municipal adoption, the architecture cleanly decouples the frontend user experience and contract-first API from prototype simulation components:

1. **`EnvironmentalDataSource` Seam**:
   The risk engine does not bind directly to static datasets; it consumes through an abstraction layer. A live hardware feed (e.g. USGS REST or MQTT IoT sensors) can replace the `SimulatedDataSource` without altering the data contracts.
2. **`RiskModel` Seam**:
   Risk and confidence calculations are produced programmatically via factor weighting and evidence volume rather than opaque LLM prose generation. Domain-calibrated hydrodynamic models can implement this interface as validation data becomes available.
3. **FHIR R4 Interoperability**:
   Resource endpoints conform to HL7 FHIR R4 schema shapes (`Observation`, `RiskAssessment`), enabling downstream integration with public health surveillance registries.

---

## Prototype Scope & Boundaries

For the complete list of capabilities that remain under prototype simulation and are **not claimed as complete**, refer to [docs/limitations.md](limitations.md).
