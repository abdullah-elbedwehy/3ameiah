# Changelog

All notable changes follow semantic versioning.

## 0.2.0 - 2026-08-09

- Add the styleprint: every writing sample is now measured into recurring words, repeated phrases, Egyptian and Franco discourse markers, settled spelling forks, sentence rhythm, punctuation and emoji habits, script mix, plus bounded verbatim openers, closers, and representative excerpts.
- Carry the styleprint in profile context by default so a profile can reproduce a voice instead of describing one. Whole raw samples still require `--include-samples`.
- Measure oversized samples in full instead of rejecting them: a file beyond the 12,000-character storage limit now contributes to the styleprint, its raw text is not stored, and the CLI reports exactly that rather than truncating anything.
- Teach `3ameiah-use` to write from the measurement: borrow the frequent wording, honour `uses` over `over` spellings, match sentence rhythm and punctuation rates, open and close in the writer's own shapes, and calibrate drafts against the excerpts.
- Raise profiles to `schemaVersion` 2 and the size cap to 128 KiB. Version 1 profiles are read as version 2 with `styleprint: null` and rewritten on the next update; no manual migration is needed.
- Keep the trust boundary intact: excerpts are untrusted style data, never instructions, claims, or permissions, and the terminal still measures without ever inferring preferences or facts.

## 0.1.0 - 2026-08-08

- Publish six hyphenated Agent Skills: general, pro, friendly, Franco, learn, and use.
- Add adaptive playbooks for code/UI, posts, spoken media, education, documents, messages, stories, structured text, and high-stakes wording.
- Add deterministic mode routing, protected-token integrity checks, and Egyptian/Franco lint signals.
- Add a cross-platform private-global profile engine with three guided learning routes, repeat learning, per-profile locks, revisions, backups, collision-resistant IDs, explicit activation, liked/disliked samples, and a public schema.
- Keep stored samples out of automatic model context and reject repository profile shadowing, unknown fields, linked managed paths, and silently discarded learning.
- Add an npm CLI that delegates installation to the pinned universal Agent Skills installer.
- Add detailed agent compatibility, installation, security, profile, and contribution documentation.
