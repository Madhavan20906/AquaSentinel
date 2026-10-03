# AquaSentinel — System Boundaries & Honest Non-Claims

This document explicitly defines the boundaries of the AquaSentinel prototype. To ensure scientific integrity, transparency, and responsible environmental intelligence, the following capabilities are **explicitly not claimed as complete**:

---

## 1. Real Sensor or Weather Providers
* **Current State:** Environmental metrics (turbidity, dissolved oxygen, water temperature, rainfall anomalies) are generated as deterministic, simulated seed telemetry within `artifacts/api-server/src/lib/aquasentinel-data.ts`. Telemetry records are tagged with `simulated: true`.
* **Not Claimed:** Direct integration with live municipal USGS, EPA, or IoT hardware feeds.
* **Production Path:** Implement the `EnvironmentalDataSource` seam interface to ingest real-time REST or MQTT streams from certified IoT sondes and weather radar APIs.

---

## 2. Real Citizen Submissions Over Time
* **Current State:** Community observation forms capture water appearance, odor, visible discharge, GPS coordinates, and media metadata. Submissions update the local session and database records.
* **Not Claimed:** Longitudinal community data collected across multi-month temporal cohorts.
* **Production Path:** Deploy participatory sensing campaigns with community validation mechanisms and spatial clustering filters.

---

## 3. Production GIS/Map View
* **Current State:** A responsive, interactive schematic coordinate visualizer and site intelligence grid built with SVG and CSS in `artifacts/aquasentinel/src/app-shell.tsx`.
* **Not Claimed:** Full-scale GIS infrastructure (e.g., PostGIS raster tiles, Mapbox/Leaflet layers, shapefile polygon overlays).
* **Production Path:** Integrate MapLibre GL or Leaflet connected to a PostGIS spatial database for vector tile rendering of watershed catchment boundaries.

---

## 4. Real Email / SMS Notifications
* **Current State:** Alert queues, status changes (Verified, Under Review, Dismissed, Escalated), and incident action timelines update within the application UI state.
* **Not Claimed:** Outbound message dispatch via telephony/email networks.
* **Production Path:** Wire webhooks to Twilio (SMS/WhatsApp) and SendGrid/Amazon SES for automated emergency dispatch notifications.

---

## 5. Fully Wired Clerk Authentication & Permissions
* **Current State:** Role-aware demo gating via the Context & Settings switcher (Environmental Officer, Research Lead, Citizen Scientist, Public Health Partner). Restricts alert verification and operational review actions based on selected role.
* **Not Claimed:** Hardened production authentication, multi-factor auth, session encryption tokens, or enterprise RBAC.
* **Production Path:** Mount the official Clerk React/Express SDK or OAuth2 OIDC provider to enforce authenticated JWT bearer tokens on all mutating API routes.

---

## 6. Complete Media Upload Flow from Frontend to Persistent Records
* **Current State:** Client-side media selection, local preview generation, and EXIF/metadata extraction (timestamp, location tags, simulated computer vision hazard analysis).
* **Not Claimed:** Direct-to-cloud signed binary uploads (e.g., AWS S3 / Google Cloud Storage buckets) or persistent object storage with anti-virus scanning.
* **Production Path:** Implement pre-signed S3 URLs (`/api/storage/presign`) and persistent BLOB storage references in the `observations` database table.

---

## 7. Full Audit-Log Implementation
* **Current State:** Review actions and state transitions are appended to in-memory timelines and logged to console output.
* **Not Claimed:** Immutable, tamper-evident, append-only compliance audit trails (e.g., SOC2 or ISO 27001 compliant audit stores).
* **Production Path:** Dedicated write-only audit log table with cryptographic hash chaining (blockchain or ledger database).

---

## 8. Scientific Validation Against Real-World Datasets
* **Current State:** Explainable heuristic risk fusion engine based on baseline deviations and evidence diversity.
* **Not Claimed:** Clinical, epidemiological, or hydro-chemical validation against ground-truth lab assays or peer-reviewed environmental models.
* **Production Path:** Peer-reviewed calibration using historical watershed datasets and ground-truth laboratory grab-sample assays.

---

## 9. Load Testing and Long-Term Multi-Site Operational Validation
* **Current State:** Verified for local development, demo workflows, and automated end-to-end typechecks.
* **Not Claimed:** High-concurrency stress testing, multi-region database replication, or multi-year continuous operational uptime.
* **Production Path:** Distributed k6 load testing, database connection pooling, read-replica caching via Redis, and multi-tenant partitioning.

---

## 10. FHIR Certification
* **Current State:** Synthetic data exported into JSON structures conforming to HL7 FHIR R4 `Observation` and `RiskAssessment` schemas for two resource types.
* **Not Claimed:** Accreditation or certification as a conformant FHIR server by HL7 or health IT certification bodies.
* **Production Path:** Implementation of full FHIR RESTful search APIs, FHIR capability statements (`/metadata`), and official HL7 validator test suite execution.
