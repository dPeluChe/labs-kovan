// Gates the repo on the react-doctor score. The CLI's own --blocking flag only
// knows severities, so this wrapper parses the JSON report and fails under the
// agreed minimum. If the remote score API is unreachable the score is null and
// the check warns instead of blocking CI.
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

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error("doctor:check could not parse react-doctor output");
  if (result.stderr) console.error(result.stderr.slice(0, 2000));
  process.exit(result.status ?? 1);
}

const score = report.summary?.score ?? report.projects?.[0]?.score ?? null;
if (score === null) {
  console.warn("doctor:check score unavailable (score API unreachable); not blocking");
  process.exit(0);
}

const { errorCount = 0, warningCount = 0 } = report.summary ?? {};
console.log(`react-doctor: score ${score} (${errorCount} errors, ${warningCount} warnings)`);

if (result.status !== 0) {
  console.error(`doctor:check react-doctor exited ${result.status}`);
  process.exit(1);
}

if (score < MIN_SCORE) {
  console.error(`doctor:check score ${score} is below the required ${MIN_SCORE}`);
  process.exit(1);
}
