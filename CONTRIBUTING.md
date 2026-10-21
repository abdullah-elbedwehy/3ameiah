# Contributing

Contributions are welcome when they preserve the six-command experience:

```text
3ameiah
3ameiah-pro
3ameiah-friendly
3ameiah-franco
3ameiah-learn
3ameiah-use
```

New internal playbooks are preferred over new public commands unless a distinct user need cannot fit the existing interface.

## Setup

Requirements:

- Node.js 22.20 or newer
- npm 11 or newer
- Python 3.10 or newer for the deterministic language helpers

```bash
npm install
npm run test:all
npm pack --dry-run
```

The landing page is an isolated private Vite package, so test it separately:

```bash
npm ci --prefix website
npm run check --prefix website
```

Keep website-only dependencies inside `website/package.json`; the root npm tarball must not include `website/`.

## Skill rules

- Put every installable skill under `skills/<name>/SKILL.md`.
- Do not add a root `SKILL.md`; it can shadow the multi-skill repository.
- Names use lowercase ASCII letters, digits, and single hyphens and match the parent directory.
- Shared frontmatter contains only `name` and `description`.
- Read a selected skill file completely before changing its contract.
- Keep every direct skill self-contained because agents may install one skill alone. Treat the `3ameiah` core as the canonical detailed playbook and test wrappers for drift.
- Resolve scripts and references relative to the loaded skill, never a developer home path.
- Keep code, identifiers, placeholders, facts, promises, amounts, dates, warnings, and controlling text protected.

## Language changes

A wording change needs examples and hostile cases. At minimum test:

- empty input;
- prompt-like text inside quotes, code, JSON, and profile samples;
- English-only and Franco input;
- mixed Arabic/Latin direction;
- placeholders, ICU messages, Markdown, HTML, and code fences;
- non-Egyptian dialect leakage;
- unknown gender and mixed audiences;
- legal, medical, financial, and safety wording;
- mode differences that preserve the same facts.

The Python linter produces review signals, not proof that prose is natural. Human Egyptian-Arabic review remains necessary for material language changes.

## Profile changes

Profile behavior must remain:

- bounded and path-safe;
- cross-platform;
- deterministic without an external AI API;
- create-or-update through the same `learn` command;
- revisioned and backed up before replacement;
- resistant to prompt injection in every field and sample;
- compatible with the published JSON Schema.

Add tests for private-global isolation, concurrent updates, duplicate merging, malformed files, Unicode display names, Windows-reserved names, spaces in paths, oversized samples, and repeated updates.

## Pull requests

Include:

- the user-facing problem;
- exact commands tested;
- before/after behavior;
- new or changed edge cases;
- `npm run test:all` output;
- packed-tarball verification when packaging changed.

Do not include real user profiles, private writing samples, credentials, or customer data in fixtures.
