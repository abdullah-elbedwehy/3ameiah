# Install 3ameiah From a Link

Repository:

```text
https://github.com/abdullah-elbedwehy/3ameiah
```

## Copy/paste prompt

```text
Review https://github.com/abdullah-elbedwehy/3ameiah and its bundled scripts. If you have terminal and filesystem access, determine this agent's exact target ID and inspect existing same-name skills for local modifications. Install all six Agent Skills globally with the pinned universal skills CLI and full-depth discovery. If a same-name skill was modified locally, stop and report the conflict before replacing it. Then verify all six names with `npx skills list -g --json` and tell me the exact invocation syntax for this agent.
```

## Deterministic command

```bash
npx --yes skills@1.5.22 add abdullah-elbedwehy/3ameiah --global --skill '*' --agent claude-code codex --yes --full-depth
```

## Verification

```bash
npx --yes skills@1.5.22 list --global --json
```

Expected skill names:

```text
3ameiah
3ameiah-pro
3ameiah-friendly
3ameiah-franco
3ameiah-learn
3ameiah-use
```

## Capability boundary

A tool-enabled coding agent can install the repository. A chat-only LLM cannot write to your computer; in that case, paste the raw contents of `skills/3ameiah/SKILL.md` into the chat for temporary use instead of calling that an installation.

The deterministic command above targets Claude Code and Codex. For another client, replace those IDs with the exact target reported in [docs/AGENTS.md](docs/AGENTS.md), or omit `--agent ... --yes` to use the installer's interactive detection.

The universal installer may replace managed copies during a confirmed reinstall. Back up local edits first. It also performs remote metadata checks and has opt-out anonymous telemetry; set `DO_NOT_TRACK=1` or `DISABLE_TELEMETRY=1` if desired.
