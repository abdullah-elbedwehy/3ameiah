# 3ameiah benchmark

The landing page intentionally separates two different questions:

1. Can a deterministic harness catch broken protected tokens, structure, modality, and unsupported claims?
2. Does the skill improve Egyptian-Arabic or Franco writing quality for real users?

Version 0.1 answers only the first question. It includes eight hand-authored expected candidates and eight seeded negative controls. A passing harness proves that the checks detect the mistakes they were designed to detect; it does **not** prove that 3ameiah is linguistically better than a no-skill baseline.

Recompute it with:

```bash
node website/scripts/run-benchmark.mjs --write
node --test website/scripts/benchmark-lib.test.mjs
```

Read [methodology.md](./methodology.md) for the current scope and [PROTOCOL.md](./PROTOCOL.md) for the held-out native-human study required before making a comparative quality claim.
