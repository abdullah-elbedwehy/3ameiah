#!/usr/bin/env python3
"""Compare source and candidate protected tokens without rewriting either file."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Callable, Iterable


@dataclass(frozen=True)
class Diagnostic:
    rule_id: str
    severity: str
    category: str
    message: str
    missing: tuple[str, ...] = ()
    extra: tuple[str, ...] = ()


DIGIT_TRANSLATION = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹", "01234567890123456789")


PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("mustache", re.compile(r"\{\{[^{}\n]+\}\}")),
    ("template", re.compile(r"\$\{[^{}\n]+\}")),
    ("printf_named", re.compile(r"%\([A-Za-z_][A-Za-z0-9_]*\)[#0 +\-]?\d*(?:\.\d+)?[diouxXeEfFgGcrs]")),
    ("printf", re.compile(r"%(?:\d+\$)?[#0 +\-]?\d*(?:\.\d+)?[diouxXeEfFgGcrs]")),
    ("icu", re.compile(r"\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*(plural|selectordinal|select)\s*,", re.IGNORECASE)),
    ("expression", re.compile(r"(?<![$\{])\{[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*|\[[^\]\n]+\])?\}(?!\})")),
    ("jsx_call", re.compile(r"(?<![$\{])\{[A-Za-z_$][A-Za-z0-9_$.]*\([^{}\n()]*\)\}(?!\})")),
    ("jsx_expression", re.compile(r"(?<![$\{])\{[A-Za-z_$][^{}\n]{0,200}[?:][^{}\n]{0,200}\}(?!\})")),
    ("function_call", re.compile(r"\b[A-Za-z_$][A-Za-z0-9_$.]*\([^()\n]{0,200}\)")),
    ("fenced_code", re.compile(r"```[^\n]*\n[\s\S]*?```")),
    ("inline_code", re.compile(r"(?<!`)`[^`\n]+`(?!`)")),
    ("url", re.compile(r"https?://[^\s<>\"']+", re.IGNORECASE)),
    ("email", re.compile(r"(?<![\w.+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")),
    ("handle", re.compile(r"(?<![\w@])@[A-Za-z0-9_]{2,}")),
    ("markdown_target", re.compile(r"\]\(([^)\s]+)(?:\s+[\"'][^\"']*[\"'])?\)")),
    ("route", re.compile(r"(?<![\w:])/(?:[A-Za-z0-9_.~:@{}%+\-]+/)*[A-Za-z0-9_.~:@{}%+\-]+/?")),
    ("filename", re.compile(r"\b[A-Za-z0-9_-]+\.(?:json|ya?ml|tsx?|jsx?|py|sh|md|srt|vtt|html?|css|csv|docx|pptx|pdf)\b", re.IGNORECASE)),
    ("flag", re.compile(r"(?<![\w-])--[A-Za-z][A-Za-z0-9_-]*\b")),
    ("timestamp", re.compile(r"\d{1,2}:\d{2}(?::\d{2})?(?:[,.]\d{3})?\s*-->\s*\d{1,2}:\d{2}(?::\d{2})?(?:[,.]\d{3})?")),
    ("technical", re.compile(r"\b(?:v\d+(?:\.\d+)*|[A-Z]{2,}(?:-[A-Z0-9]+)*|(?:[A-Z][a-z0-9]+){2,}|[A-Z][A-Z0-9_]*[0-9_][A-Z0-9_]*|[A-Za-z][A-Za-z0-9]*_[A-Za-z0-9_]+)\b")),
    ("number", re.compile(r"(?<![A-Za-z0-9_])[+\-]?[0-9٠-٩۰-۹]+(?:[.,٫٬:/-][0-9٠-٩۰-۹]+)*(?![A-Za-z0-9_])")),
)


def _normalize_number(value: str) -> str:
    translated = value.translate(DIGIT_TRANSLATION)
    translated = translated.replace("٬", ",").replace("٫", ".")
    return translated


def _token_values(category: str, pattern: re.Pattern[str], text: str, allow_number_style_change: bool) -> list[str]:
    values: list[str] = []
    for match in pattern.finditer(text):
        if category in {"icu", "markdown_target"}:
            value = "|".join(group for group in match.groups() if group is not None)
        else:
            value = match.group(0)
        if category == "technical" and value.upper() in {"EGP", "USD", "EUR", "GBP"}:
            continue
        if category == "url":
            value = value.rstrip(".,،؛!?؛")
        if category == "number" and allow_number_style_change:
            value = _normalize_number(value)
        values.append(value)
    return values


def extract_protected(text: str, allow_number_style_change: bool = False) -> dict[str, Counter[str]]:
    protected: dict[str, Counter[str]] = {}
    for category, pattern in PATTERNS:
        protected[category] = Counter(_token_values(category, pattern, text, allow_number_style_change))

    tag_skeletons = []
    for match in re.finditer(r"<\s*(/?)\s*([A-Za-z][A-Za-z0-9:-]*)\b[^>]*>", text):
        tag_skeletons.append(f"<{match.group(1)}{match.group(2).casefold()}>")
    protected["html_tag"] = Counter(tag_skeletons)

    structural_attributes = []
    structural_names = r"(?:name|id|for|htmlFor|value|type|role|class|className|href|src|action|method|data-[A-Za-z0-9_-]+|aria-(?:controls|describedby|labelledby))"
    for tag in re.finditer(r"<[^>]+>", text):
        for attribute in re.finditer(rf"\b({structural_names})\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^\s>]+))", tag.group(0)):
            value = next(group for group in attribute.groups()[1:] if group is not None)
            structural_attributes.append(f"{attribute.group(1).casefold()}={value}")
    protected["structural_attribute"] = Counter(structural_attributes)

    json_keys = [match.group(2) for match in re.finditer(r"([\"'])([A-Za-z_][A-Za-z0-9_.-]*)\1\s*:", text)]
    yaml_keys = [match.group(1) for match in re.finditer(r"(?m)^\s*(?:-\s*)?([A-Za-z_][A-Za-z0-9_.-]*)\s*:", text)]
    protected["structured_key"] = Counter(json_keys + yaml_keys)

    proper_names = [match.group(0) for match in re.finditer(r"\b[A-Z][a-z]+(?:[-'][A-Z]?[a-z]+)?(?:\s+[A-Z][a-z]+(?:[-'][A-Z]?[a-z]+)?)+\b", text)]
    protected["proper_name"] = Counter(proper_names)

    units = [match.group(0) for match in re.finditer(r"(?<![A-Za-z])(?:mcg|µg|ug|mg|kg|mmol|mol|mL|ml|IU|units?|g|L|l)(?![A-Za-z])", text)]
    protected["measurement_unit"] = Counter(units)

    dose_terms = []
    dose_pattern = re.compile(r"(?i)(?:\d+(?:[.,]\d+)?\s*(?:mcg|µg|ug|mg|kg|mmol|mol|mL|ml|IU|units?|g|L|l)\s+(?:of\s+)?)([A-Za-z][A-Za-z-]{2,})")
    dose_terms.extend(match.group(1) for match in dose_pattern.finditer(text))
    protected["dose_term"] = Counter(dose_terms)

    modality_map = (
        (r"(?<![\w])(?:ممنوع|محظور|must\s+not|do\s+not|never|prohibited)(?![\w])", "prohibition"),
        (r"(?<![\w])(?:لازم|يجب|يتعين|must|required)(?![\w])", "obligation"),
        (r"(?<![\w])(?:خطر|خطير|danger|hazard)(?![\w])", "danger"),
    )
    modality = []
    for pattern, normalized in modality_map:
        modality.extend(normalized for _ in re.finditer(pattern, text, re.IGNORECASE))
    protected["modality"] = Counter(modality)

    month_map = {
        "january": "01", "يناير": "01",
        "february": "02", "فبراير": "02",
        "march": "03", "مارس": "03",
        "april": "04", "أبريل": "04", "ابريل": "04",
        "may": "05", "مايو": "05",
        "june": "06", "يونيو": "06",
        "july": "07", "يوليو": "07",
        "august": "08", "أغسطس": "08", "اغسطس": "08",
        "september": "09", "سبتمبر": "09",
        "october": "10", "أكتوبر": "10", "اكتوبر": "10",
        "november": "11", "نوفمبر": "11",
        "december": "12", "ديسمبر": "12",
    }
    month_pattern = re.compile(r"(?<![\w])(?:" + "|".join(re.escape(key) for key in sorted(month_map, key=len, reverse=True)) + r")(?![\w])", re.IGNORECASE)
    protected["date_month"] = Counter(month_map[match.group(0).casefold()] for match in month_pattern.finditer(text))

    currency_map = (
        (r"(?<![\w])(?:EGP|جنيه(?:\s+مصري)?(?!\s+إسترليني))(?![\w])", "EGP"),
        (r"(?<![\w])(?:USD|دولار(?:\s+أمريكي)?)(?![\w])", "USD"),
        (r"(?<![\w])(?:EUR|يورو)(?![\w])", "EUR"),
        (r"(?<![\w])(?:GBP|جنيه\s+إسترليني)(?![\w])", "GBP"),
    )
    currencies = []
    for pattern, normalized in currency_map:
        currencies.extend(normalized for _ in re.finditer(pattern, text, re.IGNORECASE))
    protected["currency"] = Counter(currencies)
    return protected


def _expanded(counter: Counter[str]) -> tuple[str, ...]:
    values: list[str] = []
    for token in sorted(counter):
        values.extend([token] * counter[token])
    return tuple(values)


def _delimiter_problem(text: str) -> str | None:
    stack: list[tuple[str, int]] = []
    pairs = {"}": "{", "]": "[", ")": "("}
    opening = set(pairs.values())
    escaped = False
    for index, char in enumerate(text):
        if escaped:
            escaped = False
            continue
        if char == "\\":
            escaped = True
            continue
        if char in opening:
            stack.append((char, index))
        elif char in pairs:
            if not stack or stack[-1][0] != pairs[char]:
                return f"Unexpected {char!r} at character {index + 1}."
            stack.pop()
    if stack:
        char, index = stack[-1]
        return f"Unclosed {char!r} from character {index + 1}."
    return None


def _html_events(text: str) -> tuple[list[str], str | None]:
    events: list[str] = []
    stack: list[str] = []
    problem: str | None = None
    void_tags = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
    for match in re.finditer(r"<\s*(/?)\s*([A-Za-z][A-Za-z0-9:-]*)\b([^>]*)>", text):
        closing, raw_name, tail = match.groups()
        name = raw_name.casefold()
        if closing:
            events.append(f"</{name}>")
            if not stack or stack[-1] != name:
                expected = stack[-1] if stack else "no open tag"
                if problem is None:
                    problem = f"Closing </{name}> does not match {expected}."
                if name in stack:
                    while stack and stack[-1] != name:
                        stack.pop()
                    if stack:
                        stack.pop()
            else:
                stack.pop()
        else:
            self_closing = tail.rstrip().endswith("/") or name in void_tags
            events.append(f"<{name}/>") if self_closing else events.append(f"<{name}>")
            if not self_closing:
                stack.append(name)
    if stack and problem is None:
        problem = f"Unclosed <{stack[-1]}> tag."
    return events, problem


def compare_integrity(
    source: str,
    candidate: str,
    allow_number_style_change: bool = False,
) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []

    if "\x00" in source or "\x00" in candidate:
        diagnostics.append(Diagnostic("I000", "error", "encoding", "NUL byte found; input does not look like safe text."))

    source_problem = _delimiter_problem(source)
    candidate_problem = _delimiter_problem(candidate)
    if candidate_problem and not source_problem:
        diagnostics.append(Diagnostic("I002", "error", "candidate-delimiters", f"Candidate delimiters are unbalanced: {candidate_problem}"))

    if source.count("```") % 2:
        diagnostics.append(Diagnostic("I003", "error", "source-fences", "Source has an unclosed fenced code block."))
    if candidate.count("```") % 2:
        diagnostics.append(Diagnostic("I004", "error", "candidate-fences", "Candidate has an unclosed fenced code block."))

    printf_pattern = next(pattern for category, pattern in PATTERNS if category == "printf")
    source_printf = [match.group(0) for match in printf_pattern.finditer(source)]
    candidate_printf = [match.group(0) for match in printf_pattern.finditer(candidate)]
    has_implicit_positional = any(not re.match(r"%\d+\$", token) for token in source_printf + candidate_printf)
    if has_implicit_positional and source_printf != candidate_printf and Counter(source_printf) == Counter(candidate_printf):
        diagnostics.append(Diagnostic("I005", "error", "printf_order", "Implicit positional printf tokens were reordered.", tuple(source_printf), tuple(candidate_printf)))

    source_html, source_html_problem = _html_events(source)
    candidate_html, candidate_html_problem = _html_events(candidate)
    if candidate_html_problem and not source_html_problem:
        diagnostics.append(Diagnostic("I006", "error", "html_nesting", f"Candidate HTML nesting is invalid: {candidate_html_problem}"))
    if source_html != candidate_html and Counter(source_html) == Counter(candidate_html):
        diagnostics.append(Diagnostic("I007", "error", "html_tag_order", "HTML tag order or nesting changed.", tuple(source_html), tuple(candidate_html)))

    before = extract_protected(source, allow_number_style_change)
    after = extract_protected(candidate, allow_number_style_change)
    for index, category in enumerate(sorted(set(before) | set(after)), start=10):
        missing = before.get(category, Counter()) - after.get(category, Counter())
        extra = after.get(category, Counter()) - before.get(category, Counter())
        if not missing and not extra:
            continue
        diagnostics.append(
            Diagnostic(
                f"I{index:03d}",
                "error",
                category,
                f"Protected {category} tokens changed (missing={sum(missing.values())}, extra={sum(extra.values())}).",
                _expanded(missing),
                _expanded(extra),
            )
        )
    return diagnostics


def result_payload(diagnostics: Iterable[Diagnostic]) -> dict[str, object]:
    items = list(diagnostics)
    return {
        "ok": not any(item.severity == "error" for item in items),
        "diagnostics": [asdict(item) for item in items],
        "summary": {
            "errors": sum(item.severity == "error" for item in items),
            "warnings": sum(item.severity == "warning" for item in items),
        },
    }


def _read_utf8(path: str) -> str:
    return Path(path).read_text(encoding="utf-8-sig")


def main() -> int:
    parser = argparse.ArgumentParser(description="Check protected tokens between source and candidate text.")
    parser.add_argument("--source", required=True, help="UTF-8 source file.")
    parser.add_argument("--candidate", "--file", dest="candidate", required=True, help="UTF-8 candidate file.")
    parser.add_argument("--allow-number-style-change", action="store_true", help="Treat Arabic and Western digit forms as equivalent.")
    args = parser.parse_args()
    try:
        source = _read_utf8(args.source)
        candidate = _read_utf8(args.candidate)
    except (OSError, UnicodeError) as exc:
        print(json.dumps({"ok": False, "error_code": "INPUT_ERROR", "message": str(exc)}, ensure_ascii=False, sort_keys=True))
        return 2

    diagnostics = compare_integrity(source, candidate, args.allow_number_style_change)
    payload = result_payload(diagnostics)
    print(json.dumps(payload, ensure_ascii=False, sort_keys=True))
    return 0 if payload["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
