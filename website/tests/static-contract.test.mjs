import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const WEBSITE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUBLIC_ROOT = path.join(WEBSITE_ROOT, "public");
const SITE_URL = "https://3ameiah.elbedwehy.tech/";
const SITE_ORIGIN = new URL(SITE_URL).origin;
const GITHUB_URL = "https://github.com/abdullah-elbedwehy/3ameiah";
const NPM_URL = "https://www.npmjs.com/package/3ameiah";
const SKILL_NAMES = [
  "3ameiah",
  "3ameiah-pro",
  "3ameiah-friendly",
  "3ameiah-franco",
  "3ameiah-learn",
  "3ameiah-use",
];

const indexHtml = await readFile(path.join(WEBSITE_ROOT, "index.html"), "utf8");
const appJs = await readFile(path.join(WEBSITE_ROOT, "app.js"), "utf8");
const sourceCss = await readFile(path.join(WEBSITE_ROOT, "styles.css"), "utf8");
const sourceHtml = indexHtml.replace(/<!--[\s\S]*?-->/g, "");
const packageJson = JSON.parse(
  await readFile(path.join(WEBSITE_ROOT, "package.json"), "utf8"),
);
const vercelJson = JSON.parse(
  await readFile(path.join(WEBSITE_ROOT, "vercel.json"), "utf8"),
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function openingTags(name, html = sourceHtml) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(
    (match) => match[0],
  );
}

