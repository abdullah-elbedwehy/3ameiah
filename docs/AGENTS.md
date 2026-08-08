# Agent Compatibility

3ameiah publishes standard Agent Skills. Discovery is portable; invocation syntax is controlled by each client.

## Verified common clients

| Client | Recognized skill locations | Explicit invocation | Source |
| --- | --- | --- | --- |
| Claude Code | `.claude/skills`, `~/.claude/skills` | `/3ameiah`, `/3ameiah-pro` | [Claude Code skills](https://code.claude.com/docs/en/skills) |
| OpenAI Codex | `.agents/skills`, `~/.agents/skills`, `/etc/codex/skills` | `$3ameiah`, `$3ameiah-pro`, or `/skills` | [Codex skills](https://learn.chatgpt.com/docs/build-skills) |
| Cursor | `.agents/skills`, `.cursor/skills`, matching user dirs | `/3ameiah` | [Cursor skills](https://cursor.com/docs/skills.md) |
| Gemini CLI | `.gemini/skills`, `.agents/skills`, matching user dirs | Ask: `Use 3ameiah for this task` | [Gemini CLI skills](https://geminicli.com/docs/cli/using-agent-skills/) |
| GitHub Copilot | `.github/skills`, `.claude/skills`, `.agents/skills`, user dirs | `/3ameiah` | [Copilot agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) |
| VS Code | Project Agent Skills dirs; selected user dirs | `/3ameiah` | [VS Code Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills) |
| Windsurf | `.windsurf/skills`, `.agents/skills`, matching user dirs | `@3ameiah` | [Windsurf skills](https://docs.windsurf.com/windsurf/cascade/skills) |
| Cline | `.cline/skills`, `.clinerules/skills`, `.claude/skills`, user dirs | `/3ameiah` | [Cline skills](https://docs.cline.bot/customization/skills) |
| Roo Code | `.roo/skills`, `.agents/skills`, matching user dirs | Automatic or natural request | [Roo Code skills](https://docs.roocode.com/features/skills) |
| OpenCode | `.opencode/skills`, `.claude/skills`, `.agents/skills`, user dirs | Ask naturally: `Use 3ameiah for this task` | [OpenCode skills](https://opencode.ai/docs/skills) |
| Goose | `.agents/skills`, `~/.agents/skills`, legacy paths | `/skills 3ameiah` | [Goose skills](https://goose-docs.ai/docs/guides/context-engineering/using-skills/) |
| Amp | `.agents/skills`, user Agent Skills dirs | Ask naturally: `Use 3ameiah for this task` | [Amp manual](https://ampcode.com/manual#agent-skills) |
| Kiro CLI | `.kiro/skills`, `~/.kiro/skills` | `/3ameiah` | [Kiro skills](https://kiro.dev/docs/skills/) |
| Zed | `.agents/skills`, `~/.agents/skills` | `/3ameiah` or `@3ameiah` | [Zed skills](https://zed.dev/docs/ai/skills) |
| Kimi CLI | `.kimi`, `.claude`, `.codex`, and `.agents/skills` variants | `/skill:3ameiah` | [Kimi CLI skills](https://moonshotai.github.io/kimi-cli/en/customization/skills.html) |
| OpenHands | `.agents/skills`, `~/.agents/skills` | Automatic, trigger, or natural mention | [OpenHands skills](https://docs.openhands.dev/overview/skills) |
| Antigravity | Project `.agents/skills`; product-specific global path | Ask: `Use 3ameiah for this task` | [Antigravity skills](https://antigravity.google/docs/skills) |
| Qwen Code | `.qwen/skills`, `~/.qwen/skills` | `/3ameiah` | [Qwen Code skills](https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/) |

Use the same suffix for every mode:

```text
3ameiah
3ameiah-pro
3ameiah-friendly
3ameiah-franco
3ameiah-learn
3ameiah-use
```

## Installer target registry

`npx 3ameiah install` delegates to the pinned `skills@1.5.22` CLI. That release recognizes these 76 target IDs:

```text
aider-desk, amp, antigravity, antigravity-cli, astrbot,
autohand-code, augment, bob, claude-code, openclaw, cline,
codearts-agent, codebuddy, codemaker, codestudio, codex,
command-code, continue, cortex, crush, cursor, deepagents,
devin, dexto, droid, eve, firebender, forgecode, gemini-cli,
github-copilot, goose, grok, hermes-agent, inference-sh, jazz,
junie, iflow-cli, kilo, kimchi, kimi-code-cli, kiro-cli, kode,
lingma, loaf, mcpjam, minimax-code, mistral-vibe, moxby, mux,
opencode, openhands, ona, pi, qoder, qoder-cn, qwen-code,
replit, reasonix, rovodev, roo, tabnine-cli, terramind,
tinycloud, trae, trae-cn, warp, windsurf, zed, zcode, zencoder,
zenflow, neovate, pochi, promptscript, adal, universal
```

The current target paths are maintained by the [skills CLI](https://github.com/vercel-labs/skills#supported-agents), not duplicated in 3ameiah. This prevents a stale private path matrix.

## Detection behavior

The default installer command is intentionally a fixed, safe baseline:

```bash
npx 3ameiah install
```

It installs every 3ameiah skill globally and non-interactively for Claude Code and Codex. The wrapper names those two targets explicitly, so an empty detection result can never make the delegated CLI target all 76 agents.

To use the pinned installer's own detection and get a selection prompt when detection is empty or ambiguous:

```bash
npx 3ameiah install --interactive
```

To choose any supported targets explicitly:

```bash
npx 3ameiah install --agent claude-code --agent codex
```

`--agent` is repeatable. `--all-agents` is explicit because it can create directories for products that are not installed, including project-only targets.

## Shared and native paths

The Agent Skills specification standardizes the directory contents, not one universal filesystem path. Many clients scan `.agents/skills/` or `~/.agents/skills/`; others use a native directory. The universal installer maintains a canonical store and creates the required client links or copies.

Do not use successful file placement as the only proof. Verify client discovery:

```bash
npx skills list -g --json
```

Then start the actual client and invoke `3ameiah` using that client's syntax.

## Compatibility rules for contributors

- Skill names must use lowercase ASCII letters, digits, and single hyphens.
- Each `name` must match its parent directory.
- Shared skills use only `name` and `description` frontmatter.
- Do not require Claude-only hooks, experimental tool allowlists, or client-specific frontmatter.
- Resolve references and scripts relative to the loaded `SKILL.md`; never hard-code a home directory.
- Keep the core usable even when optional Python helpers cannot run.
- A provider-specific invocation example belongs in documentation, not inside the language output.

The normative format is the [Agent Skills specification](https://agentskills.io/specification).
