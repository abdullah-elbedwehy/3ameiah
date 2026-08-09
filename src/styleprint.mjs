import { STYLEPRINT_LIMITS } from "./constants.mjs";
import { CliError } from "./errors.mjs";

const DIACRITICS = /[ً-ْٰـ]/gu;
const TASHKEEL = /[ً-ْ]/gu;
const ARABIC_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/gu;
const LATIN_SCRIPT = /[a-z]/giu;
const TOKEN = /[\p{L}\p{M}\p{N}]+/gu;
const EMOJI = /\p{Extended_Pictographic}/gu;
const FRANCO_TOKEN = /^(?=.*[a-z])(?=.*[234579])[a-z0-9']+$/iu;
const ELONGATION = /(\p{L})\1{2,}/u;
const LAUGHTER = /^(?:ه{3,}|(?:ها){2,}|(?:ha){2,}|(?:7a){2,}|lo+l)$/iu;
const MIN_ANALYZABLE_WORDS = 40;
const PHRASE_CANDIDATES = 200;
const LONG_SENTENCE_WORDS = 20;

/** Function words that carry no personal signal; excluded from the word list only. */
const UNIVERSAL_STOPWORDS = new Set([
  "في", "من", "علي", "عن", "الي", "مع", "عند", "كل", "بعد", "قبل", "بين", "او", "ثم",
  "حتي", "هذا", "هذه", "ذلك", "التي", "الذي", "انه", "انها", "كان", "كانت", "هو", "هي",
  "ما", "ال", "او", "ولا", "بل", "قد", "لقد", "ايضا",
  "the", "and", "for", "with", "that", "this", "you", "are", "was", "have", "has", "not"
]);

/** Egyptian and Franco discourse markers. Reported only when they actually occur. */
const EGYPTIAN_MARKERS = [
  "يعني", "بقي", "خلاص", "اهو", "طيب", "ماشي", "تمام", "والله", "بجد", "اصلا", "برضه",
  "برضو", "كده", "دلوقتي", "خالص", "اوي", "جدا", "يلا", "بص", "عشان", "علشان", "مش",
  "لسه", "ازاي", "ليه", "فين", "امتي", "شويه", "كتير", "قوي", "معلش", "المهم", "عموما",
  "بصراحه", "الصراحه", "حلو", "جامد", "تحفه", "ياعم", "ربنا", "نصيحه", "صدقني", "تخيل",
  "ya3ny", "khalas", "tmam", "keda", "kda", "awy", "bgd", "msh", "3ashan", "3lshan",
  "bs", "tb", "yala", "ba2a"
];

/** Spelling forks where the writer's pick is itself part of the fingerprint. */
const SPELLING_FORKS = [
  ["دا", "ده"],
  ["كده", "كدا"],
  ["بقي", "بقا"],
  ["دلوقتي", "دلوقت"],
  ["عشان", "علشان"],
  ["برضه", "برضو"],
  ["اوي", "قوي"],
  ["شويه", "شويا"],
  ["msh", "m4"],
  ["3ashan", "3shan"],
  ["keda", "kda"]
];

/**
 * Measure how a writer actually writes. Counts observable surface features only; it never
 * infers preferences, claims, or facts. Returns null when the evidence is too thin to trust.
 */
export function analyzeStyleprint(texts = []) {
  const corpus = texts.map((text) => String(text ?? "").trim()).filter(Boolean);
  if (corpus.length === 0) return null;

  const paragraphs = corpus.flatMap(splitParagraphs);
  const sentences = paragraphs.flatMap(splitSentences);
  const tokens = sentences.flatMap(tokenize);
  if (tokens.length < MIN_ANALYZABLE_WORDS) return null;

  const unigrams = countGrams(tokens, 1);
  const styleprint = {
    corpus: {
      samples: corpus.length,
      characters: corpus.reduce((total, text) => total + text.length, 0),
      words: tokens.length,
      sentences: sentences.length,
      paragraphs: paragraphs.length
    },
    script: measureScript(corpus, tokens),
    rhythm: measureRhythm(paragraphs.length, sentences),
    punctuation: measurePunctuation(corpus, paragraphs.length, sentences, tokens),
    words: rankWords(unigrams, tokens.length),
    phrases: rankPhrases(sentences, tokens.length),
    tics: rankTics(unigrams, tokens.length),
    spellings: rankSpellings(unigrams),
    emoji: rankEmoji(corpus),
    openers: edgeLines(paragraphs, "openers"),
    closers: edgeLines(paragraphs, "closers"),
    excerpts: []
  };
  styleprint.excerpts = pickExcerpts(sentences, styleprint);
  return validateStyleprint(styleprint);
}

/** Structural equality so an unchanged re-analysis never fakes a new revision. */
export function styleprintsEqual(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

export function validateStyleprint(styleprint) {
  if (styleprint === null) return null;
  assertObject(styleprint, "styleprint");
  assertExactKeys(styleprint, [
    "closers", "corpus", "emoji", "excerpts", "openers", "phrases", "punctuation",
    "rhythm", "script", "spellings", "tics", "words"
  ], "styleprint");

  assertExactKeys(styleprint.corpus, ["characters", "paragraphs", "samples", "sentences", "words"], "styleprint.corpus");
  for (const [key, value] of Object.entries(styleprint.corpus)) assertCount(value, `styleprint.corpus.${key}`);

  assertExactKeys(styleprint.script, ["arabic", "franco", "latin"], "styleprint.script");
  assertRatio(styleprint.script.arabic, "styleprint.script.arabic");
  assertRatio(styleprint.script.latin, "styleprint.script.latin");
  assertBoolean(styleprint.script.franco, "styleprint.script.franco");

  assertExactKeys(styleprint.rhythm, [
    "longSentenceRatio", "medianWordsPerSentence", "sentencesPerParagraph", "wordsPerSentence"
  ], "styleprint.rhythm");
  for (const [key, value] of Object.entries(styleprint.rhythm)) assertNumber(value, `styleprint.rhythm.${key}`);

  assertExactKeys(styleprint.punctuation, [
    "arabicComma", "elongation", "ellipsis", "emojiPerParagraph", "exclamation", "laughter", "question", "tashkeel"
  ], "styleprint.punctuation");
  assertBoolean(styleprint.punctuation.arabicComma, "styleprint.punctuation.arabicComma");
  for (const [key, value] of Object.entries(styleprint.punctuation)) {
    if (key !== "arabicComma") assertNumber(value, `styleprint.punctuation.${key}`);
  }

  for (const field of ["words", "phrases", "tics"]) {
    assertList(styleprint[field], `styleprint.${field}`, STYLEPRINT_LIMITS[field], (item, label) => {
      assertExactKeys(item, ["count", "per1k", "text"], label);
      assertBoundedText(item.text, `${label}.text`, STYLEPRINT_LIMITS.itemChars);
      assertCount(item.count, `${label}.count`);
      assertNumber(item.per1k, `${label}.per1k`);
    });
  }
  assertList(styleprint.emoji, "styleprint.emoji", STYLEPRINT_LIMITS.emoji, (item, label) => {
    assertExactKeys(item, ["count", "text"], label);
    assertBoundedText(item.text, `${label}.text`, 16);
    assertCount(item.count, `${label}.count`);
  });
  assertList(styleprint.spellings, "styleprint.spellings", STYLEPRINT_LIMITS.spellings, (item, label) => {
    assertExactKeys(item, ["count", "over", "uses"], label);
    assertBoundedText(item.uses, `${label}.uses`, STYLEPRINT_LIMITS.itemChars);
    assertBoundedText(item.over, `${label}.over`, STYLEPRINT_LIMITS.itemChars);
    assertCount(item.count, `${label}.count`);
  });
  for (const field of ["openers", "closers"]) {
    assertList(styleprint[field], `styleprint.${field}`, STYLEPRINT_LIMITS[field], (item, label) => {
      assertBoundedText(item, label, STYLEPRINT_LIMITS.lineChars);
    });
  }
  assertList(styleprint.excerpts, "styleprint.excerpts", STYLEPRINT_LIMITS.excerpts, (item, label) => {
    assertBoundedText(item, label, STYLEPRINT_LIMITS.excerptChars);
  });
  const excerptCharacters = styleprint.excerpts.reduce((total, item) => total + item.length, 0);
  if (excerptCharacters > STYLEPRINT_LIMITS.excerptTotalChars) {
    invalid(`styleprint.excerpts exceed ${STYLEPRINT_LIMITS.excerptTotalChars} characters.`);
  }
  return styleprint;
}

function measureScript(corpus, tokens) {
  const joined = corpus.join("\n");
  const arabic = countMatches(joined, ARABIC_SCRIPT);
  const latin = countMatches(joined, LATIN_SCRIPT);
  const letters = arabic + latin;
  const franco = tokens.filter((token) => FRANCO_TOKEN.test(token)).length;
  return {
    arabic: letters === 0 ? 0 : round(arabic / letters),
    latin: letters === 0 ? 0 : round(latin / letters),
    franco: franco >= 3 && franco / tokens.length >= 0.02
  };
}

function measureRhythm(paragraphCount, sentences) {
  const lengths = sentences.map((sentence) => tokenize(sentence).length).filter((length) => length > 0);
  const sorted = [...lengths].sort((left, right) => left - right);
  const total = lengths.reduce((sum, length) => sum + length, 0);
  return {
    wordsPerSentence: round(total / Math.max(lengths.length, 1)),
    medianWordsPerSentence: sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)],
    longSentenceRatio: round(lengths.filter((length) => length > LONG_SENTENCE_WORDS).length / Math.max(lengths.length, 1)),
    sentencesPerParagraph: round(sentences.length / Math.max(paragraphCount, 1))
  };
}

