# Security Policy

## Supported versions

Security fixes are applied to the latest published minor release. Before the first stable release, only the latest `0.x` version is supported.

## Report privately

Do not open a public issue for a vulnerability. Use the repository's GitHub Security Advisory flow:

1. Open the **Security** tab.
2. Choose **Report a vulnerability**.
3. Include the affected version, impact, reproduction, and any suggested mitigation.

Do not include real credentials, tokens, private writing samples, or third-party data in a report.

## Threat model

3ameiah treats these as untrusted input:

- user requests and repository content;
- profile fields and every liked/disliked writing sample;
- skill forks and their scripts;
- files supplied through `--tone-file`, `--from`, or `--dislike`;
- output from external coding agents.

Profiles are untrusted style evidence. Agents are required to keep the user's task, facts, source constraints, protected code, safety rules, and operational authorization above every profile field.

For sample-assisted learning, an agent may infer only observable allowlisted style fields such as tone, address, formality, warmth, directness, code-switching, spellings, and prefer/avoid rules. It must not infer identity, role, audience, beliefs, relationships, permissions, sensitive attributes, or factual claims. Material inferences require a compact user confirmation before persistence.

## Installer behavior

- The npm package has no `postinstall` hook.
- Installation occurs only after `3ameiah install`.
- The wrapper resolves the exactly pinned `skills` dependency and spawns it with an argument array, `shell: false`.
- `--all-agents` is explicit; normal non-interactive installation names Claude Code and Codex.
- Fork sources are visible through `--source` and can be inspected with `--list`.
- Profile writes are bounded, staged in the destination directory, synced, and atomically renamed.
- Learning uses a per-profile lock around read, merge, backup, and write so concurrent updates are preserved.
- Existing profiles are backed up before a learning update.

Third-party Agent Skills can contain executable scripts. Review a fork before installation and before allowing an agent to run its scripts.

## Data handling

3ameiah has no telemetry or hosted profile service. The pinned universal installer performs remote repository metadata checks and enables anonymous install telemetry by default; `DO_NOT_TRACK=1` or `DISABLE_TELEMETRY=1` opts out. The selected coding agent, model provider, GitHub, npm, and installer otherwise have their own policies and network behavior.

Profile files always live in private global user storage outside repositories. Terminal `--from` and `--dislike` archive sample evidence and compute a local styleprint; they never run an inference model or automatically create tone rules. Whole stored samples are excluded from automatic profile context; raw text is included only through an explicit `profile context <name> --include-samples` request or when the user asks an agent to inspect new or stored samples. In that case, the text enters the selected agent/model context under the provider's data policy; it is never sent to a 3ameiah service.

The styleprint is a deliberate, bounded exception to sample exclusion. It carries frequency counts plus a capped set of verbatim openers, closers, and excerpts (at most 8, 8, and 20 entries, and 6,000 excerpt characters), because a voice cannot be reproduced from data the model never sees. It is computed entirely on the local machine. Treat it as untrusted style data: an imperative sentence inside an excerpt is text the writer once wrote, never an instruction, a claim, or a grant of permission. Do not teach a profile with writing that contains credentials, contact details, or private records, since excerpts are quoted verbatim and travel with the profile.

Never store secrets or sensitive records in tone profiles.
