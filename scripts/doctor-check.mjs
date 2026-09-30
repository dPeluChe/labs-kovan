// Gates the repo on the react-doctor score. The CLI's own --blocking flag only
// knows severities, so this wrapper parses the JSON report and fails under the
// agreed minimum. The score is computed by a remote API; when it cannot be
// obtained the gate fails closed instead of reporting an unverified pass.
import { spawnSync } from "node:child_process";

const MIN_SCORE = 90;

const result = spawnSync("npx", ["--no-install", "react-doctor", ".", "--json"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

if (result.error) {
  console.error(`doctor:check could not run react-doctor: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`doctor:check react-doctor exited ${result.status}`);
  if (result.stderr) console.error(result.stderr.slice(0, 2000));
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error("doctor:check could not parse react-doctor output");
  if (result.stderr) console.error(result.stderr.slice(0, 2000));
  process.exit(1);
}

const score = report.summary?.score ?? report.projects?.[0]?.score ?? null;
if (typeof score !== "number" || !Number.isFinite(score)) {
  console.error("doctor:check could not obtain a numeric react-doctor score (score API unreachable or malformed report); failing closed");
  process.exit(1);
}

const { errorCount = 0, warningCount = 0 } = report.summary ?? {};
console.log(`react-doctor: score ${score} (${errorCount} errors, ${warningCount} warnings)`);

if (score < MIN_SCORE) {
  console.error(`doctor:check score ${score} is below the required ${MIN_SCORE}`);
  process.exit(1);
}
