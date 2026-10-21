import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { summarize } from "./benchmark-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const v0CaseCount = 8;
const casesPath = path.join(root, "benchmarks", "cases.json");
const resultsPath = path.join(root, "benchmarks", "results.json");
const libraryPath = fileURLToPath(new URL("./benchmark-lib.mjs", import.meta.url));
const casesSource = await fs.readFile(casesPath, "utf8");
const librarySource = await fs.readFile(libraryPath, "utf8");
const cases = JSON.parse(casesSource);
const summary = summarize(cases);

if (process.argv.includes("--write")) {
  const stored = {
    benchmarkVersion: "0.1.0",
    skillRevision: "0e51e2c",
    generatedAt: new Date().toISOString(),
    sourceType: "hand-authored-positive-fixtures-and-seeded-negative-controls",
    fixtureHash: sha256(casesSource),
    runnerHash: sha256(librarySource),
    interpretation: "Deterministic protection-harness smoke test; not a model or human language-quality benchmark.",
    ...summary
  };
  await fs.writeFile(resultsPath, `${JSON.stringify(stored, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(root, resultsPath)}`);
}

const failedExpected = summary.caseResults.filter((entry) => !entry.expectedPassed);
const missedNegative = summary.caseResults.filter((entry) => !entry.negativeCaught);
const wrongCaseCount = summary.caseCount !== v0CaseCount;

console.log(`Expected candidates: ${summary.expectedPassed}/${summary.caseCount} passed`);
console.log(`Seeded defects: ${summary.negativeCaught}/${summary.caseCount} caught`);
console.log(`Model generations: ${summary.modelGenerations}`);
console.log(`Native-language judges: ${summary.humanJudges}`);

if (wrongCaseCount) console.error(`FAIL corpus expected ${v0CaseCount} cases, found ${summary.caseCount}`);

if (wrongCaseCount || failedExpected.length || missedNegative.length) {
  for (const entry of [...failedExpected, ...missedNegative]) console.error(`FAIL ${entry.id}`);
  process.exitCode = 1;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