function measurePunctuation(corpus, paragraphCount, sentences, tokens) {
  const joined = corpus.join("\n");
  const sentenceCount = Math.max(sentences.length, 1);
  return {
    question: round(sentences.filter((sentence) => /[?؟]\s*$/u.test(sentence)).length / sentenceCount),
    exclamation: round(sentences.filter((sentence) => /!\s*$/u.test(sentence)).length / sentenceCount),
    ellipsis: round(countMatches(joined, /\.{3}|…/gu) / sentenceCount),
    arabicComma: countMatches(joined, /،/gu) > countMatches(joined, /,/gu),
    emojiPerParagraph: round(countMatches(joined, EMOJI) / Math.max(paragraphCount, 1)),
    elongation: round(tokens.filter((token) => ELONGATION.test(token)).length / tokens.length),
    laughter: round(tokens.filter((token) => LAUGHTER.test(token)).length / tokens.length),
    tashkeel: round(countMatches(joined, TASHKEEL) / Math.max(joined.length, 1))
  };
}

function rankWords(unigrams, totalWords) {
  const rows = [...unigrams.values()].filter((entry) => (
    entry.count >= 2
    && entry.key.length >= 2
    && !/^\p{N}+$/u.test(entry.key)
    && !UNIVERSAL_STOPWORDS.has(entry.key)
  ));
  return toCountedList(rows, totalWords, STYLEPRINT_LIMITS.words);
}

