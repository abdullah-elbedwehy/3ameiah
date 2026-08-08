# Installation Guide

This guide separates three things that are easy to confuse:

1. Installing the Agent Skills into a coding agent.
2. Running the 3ameiah profile CLI temporarily through `npx`.
3. Installing the shell commands permanently with `npm --global`.

## Recommended installation

```bash
npx 3ameiah install
```

The command installs all six skills globally for Claude Code and Codex. This is the safe, non-interactive default and matches the two primary clients 3ameiah was built for. It delegates to the pinned `skills@1.5.22` package without constructing a shell command.

It never turns an empty detection result into installation for all 76 known agents. To let the installer detect your clients and guide you when none are found:

```bash
npx 3ameiah install --interactive
```

To target another client without prompts, name it explicitly. Repeat `--agent` for more than one:

```bash
npx 3ameiah install --agent cursor
npx 3ameiah install --agent claude-code --agent codex --agent cursor
```

To target all known agents explicitly:

```bash
npx 3ameiah install --all-agents
```

## Review before install

```bash
npx 3ameiah install --list
npx 3ameiah install --dry-run
```

For third-party forks, inspect the repository and bundled scripts first:

```bash
npx 3ameiah install --source owner/fork --list
npx 3ameiah install --source owner/fork
```

## Direct universal CLI installation

Global, safe non-interactive baseline (Claude Code and Codex):

```bash
npx --yes skills@1.5.22 add abdullah-elbedwehy/3ameiah \
  --global \
  --skill '*' \
  --agent claude-code codex \
  --yes \
  --full-depth
```

Global, detected agents with a selection prompt when detection is empty or ambiguous:

```bash
npx --yes skills@1.5.22 add abdullah-elbedwehy/3ameiah \
  --global \
  --skill '*' \
  --full-depth
```

Current project only:

```bash
npx --yes skills@1.5.22 add abdullah-elbedwehy/3ameiah \
  --skill '*' \
  --agent claude-code codex \
  --yes \
  --full-depth
```

Only Claude Code and Codex:

```bash
npx --yes skills@1.5.22 add abdullah-elbedwehy/3ameiah \
  --global \
  --skill '*' \
  --agent claude-code \
  --agent codex \
  --yes \
  --full-depth
```

Only the general command:

```bash
npx --yes skills@1.5.22 add abdullah-elbedwehy/3ameiah \
  --global \
  --skill 3ameiah \
  --agent claude-code \
  --yes \
  --full-depth
```

Every wrapper is self-contained, so a single selected skill also works on its own:

```bash
npx --yes skills@1.5.22 add abdullah-elbedwehy/3ameiah \
  --global \
  --skill 3ameiah-pro \
  --agent claude-code \
  --yes \
  --full-depth
```

## npm release versus GitHub source

The npm release provides the short command:

```bash
npx 3ameiah install
```

The repository can be used directly even before or without an npm release:

```bash
npx --yes --package=github:abdullah-elbedwehy/3ameiah 3ameiah install
```

Or use the universal `skills add` command shown above.

## Temporary versus permanent CLI

These always work without a permanent global CLI install:

```bash
npx 3ameiah learn my-tone
npx 3ameiah use my-tone
npx 3ameiah profile list
```

To get exact shell commands such as `3ameiah learn`, `3ameiah-learn`, and `3ameiah-use`:

```bash
npm install --global 3ameiah
3ameiah learn my-tone
3ameiah-learn my-tone
3ameiah-use my-tone
```

Running `npx 3ameiah install` does not mutate your shell PATH or secretly leave a global executable behind.

When learning from files, terminal `--from` and `--dislike` archive sample evidence only. Add explicit `--tone`, `--prefer`, or `--avoid` values, or use `3ameiah-learn` inside an agent to inspect the samples, confirm observable style inferences, and save those fields with the evidence. Raw samples stay out of automatic profile context unless explicitly requested through `profile context <name> --include-samples`.

## Update and verify

```bash
npx 3ameiah update
npx 3ameiah doctor
npx skills list -g --json
```

The update command names only the six 3ameiah skills, so it does not update unrelated installed skills.

## Skill scope and profile scope

- Global skill installation is the default because language skills are useful across projects.
- `--project` installs skills into the current repository.
- Tone profiles and their activation are always private global user files, outside repositories.
- Use a distinct name such as `client-acme` when you want a project-specific voice.

## Copies and links

The universal installer uses a canonical skill store and links compatible agent directories when appropriate. Use independent copies only when your environment cannot use links:

```bash
npx 3ameiah install --copy
```

Copied installations can drift independently. Verify them after updates.

## Troubleshooting

### The command is not found

Check Node and npm:

```bash
node --version
npm --version
```

The packaged installer currently requires Node 22.20 or newer because its pinned universal installer does.

### The skill installed but the slash command is different

Invocation belongs to the client. Claude Code uses `/3ameiah`; Codex uses `$3ameiah` or `/skills`; Kimi uses `/skill:3ameiah`; some clients use natural-language activation. See [docs/AGENTS.md](docs/AGENTS.md).

### A wrapper was installed alone

That is supported. Every public wrapper is self-contained. The one-line installer still installs the complete six-command set.

### A profile is missing

```bash
npx 3ameiah profiles
npx 3ameiah profile show profile-name --json
```

Profiles live only in private global user storage. Display names can be Unicode, while portable IDs use collision-resistant ASCII kebab-case.

### Installer network and telemetry

3ameiah itself has no telemetry. The pinned universal installer performs repository metadata checks and enables anonymous install telemetry by default. Set `DO_NOT_TRACK=1` or `DISABLE_TELEMETRY=1` when invoking installation if you want to opt out.

### Existing underscore commands still appear

Public 3ameiah skills use only hyphens. An old manually installed Claude command such as an underscore alias may still exist outside the managed skill directories. Inspect it before removing it; the installer does not delete unrelated or modified user commands.
