const modeExamples = {
  general: {
    after: "طلبك اتبعت بنجاح. تقدر تتابعه من الـDashboard.",
    note: "طبيعي، واضح، ونفس المعنى.",
    direction: "rtl"
  },
  professional: {
    after: "طلب حضرتك اتبعت بنجاح، وتقدر تتابعه من الـDashboard.",
    note: "محترم وعملي، من غير لغة خطابات.",
    direction: "rtl"
  },
  friendly: {
    after: "تمام، طلبك اتبعت! تقدر تتابعه من الـDashboard.",
    note: "دافي وخفيف، من غير قرب مصطنع.",
    direction: "rtl"
  },
  franco: {
    after: "Talabak etba3at. T2dar tetab3o men el Dashboard.",
    note: "Franco masry ma2ro2, mesh English translation.",
    direction: "ltr"
  }
};

/**
 * Hero route drawing. JS is the only writer of `--route-draw` (0 = hidden, 1 = fully drawn);
 * styles.css turns it into stroke-dashoffset. Scroll sets the target, the entrance ramp
 * feeds the tape out to that target on first load, and the two never fight over the property.
 */
const routeMotion = {
  restDraw: 0.16, // drawn fraction while the hero sits at the top of the page
  scrollGain: 1.6, // how quickly the routes draw as the hero scrolls away
  stagger: 0.035, // each later route trails the previous one by this fraction
  entryDelay: 320, // ms before the first route starts feeding out (cassette lands first)
  entryDuration: 1150, // ms for one route to reach its target
  entryStagger: 120 // ms between consecutive routes
};

const header = document.querySelector("[data-header]");
const copyLive = document.querySelector("[data-copy-live]");
const typewriterWord = document.querySelector("[data-typewriter-word]");
const heroTypedCopy = document.querySelector("[data-hero-typecopy]");
const heroTypedCopyText = heroTypedCopy?.textContent.trim() ?? "";
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;
const forceFullMotion = new URLSearchParams(window.location.search).get("motion") === "full";
let reducedMotion = !forceFullMotion && motionQuery.matches;
root.classList.toggle("motion-force-full", forceFullMotion);
const hero = document.querySelector(".hero");
const heroArt = document.querySelector(".hero-art");
const heroCopy = document.querySelector(".hero-copy");
const heroRoutes = [...document.querySelectorAll(".route")];
const scrollDeckTrack = document.querySelector(".scroll-deck-track");
const scrollDeckHead = document.querySelector(".scroll-deck-head");
const scrollCounter = document.querySelector("[data-scroll-counter]");
const tapeReels = document.querySelectorAll("[data-reel]");
const tapeCounter = document.querySelector("[data-tape-counter]");
const deckMarks = [...document.querySelectorAll("[data-deck-mark]")];
const sectionElements = {
  difference: document.querySelector(".difference"),
  modes: document.querySelector(".modes"),
  profiles: document.querySelector(".profiles"),
  install: document.querySelector(".install"),
  faq: document.querySelector(".faq"),
  final: document.querySelector(".final-cta")
};
const motionSections = Object.values(sectionElements).filter(Boolean);
const comparisonStage = document.querySelector(".comparison-stage");
const comparisonAfter = document.querySelector("[data-after]");
const comparisonNote = document.querySelector("[data-after-note]");
const resultSheet = document.querySelector(".result-sheet");
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const trackList = document.querySelector(".track-list");
const tracks = [...document.querySelectorAll(".track")];
const profileTape = document.querySelector(".profile-tape");
const easyPath = document.querySelector(".easy-path");
const terminalPath = document.querySelector(".terminal-path");
const faqDetails = [...document.querySelectorAll(".faq details")];
const finalLogo = document.querySelector(".final-logo");
const finalTapeRun = document.querySelector(".final-tape-run");
let motionResetFrame = 0;

const motionGroups = [
  [".difference", ".section-heading > *, .mode-chip, .comparison-sheet"],
  [".modes", ".modes-intro > *, .track"],
  [".profiles", ".profiles-copy > *"],
  [".install", ".install-copy > *, .install-path, .agent-strip, .agent-caveat"],
  [".faq", "h2, .faq-list details"],
  [".final-cta", ".final-kicker, h2, .final-description, .final-action"]
];

