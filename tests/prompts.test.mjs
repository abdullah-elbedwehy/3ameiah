import assert from "node:assert/strict";
import test from "node:test";

import { collectProfileAnswers } from "../src/prompts.mjs";

function scriptedAnswers(seed, answers) {
  let answerIndex = 0;
  const reader = {
    async question() {
      const answer = answers[answerIndex] ?? "";
      answerIndex += 1;
      return answer;
    }
  };
  const output = { write() {} };
  return collectProfileAnswers(seed, { output, reader });
}

test("guided blank answers preserve every existing scalar by leaving updates undefined", async () => {
  const answers = await scriptedAnswers({
    name: "creator",
    spellings: [],
    prefer: [],
    avoid: [],
    about: [],
    sampleFiles: [],
    dislikedSampleFiles: []
  }, ["3", "", "", "", "", ""]);
  for (const field of ["mode", "tone", "audience", "formality", "warmth", "directness", "codeSwitching"]) {
    assert.equal(answers[field], undefined);
  }
});

test("one-sentence route captures a useful lesson without extra questions", async () => {
  const answers = await scriptedAnswers({ name: "creator", about: [] }, ["1", "بحب أدخل في الموضوع بسرعة"]);
  assert.deepEqual(answers.about, ["بحب أدخل في الموضوع بسرعة"]);
});

test("explicit learning flags bypass the interview and are not replaced by defaults", async () => {
  const seed = { name: "creator", tone: "دافي ومختصر", warmth: 5, about: [] };
  const answers = await scriptedAnswers(seed, []);
  assert.equal(answers.tone, "دافي ومختصر");
  assert.equal(answers.warmth, 5);
  assert.equal(answers.mode, undefined);
});

test("the interactive sample route is labeled as evidence plus an agent-assisted next step", async () => {
  const lines = [];
  const reader = {
    answers: ["2", "/tmp/example.txt", "", ""],
    async question() { return this.answers.shift() ?? ""; }
  };
  await collectProfileAnswers({ name: "creator", sampleFiles: [], dislikedSampleFiles: [] }, {
    reader,
    output: { write(value) { lines.push(value); } }
  });
  assert.match(lines.join(""), /احفظ عينات كدليل/);
  assert.match(lines.join(""), /الـagent يقترح قواعد الأسلوب/);
});

test("the interactive sample route does not create an empty learned profile", async () => {
  await assert.rejects(
    scriptedAnswers({ name: "creator", sampleFiles: [], dislikedSampleFiles: [] }, ["2", "", ""]),
    /at least one liked or disliked sample/
  );
});
