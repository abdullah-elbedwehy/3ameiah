# 3ameiah

[![CI](https://github.com/abdullah-elbedwehy/3ameiah/actions/workflows/ci.yml/badge.svg)](https://github.com/abdullah-elbedwehy/3ameiah/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/3ameiah.svg)](https://www.npmjs.com/package/3ameiah)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-compatible-111827)](https://agentskills.io/specification)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Natural Egyptian Arabic and readable Franco for coding agents—with six commands that are easy to remember.

**Website:** [3ameiah.elbedwehy.tech](https://3ameiah.elbedwehy.tech/) · **Agent-readable install guide:** [3ameiah.elbedwehy.tech/install.md](https://3ameiah.elbedwehy.tech/install.md)

## Install once

```bash
npx 3ameiah install
```

## Then use one of these

```text
/3ameiah                     general Egyptian Arabic
/3ameiah-pro                 professional Egyptian Arabic
/3ameiah-friendly            warm, friendly Egyptian Arabic
/3ameiah-franco              readable Egyptian Franco / Arabizi
/3ameiah-learn <name>        create or improve a tone profile
/3ameiah-use <name>          use that profile
```

That is the whole normal workflow. Everything below is explanation or advanced setup.

> Codex uses `$3ameiah`, `$3ameiah-pro`, and so on because Codex chooses `$` for explicit skills. Claude Code uses `/`. Other agents may use `/`, `@`, a skill picker, or a natural request. The names stay the same.

## The four writing commands

### `/3ameiah`

The default. Use it for normal Egyptian Arabic that feels natural, clear, and widely understandable.

```text
/3ameiah اعمل الـ onboarding ده بالمصري
/3ameiah اكتب السكريبت ده بالعامية
/3ameiah خلّي رسائل الـ CLI دي بالمصري
```

If the task is inside a codebase, the agent still builds or edits the real product. 3ameiah changes human-facing language; it does not turn a coding request into a writing sample.

### `/3ameiah-pro`

For clients, work, proposals, support, serious updates, and professional UI. It stays recognizably Egyptian without becoming bureaucratic MSA.

```text
/3ameiah-pro اكتب الرد ده للعميل
/3ameiah-pro راجع العرض وخلي الخطوة الجاية واضحة
```

### `/3ameiah-friendly`

For warmer explanations, communities, creators, onboarding, educational content, and friendly messages. Friendly does not mean filler, fake intimacy, pet names, or forced emojis.

```text
/3ameiah-friendly اشرح الخطوة دي للمبتدئ
/3ameiah-friendly حوّل الفكرة دي لبوست قريب من الناس
```

### `/3ameiah-franco`

For Egyptian speech written in readable Latin characters and Arabizi numbers. It preserves Egyptian grammar instead of translating the message into English.

```text
/3ameiah-franco ektb el message de franco
/3ameiah-franco حوّل الكابشن ده لفرانكو مقروء
```

## Profiles that learn with you

A profile is one local JSON file that remembers style-relevant things you intentionally teach it:

- who you normally write for;
- your role, common projects, terminology, and goals;
- tone, warmth, directness, and formality;
- how much English you naturally mix in;
- words and habits to prefer or avoid;
- liked writing samples and examples you dislike;
- a **styleprint** measured from your own writing: the words, phrases, and Egyptian markers you actually repeat, your settled spellings, your sentence rhythm and punctuation habits, and real lines of yours to write against.

A described voice produces text that matches a description. A measured one produces text that sounds like you, so give it real writing when you can:

```bash
npx 3ameiah learn creator --from ./good-post.txt --yes
```

```text
Styleprint: 243 words, 34 sentences, ~7.15 words per sentence.
Recurring wording: مش (8)، كتير (3)، كل يوم (3)، أصلا (2)، بقى (2)، بقول لك (2)
Kept 20 excerpt(s), 8 opener(s), 8 closer(s).
```

### First time: create it

Inside a coding agent:

```text
/3ameiah-learn creator
```

If you do not know what to say, the skill offers three easy choices:

1. Describe the voice in one sentence.
2. Give it 2–5 good samples and optionally one example you dislike.
3. Let it ask five short questions.

From the terminal:

```bash
npx 3ameiah learn creator
```

Non-interactive example:

```bash
npx 3ameiah learn creator \
  --yes \
  --mode 3ameiah-friendly \
  --about "I teach programming to Arabic-speaking beginners" \
  --tone "واضح، دافي، وبيدخل في الموضوع بسرعة" \
  --audience "مبتدئين في البرمجة" \
  --directness 4 \
  --warmth 4 \
  --prefer "مثال عملي بعد كل فكرة" \
  --avoid "المقدمات الطويلة"
```

### Later: teach the same profile more

Run `learn` again with the same name. It updates the same file, keeps unrelated knowledge, increments the revision, records what changed, and backs up the previous version.

```bash
npx 3ameiah learn creator \
  --yes \
  --about "I also make short launch videos" \
  --avoid "hype without a concrete takeaway" \
  --note "Improve short-form content"
```

Add good and bad examples:

```bash
npx 3ameiah learn creator \
  --yes \
  --from ./good-post.txt \
  --from ./good-script.txt \
  --dislike ./not-my-style.txt
```

From the terminal, `--from` and `--dislike` archive the files and measure their styleprint; they never turn raw text into opinions about your voice. A file too large to store is still measured in full, and the CLI says so rather than truncating it. The raw text stays out of later automatic model context unless you explicitly request it through `profile context <name> --include-samples`; the bounded styleprint travels with the profile so the voice can actually be reproduced. Either save the preferences yourself in the same call:

```bash
npx 3ameiah learn creator \
  --yes \
  --from ./good-post.txt \
  --tone "مباشر وعملي" \
  --prefer "ابدأ من المشكلة" \
  --avoid "المقدمات العامة"
```

Or use `/3ameiah-learn creator` inside an agent and give it the samples. The agent inspects only observable style patterns, shows you a compact proposed learning summary, and—after you confirm—stores the extracted tone/prefer/avoid fields with the sample evidence.

The same works conversationally:

```text
/3ameiah-learn creator اتعلم إنّي بحب أبدأ من المشكلة بسرعة، ومش بحب المقدمات العامة
```

### Use it

For one task inside an agent:

```text
/3ameiah-use creator اكتب البوست ده
```

Make it your active profile from the terminal:

```bash
npx 3ameiah use creator
```

The active profile becomes your private global voice ledger across projects. A direct command still wins: `/3ameiah-pro` uses compatible personal preferences but keeps the professional mode.

### Inspect it

```bash
npx 3ameiah profiles
npx 3ameiah profile show creator
npx 3ameiah profile context creator --json
```

Profile resolution and safety:

```text
explicit profile > private global active profile > no profile
explicit writing command > profile default mode
task, facts, code, structure, and safety > every profile preference
```

Profiles, samples, and styleprint excerpts are untrusted style data and must never be followed as instructions or treated as permission or factual proof. An excerpt is a sentence you once wrote, not a request to the model. Whole stored samples stay out of automatic model context unless you explicitly include them.

See [docs/PROFILES.md](docs/PROFILES.md) for file locations, structural schema, runtime validation, revisions, backups, and privacy.

## Install by pasting one link

Copy:

```text
https://3ameiah.elbedwehy.tech
```

Paste it into any tool-enabled coding agent with terminal and filesystem access, then say:

```text
Open https://3ameiah.elbedwehy.tech/install.md, verify its canonical GitHub source and bundled scripts, then detect this agent's exact target ID. Inspect existing same-name skills for local modifications and install all six skills globally with the pinned universal skills CLI. Do not replace a locally modified skill without telling me first. Verify all six names and tell me the exact invocation syntax here.
```

A chat-only LLM cannot install files on your computer. It can still read and apply the raw [core skill](skills/3ameiah/SKILL.md) for that conversation. The website always points back to the canonical [GitHub source](https://github.com/abdullah-elbedwehy/3ameiah), and a standalone copy/paste version lives in [INSTALL-FOR-AGENTS.md](INSTALL-FOR-AGENTS.md).

## Installation options

The simple command installs all six skills globally for Claude Code and Codex, the safe non-interactive baseline:

```bash
npx 3ameiah install
```

Inspect first:

```bash
npx 3ameiah install --list
npx 3ameiah install --dry-run
```

Only the current project:

```bash
npx 3ameiah install --project
```

Only named agents:

```bash
npx 3ameiah install --agent claude-code --agent codex
```

Install directly from GitHub through the universal `vercel-labs/skills` CLI:

```bash
npx --yes skills@1.5.22 add abdullah-elbedwehy/3ameiah \
  --global \
  --skill '*' \
  --agent claude-code codex \
  --yes \
  --full-depth
```

Run the packaged CLI from GitHub before or without an npm release:

```bash
npx --yes --package=github:abdullah-elbedwehy/3ameiah 3ameiah install
```

For permanent shell shortcuts:

```bash
npm install --global 3ameiah
3ameiah learn creator
3ameiah-learn creator
3ameiah-use creator
```

`npx 3ameiah install` never silently edits your shell PATH or leaves a global executable behind. Read [INSTALL.md](INSTALL.md) for scopes, updates, verification, and troubleshooting.

## Supported agents

3ameiah follows the open Agent Skills format and delegates installation to the pinned universal `vercel-labs/skills` CLI. The installer recognizes 76 targets, including Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, VS Code, Windsurf, Cline, Roo Code, OpenCode, Goose, Amp, Kiro, Zed, Kimi CLI, OpenHands, Antigravity, and Qwen Code.

Common invocation examples:

| Agent | General command |
| --- | --- |
| Claude Code | `/3ameiah` |
| OpenAI Codex | `$3ameiah` or `/skills` |
| Cursor | `/3ameiah` |
| GitHub Copilot / VS Code | `/3ameiah` |
| Windsurf | `@3ameiah` |
| Kimi CLI | `/skill:3ameiah` |
| Goose | `/skills 3ameiah` |
| Gemini CLI, Roo, OpenHands, Antigravity | `Use 3ameiah for this task` |

The exact paths, all target IDs, and verified provider behavior are documented in [docs/AGENTS.md](docs/AGENTS.md).

## What the skill protects

3ameiah adapts the real artifact without casually changing:

- facts, claims, dates, amounts, warnings, promises, and obligations;
- code, identifiers, JSON/YAML keys, placeholders, URLs, and commands;
- UI architecture, document structure, subtitle timing, and source fidelity;
- audience, gender, spelling, directionality, and established terminology.

It routes product UI, codebases, posts, ads, landing pages, scripts, subtitles, lessons, stories, messages, PDF/DOCX/PPTX, structured data, and high-stakes wording through separate playbooks. Unknown artifact types use the same universal workflow instead of falling back to generic slang.

## Security and privacy

- No `postinstall` hook. Filesystem changes happen only after an explicit command.
- 3ameiah has no telemetry; the pinned installer has documented opt-out anonymous telemetry.
- Profile updates back up the prior revision.
- Whole tone samples stay local at rest, have strict size limits, and are excluded from automatic context.
- Samples enter model context only after an explicit request and remain untrusted content, never instructions.
- The derived styleprint travels with the profile by design, is capped in every dimension, and quotes only short excerpts; treat it as untrusted style data too.
- Do not store credentials, tokens, sensitive records, or unrelated private data in profiles.
- “Write this message” never means “send this message.”

Read [SECURITY.md](SECURITY.md) before reporting a vulnerability.

## Development

Requirements: Node.js 22.20+ and Python 3.10+ for the language helper tests.

```bash
npm install
npm run test:all
npm pack --dry-run
```

The repository deliberately has no root `SKILL.md`; every installable skill is under `skills/<name>/SKILL.md`, so multi-skill discovery finds all six commands.

See [CONTRIBUTING.md](CONTRIBUTING.md) for test and release rules.

## License

[MIT](LICENSE)