motionGroups.forEach(([sectionSelector, itemSelector]) => {
  const section = document.querySelector(sectionSelector);
  if (!section) return;
  [...section.querySelectorAll(itemSelector)].forEach((item, index) => {
    item.classList.add("motion-item");
    item.style.setProperty("--motion-delay", `${Math.min(index, 6) * 65}ms`);
  });
});

tracks.forEach((track, index) => {
  track.style.setProperty("--track-index", String(index));
  track.style.setProperty("--motion-delay", `${140 + index * 95}ms`);
});

function syncHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
}

const sectionObserverOptions = { rootMargin: "-7% 0px -10%", threshold: 0.08 };

function sectionIsInMotionViewport(section) {
  const rect = section.getBoundingClientRect();
  const topInset = window.innerHeight * 0.07;
  const bottomInset = window.innerHeight * 0.1;
  return rect.bottom > topInset && rect.top < window.innerHeight - bottomInset;
}

function syncMotionSection(section, isInView) {
  if (reducedMotion) {
    section.classList.remove("is-in-view");
    return;
  }

  if (isInView) section.classList.add("has-entered");
  section.classList.toggle("is-in-view", isInView);
}

function syncMotionSectionVisibility() {
  motionSections.forEach((section) => {
    syncMotionSection(section, sectionIsInMotionViewport(section));
  });
}

function applyMotionPreference() {
  if (motionResetFrame) {
    window.cancelAnimationFrame(motionResetFrame);
    motionResetFrame = 0;
  }
  document.getAnimations?.().forEach((animation) => animation.cancel());

  if (reducedMotion) {
    root.classList.remove("motion-enabled", "motion-resetting");
    motionSections.forEach((section) => syncMotionSection(section, false));
    return;
  }

  // Establish the real viewport state before enabling rules that hide pending items.
  root.classList.add("motion-resetting");
  syncMotionSectionVisibility();
  root.classList.add("motion-enabled");
  motionResetFrame = window.requestAnimationFrame(() => {
    motionResetFrame = window.requestAnimationFrame(() => {
      root.classList.remove("motion-resetting");
      motionResetFrame = 0;
    });
  });
}

motionSections.forEach((section) => section.classList.add("motion-section"));

const supportsSectionObserver = typeof window.IntersectionObserver === "function";

if (!supportsSectionObserver) {
  // Progressive enhancement: content stays visible even when observation is unavailable.
  motionSections.forEach((section) => section.classList.add("has-entered"));
  syncMotionSectionVisibility();
} else {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        syncMotionSection(entry.target, entry.isIntersecting);
      });
      scheduleMotionFrame();
    },
    sectionObserverOptions
  );
  motionSections.forEach((section) => sectionObserver.observe(section));
}

applyMotionPreference();
const playHeroEntry = !reducedMotion && window.scrollY <= 32 && !window.location.hash;
if (playHeroEntry) root.classList.add("hero-entry");

// Routes start hidden only when the hero entrance plays; otherwise they follow scroll at once.
const routeEntryStart = playHeroEntry ? performance.now() : null;
if (playHeroEntry) heroRoutes.forEach((route) => route.style.setProperty("--route-draw", "0"));

motionQuery.addEventListener("change", (event) => {
  reducedMotion = !forceFullMotion && event.matches;
  applyMotionPreference();
  markLayoutDirty();
  syncTypewriter();
  scheduleMotionFrame();
});

let motionFrame = 0;
let previousScrollY = window.scrollY;
let layoutDirty = true;
let layoutMetrics = {
  viewportHeight: window.innerHeight,
  viewportWidth: window.innerWidth,
  maxScroll: 1,
  headTravel: 0,
  heroHeight: window.innerHeight,
  sections: [],
  faqItems: []
};

function markLayoutDirty() {
  layoutDirty = true;
}

