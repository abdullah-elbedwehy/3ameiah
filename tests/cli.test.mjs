import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "bin", "3ameiah.mjs");
const learnBin = path.join(root, "bin", "3ameiah-learn.mjs");
const useBin = path.join(root, "bin", "3ameiah-use.mjs");

function run(bin, args, options = {}) {
  return spawnSync(process.execPath, [bin, ...args], {
    cwd: options.cwd ?? root,
    env: { ...process.env, ...options.env },
    encoding: "utf8",
    shell: false
  });
}

test("CLI reports the published package version and a safe noninteractive installer", async () => {
  const published = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")).version;
  const version = run(cli, ["--version"]);
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), published, "CLI version must track package.json");

  const install = run(cli, ["install", "--dry-run"]);
  assert.equal(install.status, 0);
  assert.match(install.stdout, /skills@1\.5\.22 add abdullah-elbedwehy\/3ameiah/);
  assert.match(install.stdout, /--global/);
  assert.match(install.stdout, /--agent claude-code codex/);
  assert.doesNotMatch(install.stdout, /--agent ["']?\*["']?/);
});

test("subcommands and convenience bins expose help without starting work", () => {
  for (const [bin, args] of [
    [cli, ["learn", "--help"]],
    [cli, ["use", "-h"]],
    [cli, ["update", "--help"]],
    [learnBin, ["--help"]],
    [useBin, ["--help"]]
  ]) {
    const result = run(bin, args);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Natural Egyptian Arabic and Franco Agent Skills/);
  }
});

test("project update keeps the requested project scope", () => {
  const result = run(cli, ["update", "--project", "--dry-run"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /--project/);
  assert.doesNotMatch(result.stdout, /--global/);
});

test("CLI learns, improves, and activates a profile; convenience bin matches use", async (t) => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "3ameiah-cli-test-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const globalRoot = path.join(temp, "global");
  const env = { THREEAMEIAH_CONFIG_DIR: globalRoot };

  const learn = run(cli, [
    "learn", "Creator_Tone", "--yes", "--tone", "سريع وواضح", "--mode", "3ameiah-friendly", "--about", "بعمل محتوى تعليمي", "--json"
  ], { cwd: temp, env });
  assert.equal(learn.status, 0, learn.stderr);
  const created = JSON.parse(learn.stdout);
  assert.equal(created.profile.id, "creator-tone");
  assert.equal(created.profile.revision, 1);

  const improved = run(cli, [
    "learn", "Creator_Tone", "--yes", "--avoid", "المقدمات الطويلة", "--json"
  ], { cwd: temp, env });
  assert.equal(improved.status, 0, improved.stderr);
  assert.equal(JSON.parse(improved.stdout).profile.revision, 2);

  const use = run(useBin, ["Creator_Tone", "--json"], { cwd: temp, env });
  assert.equal(use.status, 0, use.stderr);
  const activated = JSON.parse(use.stdout);
  assert.equal(activated.profile.defaultMode, "3ameiah-friendly");
  assert.equal(JSON.parse(await readFile(path.join(globalRoot, "config.json"), "utf8")).activeProfile, "creator-tone");

  const context = run(cli, ["profile", "context", "Creator_Tone"], { cwd: temp, env });
  assert.equal(context.status, 0, context.stderr);
  assert.equal(JSON.parse(context.stdout).context.voice.tone, "سريع وواضح");
  assert.equal("samples" in JSON.parse(context.stdout).context, false);
});

test("CLI accepts the simplest positional learning sentence", async (t) => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "3ameiah-cli-lesson-test-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const env = { THREEAMEIAH_CONFIG_DIR: path.join(temp, "global") };
  const result = run(cli, ["learn", "creator", "اتعلم إني بحب الردود المختصرة", "--yes", "--json"], { cwd: temp, env });
  assert.equal(result.status, 0, result.stderr);
  const profile = JSON.parse(result.stdout).profile;
  assert.deepEqual(profile.about, ["اتعلم إني بحب الردود المختصرة"]);
  assert.deepEqual(profile.learningLog[0].fields, ["about"]);
});

test("routine JSON output redacts raw writing samples unless explicitly requested", async (t) => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "3ameiah-cli-redaction-test-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const globalRoot = path.join(temp, "global");
  const env = { THREEAMEIAH_CONFIG_DIR: globalRoot };
  const sample = path.join(temp, "sample.txt");
  const marker = "PRIVATE_SAMPLE_MARKER_7f0a";
  await writeFile(sample, `ده أسلوبي ${marker}`, "utf8");

  const learned = run(cli, ["learn", "creator", "--yes", "--from", sample, "--json"], { cwd: temp, env });
  assert.equal(learned.status, 0, learned.stderr);
  const learnedPayload = JSON.parse(learned.stdout);
  assert.equal("samples" in learnedPayload.profile, false);
  assert.deepEqual(learnedPayload.profile.sampleEvidence, { liked: 1, disliked: 0 });
  assert.doesNotMatch(learned.stdout, new RegExp(marker));

  const used = run(cli, ["use", "creator", "--json"], { cwd: temp, env });
  assert.equal(used.status, 0, used.stderr);
  assert.equal("samples" in JSON.parse(used.stdout).profile, false);
  assert.doesNotMatch(used.stdout, new RegExp(marker));

  const listed = run(cli, ["profiles", "--json"], { cwd: temp, env });
  assert.equal(listed.status, 0, listed.stderr);
  assert.equal("samples" in JSON.parse(listed.stdout).profiles[0].profile, false);
  assert.doesNotMatch(listed.stdout, new RegExp(marker));

  const context = run(cli, ["profile", "context", "creator", "--include-samples"], { cwd: temp, env });
  assert.equal(context.status, 0, context.stderr);
  assert.match(context.stdout, new RegExp(marker));

  const shown = run(cli, ["profile", "show", "creator", "--json"], { cwd: temp, env });
  assert.equal(shown.status, 0, shown.stderr);
  assert.match(shown.stdout, new RegExp(marker));
});

test("terminal sample learning reports the measurement and never claims to have inferred style", async (t) => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "3ameiah-cli-sample-guidance-test-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const sample = path.join(temp, "sample.txt");
  const line = "بص يا صاحبي، الفكرة بقى إن الشرح لازم يبقى بمثال عملي مش كلام نظري خالص.";
  await writeFile(sample, Array.from({ length: 8 }, () => line).join("\n\n"), "utf8");
  const result = run(cli, ["learn", "creator", "--yes", "--from", sample], {
    cwd: temp,
    env: { THREEAMEIAH_CONFIG_DIR: path.join(temp, "global") }
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Styleprint: \d+ words/);
  assert.match(result.stdout, /Recurring wording:.*بقى/);
  assert.match(result.stdout, /never infers tone rules, facts, or preferences/);
  assert.match(result.stdout, /\/3ameiah-learn creator/);
});

test("JSON errors are stable for automation", () => {
  const result = run(cli, ["learn", "--yes", "--json"]);
  assert.equal(result.status, 1);
  const payload = JSON.parse(result.stderr);
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, "MISSING_PROFILE_NAME");
});
