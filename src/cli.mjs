import { assertKnownOptions, getMany, getOption, parseArgs } from "./args.mjs";
import { MODES, PACKAGE_VERSION } from "./constants.mjs";
import { CliError } from "./errors.mjs";
import {
  activateProfile,
  learnProfile,
  listProfiles,
  profileContext,
  readSafeTextFile,
  resolveProfile,
} from "./profiles.mjs";
import { collectProfileAnswers } from "./prompts.mjs";
import {
  buildDoctorArgs,
  buildInstallArgs,
  buildUpdateArgs,
  installationStatus,
  printableSkillsCommand,
  runSkills,
  runSkillsJson
} from "./skills-runner.mjs";

export async function main(argv, io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  try {
    const [command = "help", ...rest] = argv;
    if (["help", "--help", "-h"].includes(command)) {
      stdout.write(HELP);
      return 0;
    }
    if (["--version", "-v", "version"].includes(command)) {
      stdout.write(`${PACKAGE_VERSION}\n`);
      return 0;
    }
    if (hasHelpFlag(rest)) {
      stdout.write(HELP);
      return 0;
    }
    if (command === "install") return await installCommand(rest, { stdout });
    if (command === "update") return await updateCommand(rest, { stdout });
    if (command === "doctor") return await doctorCommand(rest, { stdout });
    if (command === "learn" || command === "init") return await learnCommand(rest, { stdout });
    if (command === "use") return await useCommand(rest, { stdout });
    if (command === "profiles") return await listCommand(rest, { stdout });
    if (command === "profile") return await profileCommand(rest, { stdout });
    throw new CliError(`Unknown command '${command}'. Run '3ameiah help' for usage.`, { code: "UNKNOWN_COMMAND" });
  } catch (error) {
    const exitCode = error instanceof CliError ? error.exitCode : 1;
    if (getRawJsonFlag(argv)) {
      stderr.write(`${JSON.stringify({ ok: false, error: { code: error.code ?? "UNEXPECTED_ERROR", message: error.message } })}\n`);
    } else {
      stderr.write(`3ameiah: ${error.message}\n`);
    }
    return exitCode;
  }
}

async function installCommand(argv, { stdout }) {
  const parsed = parseArgs(argv);
  assertKnownOptions(parsed, [
    "agent", "all-agents", "copy", "dry-run", "global", "interactive", "list", "project", "source", "yes"
  ]);
  ensureNoPositionals(parsed, "install");
  ensureScopeFlags(parsed);
  const args = buildInstallArgs({
    source: getOption(parsed, "source"),
    global: !getOption(parsed, "project", false),
    agents: getMany(parsed, "agent"),
    allAgents: getOption(parsed, "all-agents", false),
    copy: getOption(parsed, "copy", false),
    interactive: getOption(parsed, "interactive", false) && !getOption(parsed, "yes", false),
    list: getOption(parsed, "list", false)
  });
  if (getOption(parsed, "dry-run", false)) {
    stdout.write(`${printableSkillsCommand(args)}\n`);
    return 0;
  }
  return runSkills(args);
}

async function updateCommand(argv, { stdout }) {
  const parsed = parseArgs(argv);
  assertKnownOptions(parsed, ["dry-run", "global", "interactive", "project", "yes"]);
  ensureNoPositionals(parsed, "update");
  ensureScopeFlags(parsed);
  const args = buildUpdateArgs({
    global: !getOption(parsed, "project", false),
    interactive: getOption(parsed, "interactive", false) && !getOption(parsed, "yes", false)
  });
  if (getOption(parsed, "dry-run", false)) {
    stdout.write(`${printableSkillsCommand(args)}\n`);
    return 0;
  }
  return runSkills(args);
}