function measureLayout(scrollY = window.scrollY) {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  layoutMetrics = {
    viewportHeight,
    viewportWidth,
    maxScroll: Math.max(1, root.scrollHeight - viewportHeight),
    headTravel: Math.max(0, (scrollDeckTrack?.clientHeight ?? 0) - 22),
    heroHeight: hero?.offsetHeight ?? viewportHeight,
    sections: motionSections.map((element) => {
      const rect = element.getBoundingClientRect();
      return { element, top: rect.top + scrollY, height: rect.height };
    }),
    faqItems: faqDetails.map((element) => {
      const rect = element.getBoundingClientRect();
      return { element, center: rect.top + scrollY + rect.height / 2 };
    })
  };
  placeDeckMarks(layoutMetrics.maxScroll, scrollY);
  layoutDirty = false;
}

/**
 * Put each cue mark where its section actually starts on the tape, so the marks stay
 * honest when the page reflows. Anchored to the same scroll range as the progress fill.
 */
function placeDeckMarks(maxScroll, scrollY) {
  deckMarks.forEach((mark) => {
    const target = document.querySelector(mark.getAttribute("href"));
    if (!target) return;
    const top = target.getBoundingClientRect().top + scrollY;
    mark.style.setProperty("--mark", clamp(top / maxScroll, 0, 1).toFixed(4));
  });
}

function scheduleMotionFrame() {
  if (motionFrame) return;
  motionFrame = window.requestAnimationFrame(updateMotionFrame);
}

function updateMotionFrame(frameTime = performance.now()) {
  motionFrame = 0;
  const scrollY = window.scrollY;
  if (layoutDirty) measureLayout(scrollY);
  if (!supportsSectionObserver) syncMotionSectionVisibility();

  const { viewportHeight, viewportWidth, maxScroll, headTravel, heroHeight, sections, faqItems } = layoutMetrics;
  const pageProgress = clamp(scrollY / maxScroll, 0, 1);
  const scrollDelta = scrollY - previousScrollY;
  const scrollDirection = scrollDelta < 0 ? "up" : "down";
  const sectionProgress = new Map(
    sections.map(({ element, top, height }) => [
      element,
      clamp((viewportHeight - (top - scrollY)) / (viewportHeight + height), 0, 1)
    ])
  );

  syncHeader();
  root.style.setProperty("--page-progress", pageProgress.toFixed(4));
  if (scrollCounter) scrollCounter.textContent = String(Math.round(pageProgress * 99)).padStart(2, "0");
  deckMarks.forEach((mark) => {
    const at = Number(mark.style.getPropertyValue("--mark")) || 0;
    mark.classList.toggle("is-passed", pageProgress >= at - 0.005);
  });

  if (!reducedMotion) {
    if (scrollDeckHead) {
      scrollDeckHead.style.transform = `translate3d(0, ${pageProgress * headTravel}px, 0) rotate(${pageProgress * 720 + (scrollDirection === "down" ? 0 : 180)}deg)`;
    }

    const heroProgress = clamp(scrollY / Math.max(1, heroHeight * 0.82), 0, 1);
    const mobileFactor = viewportWidth <= 820 ? 0.55 : 1;
    if (heroArt) {
      heroArt.style.transform = `translate3d(${-34 * heroProgress * mobileFactor}px, ${76 * heroProgress}px, 0) rotate(${-1.7 - 3.1 * heroProgress}deg) scale(${1 - 0.045 * heroProgress})`;
    }
    if (heroCopy) {
      heroCopy.style.transform = `translate3d(0, ${-34 * heroProgress}px, 0)`;
      heroCopy.style.opacity = String(1 - heroProgress * 0.28);
    }
    if (!drawRoutes(heroProgress, frameTime)) scheduleMotionFrame();

    sectionProgress.forEach((progress, section) => {
      section.style.setProperty("--section-progress", progress.toFixed(4));
    });

    applySectionParallax(sectionProgress, faqItems, scrollY, viewportHeight, viewportWidth);
  }

  previousScrollY = scrollY;
}

/**
 * How far a route's entrance has played, 0..1. Routes feed out one after another once the
 * cassette has landed; when no entrance is playing every route is already "in".
 */
function routeEntryProgress(frameTime, index) {
  if (routeEntryStart === null) return 1;
  const elapsed = frameTime - routeEntryStart - routeMotion.entryDelay - index * routeMotion.entryStagger;
  return smoothstep(elapsed / routeMotion.entryDuration);
}

