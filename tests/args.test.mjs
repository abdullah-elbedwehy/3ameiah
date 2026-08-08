import assert from "node:assert/strict";
import test from "node:test";

import { assertKnownOptions, getMany, getOption, parseArgs } from "../src/args.mjs";

test("argument parser supports repeated values and aliases", () => {
  const parsed = parseArgs(["-g", "--agent", "claude-code", "--agent=codex", "--copy"]);
  assert.equal(getOption(parsed, "global"), true);
  assert.deepEqual(getMany(parsed, "agent"), ["claude-code", "codex"]);
  assert.equal(getOption(parsed, "copy"), true);
});

test("argument parser preserves values after --", () => {
  const parsed = parseArgs(["--json", "--", "--literal", "task"]);
  assert.deepEqual(parsed.positionals, ["--literal", "task"]);
});

test("unknown options are rejected by each command contract", () => {
  const parsed = parseArgs(["--mystery", "value"]);
  assert.throws(() => assertKnownOptions(parsed, ["json"]), /Unknown option/);
});

test("boolean options reject inline values", () => {
  assert.throws(() => parseArgs(["--json=false"]), /does not take a value/);
});