function rankTics(unigrams, totalWords) {
  const markers = new Set(EGYPTIAN_MARKERS.map(foldToken));
  return toCountedList(
    [...unigrams.values()].filter((entry) => markers.has(entry.key)),
    totalWords,
    STYLEPRINT_LIMITS.tics
  );
}

function rankPhrases(sentences, totalWords) {
  const candidates = new Map();
  for (const sentence of sentences) {
    const tokens = tokenize(sentence);
    for (let size = 2; size <= 5; size += 1) {
      for (const entry of countGrams(tokens, size).values()) mergeGram(candidates, entry);
    }
  }
  const repeated = [...candidates.values()]
    .filter((entry) => entry.count >= 2)
    .sort((left, right) => right.count - left.count || compareText(left.key, right.key))
    .slice(0, PHRASE_CANDIDATES);
  for (const entry of repeated) entry.surface = dominantSurface(entry.surfaces);

  // A shorter phrase that never occurs outside a longer one adds nothing over the longer one.
  const rows = repeated.filter((entry) => !repeated.some((other) => (
    other !== entry
    && other.key.length > entry.key.length
    && other.key.includes(entry.key)
    && other.count >= entry.count
  )));
  return toCountedList(rows, totalWords, STYLEPRINT_LIMITS.phrases);
}