/**
 * Feed the four tape routes out of the cassette. Scroll decides how much tape is out;
 * the entrance ramp scales that target on first load so the routes draw instead of popping.
 * Returns true once every entrance has finished, so the caller can stop scheduling frames.
 */
function drawRoutes(heroProgress, frameTime) {
  const scrollDraw = clamp(routeMotion.restDraw + heroProgress * routeMotion.scrollGain, 0, 1);
  let entryComplete = true;

  heroRoutes.forEach((route, index) => {
    const entry = routeEntryProgress(frameTime, index);
    if (entry < 1) entryComplete = false;
    const draw = clamp(scrollDraw - index * routeMotion.stagger, 0, 1) * entry;
    route.style.setProperty("--route-draw", draw.toFixed(4));
  });

  return entryComplete;
}

/**
 * Play the cassette as the section scrolls: both reels turn together, the supply hub
 * unwinds into the take-up hub, and the counter climbs the way a real deck's does.
 * Turns are deliberately unequal so the two hubs never look mechanically linked.
 */
function windTape(progress) {
  if (!tapeReels.length) return;
  const turns = progress * 900;
  tapeReels.forEach((reel) => {
    const rate = reel.dataset.reel === "left" ? 1 : 1.34;
    reel.style.transform = `rotate(${turns * rate}deg)`;
  });
  profileTape?.style.setProperty("--tape-wind", progress.toFixed(4));
  if (tapeCounter) {
    tapeCounter.textContent = String(Math.round(progress * 999)).padStart(3, "0");
  }
}

