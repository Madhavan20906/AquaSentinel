# AquaSentinel — Environmental Intelligence & Early Warning System

> **AquaSentinel** turns citizen observations and environmental telemetry into explainable early warnings and human-reviewed resilience actions for urban waterways.

---

## ⚠️ Prototype Status & Honest Scope Boundaries

### Still Not Implemented (Not Claimed as Complete)

In accordance with our commitment to transparency, scientific integrity, and responsible engineering, **the following items are explicitly not claimed as complete**:

1. **Real sensor or weather providers**: Telemetry feeds (turbidity, dissolved oxygen, rainfall) are currently deterministic, simulated data (`simulated: true`). A pluggable `EnvironmentalDataSource` abstraction seam is defined for future live hardware integration.
2. **Real citizen submissions over time**: Observations submitted during sessions update the database, but do not represent longitudinal multi-month community cohorts.
3. **Production GIS/map view**: The site overview uses a responsive schematic coordinate visualizer rather than a heavy PostGIS / Mapbox / Leaflet mapping pipeline.
4. **Real email/SMS notifications**: Incident alerting and status escalations update the in-app queue and event timeline; outbound SMS (Twilio) and Email (SES) dispatch are not wired.
5. **Fully wired Clerk authentication and permissions**: Role switching is demonstrated via client-side context gating (Citizen, Officer, Researcher) to showcase role-aware access control without requiring live third-party identity provider credentials.
6. **Complete media upload flow from frontend to persistent observation records**: Media capture extracts local file metadata and runs simulated computer-vision analysis; binary payloads are not stored in persistent cloud object storage buckets.
7. **Full audit-log implementation**: Action logs and timeline events are stored in-memory and in standard output rather than in a tamper-evident compliance audit database.
8. **Scientific validation against real-world datasets**: Risk scoring and evidence fusion use heuristic weighting formulas and baseline deviations. They do not constitute peer-reviewed environmental models or diagnostic guarantees.
9. **Load testing and long-term multi-site operational validation**: The prototype has been validated for single-user and demonstration workflows, not high-concurrency stress benchmarks.
10. **FHIR certification**: Data export endpoints output JSON structured after HL7 FHIR R4 `Observation` and `RiskAssessment` resources, but AquaSentinel is not an accredited or certified FHIR server.

For a detailed technical breakdown of each limitation and the roadmap to address it, see [docs/limitations.md](docs/limitations.md).

---

## Architecture

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

## Key Capabilities

- **Continuous Resilience Loop**: Observe → Ingest → Detect Anomalies → Fuse Evidence → Quantify Uncertainty → Human Review → Coordinated Response.
- **Explainable Risk & Decoupled Confidence**: Risk severity (0–100) reflects deviation from baseline thresholds; confidence (0–100) reflects evidence density and cross-source corroboration.
- **Human-in-the-Loop Governance**: AI recommendations never trigger automatic municipal intervention; alerts remain in review queues until an officer verifies or dismisses them.
- **FHIR-Compatible Interoperability**: Formatted according to HL7 FHIR R4 resource definitions to enable zero-friction integration into municipal public health repositories.

---

## Tech Stack

- **Monorepo**: pnpm workspaces, TypeScript 5.9, Node.js 24
- **Backend**: Express 5, Drizzle ORM, PostgreSQL, Zod validation
- **Frontend**: React 19, Wouter routing, Tailwind CSS, Lucide icons
- **Contracts**: OpenAPI 3.1 specification (`lib/api-spec/openapi.yaml`) with Orval automated client & schema codegen

---

## Quickstart

### Prerequisites
- Node.js 24+
- pnpm 11+
- PostgreSQL database (`DATABASE_URL` environment variable)

### Installation
```bash
# Clone the repository
cd AquaSentinel-Environmental-Intelligence

# Install dependencies
pnpm install

# Run type check across all workspace packages
pnpm run typecheck

# Start API server in development mode
pnpm --filter @workspace/api-server run dev
```

---

## Responsible AI & Safety Guarantees

1. **Uncertainty Forward**: Signals always present confidence intervals and underlying evidentiary factors.
2. **Attribution & Provenance**: Every metric and observation traces back to its source (sensor ID, citizen report, or simulated scenario).
3. **No Autonomous Dispatch**: Consequential public health and municipal actions require explicit human operator confirmation.
4. **Privacy-Preserving Reporting**: Citizen contact information is sanitized and decoupled from publicly visible site dossiers.

---

## License

MIT
"# AquaSentinel" 
