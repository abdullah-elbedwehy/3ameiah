#!/usr/bin/env python3
"""Suggest 3ameiah playbooks and validation gates for a user request."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict
from pathlib import Path

from resolve_mode import MODES, resolve_mode


CONTAINERS = {
    "product-ui": {
        "reference": "references/product-ui.md",
        "keywords": ("codebase", "website", "موقع", "app", "تطبيق", "ui", "واجهة", "form", "فورم", "checkout", "button", "زرار", "react", "next.js", "i18n", "locale", "html", "css", "typescript", "javascript", "python", "بايثون", "shell", "bash", ".py", ".sh", "error message", "onboarding", "landing page", "صفحة بيع"),
        "checks": ("protect code, identifiers, keys, and placeholders", "run repository tests/build", "render all UI states and verify direction/accessibility"),
    },
    "post": {
        "reference": "references/posts-marketing.md",
        "keywords": ("بوست", "post", "thread", "ثريد", "carousel", "كاروسيل", "caption", "كابشن", "instagram", "linkedin", "facebook", "twitter", "x.com", "social", "سوشيال", "ad copy", "إعلان", "اعلان", "landing page", "صفحة بيع"),
        "checks": ("verify claims, links, handles, and CTA", "check format/slide count", "confirm hook-value-CTA consistency"),
    },
    "spoken": {
        "reference": "references/spoken-media.md",
        "keywords": ("سكريبت", "script", "video", "فيديو", "reel", "ريل", "podcast", "بودكاست", "voiceover", "فويس", "transcript", "ترانسكريبت", "shotlist", "shot list", "spoken", "يتقال", "ثانية", "دقيقة"),
        "checks": ("read spoken lines aloud", "check source claims and runtime assumption", "synchronize script, shots, and captions"),
    },
    "document": {
        "reference": "references/documents-slides-pdf.md",
        "keywords": ("pdf", "docx", "word", "pptx", "powerpoint", "slide", "slides", "عرض تقديمي", "مستند", "وثيقة", "تقرير", "report", "proposal", "مقترح", "cv", "سيرة", "handbook", "كتاب", "workbook"),
        "checks": ("preserve document structure and source of truth", "export requested format", "render and inspect every page or slide"),
    },
    "message": {
        "reference": "references/professional-messages.md",
        "keywords": ("رسالة", "message", "email", "e-mail", "إيميل", "ايميل", "whatsapp", "واتساب", "slack", "support reply", "رد على", "رد ل", "عميل", "client", "follow-up", "متابعة"),
        "checks": ("verify names, amounts, dates, and authority", "make ask/owner/deadline explicit", "do not infer permission to send"),
    },
    "narrative": {
        "reference": "references/stories-dialogue.md",
        "keywords": ("قصة", "story", "حوار", "dialogue", "character", "شخصية", "رواية", "narrative", "سرد", "chapter", "فصل", "children", "أطفال", "اطفال"),
        "checks": ("lock character voice and plot beats", "check names, chronology, and attribution", "read dialogue aloud"),
    },
    "structured": {
        "reference": "references/special-formats-high-stakes.md",
        "keywords": ("json", "yaml", "yml", "cms", "srt", "vtt", "subtitle", "subtitles", "ترجمة", "كابتشن", "schema", "survey", "استبيان", "macro", "chatbot", "csv", "xml"),
        "checks": ("preserve keys, schema, cue IDs, and timestamps", "run native parser/schema validation", "compare protected tokens"),
    },
    "general": {
        "reference": "references/special-formats-high-stakes.md",
        "keywords": (),
        "checks": ("identify the artifact grammar and consumer", "protect factual and structural content", "validate with the medium's native method"),
    },
}

OVERLAYS = {
    "marketing": {
        "reference": "references/posts-marketing.md",
        "keywords": ("marketing", "ماركتنج", "تسويق", "تسويقي", "بيع", "sales", "offer", "أوفر", "عرض", "cta", "conversion", "تحويل", "إعلان", "اعلان", "campaign", "حملة", "launch", "إطلاق"),
        "checks": ("build a claim/evidence map", "keep offer and CTA consistent across assets"),
    },
    "education": {
        "reference": "references/education.md",
        "keywords": ("درس", "lesson", "course", "كورس", "تعليم", "educational", "شرح", "explain", "tutorial", "ملخص", "summary", "exercise", "تمرين", "طلاب", "طلبة", "workbook"),
        "checks": ("use the exact source and terminology ledger", "run source-fidelity and comprehension passes"),
    },
    "high-stakes": {
        "reference": "references/special-formats-high-stakes.md",
        "keywords": ("legal", "قانون", "قانوني", "قانونية", "عقد", "contract", "محامي", "قضية", "medical", "طبي", "طبية", "دواء", "دوا", "جرعة", "مريض", "قرص", "أقراص", "اقراص", "حباية", "حبوب", "روشتة", "علاج", "financial", "مالي", "مالية", "استثمار", "عائد", "قرض", "فايدة", "فائدة", "safety", "سلامة", "emergency", "طوارئ", "تحذير", "warning", "غاز", "bank", "بنك"),
        "checks": ("preserve controlling wording, units, negation, and modality", "verify time-sensitive claims from authoritative evidence"),
    },
}

ACTIONS = {
    "implement": ("نفذ", "نفّذ", "implement", "عدّل", "عدل", "حدّث", "حدث", "update", "غير في", "غيّر في", "ابني", "build", "ضيف في"),
    "review": ("راجع", "review", "audit", "قيّم", "قيم", "انقد", "check"),
    "localize": ("localize", "localise", "عرّب", "عرب", "حوّل للمصري", "خليه بالمصري", "خليها بالمصري", "ترجم"),
    "rewrite": ("أعد كتابة", "اعد كتابة", "rewrite", "حسّن", "حسن", "ظبط", "اضبط"),
    "summarize": ("لخص", "لخّص", "summarize", "summary", "ملخص"),
    "create": ("اكتب", "اعمل", "create", "draft", "صيغ", "جهز"),
}


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.casefold()).strip()


def _score(text: str, keywords: tuple[str, ...]) -> tuple[int, list[str]]:
    hits: list[str] = []
    for keyword in keywords:
        escaped = re.escape(keyword.casefold()).replace(r"\ ", r"\s+")
        if re.fullmatch(r"[\u0600-\u06ff]+", keyword):
            prefix = r"(?<![\w])(?:و|ف)?(?:ال|بال|لل|ل|ب|ك)?"
        else:
            prefix = r"(?<![\w])" if re.match(r"[A-Za-z0-9_\u0600-\u06ff]", keyword) else ""
        suffix = r"(?![\w])" if re.search(r"[A-Za-z0-9_\u0600-\u06ff]$", keyword) else ""
        if re.search(prefix + escaped + suffix, text, re.IGNORECASE):
            hits.append(keyword)
    return len(hits), hits


def _detect_action(text: str) -> tuple[str, list[str]]:
    for action, keywords in ACTIONS.items():
        _, hits = _score(text, keywords)
        if hits:
            return action, hits
    return "create", []


def _source_contract(text: str) -> str:
    if re.search(r"(?:حرفي|verbatim|من غير ما تغي[يّ]ر|نضف(?:ه|ها)? بس)", text):
        return "verbatim-cleanup"
    if re.search(r"(?:من\s+[^.،\n]+\s+بس|المصدر\s+الوحيد|source[- ]locked|مطابق\s+للمصدر)", text):
        return "source-locked"
    if re.search(r"(?:من\s+الصفر|فكرة\s+جديدة|creative|ابتكر)", text):
        return "creative"
    return "meaning-preserving"


def _looks_empty_request(text: str) -> bool:
    cleaned = re.sub(r"(?i)(?:/|\$)?3ameiah(?:[-_](?:3amy|professional|awey|pro|friendly|franco|learn|use))?", " ", text)
    cleaned = re.sub(r"(?i)\b(?:mode|مستوى|بمستوى)\s*[:=]?\s*[\w-]+", " ", cleaned)
    cleaned = re.sub(r"(?i)\b(?:استخدم|use)\b", " ", cleaned)
    cleaned = re.sub(r"[/,:=،\s]+", "", cleaned)
    return not cleaned


def route_request(text: str, selectors: list[str] | None = None) -> dict[str, object]:
    mode = resolve_mode(text, selectors or [], infer=True)
    if not mode.ok:
        return {
            "ok": False,
            "error_code": mode.error_code,
            "message": mode.message,
            "valid_modes": list(MODES),
        }

    if _looks_empty_request(text):
        return {
            "ok": False,
            "error_code": "MISSING_TASK",
            "message": "A mode was selected but no artifact or task was supplied.",
            "mode": mode.mode,
            "variant_modes": list(mode.selected) if mode.source == "comparison" else [],
        }

    normalized = _normalize(text)
    scores: dict[str, tuple[int, list[str]]] = {
        name: _score(normalized, data["keywords"])
        for name, data in CONTAINERS.items()
        if name != "general"
    }

    # A programming-language or filename marker makes bare "script" a code artifact.
    code_script = bool(re.search(r"(?:shell|bash|python|javascript|typescript|\.py\b|\.sh\b|سكريبت\s+(?:بايثون|برمجي|شيل))", normalized))
    if code_script:
        scores["product-ui"] = (scores["product-ui"][0] + 3, scores["product-ui"][1] + ["programming-script"])
        spoken_hits = [hit for hit in scores["spoken"][1] if hit not in {"script", "سكريبت"}]
        scores["spoken"] = (len(spoken_hits), spoken_hits)

    if re.search(r"\b(?:srt|vtt|subtitles?)\b|ترجمة\s+زمني[ةه]", normalized):
        scores["structured"] = (scores["structured"][0] + 3, scores["structured"][1] + ["timed-text"])

    formatted_document = bool(re.search(r"(?<!\w)(?:pdf|docx|pptx|powerpoint|slides?)(?!\w)|عرض\s+تقديمي", normalized, re.IGNORECASE))
    if formatted_document:
        scores["document"] = (scores["document"][0] + 3, scores["document"][1] + ["formatted-deliverable"])

    ranked = sorted(scores.items(), key=lambda item: (-item[1][0], list(CONTAINERS).index(item[0])))
    primary = ranked[0][0] if ranked and ranked[0][1][0] > 0 else "general"
    primary_score = ranked[0][1][0] if ranked else 0
    companions = [name for name, (score, _) in ranked[1:] if score >= 2 and score >= max(2, primary_score - 1)]

    timed_text = bool(re.search(r"\b(?:srt|vtt|subtitles?)\b|ترجمة\s+زمني[ةه]", normalized, re.IGNORECASE))
    if timed_text and primary != "spoken" and "spoken" not in companions:
        companions.append("spoken")
    explicit_structured_format = bool(re.search(
        r"(?<![\w.])(?:json|ya?ml|xml|csv|cms)(?!\w)|\b(?:json|ya?ml|xml|csv|cms)\b|بصيغة\s+(?:جيسون|JSON)",
        normalized,
        re.IGNORECASE,
    ))
    if explicit_structured_format and primary != "structured" and "structured" not in companions:
        companions.append("structured")
    story_document = formatted_document and bool(re.search(r"(?<!\w)(?:story|chapter|children)(?!\w)|قصة|حوار|أطفال|اطفال", normalized, re.IGNORECASE))
    if story_document and primary != "narrative" and "narrative" not in companions:
        companions.append("narrative")

    overlays: list[str] = []
    overlay_hits: dict[str, list[str]] = {}
    for name, data in OVERLAYS.items():
        score, hits = _score(normalized, data["keywords"])
        if score:
            overlays.append(name)
            overlay_hits[name] = hits

    landing_page = bool(re.search(r"(?<!\w)landing\s+page(?!\w)|صفحة\s+بيع", normalized, re.IGNORECASE))
    marketing_message = primary == "message" and _score(normalized, ("تسويق", "تسويقي", "marketing", "campaign", "حملة", "بيع", "sales"))[0] > 0
    if (landing_page or marketing_message) and "marketing" not in overlays:
        overlays.append("marketing")
        overlay_hits["marketing"] = ["semantic-context"]

    # Container semantics imply some overlays even without explicit jargon.
    if primary == "post" and _score(normalized, ("بيع", "offer", "ad", "إعلان", "اعلان", "landing"))[0] > 0 and "marketing" not in overlays:
        overlays.append("marketing")
        overlay_hits["marketing"] = ["container-context"]

    references = ["references/modes.md", CONTAINERS[primary]["reference"]]
    for companion in companions:
        references.append(CONTAINERS[companion]["reference"])
    for overlay in overlays:
        references.append(OVERLAYS[overlay]["reference"])
    references = list(dict.fromkeys(references))

    checks: list[str] = [
        "lock mode, audience, address, spelling, and source contract",
        "inventory human-facing and protected surfaces",
        *CONTAINERS[primary]["checks"],
    ]
    for companion in companions:
        checks.extend(CONTAINERS[companion]["checks"])
    for overlay in overlays:
        checks.extend(OVERLAYS[overlay]["checks"])
    checks.extend(("run protected-token lint when source exists", "deliver and validate the real artifact"))
    checks = list(dict.fromkeys(checks))

    action, action_hits = _detect_action(normalized)
    return {
        "ok": True,
        "mode": mode.mode,
        "variant_modes": list(mode.selected) if mode.source == "comparison" else [],
        "mode_source": mode.source,
        "action": action,
        "primary_container": primary,
        "companion_containers": companions,
        "overlays": overlays,
        "source_contract": _source_contract(normalized),
        "references": references,
        "checks": checks,
        "evidence": {
            "action": action_hits,
            "primary": scores.get(primary, (0, []))[1] if primary != "general" else [],
            "companions": {name: scores[name][1] for name in companions},
            "overlays": overlay_hits,
        },
    }


def _render(payload: dict[str, object]) -> str:
    if not payload.get("ok"):
        return f"3ameiah router: {payload.get('error_code')} — {payload.get('message')}"
    lines = [
        f"Mode: {payload['mode']} ({payload['mode_source']})",
        f"Action: {payload['action']}",
        f"Container: {payload['primary_container']}",
        f"Companions: {', '.join(payload['companion_containers']) or 'none'}",
        f"Overlays: {', '.join(payload['overlays']) or 'none'}",
        f"Source contract: {payload['source_contract']}",
        "Read:",
        *[f"- {path}" for path in payload["references"]],
        "Checks:",
        *[f"- {check}" for check in payload["checks"]],
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Route a request to 3ameiah playbooks.")
    source = parser.add_mutually_exclusive_group()
    source.add_argument("--text", help="User request.")
    source.add_argument("--file", help="UTF-8 file containing the request.")
    parser.add_argument("--mode", action="append", default=[], help="Explicit mode or short alias. Repeat to detect conflicts.")
    parser.add_argument("--json", action="store_true", help="Print deterministic JSON.")
    args = parser.parse_args()
    try:
        if args.file:
            text = Path(args.file).read_text(encoding="utf-8-sig")
        elif args.text is not None:
            text = args.text
        elif not sys.stdin.isatty():
            text = sys.stdin.read()
        else:
            text = ""
    except (OSError, UnicodeError) as exc:
        print(json.dumps({"ok": False, "error_code": "INPUT_ERROR", "message": str(exc)}, ensure_ascii=False, sort_keys=True))
        return 2

    payload = route_request(text, args.mode)
    print(json.dumps(payload, ensure_ascii=False, sort_keys=True) if args.json else _render(payload))
    return 0 if payload.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