function rankSpellings(unigrams) {
  const rows = [];
  for (const [left, right] of SPELLING_FORKS) {
    const leftEntry = unigrams.get(foldToken(left));
    const rightEntry = unigrams.get(foldToken(right));
    const leftCount = leftEntry?.count ?? 0;
    const rightCount = rightEntry?.count ?? 0;
    if (leftCount === rightCount) continue;
    const winner = leftCount > rightCount ? leftEntry : rightEntry;
    rows.push({
      uses: clip(winner.surface, STYLEPRINT_LIMITS.itemChars),
      over: leftCount > rightCount ? right : left,
      count: winner.count
    });
  }
  return rows
    .sort((left, right) => right.count - left.count || compareText(left.uses, right.uses))
    .slice(0, STYLEPRINT_LIMITS.spellings);
}

function rankEmoji(corpus) {
  const counts = new Map();
  for (const emoji of corpus.join("\n").match(EMOJI) ?? []) {
    counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([text, count]) => ({ text, count }))
    .sort((left, right) => right.count - left.count || compareText(left.text, right.text))
    .slice(0, STYLEPRINT_LIMITS.emoji);
}

function edgeLines(paragraphs, field) {
  const counts = new Map();
  for (const paragraph of paragraphs) {
    const lines = splitSentences(paragraph);
    // A one-sentence paragraph opens; treating it as a closer too would double-count it.
    if (field === "closers" && lines.length < 2) continue;
    const line = field === "openers" ? lines.at(0) : lines.at(-1);
    if (!line) continue;
    const clipped = clip(line, STYLEPRINT_LIMITS.lineChars);
    if (tokenize(clipped).length < 2) continue;
    counts.set(clipped, (counts.get(clipped) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].length - right[0].length || compareText(left[0], right[0]))
    .slice(0, STYLEPRINT_LIMITS[field])
    .map(([line]) => line);
}

/** Keep the sentences that carry the most of this writer's own vocabulary and rhythm. */
function pickExcerpts(sentences, styleprint) {
  const weights = new Map();
  for (const entry of [...styleprint.phrases, ...styleprint.tics, ...styleprint.words]) {
    const key = ` ${foldText(entry.text)} `;
    weights.set(key, Math.max(weights.get(key) ?? 0, entry.per1k));
  }
  const median = Math.max(styleprint.rhythm.medianWordsPerSentence, 1);
  const scored = sentences
    .map((sentence) => clip(sentence, STYLEPRINT_LIMITS.excerptChars))
    .filter((sentence) => sentence.length >= 20)
    .map((sentence) => {
      const haystack = ` ${foldText(sentence)} `;
      let score = 0;
      for (const [needle, weight] of weights) if (haystack.includes(needle)) score += weight;
      const words = tokenize(sentence).length;
      const rhythmFit = 1 - Math.min(Math.abs(words - median) / (median * 2), 0.9);
      return { sentence, score: score * rhythmFit };
    })
    .sort((left, right) => (
      right.score - left.score
      || left.sentence.length - right.sentence.length
      || compareText(left.sentence, right.sentence)
    ));

  const picked = [];
  const seen = [];
  let characters = 0;
  for (const { sentence, score } of scored) {
    if (picked.length >= STYLEPRINT_LIMITS.excerpts) break;
    if (score <= 0) break;
    if (characters + sentence.length > STYLEPRINT_LIMITS.excerptTotalChars) continue;
    const tokens = new Set(tokenize(sentence).map(foldToken));
    if (seen.some((earlier) => overlap(tokens, earlier) > 0.6)) continue;
    picked.push(sentence);
    seen.push(tokens);
    characters += sentence.length;
  }
  return picked;
}

function countGrams(tokens, size) {
  const counts = new Map();
  for (let index = 0; index + size <= tokens.length; index += 1) {
    const window = tokens.slice(index, index + size);
    const key = window.map(foldToken).join(" ");
    const surface = window.join(" ");
    const entry = counts.get(key);
    if (entry) {
      entry.count += 1;
      entry.surfaces.set(surface, (entry.surfaces.get(surface) ?? 0) + 1);
    } else {
      counts.set(key, { key, count: 1, surfaces: new Map([[surface, 1]]) });
    }
  }
  for (const entry of counts.values()) entry.surface = dominantSurface(entry.surfaces);
  return counts;
}

function mergeGram(target, entry) {
  const existing = target.get(entry.key);
  if (!existing) {
    target.set(entry.key, { key: entry.key, count: entry.count, surfaces: new Map(entry.surfaces) });
    return;
  }
  existing.count += entry.count;
  for (const [surface, count] of entry.surfaces) {
    existing.surfaces.set(surface, (existing.surfaces.get(surface) ?? 0) + count);
  }
}

function toCountedList(rows, totalWords, limit) {
  return rows
    .sort((left, right) => right.count - left.count || compareText(left.surface, right.surface))
    .slice(0, limit)
    .map((entry) => ({
      text: clip(entry.surface, STYLEPRINT_LIMITS.itemChars),
      count: entry.count,
      per1k: round((entry.count / totalWords) * 1_000)
    }));
}

function dominantSurface(surfaces) {
  return [...surfaces.entries()]
    .sort((left, right) => right[1] - left[1] || compareText(left[0], right[0]))[0][0];
}

function splitParagraphs(text) {
  return text.split(/\n\s*\n+/u).map((part) => part.trim()).filter(Boolean);
}

function splitSentences(text) {
  return text.split(/(?<=[.!?…؟])\s+|\n+/u).map((part) => part.trim()).filter(Boolean);
}

function tokenize(text) {
  return String(text).match(TOKEN) ?? [];
}

export function foldToken(token) {
  return String(token)
    .normalize("NFKC")
    .replace(DIACRITICS, "")
    .replace(/[أإآٱ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/ة/gu, "ه")
    .replace(/[ؤئ]/gu, "ء")
    .toLowerCase();
}

function foldText(text) {
  return tokenize(text).map(foldToken).join(" ");
}

function overlap(left, right) {
  const smaller = Math.min(left.size, right.size);
  if (smaller === 0) return 0;
  let shared = 0;
  for (const value of left) if (right.has(value)) shared += 1;
  return shared / smaller;
}

function clip(text, max) {
  const trimmed = text.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function countMatches(text, pattern) {
  return (text.match(pattern) ?? []).length;
}

function compareText(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(`${label} must be an object.`);
}

function assertExactKeys(object, allowed, label) {
  assertObject(object, label);
  const actual = Object.keys(object).sort();
  const expected = [...allowed].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    invalid(`${label} has missing or unknown fields.`);
  }
}

function assertList(values, label, limit, check) {
  if (!Array.isArray(values) || values.length > limit) {
    invalid(`${label} must be an array of at most ${limit} entries.`);
  }
  values.forEach((value, index) => check(value, `${label}[${index}]`));
}

function assertBoundedText(value, label, max) {
  if (typeof value !== "string" || value.length === 0 || value.length > max || /\0/u.test(value)) {
    invalid(`${label} must be a non-empty string no longer than ${max} characters.`);
  }
}

function assertCount(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) invalid(`${label} must be a non-negative integer.`);
}

function assertNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    invalid(`${label} must be a finite non-negative number.`);
  }
}

function assertRatio(value, label) {
  assertNumber(value, label);
  if (value > 1) invalid(`${label} must be between 0 and 1.`);
}

function assertBoolean(value, label) {
  if (typeof value !== "boolean") invalid(`${label} must be a boolean.`);
}

function invalid(message) {
  throw new CliError(message, { code: "INVALID_PROFILE" });
}
