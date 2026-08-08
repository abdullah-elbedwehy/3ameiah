import { createInterface } from "node:readline/promises";

import { CliError } from "./errors.mjs";

export async function collectProfileAnswers(seed, {
  input = process.stdin,
  output = process.stdout,
  forceInteractive = false,
  reader: suppliedReader
} = {}) {
  const interactive = Boolean(suppliedReader) || forceInteractive || (input.isTTY && output.isTTY);
  if (!interactive) return seed;

  const reader = suppliedReader ?? createInterface({ input, output });
  try {
    const name = seed.name || await ask(reader, "اسم البروفايل / Profile name", "");
    if (!name) throw new CliError("Profile name is required.", { code: "MISSING_PROFILE_NAME" });
    if (hasLearningInput(seed)) return { ...seed, name };

    output.write("\nعلّمه بالطريقة الأسهل ليك:\n");
    output.write("  1) جملة واحدة عن أسلوبك أو شغلك\n");
    output.write("  2) احفظ عينات كدليل، وبعدها خلّي الـagent يقترح قواعد الأسلوب\n");
    output.write("  3) خمس أسئلة سريعة\n\n");
    const route = await ask(reader, "اختار 1 أو 2 أو 3", "1");
    if (route === "1") return collectOneSentence(reader, seed, name);
    if (route === "2") return collectSamples(reader, seed, name);
    if (route === "3") return collectGuided(reader, seed, name);
    throw new CliError("Choose learning route 1, 2, or 3.", { code: "INVALID_LEARNING_ROUTE" });
  } finally {
    if (!suppliedReader) reader.close();
  }
}

async function collectOneSentence(reader, seed, name) {
  const lesson = await ask(reader, "اكتب حاجة واحدة يتعلمها عنك أو عن النبرة المطلوبة", "");
  return {
    ...seed,
    name,
    about: [...(seed.about ?? []), ...(lesson ? [lesson] : [])]
  };
}

async function collectSamples(reader, seed, name) {
  const sampleFiles = [...(seed.sampleFiles ?? [])];
  for (let index = 1; index <= 5; index += 1) {
    const sample = await ask(
      reader,
      index === 1
        ? "مسار أول عينة بتحبها"
        : `مسار عينة إضافية ${index}/5 (Enter لما تخلص)`,
      ""
    );
    if (!sample) break;
    sampleFiles.push(sample);
  }
  const disliked = await ask(reader, "مسار مثال مش شبه أسلوبك (اختياري)", "");
  if (sampleFiles.length === 0 && !disliked && (seed.dislikedSampleFiles ?? []).length === 0) {
    throw new CliError("Add at least one liked or disliked sample for route 2.", { code: "NO_LEARNING_INPUT" });
  }
  return {
    ...seed,
    name,
    sampleFiles,
    dislikedSampleFiles: [
      ...(seed.dislikedSampleFiles ?? []),
      ...(disliked ? [disliked] : [])
    ]
  };
}

async function collectGuided(reader, seed, name) {
  const audience = optional(await ask(reader, "1/5 بتكتب لمين غالبًا؟", ""));
  const tone = optional(await ask(reader, "2/5 عايز الكلام يتحس إزاي؟", ""));
  const formality = optional(await ask(reader, "3/5 الرسمية من 1 لحد 5", ""));
  const codeSwitching = optional(await ask(reader, "4/5 بتحب تخلط English قد إيه؟", ""));
  const habits = await ask(
    reader,
    "5/5 اكتب اللي بتحبه واللي بتتجنبه بالشكل ده: prefer: ... | avoid: ...",
    ""
  );
  const { prefer, avoid } = parseHabits(habits);
  return compactUndefined({
    ...seed,
    name,
    audience,
    tone,
    formality,
    codeSwitching,
    prefer: [...(seed.prefer ?? []), ...prefer],
    avoid: [...(seed.avoid ?? []), ...avoid]
  });
}

function hasLearningInput(seed) {
  return ["mode", "tone", "audience", "address", "formality", "warmth", "directness", "codeSwitching", "note"]
    .some((key) => seed[key] !== undefined && seed[key] !== "")
    || ["about", "spellings", "prefer", "avoid", "sampleFiles", "dislikedSampleFiles"]
      .some((key) => seed[key]?.length);
}

function parseHabits(value) {
  if (!value) return { prefer: [], avoid: [] };
  const prefer = [];
  const avoid = [];
  for (const section of value.split("|")) {
    const [rawLabel, ...rest] = section.split(":");
    const items = split(rest.join(":"));
    const label = rawLabel.trim().toLowerCase();
    if (["prefer", "بحب", "فضل"].includes(label)) prefer.push(...items);
    else if (["avoid", "مش بحب", "اتجنب", "تجنب"].includes(label)) avoid.push(...items);
    else if (items.length === 0 && section.trim()) prefer.push(section.trim());
  }
  return { prefer, avoid };
}

function split(value) {
  return value.split(/[،,]/u).map((item) => item.trim()).filter(Boolean);
}

function optional(value) {
  return value || undefined;
}

function compactUndefined(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

async function ask(reader, label, fallback) {
  const suffix = fallback ? ` [${fallback}]` : "";
  const answer = (await reader.question(`${label}${suffix}: `)).trim();
  return answer || fallback;
}
