import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { evaluateCandidate, summarize } from "./benchmark-lib.mjs";

const casesPath = new URL("../benchmarks/cases.json", import.meta.url);
const cases = JSON.parse(await fs.readFile(casesPath, "utf8"));

test("the frozen v0 corpus has eight passing positives and eight caught seeded controls", () => {
  const summary = summarize(cases);
  assert.equal(summary.caseCount, 8);
  assert.equal(summary.expectedPassed, 8);
  assert.equal(summary.negativeCaught, 8);
  assert.equal(summary.modelGenerations, 0);
  assert.equal(summary.humanJudges, 0);
});

test("sentence punctuation is not part of a route, but a route extension is", () => {
  const fixture = cases.find(({ id }) => id === "franco-tech");
  const accepted = evaluateCandidate(fixture, fixture.expectedCandidate);
  const changed = evaluateCandidate(fixture, fixture.expectedCandidate.replace("/v1/orders.", "/v1/orders.json"));
  assert.equal(check(accepted, "protected:/v1/orders"), true);
  assert.equal(check(changed, "protected:/v1/orders"), false);
});

test("3ameiah is accepted as an official name without being satisfied by the version token", () => {
  const fixture = cases.find(({ id }) => id === "claim-boundary");
  const accepted = evaluateCandidate(fixture, fixture.expectedCandidate);
  const missingStandaloneName = evaluateCandidate(fixture, fixture.expectedCandidate.replace(/^3ameiah/, "A3ameiah"));
  assert.equal(check(accepted, "protected:3ameiah"), true);
  assert.equal(check(missingStandaloneName, "protected:3ameiah"), false);
});

function check(evaluation, id) {
  return evaluation.checks.find((entry) => entry.id === id)?.passed;
}