async function doctorCommand(argv, { stdout }) {
  const parsed = parseArgs(argv);
  assertKnownOptions(parsed, ["dry-run", "global", "json", "project"]);
  ensureNoPositionals(parsed, "doctor");
  ensureScopeFlags(parsed);
  const args = buildDoctorArgs({ global: !getOption(parsed, "project", false) });
  if (getOption(parsed, "dry-run", false)) {
    stdout.write(`${printableSkillsCommand(args)}\n`);
    return 0;
  }
  const status = installationStatus(runSkillsJson(args));
  if (getOption(parsed, "json", false)) stdout.write(`${JSON.stringify(status)}\n`);
  else {
    for (const skill of status.skills) stdout.write(`${skill.installed ? "✓" : "✗"} ${skill.name}\n`);
    if (!status.ok) stdout.write(`Missing ${status.missing.length} skill(s). Repair with: npx 3ameiah install\n`);
  }
  return status.ok ? 0 : 1;
}

async function learnCommand(argv, { stdout }) {
  const parsed = parseArgs(argv);
  assertKnownOptions(parsed, [
    "about", "address", "audience", "avoid", "code-switching", "directness", "dislike", "from",
    "interactive", "json", "mode", "note", "prefer", "spelling", "tone", "tone-file", "warmth",
    "formality", "yes"
  ]);
  const [profileName, ...lessonParts] = parsed.positionals;

  let tone = getOption(parsed, "tone");
  const toneFile = getOption(parsed, "tone-file");
  if (tone !== undefined && toneFile !== undefined) {
    throw new CliError("Use either --tone or --tone-file, not both.", { code: "CONFLICTING_OPTIONS" });
  }
  if (toneFile) tone = (await readSafeTextFile(toneFile, 32 * 1024, "tone file")).trim();

  const seed = {
    name: profileName,
    mode: getOption(parsed, "mode"),
    tone,
    audience: getOption(parsed, "audience"),
    address: getOption(parsed, "address"),
    formality: getOption(parsed, "formality"),
    warmth: getOption(parsed, "warmth"),
    directness: getOption(parsed, "directness"),
    codeSwitching: getOption(parsed, "code-switching"),
    spellings: getMany(parsed, "spelling"),
    prefer: getMany(parsed, "prefer"),
    avoid: getMany(parsed, "avoid"),
    about: [...getMany(parsed, "about"), ...(lessonParts.length > 0 ? [lessonParts.join(" ")] : [])],
    sampleFiles: getMany(parsed, "from"),
    dislikedSampleFiles: getMany(parsed, "dislike"),
    note: getOption(parsed, "note")
  };
  const answers = getOption(parsed, "yes", false)
    ? seed
    : await collectProfileAnswers(seed, { forceInteractive: getOption(parsed, "interactive", false) });
  if (!answers.name) {
    throw new CliError(
      "Name the profile first, for example: 3ameiah learn creator. Then describe your style, add samples, or answer the guided questions.",
      { code: "MISSING_PROFILE_NAME" }
    );
  }
  const result = await learnProfile(answers);
  if (getOption(parsed, "json", false)) stdout.write(`${JSON.stringify({ ok: true, ...redactResultProfile(result) })}\n`);
  else {
    stdout.write(`${result.action === "created" ? "Created" : "Updated"} profile '${result.profile.id}' (${result.profile.displayName}), revision ${result.profile.revision}.\n`);
    stdout.write(`Saved to ${result.path}\n`);
    writeStyleprintSummary(result, stdout);
    const learned = result.profile.learningLog.at(-1)?.fields ?? [];
    if (learned.length > 0 && learned.every((field) => ["likedSamples", "dislikedSamples", "styleprint"].includes(field))) {
      stdout.write("Measured the writing only; the terminal never infers tone rules, facts, or preferences from a sample.\n");
      stdout.write(`Next in your agent: /3ameiah-learn ${result.profile.id} راجع الـ styleprint واقترح قواعد الأسلوب قبل ما تحفظها\n`);
    }
    stdout.write(`Activate it here with: npx 3ameiah use ${result.profile.id}\n`);
  }
  return 0;
}

