// Post-build sanity gate (OPT-007 / BUNDLE-SMOKE). Two checks on dist/assets:
// 1. The static-import graph between emitted chunks must be acyclic — the
//    PR #19 regression was a react-vendor <-> vendor cycle that crashed the
//    browser at eval while lint, tests and build stayed green.
// 2. Every vendor chunk must import cleanly in Node, which reproduces that
//    same init-order crash locally. Page chunks are skipped on purpose: they
//    legitimately touch browser globals (document) at eval time.
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const assetsDir = resolve("dist/assets");

let chunks;
try {
  chunks = readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
} catch {
  console.error("bundle-smoke: dist/assets not found — run `vite build` first");
  process.exit(1);
}
if (chunks.length === 0) {
  console.error("bundle-smoke: no JS chunks under dist/assets");
  process.exit(1);
}

// Static sibling imports only (`from "./x.js"` / `import "./x.js"`); dynamic
// `import("./x.js")` edges are lazy by design and excluded on purpose.
const edges = new Map();
for (const file of chunks) {
  const src = readFileSync(join(assetsDir, file), "utf8");
  const deps = new Set();
  for (const m of src.matchAll(/from\s*["']\.\/([^"']+)["']/g)) deps.add(m[1]);
  for (const m of src.matchAll(/import\s*["']\.\/([^"']+)["']/g)) deps.add(m[1]);
  edges.set(file, [...deps].filter((d) => chunks.includes(d)));
}

const state = new Map();
const cycles = [];
function visit(node, stack) {
  state.set(node, 1);
  stack.push(node);
  for (const dep of edges.get(node)) {
    if (state.get(dep) === 1) cycles.push([...stack.slice(stack.indexOf(dep)), dep]);
    else if (!state.has(dep)) visit(dep, stack);
  }
  stack.pop();
  state.set(node, 2);
}
for (const file of chunks) if (!state.has(file)) visit(file, []);

if (cycles.length > 0) {
  for (const cycle of cycles) {
    console.error(`bundle-smoke: circular chunk imports: ${cycle.join(" -> ")}`);
  }
  process.exit(1);
}

const vendorChunks = chunks.filter((f) => f.includes("vendor"));
let failed = false;
for (const file of vendorChunks) {
  try {
    await import(pathToFileURL(join(assetsDir, file)).href);
  } catch (err) {
    failed = true;
    console.error(`bundle-smoke: ${file} threw on import: ${err.message}`);
  }
}
if (failed) process.exit(1);

console.log(
  `bundle-smoke: ${chunks.length} chunks, no cycles; ${vendorChunks.length} vendor chunks import cleanly`
);
