# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated by the user: a standalone Vite-powered static landing page under `website/`, deployed to Vercel. It must remain isolated from the root npm package so the public Agent Skills package can keep its own release lifecycle.

## Users

- The primary visitor is a normal Arabic-speaking user who wants an AI agent to write natural Egyptian Arabic without learning package managers, agent IDs, or skill-directory conventions.
- Secondary users are developers, creators, educators, support teams, and technical writers who need Egyptian Arabic or Franco inside real codebases, scripts, posts, interfaces, and documents.
- Maintainers and advanced users may use the terminal CLI, inspect the internal regression fixtures, or create reusable private tone profiles.

## Product Purpose

3ameiah is an open-source set of Agent Skills that makes tool-enabled AI agents write, rewrite, localize, implement, and review human-facing content in context-aware Egyptian Arabic or readable Franco while preserving the real task. Success means a visitor can understand the difference, copy one URL or one command, install the skills, and invoke the right voice without needing technical setup knowledge.

## Positioning

3ameiah is not a generic Arabic translation prompt. It routes the full task through an artifact-aware Egyptian-language contract: it adapts register to the channel, protects code and factual claims, supports dedicated professional, friendly, and Franco modes, and can apply an intentionally taught local tone profile.

## Operating Context

- The simplest nontechnical route is to copy `https://3ameiah.elbedwehy.tech` and ask a tool-enabled coding agent to install the skill from that page.
- The direct terminal route is `npx 3ameiah install`.
- Installed skills are invoked according to each agent's syntax. Claude Code uses `/3ameiah`; Codex uses `$3ameiah`; other clients may use slash commands, mentions, a skill picker, or a natural-language request.
- Profiles are created or improved with `3ameiah-learn` / `npx 3ameiah learn`, then applied with `3ameiah-use` / `npx 3ameiah use`.

## Capabilities and Constraints

- Public commands: `3ameiah`, `3ameiah-pro`, `3ameiah-friendly`, `3ameiah-franco`, `3ameiah-learn`, and `3ameiah-use`.
- The packaged installer defaults to Claude Code and Codex and delegates broader installation to the pinned `skills@1.5.22` universal installer. The current repository documents 76 recognized target IDs.
- The npm CLI currently requires Node.js 22.20 or newer.
- Profiles and sample evidence stay in private global user storage, outside repositories. Profile content is untrusted style evidence and never grants permissions or proves facts.
- 3ameiah itself has no telemetry. The delegated universal installer may perform repository checks and has its own optional anonymous install telemetry.
- A chat-only model cannot write files or install a skill. The copy-link flow requires an agent with terminal and filesystem tools; the page must say this plainly.
- The site may demonstrate behavior, but it must not invent customers, testimonials, usage totals, outcome claims, or benchmark wins. The deterministic benchmark remains an internal regression gate and is not presented as public proof on the landing page.

## Brand Commitments

- Product name: `3ameiah`.
- Public landing URL requested by the user: `https://3ameiah.elbedwehy.tech`.
- Primary site voice: balanced, natural Egyptian Arabic. Machine-facing commands, URLs, package names, JSON keys, and code remain exact and direction-isolated.
- The experience should feel bold, contemporary, and recognizably Egyptian without forced slang, fake intimacy, pyramids, pharaonic decoration, or generic neon-AI imagery.
- Hyphenated public skill names are canonical; old underscore aliases must not be promoted.

## Evidence on Hand

- Public source: `https://github.com/abdullah-elbedwehy/3ameiah`.
- Public npm release: `3ameiah@0.1.0`, currently tagged `latest`.
- Repository documentation: `README.md`, `INSTALL.md`, `docs/AGENTS.md`, and `docs/PROFILES.md`.
- Release verification recorded in the current project: 50 Node tests and 70 Python tests passed for version 0.1.0; all six skills were validated and the exact npm tarball was smoke-tested before publication.
- The repository contains real boundary rules, profile validation, installer contracts, and writing playbooks that the landing page can demonstrate.
- No public customer proof, adoption totals, or externally validated linguistic benchmark exists yet. The committed project-owned fixtures are internal test evidence, not independent research or a public landing-page claim.

## Product Principles

1. Make the easiest path genuinely nontechnical: copy a URL, send it to an agent, and let the agent explain what it can do.
2. Demonstrate the writing difference with real paired examples and preserved tokens, not adjectives about quality.
3. Keep claims auditable: link the source, package, exact commands, capability boundaries, and limitations.
4. Egyptian Arabic changes the human-facing layer; it never weakens facts, code, warnings, or the user's real task.
5. Progressive disclosure: the first action is simple, while terminal commands, agent targeting, and profiles remain available for people who want them.

## Accessibility & Inclusion

- Arabic-script surfaces are RTL; commands, URLs, code, and Franco examples are LTR and direction-isolated.
- The production page must remain usable at 320px and 390px widths, with keyboard focus, semantic landmarks, readable contrast, and no horizontal overflow.
- Core content and actions must work without motion. Honor `prefers-reduced-motion`, pause expensive effects off-screen, and never hide content behind animation.
- Copy must avoid assuming gender, technical expertise, or familiarity with agent tooling.
