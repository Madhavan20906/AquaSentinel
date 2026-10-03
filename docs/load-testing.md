# AquaSentinel Operational Load Testing & Validation

## 1. Overview

AquaSentinel provides real-time environmental monitoring across river basins and coastal waterways. During acute storm events or hazardous discharge incidents, sudden bursts of citizen submissions and sensor data can stress ingestion pipelines and decision dashboards.

This document outlines the load testing strategy, concurrency profiles, stress benchmarks, and operational validation protocol.

---

## 2. Performance Service Level Objectives (SLOs)

| Metric | Target (Standard Load) | Target (Peak Stress Load) | Critical SLA Floor |
| :--- | :--- | :--- | :--- |
| **p50 Latency (API endpoints)** | $< 35\text{ ms}$ | $< 65\text{ ms}$ | $< 100\text{ ms}$ |
| **p95 Latency (API endpoints)** | $< 80\text{ ms}$ | $< 150\text{ ms}$ | $< 250\text{ ms}$ |
| **Throughput (single Node core)** | $> 250\text{ RPS}$ | $> 500\text{ RPS}$ | $> 150\text{ RPS}$ |
| **Error Rate (HTTP 5xx)** | $0.00\%$ | $< 0.10\%$ | $< 0.50\%$ |
| **Media Upload Time (2MB JPEG)** | $< 300\text{ ms}$ | $< 600\text{ ms}$ | $< 1200\text{ ms}$ |

---

## 3. Endpoints Under Benchmark

The load harness benchmarks the core data delivery and ingestion endpoints:

1. **`GET /api/dashboard`**: Heavy aggregation query retrieving active sites, sensor telemetry status, incident summaries, and recent alerts.
2. **`GET /api/sites`**: Catalog query with spatial bounding box filters and historical trend summaries.
3. **`GET /api/audit-logs`**: Audit trail query with actor metadata and chronological sorting.
4. **`GET /api/fhir/Observation`**: Interoperability query transforming internal sensor records into HL7 FHIR R4 JSON bundles.
5. **`POST /api/upload`**: Multipart media upload handling citizen observational photographs.

---

## 4. Running the Load Test Harness

Ensure the API server is running on `http://127.0.0.1:5000` (or set `TEST_URL`):

```bash
# Terminal 1: Run API server
pnpm --filter @workspace/api-server run dev

# Terminal 2: Execute load test suite
pnpm --filter @workspace/scripts run test:load
```

Custom concurrency and volume can be configured via environment variables:

```bash
CONCURRENCY=50 TOTAL_REQUESTS=1000 TEST_URL=http://127.0.0.1:5000 pnpm --filter @workspace/scripts run test:load
```

---

## 5. Architectural Scaling Safeguards

- **In-Memory Cache / HTTP Keep-Alive**: Reuses database connection pools and connection keep-alives to prevent port exhaustion.
- **Drizzle Prepared Statements**: Queries are pre-compiled to reduce SQL parse overhead.
- **Asynchronous Audit Logging**: Audit log writes are non-blocking so that client response times remain deterministic even under heavy write loads.
- **Multipart Streaming**: File uploads use streaming to write directly to disk without loading entire payloads into V8 heap memory.
