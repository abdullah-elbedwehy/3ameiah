#!/usr/bin/env node

import { constants as fsConstants } from "node:fs";
import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = path.join(root, "skills");
const expected = new Set([
  "3ameiah",
  "3ameiah-pro",
  "3ameiah-friendly",
  "3ameiah-franco",
  "3ameiah-learn",
  "3ameiah-use"
]);
const errors = [];

await validatePackage();
await validateSkills();
await validatePublicText();

if (errors.length > 0) {
  for (const error of errors) process.stderr.write(`ERROR ${error}\n`);
  process.stderr.write(`Validation failed with ${errors.length} error(s).\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Validated ${expected.size} Agent Skills and repository metadata.\n`);
}

async function validatePackage() {
  const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const constants = await import(new URL("../src/constants.mjs", import.meta.url));
  if (packageJson.name !== "3ameiah") errors.push("package.json name must be 3ameiah.");
  if (packageJson.version !== constants.PACKAGE_VERSION) errors.push("PACKAGE_VERSION must match package.json version.");
  if (packageJson.dependencies?.skills !== "1.5.22") errors.push("skills dependency must be pinned exactly to 1.5.22.");
  if (packageJson.dependencies?.skills !== constants.SKILLS_VERSION) errors.push("SKILLS_VERSION must match the pinned package dependency.");
  for (const [name, relative] of Object.entries(packageJson.bin ?? {})) {
    const file = path.join(root, relative);
    if (!(await exists(file))) errors.push(`Missing bin '${name}' at ${relative}.`);
    else {
      const text = await readFile(file, "utf8");
      if (!text.startsWith("#!/usr/bin/env node")) errors.push(`Bin '${name}' is missing its Node shebang.`);
      await access(file, fsConstants.X_OK).catch(() => errors.push(`Bin '${name}' is not executable.`));
    }
  }
  if (await exists(path.join(root, "SKILL.md"))) errors.push("Repository root must not contain SKILL.md; it would shadow nested skills.");
}

async function validateSkills() {
  const entries = (await readdir(skillRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  const actual = new Set(entries.map((entry) => entry.name));
  for (const name of expected) if (!actual.has(name)) errors.push(`Missing skills/${name}/SKILL.md.`);
  for (const name of actual) if (!expected.has(name)) errors.push(`Unexpected skill directory: skills/${name}.`);

  for (const name of actual) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) errors.push(`Invalid skill folder name: ${name}.`);
    const skillDirectory = path.join(skillRoot, name);
    const file = path.join(skillDirectory, "SKILL.md");
    if (!(await exists(file))) {
      errors.push(`Missing SKILL.md in ${name}.`);
      continue;
    }
    const text = await readFile(file, "utf8");
    const frontmatter = parseFrontmatter(text, file);
    if (!frontmatter) continue;
    if (frontmatter.name !== name) errors.push(`${relative(file)} frontmatter name '${frontmatter.name}' does not match its folder.`);
    const description = frontmatter.description ?? "";
    if (description.length < 1 || description.length > 1024) errors.push(`${relative(file)} description must be 1..1024 characters.`);
    const unknown = Object.keys(frontmatter).filter((key) => !["name", "description"].includes(key));
    if (unknown.length > 0) errors.push(`${relative(file)} has unsupported frontmatter keys: ${unknown.join(", ")}.`);

    await validateNoSymlinks(skillDirectory);
    for (const markdown of (await walk(skillDirectory)).filter((entry) => entry.endsWith(".md"))) {
      const markdownText = await readFile(markdown, "utf8");
      await validateLinks(markdown, markdownText, skillDirectory);
      if (/(^|[\s("'\x60])\.\.[\\/]/m.test(markdownText)) {
        errors.push(`${relative(markdown)} contains a parent-directory dependency; every skill must work when installed alone.`);
      }
    }
  }
}

async function validateNoSymlinks(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      errors.push(`${relative(child)} is a symlink; skill packages must be self-contained regular files.`);
    } else if (entry.isDirectory()) {
      await validateNoSymlinks(child);
    }
  }
}

async function validatePublicText() {
  const files = await walk(root);
  for (const file of files) {
    if (!/\.(?:md|mjs|json|yaml|yml|py)$/.test(file)) continue;
    if (file.includes(`${path.sep}node_modules${path.sep}`) || file.endsWith("package-lock.json")) continue;
    const text = await readFile(file, "utf8");
    if (text.includes(["/Users", "abdullah"].join("/"))) errors.push(`${relative(file)} contains a machine-specific home path.`);
    const unresolvedMarker = new RegExp(`\\b(?:TO${"DO"}|TB${"D"})\\b`);
    if (unresolvedMarker.test(text)) errors.push(`${relative(file)} contains an unresolved planning marker.`);
    if (/\/(?:3ameiah_(?:3amy|professional|awey|franco))\b/.test(text)) {
      errors.push(`${relative(file)} exposes a deprecated underscore command.`);
    }
  }
  const schema = JSON.parse(await readFile(path.join(root, "schemas", "profile.schema.json"), "utf8"));
  if (schema.title !== "3ameiah Tone Profile") errors.push("Profile schema title is missing or invalid.");
}

function parseFrontmatter(text, file) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    errors.push(`${relative(file)} has invalid YAML frontmatter delimiters.`);
    return null;
  }
  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const field = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!field) {
      errors.push(`${relative(file)} has unsupported frontmatter syntax: ${line}`);
      continue;
    }
    let value = field[2].trim();
    if (value.startsWith('"')) {
      try { value = JSON.parse(value); }
      catch { errors.push(`${relative(file)} has invalid quoted frontmatter for ${field[1]}.`); }
    }
    values[field[1]] = value;
  }
  return values;
}

async function validateLinks(file, text, boundary) {
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split("#", 1)[0];
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) continue;
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
    const insideBoundary = resolved === boundary || resolved.startsWith(`${boundary}${path.sep}`);
    if (!insideBoundary || !(await exists(resolved))) {
      errors.push(`${relative(file)} has a broken or escaping relative link: ${target}.`);
    }
  }
}

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(child));
    else if (entry.isFile()) output.push(child);
  }
  return output;
}

async function exists(file) {
  return stat(file).then(() => true).catch(() => false);
}

function relative(file) {
  return path.relative(root, file);
}