function attribute(tag, name) {
  const match = tag.match(
    new RegExp(
      `(?:^|\\s)${escapeRegExp(name)}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
      "i",
    ),
  );
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

function hasAttribute(tag, name) {
  return new RegExp(
    `(?:^|\\s)${escapeRegExp(name)}(?:\\s*=|\\s|>)`,
    "i",
  ).test(tag);
}

function relIncludes(tag, value) {
  return (attribute(tag, "rel") ?? "")
    .toLowerCase()
    .split(/\s+/)
    .includes(value.toLowerCase());
}

function visibleText(html = sourceHtml) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function assertNonEmptyFile(relativePath) {
  const absolutePath = path.join(WEBSITE_ROOT, relativePath);
  let fileStat;
  try {
    fileStat = await stat(absolutePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      assert.fail(`${relativePath} must exist`);
    }
    throw error;
  }
  assert.equal(fileStat.isFile(), true, `${relativePath} must be a file`);
  assert.ok(fileStat.size > 0, `${relativePath} must not be empty`);
}

async function readOptionalJson(relativePath) {
  try {
    return JSON.parse(await readFile(path.join(WEBSITE_ROOT, relativePath), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

test("the document is Egyptian Arabic RTL and has exactly one H1", () => {
  const htmlTags = openingTags("html");
  assert.equal(htmlTags.length, 1, "index.html must contain one <html> element");
  assert.equal(attribute(htmlTags[0], "lang"), "ar-EG");
  assert.equal(attribute(htmlTags[0], "dir"), "rtl");

  assert.equal(
    openingTags("h1").length,
    1,
    "the page must expose one, and only one, primary heading",
  );
  assert.equal(
    [...sourceHtml.matchAll(/<\/h1\s*>/gi)].length,
    1,
    "the primary heading must be closed",
  );
});

test("canonical and Open Graph URLs point at the production origin", () => {
  const links = openingTags("link");
  const canonical = links.filter((tag) => relIncludes(tag, "canonical"));
  assert.equal(canonical.length, 1, "exactly one canonical link is required");
  assert.equal(attribute(canonical[0], "href"), SITE_URL);

  const metadata = openingTags("meta");
  const metaContent = (property) => {
    const matches = metadata.filter(
      (tag) => attribute(tag, "property")?.toLowerCase() === property,
    );
    assert.equal(matches.length, 1, `${property} must appear exactly once`);
    return attribute(matches[0], "content");
  };

  assert.equal(metaContent("og:url"), SITE_URL);
  const ogImage = new URL(metaContent("og:image"));
  assert.equal(ogImage.protocol, "https:");
  assert.equal(ogImage.origin, SITE_ORIGIN);
});

test("a single-language page does not advertise hreflang alternates", () => {
  assert.doesNotMatch(
    sourceHtml,
    /\shreflang\s*=/i,
    "remove hreflang until a real alternate-language URL exists",
  );
});

test("mobile comparison tape stays in flow and does not overlay the sheets", () => {
  const mobileCss = sourceCss.split("@media (max-width: 820px)")[1] ?? "";
  const transferBlock = mobileCss.match(/\.tape-transfer \{[^}]+\}/)?.[0] ?? "";
  assert.match(transferBlock, /width:\s*max-content/);
  assert.doesNotMatch(
    transferBlock,
    /rotate\(90deg\)/,
    "rotating the full-width transfer overlays the baseline copy",
  );
  assert.match(mobileCss, /\.tape-transfer::after \{[\s\S]*?content:\s*"↓"/);
});

test("headline word swap starts without waiting for the intro typewriter", () => {
  assert.match(
    appJs,
    /function runHeroTypingSequence\(runId\) \{\s*typeHeroIntroCopy\(runId\);\s*runHeadlineTypewriter\(runId\);/,
    "مصري/زيك must start cycling independently of the intro paragraph",
  );
  assert.doesNotMatch(
    appJs,
    /await typeHeroIntroCopy\(/,
    "the headline loop must not await the intro typewriter",
  );
});

test("the hero typewriter keeps complete assistive copy and has no caret", () => {
  const h1 = openingTags("h1")[0];
  assert.match(attribute(h1, "aria-label") ?? "", /مصري/);
  assert.match(attribute(h1, "aria-label") ?? "", /زيك/);
  assert.match(sourceHtml, /data-typewriter-word/i);
  assert.match(sourceHtml, /data-hero-typecopy/i);
  assert.doesNotMatch(sourceHtml, /class=["'][^"']*type-caret/i);

  const intro = openingTags("p").find((tag) => /\bhero-intro\b/.test(attribute(tag, "class") ?? ""));
  assert.ok(intro, "the typed intro paragraph must exist");
  assert.match(sourceHtml, /<span\s+class=["']sr-only["']>\s*مش ترجمة حرفية/);
  assert.match(sourceHtml, /<span\s+aria-hidden=["']true["']\s+data-hero-typecopy/);
});

test("motion remains progressive and restores only real in-view loops", () => {
  assert.match(
    appJs,
    /motionSections\.forEach\(\(section\) => section\.classList\.add\("motion-section"\)\)/,
    "every animated section needs the reveal class before feature detection",
  );
  assert.match(
    appJs,
    /if \(!supportsSectionObserver\)[\s\S]*?classList\.add\("has-entered"\)/,
    "missing IntersectionObserver must leave section content visible",
  );
  assert.match(
    appJs,
    /if \(reducedMotion\)[\s\S]*?classList\.remove\("is-in-view"\)/,
    "reduced motion must stop viewport-only loops",
  );
  assert.match(
    appJs,
    /function applyMotionPreference\(\)[\s\S]*?syncMotionSectionVisibility\(\)[\s\S]*?root\.classList\.add\("motion-enabled"\)/,
    "restoring motion must recompute visibility before animations are enabled",
  );
  assert.match(
    appJs,
    /get\("motion"\) === "full"/,
    "the explicit full-motion preview needs a stable URL switch",
  );
  assert.match(
    appJs,
    /root\.classList\.toggle\("motion-force-full", forceFullMotion\)/,
    "the preview switch must opt out of reduced-motion CSS as well as JS",
  );
});

test("the public GitHub repository and npm package are real links", () => {
  const anchorHrefs = new Set(
    openingTags("a").map((tag) => attribute(tag, "href")).filter(Boolean),
  );
  assert.ok(anchorHrefs.has(GITHUB_URL), "missing public GitHub link");
  assert.ok(anchorHrefs.has(NPM_URL), "missing public npm link");
});

test("all six public skill names use their canonical hyphenated spelling", () => {
  const copy = visibleText();
  const invokedNames = new Set(
    [...copy.matchAll(/(?:\/|\$)(3ameiah(?:-[a-z]+)?)(?![\w-])/gi)].map(
      (match) => match[1].toLowerCase(),
    ),
  );

  assert.deepEqual(
    [...invokedNames].sort(),
    [...SKILL_NAMES].sort(),
    "the landing page must show exactly the six public skill invocations",
  );
  assert.doesNotMatch(
    sourceHtml,
    /(?:\/|\$)3ameiah_(?:pro|friendly|franco|learn|use)\b/i,
    "legacy underscore aliases must not be promoted",
  );
});

test("the copy-link install path is actionable without overstating agent capability", () => {
  const messageButtons = openingTags("button").filter(
    (tag) => attribute(tag, "data-copy-kind") === "message",
  );
  assert.ok(messageButtons.length > 0, "missing ready-to-copy install message");

  const installMessage = messageButtons
    .map((tag) => attribute(tag, "data-copy") ?? "")
    .find((value) => value.includes(SITE_URL.slice(0, -1)));
  assert.ok(installMessage, "the copied install request must contain the site URL");
  assert.match(installMessage, /(?:نز[ّّ]?ل|ثب[ّّ]?ت)/i);
  assert.match(
    installMessage,
    /(?:(?:6|٦)\s*(?:skills?|مهارات|أوامر)|(?:ال)?أوامر\s+(?:الستة|6|٦)|(?:ال)?مهارات\s+(?:الستة|6|٦))/i,
  );

  const copy = visibleText();
  assert.match(
    copy,
    /لازم\s+الـ?Agent[^.؟]{0,180}(?:Terminal|تيرمنال)[^.؟]{0,180}(?:ملفات|يكتب ملفات)/i,
    "the page must require both terminal and filesystem capability",
  );
  assert.match(
    copy,
    /شات بس[^.؟]{0,240}(?:مش|ما)[^.؟]{0,80}(?:يثب|تثبيت)/i,
    "the page must say that a chat-only model cannot install files",
  );
});

test("the final CTA keeps its URL, bidi, and copy feedback local", () => {
  const finalSectionMatch = sourceHtml.match(
    /(<section\b[^>]*class=["'][^"']*\bfinal-cta\b[^"']*["'][^>]*>)([\s\S]*?)<\/section>/i,
  );
  assert.ok(finalSectionMatch, "missing final CTA section");

  const [, sectionTag, finalSection] = finalSectionMatch;
  assert.equal(attribute(sectionTag, "aria-labelledby"), "final-title");

  const headings = openingTags("h2", finalSection);
  assert.equal(headings.length, 1, "the final CTA needs one heading");
  assert.equal(attribute(headings[0], "id"), "final-title");

  const copyButtons = openingTags("button", finalSection).filter(
    (tag) => attribute(tag, "data-copy-kind") === "url",
  );
  assert.equal(copyButtons.length, 1, "the final CTA needs one URL copy action");
  assert.equal(attribute(copyButtons[0], "type"), "button");
  assert.equal(attribute(copyButtons[0], "data-copy"), "https://3ameiah.elbedwehy.tech");
  assert.equal(attribute(copyButtons[0], "aria-describedby"), "final-copy-feedback");

  const isolatedUrls = openingTags("bdi", finalSection).filter(
    (tag) => attribute(tag, "dir") === "ltr",
  );
  assert.ok(isolatedUrls.length >= 1, "the mixed-direction CTA needs an LTR isolate");
  assert.match(finalSection, />\s*3ameiah\.elbedwehy\.tech\s*<\/bdi>/i);

  const feedback = openingTags("p", finalSection).find(
    (tag) => hasAttribute(tag, "data-copy-feedback"),
  );
  assert.ok(feedback, "copy feedback must stay beside the final action");
  assert.equal(attribute(feedback, "id"), "final-copy-feedback");
  assert.equal(attribute(feedback, "role"), "status");
  assert.equal(attribute(feedback, "aria-live"), "polite");
});

test("required public discovery, install, and visual assets exist", async () => {
  const requiredFiles = [
    "public/assets/3ameiah-logo.webp",
    "public/assets/hero-cassette.webp",
    "public/og-image.png",
    "public/favicon.svg",
    "public/site.webmanifest",
    "public/robots.txt",
    "public/sitemap.xml",
    "public/llms.txt",
    "public/install.md",
  ];
  await Promise.all(requiredFiles.map(assertNonEmptyFile));

  const links = openingTags("link");
  const iconLink = links.find((tag) => relIncludes(tag, "icon"));
  assert.ok(iconLink, "index.html must reference a favicon");
  const iconHref = attribute(iconLink, "href");
  assert.ok(iconHref?.startsWith("/"), "favicon must use a root-relative URL");
  await assertNonEmptyFile(`public/${iconHref.slice(1)}`);
  assert.ok(
    links.some(
      (tag) =>
        relIncludes(tag, "manifest") &&
        attribute(tag, "href") === "/site.webmanifest",
    ),
    "site.webmanifest must be referenced from index.html",
  );
  assert.match(sourceHtml, /(?:src|href)="\/assets\/hero-cassette\.webp"/i);
});

test("manifest, robots, and sitemap metadata agree on locale and canonical URL", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(PUBLIC_ROOT, "site.webmanifest"), "utf8"),
  );
  assert.equal(manifest.lang, "ar-EG");
  assert.equal(manifest.dir, "rtl");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);

  for (const icon of manifest.icons) {
    assert.equal(typeof icon.src, "string");
    const iconUrl = new URL(icon.src, SITE_URL);
    assert.equal(iconUrl.origin, SITE_ORIGIN);
    const iconPath = path.resolve(PUBLIC_ROOT, `.${iconUrl.pathname}`);
    assert.ok(
      iconPath.startsWith(`${PUBLIC_ROOT}${path.sep}`),
      `manifest icon escapes public/: ${icon.src}`,
    );
    const iconStat = await stat(iconPath);
    assert.ok(iconStat.isFile() && iconStat.size > 0, `missing icon ${icon.src}`);
  }

  const robots = await readFile(path.join(PUBLIC_ROOT, "robots.txt"), "utf8");
  assert.match(robots, /^User-agent:\s*\*/im);
  assert.match(robots, /^Allow:\s*\/\s*$/im);
  assert.match(
    robots,
    new RegExp(`^Sitemap:\\s*${escapeRegExp(SITE_URL)}sitemap\\.xml\\s*$`, "im"),
  );

  const sitemap = await readFile(path.join(PUBLIC_ROOT, "sitemap.xml"), "utf8");
  assert.match(
    sitemap,
    new RegExp(`<loc>\\s*${escapeRegExp(SITE_URL)}\\s*</loc>`, "i"),
  );
});

test("machine-readable install documents preserve source, names, and capability boundary", async () => {
  const llms = await readFile(path.join(PUBLIC_ROOT, "llms.txt"), "utf8");
  const install = await readFile(path.join(PUBLIC_ROOT, "install.md"), "utf8");

  for (const [name, content] of [
    ["llms.txt", llms],
    ["install.md", install],
  ]) {
    assert.match(content, new RegExp(escapeRegExp(GITHUB_URL)), `${name} needs source URL`);
    for (const skillName of SKILL_NAMES) {
      assert.match(
        content,
        new RegExp(`(?:^|[^\\w-])${escapeRegExp(skillName)}(?:$|[^\\w-])`, "m"),
        `${name} is missing ${skillName}`,
      );
    }
  }

  assert.match(install, /terminal/i);
  assert.match(install, /(?:filesystem|ملفات|يكتب ملفات)/i);
  assert.match(install, /(?:chat[- ]only|شات بس)[\s\S]{0,300}(?:cannot|can't|مش|ما)/i);
});

test("Vercel applies CSP, frame protection, and MIME sniffing protection globally", () => {
  assert.ok(Array.isArray(vercelJson.headers), "vercel.json headers must be an array");
  const catchAll = vercelJson.headers.filter(({ source }) =>
    /(?:\(\.\*\)|:path\*)/.test(source ?? ""),
  );
  assert.ok(catchAll.length > 0, "security headers need a catch-all route");

  const headers = new Map(
    catchAll
      .flatMap((rule) => rule.headers ?? [])
      .map(({ key, value }) => [key.toLowerCase(), value]),
  );
  const csp = headers.get("content-security-policy");
  assert.equal(typeof csp, "string", "missing Content-Security-Policy");
  assert.match(csp, /(?:^|;)\s*default-src\s+[^;]*'self'/i);

  assert.match(
    headers.get("x-frame-options") ?? "",
    /^(?:DENY|SAMEORIGIN)$/i,
    "X-Frame-Options must deny cross-origin framing",
  );
  assert.equal(
    (headers.get("x-content-type-options") ?? "").toLowerCase(),
    "nosniff",
  );
});

test("the website package stays private and exposes the requested test/build commands", () => {
  assert.equal(packageJson.private, true, "the landing package must never be published");
  assert.match(packageJson.scripts?.test ?? "", /node\s+--test\s+\.\/tests\/\*\.test\.mjs/);
  assert.match(packageJson.scripts?.build ?? "", /\bvite\s+build\b/);
});

test("Vite source references and their final files are present", async () => {
  const links = openingTags("link");
  assert.ok(
    links.some(
      (tag) =>
        relIncludes(tag, "stylesheet") && attribute(tag, "href") === "/styles.css",
    ),
    "index.html must load /styles.css",
  );

  const scripts = openingTags("script");
  assert.ok(
    scripts.some(
      (tag) =>
        attribute(tag, "type") === "module" && attribute(tag, "src") === "/app.js",
    ),
    "index.html must load /app.js as a module",
  );
  await Promise.all([
    assertNonEmptyFile("styles.css"),
    assertNonEmptyFile("app.js"),
  ]);

  const appJavaScript = await readFile(path.join(WEBSITE_ROOT, "app.js"), "utf8");
  assert.doesNotThrow(
    () => new Function(appJavaScript),
    "app.js must parse before a static contract can pass",
  );
});

test("committed benchmark artifacts stay internally consistent", async () => {
  const results = await readOptionalJson("benchmarks/results.json");
  if (!results) return;

  assert.match(results.benchmarkVersion, /^\d+\.\d+\.\d+$/);
  assert.ok(Array.isArray(results.caseResults));
  assert.equal(results.caseCount, results.caseResults.length);
  assert.equal(
    results.expectedPassed,
    results.caseResults.filter((entry) => entry.expectedPassed === true).length,
  );
  assert.equal(
    results.negativeCaught,
    results.caseResults.filter((entry) => entry.negativeCaught === true).length,
  );
  assert.equal(results.modelGenerations, 0);
  assert.equal(results.humanJudges, 0);
  assert.match(results.interpretation, /deterministic/i);
  assert.match(results.interpretation, /not (?:a )?model/i);
  assert.match(results.fixtureHash, /^[a-f0-9]{64}$/i);
  assert.match(results.runnerHash, /^[a-f0-9]{64}$/i);
  assert.doesNotMatch(sourceHtml, /id=["']benchmark["']/i, "the landing page intentionally omits the benchmark section");
});
