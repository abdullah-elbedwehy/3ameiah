import { CliError } from "./errors.mjs";

export function parseArgs(argv) {
  const positionals = [];
  const options = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--") {
      positionals.push(...argv.slice(index + 1));
      break;
    }
    if (!token.startsWith("-") || token === "-") {
      positionals.push(token);
      continue;
    }

    const equalIndex = token.indexOf("=");
    const rawKey = equalIndex === -1 ? token : token.slice(0, equalIndex);
    const inlineValue = equalIndex === -1 ? undefined : token.slice(equalIndex + 1);
    const key = normalizeFlag(rawKey);

    if (BOOLEAN_FLAGS.has(key)) {
      if (inlineValue !== undefined) {
        throw new CliError(`Option --${key} does not take a value.`, { code: "INVALID_OPTION" });
      }
      addOption(options, key, true);
      continue;
    }

    const value = inlineValue ?? argv[index + 1];
    if (value === undefined || (inlineValue === undefined && value.startsWith("-"))) {
      throw new CliError(`Option --${key} needs a value.`, { code: "MISSING_OPTION_VALUE" });
    }
    addOption(options, key, value);
    if (inlineValue === undefined) index += 1;
  }

  return { positionals, options };
}

function normalizeFlag(flag) {
  const aliases = {
    "-g": "global",
    "-p": "project",
    "-a": "agent",
    "-y": "yes",
    "-f": "force",
    "-h": "help",
    "-v": "version"
  };
  if (aliases[flag]) return aliases[flag];
  if (!flag.startsWith("--") || flag.length < 3) {
    throw new CliError(`Unknown option: ${flag}`, { code: "UNKNOWN_OPTION" });
  }
  return flag.slice(2);
}

function addOption(options, key, value) {
  const current = options.get(key);
  if (current === undefined) options.set(key, value);
  else if (Array.isArray(current)) current.push(value);
  else options.set(key, [current, value]);
}

const BOOLEAN_FLAGS = new Set([
  "all-agents",
  "copy",
  "dry-run",
  "force",
  "global",
  "help",
  "include-samples",
  "interactive",
  "json",
  "list",
  "off",
  "project",
  "show",
  "version",
  "yes"
]);

export function getOption(parsed, name, fallback = undefined) {
  return parsed.options.has(name) ? parsed.options.get(name) : fallback;
}

export function getMany(parsed, name) {
  const value = parsed.options.get(name);
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function assertKnownOptions(parsed, allowed) {
  const allowedSet = new Set(allowed);
  const unknown = [...parsed.options.keys()].filter((key) => !allowedSet.has(key));
  if (unknown.length > 0) {
    throw new CliError(`Unknown option${unknown.length === 1 ? "" : "s"}: ${unknown.map((key) => `--${key}`).join(", ")}`, {
      code: "UNKNOWN_OPTION"
    });
  }
}