function smoothstep(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/**
 * Suspended sway, whip cut, fast drop, then a light settling bounce.
 * Shell only — windTape() still drives reels, hubs, and counter.
 */
function profileTapeMotion(progress, motionFactor) {
  const p = clamp(progress, 0, 1);
  const hangEnd = 0.35;
  const cutEnd = 0.42;
  const fallEnd = 0.72;

  const hangY = -58 * motionFactor;
  const restY = 28 * motionFactor;
  const restRotate = 3;
  const swayAmp = 5.5;
  const endHangSway = Math.sin(2.8 * Math.PI) * swayAmp;

  if (p <= hangEnd) {
    const hangT = p / hangEnd;
    const sway = Math.sin(hangT * Math.PI * 2.8) * swayAmp;
    const bob = Math.sin(hangT * Math.PI * 5.5) * 2.5 * motionFactor;
    return { y: hangY + bob, rotate: sway, scale: 1 };
  }

  if (p <= cutEnd) {
    const cutT = (p - hangEnd) / (cutEnd - hangEnd);
    const whip = Math.sin(cutT * Math.PI) * 14;
    const yLift = Math.sin(cutT * Math.PI) * 5 * motionFactor;
    return {
      y: hangY + yLift,
      rotate: endHangSway + whip,
      scale: 1 + Math.sin(cutT * Math.PI) * 0.025
    };
  }

  if (p <= fallEnd) {
    const fallT = (p - cutEnd) / (fallEnd - cutEnd);
    const eased = fallT * fallT;
    const y = hangY + (restY - hangY) * eased;
    const rotate = endHangSway + (restRotate - endHangSway) * smoothstep(fallT);
    const scale = 1 + (1 - eased) * 0.02;
    return { y, rotate, scale };
  }

  const settleT = (p - fallEnd) / (1 - fallEnd);
  const bounceAmp = 12 * motionFactor;
  const decay = (1 - settleT) * (1 - settleT);
  const bounce = Math.sin(settleT * Math.PI * 2.4) * bounceAmp * decay;
  const rotateWiggle = Math.sin(settleT * Math.PI * 2) * 1.2 * decay;
  return {
    y: restY + bounce,
    rotate: restRotate + rotateWiggle,
    scale: 1
  };
}

function applySectionParallax(sectionProgress, faqItems, scrollY, viewportHeight, viewportWidth) {
  const progressOf = (section) => sectionProgress.get(section) ?? 0;
  const isInView = (section) => section?.classList.contains("is-in-view");
  const motionFactor = viewportWidth <= 820 ? 0.45 : 1;

  if (comparisonStage && isInView(sectionElements.difference)) {
    const differenceProgress = progressOf(sectionElements.difference);
    comparisonStage.style.transform = `translate3d(${(differenceProgress - 0.5) * 24 * motionFactor}px, 0, 0)`;
  }

  const modesProgress = progressOf(sectionElements.modes);
  const modesInView = isInView(sectionElements.modes);
  if (modesInView) {
    if (trackList) trackList.style.transform = `perspective(1200px) translate3d(0, ${(0.5 - modesProgress) * 28 * motionFactor}px, 0) rotateX(${(0.5 - modesProgress) * 2.4 * motionFactor}deg)`;
    const activeTrack = Math.min(tracks.length - 1, Math.floor(clamp((modesProgress - 0.08) / 0.78, 0, 0.999) * tracks.length));
    tracks.forEach((track, index) => {
      const fan = (index - 1.5) * (modesProgress - 0.5) * 12 * motionFactor;
      track.style.setProperty("--parallax-y", `${fan.toFixed(2)}px`);
      track.style.setProperty("--switch-turn", `${modesProgress * (240 + index * 45)}deg`);
      track.classList.toggle("is-playing", index === activeTrack);
    });
  } else {
    tracks.forEach((track) => track.classList.remove("is-playing"));
  }

  const profilesProgress = progressOf(sectionElements.profiles);
  if (profileTape && isInView(sectionElements.profiles)) {
    const tapeMotion = profileTapeMotion(profilesProgress, motionFactor);
    profileTape.style.transform = `translate3d(0, ${tapeMotion.y}px, 0) rotate(${tapeMotion.rotate}deg) scale(${tapeMotion.scale})`;
    windTape(profilesProgress);
  }

  const installProgress = progressOf(sectionElements.install);
  if (isInView(sectionElements.install)) {
    easyPath?.style.setProperty("--parallax-y", `${(0.5 - installProgress) * 18 * motionFactor}px`);
    terminalPath?.style.setProperty("--parallax-y", `${(installProgress - 0.5) * 14 * motionFactor}px`);
    sectionElements.install.style.setProperty("--install-cue", clamp(installProgress * 1.8, 0, 1).toFixed(4));
  }

  if (sectionElements.faq?.classList.contains("is-in-view")) {
    const viewportCenter = scrollY + viewportHeight * 0.5;
    let closestDetail;
    let closestDistance = Number.POSITIVE_INFINITY;
    faqItems.forEach(({ element, center }) => {
      const distance = Math.abs(center - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestDetail = element;
      }
    });
    faqDetails.forEach((detail) => detail.classList.toggle("is-current", detail === closestDetail));
  } else {
    faqDetails.forEach((detail) => detail.classList.remove("is-current"));
  }

  const finalProgress = progressOf(sectionElements.final);
  if (finalLogo && isInView(sectionElements.final)) {
    const floatY = (0.5 - finalProgress) * 36 * motionFactor;
    const tilt = -5 + finalProgress * 5;
    const scale = 0.94 + finalProgress * 0.06;
    finalLogo.style.transform = `translate3d(0, ${floatY}px, 0) rotate(${tilt}deg) scale(${scale})`;
  }
  if (finalTapeRun && isInView(sectionElements.final)) {
    const tapeReveal = clamp((finalProgress - 0.08) / 0.42, 0, 1);
    finalTapeRun.style.setProperty("--tape-reveal", tapeReveal.toFixed(4));
    finalTapeRun.style.setProperty("--tape-drift-y", `${(0.5 - finalProgress) * 10 * motionFactor}px`);
  }
}

window.addEventListener("scroll", scheduleMotionFrame, { passive: true });
window.addEventListener("resize", () => {
  markLayoutDirty();
  scheduleMotionFrame();
}, { passive: true });
window.addEventListener("orientationchange", () => {
  markLayoutDirty();
  scheduleMotionFrame();
}, { passive: true });
window.addEventListener("pageshow", () => {
  markLayoutDirty();
  scheduleMotionFrame();
});
document.fonts?.ready.then(() => {
  markLayoutDirty();
  scheduleMotionFrame();
});
if (typeof window.ResizeObserver === "function") {
  const layoutObserver = new ResizeObserver(() => {
    markLayoutDirty();
    scheduleMotionFrame();
  });
  layoutObserver.observe(document.body);
}
scheduleMotionFrame();

modeButtons.forEach((button) => {
  button.addEventListener("click", () => activateMode(button.dataset.mode));
});

function activateMode(mode) {
  const example = modeExamples[mode];
  if (!example) return;

  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  if (comparisonStage) comparisonStage.dataset.activeMode = mode;
  if (comparisonAfter) {
    comparisonAfter.textContent = example.after;
    comparisonAfter.dir = example.direction;
  }
  if (comparisonNote) {
    comparisonNote.textContent = example.note;
    comparisonNote.dir = example.direction;
  }

  if (!reducedMotion) {
    resultSheet?.getAnimations().forEach((animation) => animation.cancel());
    resultSheet?.animate(
      [
        { opacity: 0.3, transform: "translate3d(-16px, 0, 0) scale(0.99)" },
        { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }
      ],
      { duration: 320, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
    );
  }
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const text = button.dataset.copy ?? "";
    if (!text) return;

    clearTimeout(button.copyResetTimer);
    removeManualCopy();

    try {
      await copyText(text);
      setCopyState(button, "success");
      announce(copySuccessMessage(button.dataset.copyKind), button);
      if (!reducedMotion) createCopySparks(button);
    } catch {
      setCopyState(button, "error");
      showManualCopy(text, button);
      announce("النسخ التلقائي ما اشتغلش. النص ظهر تحت الزر ومتحدد، انسخه يدويًا.", button);
    }

    if (button.dataset.state === "success") {
      button.copyResetTimer = window.setTimeout(() => setCopyState(button, "idle"), 2600);
    }
  });
});

