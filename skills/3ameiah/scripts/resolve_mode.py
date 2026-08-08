#!/usr/bin/env python3
"""Resolve a 3ameiah mode without modifying user content."""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from dataclasses import asdict, dataclass
from typing import Iterable


MODES = (
    "3ameiah",
    "3ameiah-pro",
    "3ameiah-friendly",
    "3ameiah-franco",
)

ALIASES = {
    "3ameiah-3amy": "3ameiah",
    "3ameiah-professional": "3ameiah-pro",
    "3ameiah-awey": "3ameiah-friendly",
    "3amy": "3ameiah",
    "عامي": "3ameiah",
    "عامية": "3ameiah",
    "balanced": "3ameiah",
    "professional": "3ameiah-pro",
    "pro": "3ameiah-pro",
    "مهني": "3ameiah-pro",
    "محترف": "3ameiah-pro",
    "friendly": "3ameiah-friendly",
    "warm": "3ameiah-friendly",
    "فريندلي": "3ameiah-friendly",
    "ودود": "3ameiah-friendly",
    "لطيف": "3ameiah-friendly",
    "قريب": "3ameiah-friendly",
    "awey": "3ameiah-friendly",
    "قوي": "3ameiah-friendly",
    "تقيل": "3ameiah-friendly",
    "franco": "3ameiah-franco",
    "arabizi": "3ameiah-franco",
    "فرانكو": "3ameiah-franco",
}


@dataclass(frozen=True)
class Resolution:
    ok: bool
    mode: str | None
    source: str
    selected: tuple[str, ...]
    error_code: str | None = None
    message: str | None = None


def _norm(value: str) -> str:
    return unicodedata.normalize("NFKC", value).strip().casefold()


def normalize_selector(value: str) -> str | None:
    normalized = _norm(value).replace("_", "-")
    if normalized == "auto":
        return "auto"
    if normalized in MODES:
        return normalized
    return ALIASES.get(normalized)


def _strip_quoted_and_code(text: str) -> str:
    """Mask common quoted/code spans so source data does not become control."""
    patterns = (
        r"```[\s\S]*?```",
        r"`[^`\n]*`",
        r'"(?:\\.|[^"\\])*"',
        r"'(?:\\.|[^'\\])*'",
        r"“[^”]*”",
        r"«[^»]*»",
    )
    masked = text
    for pattern in patterns:
        masked = re.sub(pattern, lambda match: " " * len(match.group(0)), masked)
    return masked


def _controlled_tokens(text: str) -> list[str]:
    """Find tokens only in command-like positions, not arbitrary source prose."""
    clean = _strip_quoted_and_code(text)
    found: list[str] = []
    mode_token = r"3ameiah(?:[-_][a-z0-9_-]+)?"
    direct_command = re.match(rf"(?i)^\s*(?:/|\$)({mode_token})(?=\s|$)", clean)
    if direct_command:
        selected = normalize_selector(direct_command.group(1))
        remainder = clean[direct_command.end() :]
        base_is_selector_prefix = selected == "3ameiah" and re.match(
            rf"(?i)^\s*(?:(?:mode|مستوى|بمستوى)\s*[:=]?\s*|(?:استخدم|use)\s+)?(?:{mode_token}|3amy|pro|professional|friendly|franco|arabizi)\b",
            remainder,
        )
        if not base_is_selector_prefix:
            found.append(direct_command.group(1))
    explicit_assignment = re.compile(rf"(?i)(?<![\w])(?:mode|مستوى|بمستوى)\s*[:=]\s*({mode_token}|[a-z]+|[\u0600-\u06ff]+)\b")
    for match in explicit_assignment.finditer(clean):
        context = clean[max(0, match.start() - 45) : match.start()]
        if re.search(r"(?:اشرح|معنى|يعني|ناقش|الفرق|مثال|string|نص).{0,35}$", context, re.IGNORECASE):
            continue
        found.append(match.group(1))

    patterns = (
        rf"(?i)(?<![\w])(?:mode|مستوى|بمستوى)\s+({mode_token}|3amy|professional|pro|friendly|warm|awey|franco|arabizi|عامي(?:ة)?|مهني|محترف|فريندلي|ودود|لطيف|قريب|قوي|تقيل|فرانكو)\b",
        rf"(?i)(?:\$|/)3ameiah\s+(?:استخدم|use)\s+({mode_token})\b",
        rf"(?i)(?:\$|/)3ameiah\s+({mode_token}|3amy|professional|pro|friendly|warm|awey|franco|arabizi|عامي(?:ة)?|مهني|محترف|فريندلي|ودود|لطيف|قريب|قوي|تقيل|فرانكو)\b",
        rf"(?im)^\s*({mode_token})\b",
        rf"(?i)(?:^|[\n;,،])\s*(?:use|استخدم|اختار)\s+({mode_token})\b",
        rf"(?i)(?:باستخدام|using)\s+({mode_token})\b",
    )
    for pattern in patterns:
        found.extend(match.group(1) for match in re.finditer(pattern, clean))

    comparison_intent = bool(re.search(r"(?:قارن|مقارن[ةه]|نسخ(?:ة|تين|تان)?|variants?|كل\s+(?:ال)?مستويات|أربع|اربع)\b", clean, re.IGNORECASE))
    if comparison_intent:
        found.extend(re.findall(rf"(?i)(?<![A-Za-z0-9_])(?:و)?({mode_token})\b", clean))
    elif found:
        found.extend(match.group(1) for match in re.finditer(rf"(?i)(?:و|and|,|،)\s*({mode_token})\b", clean))
    return found


