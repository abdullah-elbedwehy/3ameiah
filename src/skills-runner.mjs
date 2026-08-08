import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

import { REPOSITORY, SKILL_NAMES, SKILLS_VERSION } from "./constants.mjs";
import { CliError } from "./errors.mjs";

const require = createRequire(import.meta.url);
const DEFAULT_INSTALL_AGENTS = ["claude-code", "codex"];

export function buildInstallArgs({
  source = REPOSITORY,
  global = true,
  agents = [],
  allAgents = false,
  copy = false,
  interactive = false,
  list = false
} = {}) {
  if (allAgents && agents.length > 0) {
    throw new CliError("Use either --all-agents or one or more --agent values, not both.", { code: "CONFLICTING_OPTIONS" });
  }
  const args = ["add", source, "--full-depth"];
  if (list) return [...args, "--list"];
  args.push("--skill", "*");
  if (global) args.push("--global");
  if (allAgents) args.push("--agent", "*");
  else if (agents.length > 0) args.push("--agent", ...agents);
  else if (!interactive) args.push("--agent", ...DEFAULT_INSTALL_AGENTS);
  if (copy) args.push("--copy");
  if (!interactive) args.push("--yes");
  return args;
}

export function buildUpdateArgs({ global = true, interactive = false } = {}) {
  const args = ["update", ...SKILL_NAMES];
  args.push(global ? "--global" : "--project");
  if (!interactive) args.push("--yes");
  return args;
}

export function buildDoctorArgs({ global = true } = {}) {
  const args = ["list"];
  if (global) args.push("--global");
  args.push("--json");
  return args;
}

export function printableSkillsCommand(args) {
  return ["npx", "--yes", `skills@${SKILLS_VERSION}`, ...args].map(quote).join(" ");
}

export function runSkills(args, { stdio = "inherit" } = {}) {
  const skillsCli = resolveSkillsCli();
  const result = spawnSync(process.execPath, [skillsCli, ...args], {
    stdio,
    shell: false,
    windowsHide: true
  });
  if (result.error) {
    throw new CliError(`Could not start the skills installer: ${result.error.message}`, { code: "INSTALLER_FAILED" });
  }
  return result.status ?? 1;
}

export function runSkillsJson(args) {
  const skillsCli = resolveSkillsCli();
  const result = spawnSync(process.execPath, [skillsCli, ...args], {
    encoding: "utf8",
    shell: false,
    windowsHide: true
  });
  if (result.error) throw new CliError(`Could not start the skills installer: ${result.error.message}`, { code: "INSTALLER_FAILED" });
  if (result.status !== 0) {
    throw new CliError((result.stderr || result.stdout || "The skills installer failed.").trim(), { code: "INSTALLER_FAILED" });
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new CliError(`The skills installer returned invalid JSON: ${error.message}`, { code: "INSTALLER_INVALID_OUTPUT" });
  }
}

export function installationStatus(installed) {
  const installedNames = new Set(installed.map((item) => item?.name).filter(Boolean));
  const skills = SKILL_NAMES.map((name) => ({ name, installed: installedNames.has(name) }));
  return {
    ok: skills.every((item) => item.installed),
    installed: skills.filter((item) => item.installed).map((item) => item.name),
    missing: skills.filter((item) => !item.installed).map((item) => item.name),
    skills
  };
}

function resolveSkillsCli() {
  try {
    return require.resolve("skills/bin/cli.mjs");
  } catch (error) {
    throw new CliError(`The bundled skills installer could not be resolved: ${error.message}`, { code: "INSTALLER_MISSING" });
  }
}

function quote(value) {
  return /^[A-Za-z0-9_./:@-]+$/.test(value) ? value : JSON.stringify(value);
}
