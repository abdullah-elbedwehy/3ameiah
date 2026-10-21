# Confirmatory language-quality protocol

No confirmatory study has been run yet. Before publishing a comparative writing-quality claim:

1. Freeze the exact model build, skill commit/hash, effective instruction stacks, settings, retry policy, prompt corpus, rubric, analysis code, and stopping rule.
2. Use at least 100 unique held-out prompts for each separately claimed Arabic or Franco mode. Keep prompts used to develop the skill out of the confirmatory set.
3. Generate at least three independent outputs per prompt and arm in fresh contexts. Arm A gets no skill exposure; arm B gets the frozen skill. Interleave and balance call order.
4. Keep deterministic protection gates separate from language-quality judgment. Do not discard failed outputs before judging them.
5. Blind and randomize paired outputs. Use at least three independent native Egyptian judges per pair; Franco judges must regularly read and write Franco.
6. Score meaning/factual fidelity, invention, Egyptian/Franco naturalness, tone fit, clarity, acceptability, and overall preference. Allow ties and “both poor.”
7. Analyze at the unique-prompt level. Report A wins, B wins, ties, gate pass rates, serious failures, 95% confidence intervals, token use, latency, and limitations.
8. Treat LLM-as-judge as a secondary diagnostic only and disclose it. Do not turn “preferred in N% of this sample” into “N% better.”

