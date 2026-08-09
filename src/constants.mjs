export const PACKAGE_NAME = "3ameiah";
export const PACKAGE_VERSION = "0.2.0";
export const REPOSITORY = "abdullah-elbedwehy/3ameiah";
export const SKILLS_VERSION = "1.5.22";

export const SKILL_NAMES = Object.freeze([
  "3ameiah",
  "3ameiah-pro",
  "3ameiah-friendly",
  "3ameiah-franco",
  "3ameiah-learn",
  "3ameiah-use"
]);

export const MODES = Object.freeze([
  "3ameiah",
  "3ameiah-pro",
  "3ameiah-friendly",
  "3ameiah-franco"
]);

export const LEGACY_MODE_ALIASES = Object.freeze({
  "3ameiah-3amy": "3ameiah",
  "3ameiah-professional": "3ameiah-pro",
  "3ameiah-awey": "3ameiah-friendly",
  "3ameiah_3amy": "3ameiah",
  "3ameiah_professional": "3ameiah-pro",
  "3ameiah_awey": "3ameiah-friendly",
  "3ameiah_franco": "3ameiah-franco"
});

export const PROFILE_SCHEMA_VERSION = 2;
export const MAX_PROFILE_BYTES = 128 * 1024;
export const MAX_SAMPLE_CHARS = 12_000;
export const MAX_ANALYSIS_BYTES = 512 * 1024;

/** Hard caps for the derived styleprint so a profile can never grow unbounded. */
export const STYLEPRINT_LIMITS = Object.freeze({
  words: 30,
  phrases: 30,
  tics: 20,
  spellings: 20,
  emoji: 15,
  openers: 8,
  closers: 8,
  excerpts: 20,
  itemChars: 120,
  lineChars: 220,
  excerptChars: 400,
  excerptTotalChars: 6_000
});
