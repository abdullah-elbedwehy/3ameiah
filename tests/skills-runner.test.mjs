import assert from "node:assert/strict";
import test from "node:test";

import { SKILL_NAMES } from "../src/constants.mjs";
import { buildInstallArgs, buildUpdateArgs, installationStatus, printableSkillsCommand } from "../src/skills-runner.mjs";

test("default install safely targets Claude Code and Codex globally", () => {
  assert.deepEqual(buildInstallArgs(), [
    "add",
    "abdullah-elbedwehy/3ameiah",
    "--full-depth",
    "--skill",
    "*",
    "--global",
    "--agent",
    "claude-code",
    "codex",
    "--yes"
  ]);
});

test("interactive install delegates agent detection without a noninteractive all-agent fallback", () => {
  const args = buildInstallArgs({ interactive: true });
  assert.deepEqual(args, [
    "add",
    "abdullah-elbedwehy/3ameiah",
    "--full-depth",
    "--skill",
    "*",
    "--global"
  ]);
  assert.equal(args.includes("--yes"), false);
  assert.equal(args.includes("--agent"), false);
});

test("all agents is explicit and specific agents can repeat", () => {
  assert.deepEqual(buildInstallArgs({ allAgents: true }), [
    "add", "abdullah-elbedwehy/3ameiah", "--full-depth", "--skill", "*", "--global", "--agent", "*", "--yes"
  ]);
  assert.deepEqual(buildInstallArgs({ agents: ["claude-code", "codex"], global: false, copy: true }), [
    "add", "abdullah-elbedwehy/3ameiah", "--full-depth", "--skill", "*", "--agent", "claude-code", "codex", "--copy", "--yes"
  ]);
  assert.deepEqual(buildInstallArgs({ agents: ["cursor"], interactive: true }), [
    "add", "abdullah-elbedwehy/3ameiah", "--full-depth", "--skill", "*", "--global", "--agent", "cursor"
  ]);
  assert.throws(() => buildInstallArgs({ allAgents: true, agents: ["codex"] }), /either --all-agents/);
});

test("list mode does not install or choose a scope", () => {
  assert.deepEqual(buildInstallArgs({ list: true }), [
    "add", "abdullah-elbedwehy/3ameiah", "--full-depth", "--list"
  ]);
});

test("update is scoped to only the owned 3ameiah skills", () => {
  const args = buildUpdateArgs();
  assert.deepEqual(args.slice(0, 1 + SKILL_NAMES.length), ["update", ...SKILL_NAMES]);
  assert.ok(args.includes("--global"));
  assert.ok(args.includes("--yes"));
  const project = buildUpdateArgs({ global: false });
  assert.ok(project.includes("--project"));
  assert.equal(project.includes("--global"), false);
});

test("printable command safely quotes wildcard arguments", () => {
  const command = printableSkillsCommand(buildInstallArgs({ allAgents: true }));
  assert.match(command, /^npx --yes skills@1\.5\.22 add /);
  assert.match(command, /"\*"/);
});

test("doctor status fails when any owned skill is missing", () => {
  const partial = installationStatus([{ name: "3ameiah" }, { name: "unrelated" }]);
  assert.equal(partial.ok, false);
  assert.deepEqual(partial.installed, ["3ameiah"]);
  assert.equal(partial.missing.length, SKILL_NAMES.length - 1);

  const complete = installationStatus(SKILL_NAMES.map((name) => ({ name })));
  assert.equal(complete.ok, true);
  assert.deepEqual(complete.missing, []);
});