def _infer_mode(text: str) -> tuple[str, str]:
    clean = _norm(_strip_quoted_and_code(text))
    franco_is_topic = bool(re.search(r"(?:عن|معنى|الفرق\s+بين|تاريخ|ناقش).{0,30}(?:ال)?(?:فرانكو|franco|arabizi)", clean))
    rules = (
        (r"(?:اكتب|حوّل|حول|خليه|خليها)(?:\s+\S+){0,4}\s+(?:فرانكو|arabizi)\b|بالفرانكو|بفرانكو|للفرانكو|لفرانكو", "3ameiah-franco", "inferred-franco"),
        (r"(?:فريندلي|friendly|warm|ودود[ةه]?|لطيف[ةه]?|قريب[ةه]?)|كلام\s+صحاب", "3ameiah-friendly", "inferred-friendly"),
        (r"رسمي\s+(?:بس\s+)?بالمصري|بشكل\s+(?:مهني|محترم)|رسالة\s+شغل|(?:رسالة|رد|إيميل|ايميل|email|message).{0,20}(?:لعميل|للعميل|client)|(?:بشكل|ستايل|tone)\s+professional|خلي(?:ه|ها)\s+professional", "3ameiah-pro", "inferred-professional"),
        (r"بالمصري|بالعامي[ةه]|لهج[ةه]\s+مصري[ةه]|egyptian\s+arabic", "3ameiah", "inferred-general"),
    )
    for pattern, mode, source in rules:
        if mode == "3ameiah-franco" and franco_is_topic:
            continue
        if re.search(pattern, clean, flags=re.IGNORECASE):
            return mode, source
    return "3ameiah", "default"


def resolve_mode(
    text: str = "",
    selectors: Iterable[str] | None = None,
    infer: bool = True,
) -> Resolution:
    raw_selectors = [selector for selector in (selectors or []) if _norm(selector) != "auto"]
    controlled = _controlled_tokens(text)
    candidates = raw_selectors + controlled

    normalized: list[str] = []
    invalid: list[str] = []
    for candidate in candidates:
        mode = normalize_selector(candidate)
        if mode and mode != "auto":
            normalized.append(mode)
        else:
            invalid.append(candidate)

    if invalid:
        return Resolution(
            ok=False,
            mode=None,
            source="invalid",
            selected=tuple(candidates),
            error_code="INVALID_MODE",
            message=f"Unknown mode selector: {', '.join(invalid)}. Valid modes: {', '.join(MODES)}.",
        )

    unique = tuple(dict.fromkeys(normalized))
    comparison_intent = bool(re.search(r"(?:قارن|مقارن[ةه]|نسخ(?:ة|تين|تان)?|variants?|كل\s+(?:ال)?مستويات|أربع|اربع)\b", _strip_quoted_and_code(text), re.IGNORECASE))
    if len(unique) > 1 and comparison_intent:
        return Resolution(True, None, "comparison", unique)
    if len(unique) > 1:
        return Resolution(
            ok=False,
            mode=None,
            source="conflict",
            selected=unique,
            error_code="MODE_CONFLICT",
            message="Multiple modes target one output. Request labelled variants or choose one mode.",
        )
    if unique:
        source = "explicit-argument" if raw_selectors else "controlled-token"
        return Resolution(True, unique[0], source, unique)

    if infer:
        mode, source = _infer_mode(text)
        return Resolution(True, mode, source, ())
    return Resolution(True, "3ameiah", "default", ())


def _read_text(args: argparse.Namespace) -> str:
    if args.file:
        return open(args.file, "r", encoding="utf-8-sig", newline="").read()
    if args.text is not None:
        return args.text
    if not sys.stdin.isatty():
        return sys.stdin.read()
    return ""


def main() -> int:
    parser = argparse.ArgumentParser(description="Resolve one 3ameiah mode deterministically.")
    source = parser.add_mutually_exclusive_group()
    source.add_argument("--text", help="Request text used for controlled-token detection and inference.")
    source.add_argument("--file", help="UTF-8 request file.")
    parser.add_argument("--mode", action="append", default=[], help="Explicit mode or short alias. Repeat to detect conflicts.")
    parser.add_argument("--no-infer", action="store_true", help="Skip natural-language inference and use the default.")
    args = parser.parse_args()
    try:
        result = resolve_mode(_read_text(args), args.mode, infer=not args.no_infer)
    except (OSError, UnicodeError) as exc:
        print(json.dumps({"ok": False, "error_code": "INPUT_ERROR", "message": str(exc)}, ensure_ascii=False, sort_keys=True))
        return 2
    print(json.dumps(asdict(result), ensure_ascii=False, sort_keys=True))
    return 0 if result.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
