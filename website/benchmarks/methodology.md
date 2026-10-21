# Protection benchmark v0.1

## What this run measures

- Exact preservation of declared placeholders, routes, commands, URLs, names, versions, and identifiers.
- Required words that carry strength such as `ممنوع` and `لازم`.
- Explicit forbidden additions such as fake discounts, unsupported percentages, fake adoption, pet names, or weakened safety language.
- Bounded spoken-sentence length and minimum beat count for one script case.
- Latin-script output for the Franco case.
- Valid JSON and exact top-level keys for the structured-data case.

## Corpus

Eight fixtures cover UI, professional support, Franco, friendly onboarding, spoken media, safety modality, claim boundaries, and structured data. Every fixture contains:

- a source contract;
- a hand-authored expected candidate;
- a deliberately broken negative control;
- deterministic validators;
- a short public contract label.

The fixtures are development fixtures, not held-out model prompts.

## Interpretation

The expected-candidate pass rate shows whether the harness accepts the intended fixtures. The negative-control catch rate shows whether it rejects the seeded defects. Both are software-checker smoke tests.

This benchmark includes zero model generations and zero native-language judges. It cannot support claims such as “X% better,” “more authentic,” or “human-level.” Naturalness, tone fit, and overall preference require the separate blinded protocol.

Each negative control names the exact seeded checks that must fail. A control does not count as “caught” merely because some unrelated validator happened to reject it.

## False-positive controls

- Routes are declared as route tokens. Sentence punctuation such as the full stop in `/v1/orders.` and JSON delimiters are not treated as part of the route, while a changed route such as `/v1/orders.json` is rejected.
- `3ameiah` is declared as an official product name in the claim fixture. It is allowed as content and is not treated as a leaked mode instruction. The standalone name is checked separately, so `3ameiah@0.1.0` cannot hide a missing product-name mention.
- Numbers can be declared as number tokens, so the real `3` in `3andy 3 mashakel` is distinguished from Arabizi digits inside words.

## Reproduction

Run `node website/scripts/run-benchmark.mjs --write`. The command reads `cases.json`, executes every declared validator, writes the complete checks and hashes to `results.json`, and exits non-zero unless all eight expected candidates pass and every named seeded defect is caught. Run `node --test website/scripts/benchmark-lib.test.mjs` for the validator edge cases.
