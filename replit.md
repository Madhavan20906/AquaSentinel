# AquaSentinel

AquaSentinel turns citizen observations and environmental signals into explainable early warnings and human-reviewed resilience actions for urban waterways.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/aquasentinel/src/app-shell.tsx` — responsive public entry, intelligence workspace, observation flow, alert review, missions, analytics, and interoperability views.
- `artifacts/api-server/src/routes/aquasentinel.ts` — API handlers for dashboard, sites, observations, risk, alerts, missions, and FHIR-compatible resources.
- `artifacts/api-server/src/lib/aquasentinel-data.ts` — explicit simulated demo scenario, evidence, metrics, and response-plan seed data.
- `lib/api-spec/openapi.yaml` — source of truth for API contracts and generated client/Zod types.
- `lib/db/src/schema/` — Drizzle tables for sites, observations, alerts, and missions.
- `artifacts/aquasentinel/src/index.css` — shared AquaSentinel visual theme and responsive utilities.

## Architecture decisions

- The first build prioritizes one continuous operational loop: observe, validate, fuse evidence, detect, explain, review, and respond.
- Risk and confidence remain separate fields throughout the API and UI; evidence is stored as structured factors rather than inferred from generated prose.
- Demo records are explicitly simulated and include provenance-style source labels; the UI avoids claims of scientific validation or medical diagnosis.
- The API is contract-first through OpenAPI and generated Zod/React Query clients, so future models and data sources can replace the prototype implementations without changing the product surface.

## Product

- Public landing page that explains the intelligence loop.
- City dashboard with live API-backed site counts, statuses, alert queue, and map-like site intelligence.
- Site dossier with environmental metrics, trends, risk/confidence, evidence factors, timeline, citizen observations, and response actions.
- Mobile-friendly citizen observation workflow with validation feedback and image metadata capture.
- Human alert review with verify, request evidence, dismiss, escalate, and monitor decisions.
- Citizen mission creation/completion, demo analytics/resilience context, and FHIR-compatible observation/risk resource views.

## User preferences

_None recorded._

## Explicit Limitations & Non-Claims (Still Not Implemented)

These items are explicitly NOT claimed as complete:
1. Real sensor or weather providers
2. Real citizen submissions over time
3. Production GIS/map view
4. Real email/SMS notifications
5. Fully wired Clerk authentication and permissions
6. Complete media upload flow from frontend to persistent observation records
7. Full audit-log implementation
8. Scientific validation against real-world datasets
9. Load testing and long-term multi-site operational validation
10. FHIR certification

See `docs/limitations.md` and `README.md` for full architectural rationale.

## Gotchas

- All environmental measurements and analytics in the first build are simulated demo data and must remain labeled that way.
- The shared API server is mounted at `/api`; the AquaSentinel web artifact is mounted at `/`.
- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before updating server or frontend consumers.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
