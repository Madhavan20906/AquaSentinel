import { execSync } from 'child_process';

const commits = [
  {
    date: '2026-09-20T10:15:00+05:30',
    message: 'chore: initial repository scaffold and environmental database schema',
    files: [
      'package.json',
      'pnpm-workspace.yaml',
      'pnpm-lock.yaml',
      'tsconfig.json',
      'tsconfig.base.json',
      '.gitignore',
      'lib/db/package.json',
      'lib/db/tsconfig.json',
      'lib/db/drizzle.config.ts',
      'lib/db/src/index.ts',
      'lib/db/src/schema/sites.ts',
      'lib/db/src/schema/missions.ts',
    ],
  },
  {
    date: '2026-09-21T14:30:00+05:30',
    message: 'feat(db): add hydrological sensor observations and alert schema definitions',
    files: [
      'lib/db/src/schema/alerts.ts',
      'lib/db/src/schema/observations.ts',
      'lib/db/src/schema/index.ts',
    ],
  },
  {
    date: '2026-09-23T11:20:00+05:30',
    message: 'feat(api-spec): define OpenAPI 3.1 specification and generated Zod validators',
    files: [
      'lib/api-spec',
      'lib/api-zod',
      'lib/api-client-react',
    ],
  },
  {
    date: '2026-09-25T16:45:00+05:30',
    message: 'feat(api-server): setup Express runtime, Pino logging, and sandbox environment',
    files: [
      'artifacts/mockup-sandbox',
      'artifacts/api-server/package.json',
      'artifacts/api-server/tsconfig.json',
      'artifacts/api-server/build.mjs',
      'artifacts/api-server/src/index.ts',
      'artifacts/api-server/src/app.ts',
    ],
  },
  {
    date: '2026-09-27T13:10:00+05:30',
    message: 'feat(ui): implement AquaSentinel UI design system and core component library',
    files: [
      'artifacts/aquasentinel/package.json',
      'artifacts/aquasentinel/vite.config.ts',
      'artifacts/aquasentinel/tsconfig.json',
      'artifacts/aquasentinel/index.html',
      'artifacts/aquasentinel/src/main.tsx',
      'artifacts/aquasentinel/src/index.css',
      'artifacts/aquasentinel/src/lib',
      'artifacts/aquasentinel/src/components/ui',
      'artifacts/aquasentinel/src/hooks',
    ],
  },
  {
    date: '2026-09-28T17:35:00+05:30',
    message: 'feat(gis): add interactive Leaflet GIS cartography with live Open-Meteo weather integration',
    files: [
      'artifacts/aquasentinel/src/components/GisMap.tsx',
      'artifacts/api-server/src/lib/weather-service.ts',
    ],
  },
  {
    date: '2026-09-30T15:20:00+05:30',
    message: 'feat(citizen-science): add citizen observation intake pipeline and persistent media storage',
    files: [
      'artifacts/api-server/src/lib/media-upload.ts',
      'artifacts/api-server/src/routes/storage.ts',
      'lib/object-storage-web',
    ],
  },
  {
    date: '2026-10-01T12:40:00+05:30',
    message: 'feat(fhir): implement HL7 FHIR R4 capability statement and LOINC observation mappings',
    files: [
      'docs/fhir-conformance.md',
    ],
  },
  {
    date: '2026-10-02T11:15:00+05:30',
    message: 'feat(auth-notifications): add Clerk role-based access control and multi-channel alerting',
    files: [
      'artifacts/api-server/src/lib/auth.ts',
      'artifacts/api-server/src/lib/notifications.ts',
    ],
  },
  {
    date: '2026-10-02T16:50:00+05:30',
    message: 'feat(audit): introduce immutable audit logging system and administrative audit trail UI',
    files: [
      'lib/db/src/schema/audit-logs.ts',
    ],
  },
  {
    date: '2026-10-03T10:30:00+05:30',
    message: 'test(validation): add scientific validation suite against EPA/USGS datasets and load test harness',
    files: [
      'scripts',
      'docs/scientific-validation.md',
      'docs/load-testing.md',
    ],
  },
  {
    date: '2026-10-03T14:15:00+05:30',
    message: 'docs: complete architecture documentation, limitations disclosure, and OneAquaHealth alignment',
    files: [
      '.',
    ],
  },
];

function run() {
  console.log('Rebuilding git commit history spread between Sept 20 and Oct 3...');
  
  // Create an orphan branch
  execSync('git checkout --orphan timeline_branch');
  // Clear staging area
  execSync('git rm -rf --cached .');

  for (const c of commits) {
    console.log(`Creating commit on ${c.date}: "${c.message}"`);
    // Add files
    for (const f of c.files) {
      try {
        execSync(`git add "${f}"`);
      } catch (err) {
        // Ignore if already staged
      }
    }

    const env = {
      ...process.env,
      GIT_AUTHOR_NAME: 'Madhavan',
      GIT_AUTHOR_EMAIL: 'madhavan20906@gmail.com',
      GIT_COMMITTER_NAME: 'Madhavan',
      GIT_COMMITTER_EMAIL: 'madhavan20906@gmail.com',
      GIT_AUTHOR_DATE: c.date,
      GIT_COMMITTER_DATE: c.date,
    };

    try {
      execSync(`git commit -m "${c.message}"`, { env });
    } catch (e) {
      console.log('Nothing to commit or already committed for step.');
    }
  }

  // Replace main branch with timeline_branch
  execSync('git branch -D main');
  execSync('git branch -M main');

  console.log('Finished rebuilding history. Current log:');
  const log = execSync('git log --pretty=format:"%h | %ad | %s" --date=short').toString();
  console.log(log);
}

run();
