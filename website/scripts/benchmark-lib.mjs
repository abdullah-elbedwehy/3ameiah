const ARABIC_SCRIPT = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u;

export function evaluateCandidate(testCase, candidate) {
  const checks = [];
  const validators = testCase.validators ?? {};

  for (const tokenSpec of validators.protectedTokens ?? []) {
    const token = normalizeTokenSpec(tokenSpec);
    checks.push(result(
      `protected:${token.value}`,
      containsProtectedToken(candidate, token),
      `لازم يفضل ${token.value} زي ما هو`
    ));
  }

  for (const value of validators.requiredSubstrings ?? []) {
    checks.push(result(`required:${value}`, candidate.includes(value), `لازم يحتوي على ${value}`));
  }

  for (const value of validators.forbiddenSubstrings ?? []) {
    checks.push(result(`forbidden:${value}`, !candidate.includes(value), `مينفعش يضيف ${value}`));
  }

  if (validators.script === "latin") {
    checks.push(result("script:latin", !ARABIC_SCRIPT.test(stripProtected(candidate, validators.protectedTokens)), "الفرانكو لازم يفضل بحروف لاتيني"));
  }

  if (Number.isInteger(validators.maxSentenceWords)) {
    const lengths = splitSentences(candidate).map(countWords);
    checks.push(result("spoken:max-words", lengths.every((length) => length <= validators.maxSentenceWords), `كل Beat لازم يبقى ${validators.maxSentenceWords} كلمة أو أقل`));
  }

  if (Number.isInteger(validators.minimumSentences)) {
    checks.push(result("spoken:min-beats", splitSentences(candidate).length >= validators.minimumSentences, `لازم يبقى فيه ${validators.minimumSentences} Beats على الأقل`));
  }

  if (validators.validJson) {
    let parsed;
    try {
      parsed = JSON.parse(candidate);
      checks.push(result("json:valid", true, "JSON لازم يفضل valid"));
    } catch {
      checks.push(result("json:valid", false, "JSON لازم يفضل valid"));
    }

    if (parsed && Array.isArray(validators.exactJsonKeys)) {
      const actual = Object.keys(parsed).sort();
      const expected = [...validators.exactJsonKeys].sort();
      checks.push(result("json:keys", JSON.stringify(actual) === JSON.stringify(expected), "JSON keys لازم تفضل ثابتة"));
    }
  }

  return {
    passed: checks.every((check) => check.passed),
    checks
  };
}

export function summarize(cases) {
  validateCases(cases);

  const caseResults = cases.map((testCase) => {
    const expected = evaluateCandidate(testCase, testCase.expectedCandidate);
    const negative = evaluateCandidate(testCase, testCase.negativeControl);
    const negativeChecks = new Map(negative.checks.map((check) => [check.id, check]));
    const seededDefectChecks = testCase.negativeExpectedFailures.map((id) => {
      const check = negativeChecks.get(id);
      return {
        id,
        found: Boolean(check),
        caught: Boolean(check && !check.passed)
      };
    });

    return {
      id: testCase.id,
      expectedPassed: expected.passed,
      negativeCaught: seededDefectChecks.every((check) => check.found && check.caught),
      seededDefectChecks,
      expectedChecks: expected.checks,
      negativeChecks: negative.checks
    };
  });

  return {
    caseCount: cases.length,
    expectedPassed: caseResults.filter((entry) => entry.expectedPassed).length,
    negativeCaught: caseResults.filter((entry) => entry.negativeCaught).length,
    modelGenerations: 0,
    humanJudges: 0,
    caseResults
  };
}

function result(id, passed, label) {
  return { id, passed, label };
}

function stripProtected(text, tokens = []) {
  return tokens.reduce((output, tokenSpec) => {
    const token = normalizeTokenSpec(tokenSpec);
    return output.split(token.value).join("");
  }, text);
}

function splitSentences(text) {
  return text.split(/[.!؟?]+/u).map((part) => part.trim()).filter(Boolean);
}

function countWords(text) {
  return text.split(/\s+/u).filter(Boolean).length;
}

function normalizeTokenSpec(tokenSpec) {
  if (typeof tokenSpec === "string") return { value: tokenSpec, kind: "exact" };
  if (!tokenSpec || typeof tokenSpec.value !== "string") {
    throw new TypeError("Every protected token must be a string or an object with a string value.");
  }
  return { value: tokenSpec.value, kind: tokenSpec.kind ?? "exact" };
}

function containsProtectedToken(text, token) {
  const escaped = escapeRegExp(token.value);

  if (token.kind === "route") {
    // A final full stop belongs to the sentence, not the route. Route-like
    // continuations such as /v1/orders.json or /v1/orders/42 still fail.
    const terminal = String.raw`(?=$|[\s,،؛!?؟"'\]\}]|\.(?=$|\s))`;
    return new RegExp(`${escaped}${terminal}`, "u").test(text);
  }

  if (token.kind === "number") {
    return new RegExp(String.raw`(?<![\p{L}\p{N}_])${escaped}(?![\p{L}\p{N}_])`, "u").test(text);
  }

  if (token.kind === "official-name") {
    // `3ameiah` is the product name here, not a leaked mode instruction.
    return new RegExp(String.raw`(?<![A-Za-z0-9_@-])${escaped}(?![A-Za-z0-9_@-])`, "u").test(text);
  }

  if (token.kind !== "exact") throw new TypeError(`Unknown protected token kind: ${token.kind}`);
  return text.includes(token.value);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateCases(cases) {
  if (!Array.isArray(cases) || cases.length === 0) throw new TypeError("Benchmark cases must be a non-empty array.");

  const ids = new Set();
  for (const testCase of cases) {
    if (!testCase || typeof testCase.id !== "string" || !testCase.id) throw new TypeError("Every benchmark case needs an id.");
    if (ids.has(testCase.id)) throw new TypeError(`Duplicate benchmark case id: ${testCase.id}`);
    ids.add(testCase.id);

    for (const field of ["source", "negativeControl", "expectedCandidate"]) {
      if (typeof testCase[field] !== "string" || !testCase[field].trim()) {
        throw new TypeError(`${testCase.id}.${field} must be a non-empty string.`);
      }
    }

    if (!Array.isArray(testCase.negativeExpectedFailures) || testCase.negativeExpectedFailures.length === 0) {
      throw new TypeError(`${testCase.id}.negativeExpectedFailures must name the deliberately seeded checks.`);
    }
  }
}