document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("pointerdown", () => {
    if (reducedMotion) return;
    button.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(0.965)" },
        { transform: "scale(1)" }
      ],
      { duration: 180, easing: "cubic-bezier(0.25, 1, 0.5, 1)" }
    );
  });
});

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.inset = "-9999px auto auto -9999px";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard copy was rejected");
}

function setCopyState(button, state) {
  if (state === "idle") {
    delete button.dataset.state;
  } else {
    button.dataset.state = state;
  }

  const status = button.querySelector(".label-status");
  if (status) {
    status.textContent = state === "success" ? "DONE" : state === "error" ? "SELECT" : "COPY";
  }

  const label = button.querySelector("[data-copy-label]");
  if (label) {
    label.dataset.idleCopy ??= label.textContent.trim();
    label.textContent = state === "success"
      ? "اللينك اتنسخ"
      : state === "error"
        ? "انسخ اللينك من الخانة تحت"
        : label.dataset.idleCopy;
  }

  const localFeedback = button.closest("[data-copy-scope]")?.querySelector("[data-copy-feedback]");
  if (localFeedback) {
    const idleCopy = localFeedback.dataset.idleCopy ?? "";
    localFeedback.textContent = state === "success"
      ? copySuccessMessage(button.dataset.copyKind)
      : state === "error"
        ? "النسخ التلقائي ما اشتغلش. اللينك متحدد تحت وتقدر تنسخه يدويًا."
        : idleCopy;
  }
}

function copySuccessMessage(kind) {
  if (kind === "message") return "الرسالة اتنسخت. ابعتها للـAgent زي ما هي.";
  if (kind === "command") return "كوماند التثبيت اتنسخ.";
  return "لينك 3ameiah اتنسخ.";
}

function announce(message, sourceButton) {
  if (sourceButton?.closest("[data-copy-scope]")?.querySelector("[data-copy-feedback]")) return;
  if (!copyLive) return;
  copyLive.textContent = message;
}

function showManualCopy(text, button) {
  const textarea = document.createElement("textarea");
  textarea.className = "manual-copy";
  textarea.value = text;
  textarea.setAttribute("aria-label", "النص الجاهز للنسخ اليدوي");
  textarea.dir = /^[\u0000-\u024f\s\p{P}\p{N}]+$/u.test(text) ? "ltr" : "auto";
  textarea.rows = Math.min(4, Math.max(2, Math.ceil(text.length / 54)));
  button.insertAdjacentElement("afterend", textarea);
  textarea.focus();
  textarea.select();
}