function writeStyleprintSummary({ profile, measuredOnly = [] }, stdout) {
  for (const { source, characters } of measuredOnly) {
    stdout.write(`Measured '${source}' in full (${characters} characters); it is too large to store, so only the styleprint keeps it.\n`);
  }
  const styleprint = profile.styleprint;
  if (!styleprint) return;
  const { corpus, rhythm } = styleprint;
  stdout.write(`Styleprint: ${corpus.words} words, ${corpus.sentences} sentences, ~${rhythm.wordsPerSentence} words per sentence.\n`);
  const signature = [...styleprint.tics, ...styleprint.phrases]
    .sort((left, right) => right.count - left.count)
    .slice(0, 6)
    .map((entry) => `${entry.text} (${entry.count})`);
  if (signature.length > 0) stdout.write(`Recurring wording: ${signature.join("، ")}\n`);
  stdout.write(`Kept ${styleprint.excerpts.length} excerpt(s), ${styleprint.openers.length} opener(s), ${styleprint.closers.length} closer(s).\n`);
}

async function useCommand(argv, { stdout }) {
  const parsed = parseArgs(argv);
  assertKnownOptions(parsed, ["json", "off", "show"]);
  if (parsed.positionals.length > 1) throw new CliError("use accepts one profile name.", { code: "TOO_MANY_ARGUMENTS" });
  if (getOption(parsed, "show", false)) return showResolvedProfile(parsed.positionals[0], { stdout, json: getOption(parsed, "json", false) });
  const off = getOption(parsed, "off", false);
  const name = parsed.positionals[0];
  if (!off && !name) throw new CliError("Profile name is required. Pass it as: 3ameiah-use <name>.", { code: "MISSING_PROFILE_NAME" });
  const result = await activateProfile(name, { off });
  if (getOption(parsed, "json", false)) stdout.write(`${JSON.stringify({ ok: true, ...redactResultProfile(result) })}\n`);
  else if (off) stdout.write(`3ameiah profile is off for this ${result.scope} scope.\n`);
  else {
    stdout.write(`Using '${result.profile.id}' (${result.profile.displayName}) as the active global tone profile.\n`);
    stdout.write(`Activation saved to ${result.activationPath}\n`);
  }
  return 0;
}

async function profileCommand(argv, { stdout }) {
  const [subcommand = "list", ...rest] = argv;
  if (subcommand === "list") return listCommand(rest, { stdout });
  if (["show", "context"].includes(subcommand)) {
    const parsed = parseArgs(rest);
    assertKnownOptions(parsed, ["include-samples", "json"]);
    if (parsed.positionals.length > 1) throw new CliError(`${subcommand} accepts one profile name.`, { code: "TOO_MANY_ARGUMENTS" });
    return showResolvedProfile(parsed.positionals[0], {
      stdout,
      json: getOption(parsed, "json", false) || subcommand === "context",
      contextOnly: subcommand === "context",
      includeSamples: getOption(parsed, "include-samples", false)
    });
  }
  throw new CliError(`Unknown profile command '${subcommand}'. Use list, show, or context.`, { code: "UNKNOWN_COMMAND" });
}

async function listCommand(argv, { stdout }) {
  const parsed = parseArgs(argv);
  assertKnownOptions(parsed, ["json"]);
  ensureNoPositionals(parsed, "profile list");
  const rows = await listProfiles();
  if (getOption(parsed, "json", false)) {
    const profiles = rows.map((row) => row.profile ? { ...row, profile: redactProfile(row.profile) } : row);
    stdout.write(`${JSON.stringify({ ok: true, profiles })}\n`);
  }
  else if (rows.length === 0) stdout.write("No 3ameiah profiles found.\n");
  else {
    for (const row of rows) {
      if (row.error) stdout.write(`! ${row.scope}: ${row.path} — ${row.error}\n`);
      else stdout.write(`- ${row.profile.id} (${row.profile.displayName}) [${row.scope}] ${row.profile.defaultMode}, revision ${row.profile.revision}\n`);
    }
  }
  return 0;
}

