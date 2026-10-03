/**
 * AquaSentinel Operational Load Test Suite
 * Measures latency, throughput, and error rates under concurrent load across critical endpoints:
 * - GET /api/dashboard
 * - GET /api/sites
 * - GET /api/audit-logs
 * - GET /api/fhir/Observation
 */

interface LoadTestOptions {
  baseUrl: string;
  concurrency: number;
  totalRequests: number;
  endpoints: string[];
}

interface RequestMetrics {
  duration: number;
  statusCode: number;
  error?: string;
}

async function makeRequest(url: string): Promise<RequestMetrics> {
  const start = performance.now();
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const duration = performance.now() - start;
    return { duration, statusCode: res.status };
  } catch (err: any) {
    const duration = performance.now() - start;
    return { duration, statusCode: 0, error: err.message };
  }
}

async function runWorker(
  queue: string[],
  results: RequestMetrics[]
): Promise<void> {
  while (queue.length > 0) {
    const url = queue.shift();
    if (!url) break;
    const metric = await makeRequest(url);
    results.push(metric);
  }
}

export async function runLoadTest(options: LoadTestOptions) {
  console.log("================================================================================");
  console.log("                   AQUASENTINEL LOAD & CONCURRENCY TEST SUITE                   ");
  console.log("================================================================================");
  console.log(`Base URL          : ${options.baseUrl}`);
  console.log(`Target Concurrency: ${options.concurrency} parallel clients`);
  console.log(`Total Requests    : ${options.totalRequests}`);
  console.log(`Endpoints Under Test:`);
  options.endpoints.forEach((ep) => console.log(`  - ${ep}`));
  console.log("--------------------------------------------------------------------------------\n");

  const queue: string[] = [];
  for (let i = 0; i < options.totalRequests; i++) {
    const ep = options.endpoints[i % options.endpoints.length];
    queue.push(`${options.baseUrl}${ep}`);
  }

  const results: RequestMetrics[] = [];
  const testStart = performance.now();

  const workers = Array.from({ length: options.concurrency }, () =>
    runWorker(queue, results)
  );

  await Promise.all(workers);
  const totalDurationSeconds = (performance.now() - testStart) / 1000;

  const successful = results.filter((r) => r.statusCode >= 200 && r.statusCode < 400);
  const failed = results.filter((r) => r.statusCode === 0 || r.statusCode >= 400);
  const latencies = results.map((r) => r.duration).sort((a, b) => a - b);

  const avgLatency = latencies.reduce((sum, d) => sum + d, 0) / (latencies.length || 1);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = results.length / totalDurationSeconds;

  console.log("Results Summary:");
  console.log(`- Total Requests Completed : ${results.length}`);
  console.log(`- Success Rate             : ${((successful.length / results.length) * 100).toFixed(2)}% (${successful.length} passed, ${failed.length} failed)`);
  console.log(`- Total Elapsed Time       : ${totalDurationSeconds.toFixed(2)}s`);
  console.log(`- Throughput (req/sec)     : ${rps.toFixed(1)} RPS`);
  console.log(`- Mean Latency             : ${avgLatency.toFixed(2)} ms`);
  console.log(`- p50 Latency              : ${p50.toFixed(2)} ms`);
  console.log(`- p95 Latency              : ${p95.toFixed(2)} ms`);
  console.log(`- p99 Latency              : ${p99.toFixed(2)} ms`);
  console.log("--------------------------------------------------------------------------------\n");

  if (p95 > 250) {
    console.warn("⚠️ Warning: p95 latency exceeded the 250ms target threshold.");
  } else {
    console.log("✓ SLA Met: Latencies well within operational target bounds (< 250ms p95).");
  }
}

// Allow direct CLI invocation with defaults
const port = process.env.PORT || "5000";
const baseUrl = process.env.TEST_URL || `http://127.0.0.1:${port}`;

const options: LoadTestOptions = {
  baseUrl,
  concurrency: 10,
  totalRequests: 100,
  endpoints: [
    "/api/dashboard",
    "/api/sites",
    "/api/audit-logs",
    "/api/fhir/Observation",
  ],
};

// If run directly, run test against configured url or simulate
if (process.argv.includes("--run")) {
  runLoadTest(options).catch(console.error);
} else {
  console.log("AquaSentinel Load Test Suite compiled. Run with 'pnpm run test:load' or node --run.");
}