function removeManualCopy() {
  document.querySelectorAll(".manual-copy").forEach((textarea) => textarea.remove());
}

function createCopySparks(button) {
  const colors = ["var(--coral)", "var(--mint)", "var(--mango)", "var(--track-blue)"];
  for (let index = 0; index < 6; index += 1) {
    const spark = document.createElement("span");
    spark.className = "copy-spark";
    spark.style.setProperty("--spark-color", colors[index % colors.length]);
    spark.style.setProperty("--spark-x", `${Math.cos((Math.PI * 2 * index) / 6) * (34 + index * 3)}px`);
    spark.style.setProperty("--spark-y", `${Math.sin((Math.PI * 2 * index) / 6) * (26 + index * 2)}px`);
    button.append(spark);
    window.setTimeout(() => spark.remove(), 520);
  }
}

const typewriterWords = ["مصري", "زيك"];
let typewriterRun = 0;
let typewriterVisible = true;
let heroCopyHasTyped = false;

function waitForTypewriter(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function syncTypewriter() {
  typewriterRun += 1;
  if (!typewriterWord) return;

  typewriterWord.textContent = typewriterWords[0];
  if (reducedMotion || document.hidden || !typewriterVisible) {
    if (heroTypedCopy) heroTypedCopy.textContent = heroTypedCopyText;
    heroCopyHasTyped = true;
    return;
  }

  runHeroTypingSequence(typewriterRun);
}

function typewriterIsCurrent(runId) {
  return runId === typewriterRun && !reducedMotion && !document.hidden && typewriterVisible;
}

function runHeroTypingSequence(runId) {
  typeHeroIntroCopy(runId);
  runHeadlineTypewriter(runId);
}

async function typeHeroIntroCopy(runId) {
  if (!heroTypedCopy) return;

  if (heroCopyHasTyped) {
    heroTypedCopy.textContent = heroTypedCopyText;
    return;
  }

  heroTypedCopy.textContent = "";
  await waitForTypewriter(620);

  for (const letter of Array.from(heroTypedCopyText)) {
    if (!typewriterIsCurrent(runId)) return;
    heroTypedCopy.textContent += letter;

    const pause = /[.!؟]/.test(letter)
      ? 220
      : /[،,:—]/.test(letter)
        ? 105
        : letter === " "
          ? 34
          : 24;
    await waitForTypewriter(pause);
  }

  if (!typewriterIsCurrent(runId)) return;
  heroCopyHasTyped = true;
}

async function runHeadlineTypewriter(runId) {
  let activeIndex = 0;

  while (typewriterIsCurrent(runId)) {
    await waitForTypewriter(2000);
    if (!typewriterIsCurrent(runId)) return;

    const currentLetters = Array.from(typewriterWords[activeIndex]);
    while (currentLetters.length > 0) {
      currentLetters.pop();
      typewriterWord.textContent = currentLetters.join("");
      await waitForTypewriter(92);
      if (!typewriterIsCurrent(runId)) return;
    }

    await waitForTypewriter(220);
    if (!typewriterIsCurrent(runId)) return;

    activeIndex = (activeIndex + 1) % typewriterWords.length;
    let nextWord = "";
    for (const letter of Array.from(typewriterWords[activeIndex])) {
      nextWord += letter;
      typewriterWord.textContent = nextWord;
      await waitForTypewriter(128);
      if (!typewriterIsCurrent(runId)) return;
    }
  }
}

if (supportsSectionObserver && hero) {
  const typewriterObserver = new IntersectionObserver(
    ([entry]) => {
      typewriterVisible = entry.isIntersecting;
      syncTypewriter();
    },
    { threshold: 0.18 }
  );
  typewriterObserver.observe(hero);
}

document.addEventListener("visibilitychange", syncTypewriter);
syncTypewriter();

faqDetails.forEach((details) => {
  details.addEventListener("toggle", () => {
    markLayoutDirty();
    scheduleMotionFrame();
    if (reducedMotion || !details.open) return;
    details.querySelector("p")?.animate(
      [
        { opacity: 0, transform: "translate3d(0, -10px, 0)" },
        { opacity: 1, transform: "translate3d(0, 0, 0)" }
      ],
      { duration: 260, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
    );
  });
});

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