async function showResolvedProfile(name, { stdout, json = false, contextOnly = false, includeSamples = false }) {
  const found = await resolveProfile({ name });
  if (!found) throw new CliError(name ? `Profile '${name}' was not found.` : "No active profile was found.", { code: "PROFILE_NOT_FOUND" });
  const value = contextOnly ? profileContext(found, { includeSamples }) : found;
  if (json) stdout.write(`${JSON.stringify({ ok: true, ...(contextOnly ? { context: value } : value) })}\n`);
  else stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  return 0;
}

function ensureScopeFlags(parsed) {
  if (getOption(parsed, "global", false) && getOption(parsed, "project", false)) {
    throw new CliError("Use either --global or --project, not both.", { code: "CONFLICTING_OPTIONS" });
  }
}

function ensureNoPositionals(parsed, command) {
  if (parsed.positionals.length > 0) {
    throw new CliError(`${command} does not accept positional arguments: ${parsed.positionals.join(" ")}`, { code: "TOO_MANY_ARGUMENTS" });
  }
}

function getRawJsonFlag(argv) {
  return argv.includes("--json");
}

function hasHelpFlag(argv) {
  for (const value of argv) {
    if (value === "--") return false;
    if (["--help", "-h"].includes(value)) return true;
  }
  return false;
}

function redactResultProfile(result) {
  return result.profile ? { ...result, profile: redactProfile(result.profile) } : result;
}

function redactProfile(profile) {
  const { samples, ...safe } = profile;
  return {
    ...safe,
    sampleEvidence: {
      liked: samples.filter((sample) => sample.label === "liked").length,
      disliked: samples.filter((sample) => sample.label === "disliked").length
    }
  };
}

const HELP = `3ameiah ${PACKAGE_VERSION}

Natural Egyptian Arabic and Franco Agent Skills.

Usage:
  npx 3ameiah install [options]
  npx 3ameiah learn <name> [what it should learn]
  npx 3ameiah use <name>
  npx 3ameiah use --off
  npx 3ameiah profiles [--json]
  npx 3ameiah profile show [name] [--json]
  npx 3ameiah profile context [name] [--include-samples]
  npx 3ameiah doctor
  npx 3ameiah update

Install options:
  --project              Install into the current project (global is the default)
  --agent <id>           Install to a specific agent; repeat as needed
  --all-agents           Explicitly target every agent known to the installer
  --copy                 Copy instead of using shared links where supported
  --interactive          Ask which detected agents to target
  --list                 Inspect the repository without installing
  --dry-run              Print the delegated universal command only
  --source <repo>        Install from a fork, URL, or local directory

Profile options:
  --mode <mode>          One of: ${MODES.join(", ")}
  --about <text>         A style-relevant fact about you; repeat as needed
  --tone <text>          Short tone description
  --tone-file <path>     Read the tone description from a file
  --from <path>          Add a local writing sample and measure its styleprint; repeat as needed
  --dislike <path>       Add an example that is not your style
  --audience <text>      Main audience
  --address <text>       Address convention, for example إنت or حضرتك
  --formality <1-5>      Formality level
  --warmth <1-5>         Warmth level
  --directness <1-5>     Directness level
  --code-switching <x>   Natural, low, high, or a custom convention
  --prefer <rule>        Preferred wording or style rule; repeat as needed
  --avoid <rule>         Wording or habit to avoid; repeat as needed
  --note <text>          Explain what this learning update improves
  --include-samples      Include raw samples only in explicit profile context output
  --yes                  Use defaults without interactive questions
  --json                 Machine-readable output

Styleprint:
  Every --from sample is measured in full: recurring words and phrases, Egyptian discourse
  markers, spelling choices, sentence rhythm, punctuation and emoji habits, plus a bounded
  set of verbatim openers, closers, and representative excerpts. A file too large to store
  is still measured; only its raw text is left out. The terminal measures and never infers
  preferences, facts, or claims from what it read.

Profile privacy:
  Profiles are stored globally in your private user config, never inside a repository.
  The styleprint travels with profile context so the voice can actually be reproduced.
  Whole raw samples stay out of context unless requested with --include-samples.

Convenience after a global npm install:
  3ameiah learn my-tone
  3ameiah-learn my-tone
  3ameiah-use my-tone
`;
