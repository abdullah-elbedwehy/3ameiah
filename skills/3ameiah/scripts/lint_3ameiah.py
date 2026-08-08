#!/usr/bin/env python3
"""Heuristic language lint plus deterministic protected-token checks for 3ameiah."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

from check_integrity import compare_integrity
from resolve_mode import MODES, normalize_selector


@dataclass(frozen=True)
class Finding:
    rule_id: str
    severity: str
    line: int
    column: int
    message: str
    suggestion: str


FORMAL_MARKERS = (
    "سوف",
    "ليس",
    "ليست",
    "يرجى",
    "يُرجى",
    "يتعين",
    "يتوجب",
    "حيث إن",
    "وعليه",
    "نود إفادتكم",
    "نرجو من سيادتكم",
    "قم بـ",
    "كافي",
)

DIALECT_LEAK = (
    "شو",
    "ليش",
    "هلق",
    "مو",
    "رح",
    "هيك",
    "إيش",
    "يبغى",
    "وايد",
)

MALFORMED_EGYPTIAN = ("ماهو حاجة",)

FILLERS = ("بص", "يعني", "بقى", "يا معلم", "جامد")
PROFANITY = ("خرا", "وسخ", "غبي", "احا", "يا ابن")
BIDI_CONTROLS = set("\u200e\u200f\u202a\u202b\u202c\u202d\u202e\u2066\u2067\u2068\u2069")

FRANCO_ANCHORS = {
    "ana", "enta", "enty", "ento", "ehna", "howa", "heya", "homma",
    "mesh", "msh", "mafeesh", "3ayez", "3ayz", "3ayza", "7aga", "keda",
    "delwa2ty", "3ashan", "lazem", "abl", "2abl", "ba3d", "fahmet", "tabbe2",
    "a2olak", "2olek", "yewsal", "yowsal", "el", "wel", "fel", "3ala",
    "momken", "teb3at", "teb3aty", "malaf", "bokra", "shokran", "kalam",
    "da", "di", "de", "fe", "fi", "men", "le", "law", "bas", "gedan",
    "gameel", "gedid", "shoghl", "3andak", "3andy", "eih", "eh", "leh",
}

ENGLISH_MARKERS = {
    "the", "this", "that", "is", "are", "was", "were", "want", "need", "please",
    "send", "file", "before", "after", "important", "message", "price", "client",
    "we", "you", "your", "to", "and", "with", "must", "should", "can",
    "kindly", "forward", "payment", "promptly", "upon", "receipt", "our", "team",
    "appreciates", "prompt", "response", "today", "discuss", "branding", "strategy",
    "customer", "acquisition",
}

FRANCO_DIALECT_LEAK = {"shu", "leish", "halla2", "hal2", "heik", "hayk", "wayed", "yebgha"}


def _position(text: str, offset: int) -> tuple[int, int]:
    line = text.count("\n", 0, offset) + 1
    previous = text.rfind("\n", 0, offset)
    column = offset + 1 if previous < 0 else offset - previous
    return line, column


def _mask(text: str, source: str | None = None) -> str:
    """Mask spans that style heuristics should not interpret as prose."""
    patterns = (
        r"```[^\n]*\n[\s\S]*?```",
        r"(?<!`)`[^`\n]+`(?!`)",
        r"https?://[^\s<>\"']+",
        r"(?<![\w.+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        r"<[^>]+>",
    )
    masked = text
    for pattern in patterns:
        masked = re.sub(pattern, lambda match: "".join("\n" if c == "\n" else " " for c in match.group(0)), masked)
    if source:
        quote_patterns = (r'"(?:\\.|[^"\\])*"', r"“[^”]*”", r"«[^»]*»")
        exact_quotes: set[str] = set()
        for pattern in quote_patterns:
            exact_quotes.update(match.group(0) for match in re.finditer(pattern, source) if len(match.group(0)) >= 4)
        for quote in sorted(exact_quotes, key=len, reverse=True):
            masked = masked.replace(quote, "".join("\n" if c == "\n" else " " for c in quote))
    return masked


def _word_pattern(phrase: str) -> re.Pattern[str]:
    return re.compile(rf"(?<![\w\u0600-\u06ff]){re.escape(phrase)}(?![\w\u0600-\u06ff])", re.IGNORECASE)


def _finding(rule: str, severity: str, text: str, offset: int, message: str, suggestion: str) -> Finding:
    line, column = _position(text, offset)
    return Finding(rule, severity, line, column, message, suggestion)


def lint_text(
    candidate: str,
    mode: str,
    artifact: str = "general",
    source: str | None = None,
    allow_arabic_franco: bool = False,
    allow_profanity: bool = False,
    allow_bidi_controls: bool = False,
    allow_mode_labels: bool = False,
    allow_number_style_change: bool = False,
) -> list[Finding]:
    findings: list[Finding] = []
    masked = _mask(candidate, source)

    if not candidate.strip():
        findings.append(Finding("E001", "error", 1, 1, "Output is empty.", "Provide the requested artifact or text."))
        return findings

    if "\x00" in candidate:
        findings.append(Finding("E002", "error", 1, 1, "NUL byte found in text output.", "Use valid UTF-8 text input."))

    if not allow_bidi_controls:
        for offset, char in enumerate(candidate):
            if char in BIDI_CONTROLS:
                findings.append(_finding("E003", "error", candidate, offset, f"Unexpected bidi control U+{ord(char):04X}.", "Use structural direction handling such as dir or bdi, or explicitly allow the control."))

    if candidate.count("```") % 2:
        offset = candidate.rfind("```")
        findings.append(_finding("E004", "error", candidate, max(offset, 0), "Unclosed fenced code block.", "Close the code fence without changing its content."))

    if not allow_mode_labels:
        for token in MODES:
            match = re.search(rf"(?<![\w]){re.escape(token)}(?![\w])", masked)
            if match:
                findings.append(_finding("E005", "error", candidate, match.start(), f"Control token {token} leaked into delivered copy.", "Remove the mode label from the artifact or pass --allow-mode-labels for an intentional comparison."))

    if source is not None:
        for item in compare_integrity(source, candidate, allow_number_style_change):
            findings.append(Finding(f"P-{item.rule_id}", item.severity, 1, 1, item.message, "Restore the missing protected token and remove unintended extras."))

    for marker in FORMAL_MARKERS:
        for match in _word_pattern(marker).finditer(masked):
            findings.append(_finding("W101", "warning", candidate, match.start(), f"Formal marker {marker!r} may leave an MSA skeleton.", "Rewrite the whole sentence with natural Egyptian syntax unless this is protected official wording."))

    for marker in DIALECT_LEAK:
        for match in _word_pattern(marker).finditer(masked):
            findings.append(_finding("W102", "warning", candidate, match.start(), f"Possible non-Egyptian dialect marker {marker!r}.", "Use an Egyptian equivalent unless the source or character requires this dialect."))

    for marker in MALFORMED_EGYPTIAN:
        for match in re.finditer(re.escape(marker), masked, re.IGNORECASE):
            findings.append(_finding("W107", "warning", candidate, match.start(), f"Malformed or unnatural Egyptian phrase {marker!r}.", "Replace it with a simpler construction that reads naturally aloud."))

    word_count = max(1, len(re.findall(r"[A-Za-z\u0600-\u06ff0-9]+", masked)))
    filler_limit = max(1, word_count // 80 + 1)
    for filler in FILLERS:
        matches = list(_word_pattern(filler).finditer(masked))
        if len(matches) > filler_limit:
            findings.append(_finding("W103", "warning", candidate, matches[filler_limit].start(), f"Filler {filler!r} repeats {len(matches)} times.", "Create colloquial rhythm through syntax and concrete wording, not filler density."))

    if not allow_profanity:
        for term in PROFANITY:
            match = _word_pattern(term).search(masked)
            if match:
                findings.append(_finding("W104", "warning", candidate, match.start(), f"Unverified profanity or insult {term!r}.", "Remove it unless the user and context explicitly require it."))

    if artifact not in {"narrative", "dialogue"}:
        address_groups = {
            "informal-single": re.compile(r"(?<![\w\u0600-\u06ff])(?:إنت|انت)[َُِ]?(?!وا)(?![\w\u0600-\u06ff])"),
            "respectful-single": re.compile(r"(?<![\w\u0600-\u06ff])(?:حضرتك|سيادتك)(?![\w\u0600-\u06ff])"),
            "plural": re.compile(r"(?<![\w\u0600-\u06ff])(?:إنتوا|انتوا|أنتم)(?![\w\u0600-\u06ff])"),
        }
        present = [(label, pattern.search(masked)) for label, pattern in address_groups.items()]
        present = [(label, match) for label, match in present if match]
        if len(present) > 1:
            labels = ", ".join(label for label, _ in present)
            findings.append(_finding("W105", "warning", candidate, present[1][1].start(), f"Address convention may drift across: {labels}.", "Choose one audience/address convention unless multiple speakers require different ones."))

        gender_pairs = (
            (r"(?<![\w\u0600-\u06ff])تقدر(?![\w\u0600-\u06ff])", r"(?<![\w\u0600-\u06ff])تقدري(?![\w\u0600-\u06ff])"),
            (r"(?<![\w\u0600-\u06ff])تبعت(?![\w\u0600-\u06ff])", r"(?<![\w\u0600-\u06ff])تبعتي(?![\w\u0600-\u06ff])"),
            (r"(?<![\w\u0600-\u06ff])تعمل(?![\w\u0600-\u06ff])", r"(?<![\w\u0600-\u06ff])تعملي(?![\w\u0600-\u06ff])"),
            (r"(?<![\w\u0600-\u06ff])جاهز(?![\w\u0600-\u06ff])", r"(?<![\w\u0600-\u06ff])جاهزة(?![\w\u0600-\u06ff])"),
        )
        for masculine_pattern, feminine_pattern in gender_pairs:
            masculine = re.search(masculine_pattern, masked)
            feminine = re.search(feminine_pattern, masked)
            if masculine and feminine:
                findings.append(_finding("W106", "warning", candidate, feminine.start(), "Masculine and feminine forms may drift for one audience.", "Keep gender endings consistent or rephrase neutrally."))
                break

        explicit_feminine = re.search(r"(?<![\w\u0600-\u06ff])(?:إنتِ|انتي)(?![\w\u0600-\u06ff])", masked)
        masculine_form = re.search(r"(?<![\w\u0600-\u06ff])(?:تقدر|تبعت|تعمل|جاهز)(?![\w\u0600-\u06ff])", masked)
        if explicit_feminine and masculine_form and not any(item.rule_id == "W106" for item in findings):
            findings.append(_finding("W106", "warning", candidate, masculine_form.start(), "Feminine address is mixed with a masculine form.", "Use consistent feminine endings or rephrase neutrally."))

    arabic_matches = list(re.finditer(r"[\u0600-\u06ff]", masked))
    latin_words = re.findall(r"\b[A-Za-z][A-Za-z0-9'-]*\b", masked)
    arabic_words = re.findall(r"[\u0600-\u06ff]+", masked)

    if mode == "3ameiah-franco":
        if arabic_matches and not allow_arabic_franco:
            findings.append(_finding("W201", "warning", candidate, arabic_matches[0].start(), "Arabic-script prose found in Franco mode.", "Use LTR Egyptian Arabizi, or explicitly allow Arabic for a controlling quote or warning."))
        if re.search(r"\b(?:jameel|jedid|jamed)\b", masked, re.IGNORECASE):
            match = re.search(r"\b(?:jameel|jedid|jamed)\b", masked, re.IGNORECASE)
            assert match is not None
            findings.append(_finding("W202", "warning", candidate, match.start(), "Franco uses j for likely Egyptian ج.", "Use g by default unless an official name or supplied regional voice requires j."))
        malformed_franco = re.search(r"(?i)(?<![A-Za-z0-9_])(?:ana2a|ba3at3)(?![A-Za-z0-9_])", masked)
        if malformed_franco:
            findings.append(_finding("W209", "warning", candidate, malformed_franco.start(), f"Malformed Franco guess {malformed_franco.group(0)!r}.", "Read the word back as Egyptian and use a stable form such as eb3atli, 2olli, or another source-consistent spelling."))
        if re.search(r"(?i)\b\w*5\w*\b", masked) and re.search(r"(?i)\b\w*kh\w*\b", masked):
            match = re.search(r"(?i)\b\w*kh\w*\b", masked)
            assert match is not None
            findings.append(_finding("W203", "warning", candidate, match.start(), "Mixed 5 and kh conventions may be inconsistent.", "Follow the source house style or choose one convention per artifact."))
        normalized_latin = [word.casefold() for word in latin_words]
        english_count = sum(word in ENGLISH_MARKERS for word in normalized_latin)
        franco_count = sum(word in FRANCO_ANCHORS or any(char in word for char in "2357") for word in normalized_latin)
        if len(normalized_latin) >= 4 and (franco_count == 0 or (english_count >= 3 and english_count > franco_count * 2)):
            findings.append(Finding("W206", "warning", 1, 1, "Candidate looks more like English than Egyptian Franco.", "Render Egyptian speech in Latin characters; keep only natural or protected English terms."))
        for index, word in enumerate(normalized_latin):
            if word in FRANCO_DIALECT_LEAK:
                match = re.search(rf"(?i)(?<![A-Za-z0-9_]){re.escape(word)}(?![A-Za-z0-9_])", masked)
                findings.append(_finding("W207", "warning", candidate, match.start() if match else 0, f"Possible non-Egyptian Franco marker {word!r}.", "Use Egyptian wording unless the source or character requires this dialect."))
                break
        franco_gender_pairs = (("enta", "enty"), ("te2dar", "te2dary"), ("teb3at", "teb3aty"), ("gahez", "gahza"))
        word_set = set(normalized_latin)
        for masculine, feminine in franco_gender_pairs:
            if masculine in word_set and feminine in word_set:
                match = re.search(rf"(?i)(?<![A-Za-z0-9_]){re.escape(feminine)}(?![A-Za-z0-9_])", masked)
                findings.append(_finding("W208", "warning", candidate, match.start() if match else 0, "Franco masculine and feminine forms may drift for one audience.", "Keep gender endings consistent or rephrase neutrally."))
                break
    else:
        if not arabic_words and len(latin_words) >= 5 and artifact not in {"structured"}:
            findings.append(Finding("W204", "warning", 1, 1, "No Arabic-script human prose detected for an Arabic mode.", "Confirm that all user-facing text was actually adapted."))
        if len(latin_words) >= 10 and len(latin_words) > max(8, len(arabic_words) * 2):
            findings.append(Finding("W205", "warning", 1, 1, "English/code-switching dominates the candidate.", "Keep protected technical terms, but rewrite ordinary human prose in Egyptian Arabic."))

    repeated_punctuation = re.search(r"[!?؟]{3,}", masked)
    if repeated_punctuation:
        findings.append(_finding("W301", "warning", candidate, repeated_punctuation.start(), "Repeated emphatic punctuation may add unrequested intensity.", "Match the source emotional intensity and channel convention."))

    if artifact == "product-ui":
        offset = 0
        for line in candidate.splitlines(keepends=True):
            visible = re.sub(r"`[^`]*`|https?://\S+", "", line).strip()
            if len(visible) > 120:
                findings.append(_finding("W401", "warning", candidate, offset, "A UI line exceeds 120 characters.", "Tighten the visible string and verify it in the rendered state."))
            offset += len(line)
    elif artifact == "post":
        hashtag_count = len(re.findall(r"(?<!\w)#[\w\u0600-\u06ff]+", masked))
        if hashtag_count > 8:
            match = re.search(r"(?<!\w)#[\w\u0600-\u06ff]+", masked)
            findings.append(_finding("W402", "warning", candidate, match.start() if match else 0, f"Post contains {hashtag_count} hashtags.", "Keep only hashtags that serve discovery or campaign requirements."))
        first_line = next((line for line in candidate.splitlines() if line.strip()), "")
        if len(first_line) > 180:
            findings.append(Finding("W403", "warning", 1, 1, "Opening line is longer than 180 characters.", "Make the opening easier to scan without replacing the central idea."))
    elif artifact == "spoken":
        for sentence in re.finditer(r"[^.!؟!?\n]+[.!؟!?]?", masked):
            words = re.findall(r"[A-Za-z\u0600-\u06ff0-9]+", sentence.group(0))
            if len(words) > 35:
                findings.append(_finding("W404", "warning", candidate, sentence.start(), f"Spoken sentence has {len(words)} words.", "Split it into shorter breath groups and read it aloud."))

    severity_rank = {"error": 0, "warning": 1}
    findings.sort(key=lambda item: (severity_rank.get(item.severity, 9), item.line, item.column, item.rule_id, item.message))
    return findings


def _read_candidate(args: argparse.Namespace) -> str:
    if args.file:
        return Path(args.file).read_text(encoding="utf-8-sig")
    if args.text is not None:
        return args.text
    if not sys.stdin.isatty():
        return sys.stdin.read()
    return ""


def _render_text(payload: dict[str, object]) -> str:
    findings = payload["findings"]
    if not findings:
        return "3ameiah lint: clean"
    lines = [f"3ameiah lint: {payload['summary']['errors']} error(s), {payload['summary']['warnings']} warning(s)"]
    for finding in findings:
        lines.append(f"{finding['severity'].upper()} {finding['rule_id']} {finding['line']}:{finding['column']} {finding['message']}")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Lint Egyptian Arabic or Franco output and protected tokens.")
    source_group = parser.add_mutually_exclusive_group()
    source_group.add_argument("--file", help="UTF-8 candidate file.")
    source_group.add_argument("--text", help="Candidate text. Reads stdin when omitted.")
    parser.add_argument("--source", help="Optional UTF-8 source for protected-token comparison.")
    parser.add_argument("--mode", default="3ameiah", help="Exact mode or short alias.")
    parser.add_argument("--artifact", default="general", choices=("general", "product-ui", "post", "spoken", "document", "message", "narrative", "dialogue", "structured"))
    parser.add_argument("--strict", action="store_true", help="Return failure for warnings as well as errors.")
    parser.add_argument("--json", action="store_true", help="Print deterministic JSON.")
    parser.add_argument("--allow-arabic-franco", action="store_true")
    parser.add_argument("--allow-profanity", action="store_true")
    parser.add_argument("--allow-bidi-controls", action="store_true")
    parser.add_argument("--allow-mode-labels", action="store_true")
    parser.add_argument("--allow-number-style-change", action="store_true")
    args = parser.parse_args()

    mode = normalize_selector(args.mode)
    if mode in {None, "auto"}:
        payload = {
            "ok": False,
            "mode": args.mode,
            "artifact": args.artifact,
            "findings": [asdict(Finding("E000", "error", 1, 1, f"Invalid mode {args.mode!r}.", f"Use one of: {', '.join(MODES)}."))],
            "summary": {"errors": 1, "warnings": 0},
        }
        print(json.dumps(payload, ensure_ascii=False, sort_keys=True) if args.json else _render_text(payload))
        return 1

    try:
        candidate = _read_candidate(args)
        source = Path(args.source).read_text(encoding="utf-8-sig") if args.source else None
    except (OSError, UnicodeError) as exc:
        print(json.dumps({"ok": False, "error_code": "INPUT_ERROR", "message": str(exc)}, ensure_ascii=False, sort_keys=True))
        return 2

    findings = lint_text(
        candidate,
        mode,
        args.artifact,
        source,
        args.allow_arabic_franco,
        args.allow_profanity,
        args.allow_bidi_controls,
        args.allow_mode_labels,
        args.allow_number_style_change,
    )
    errors = sum(item.severity == "error" for item in findings)
    warnings = sum(item.severity == "warning" for item in findings)
    ok = errors == 0 and (warnings == 0 or not args.strict)
    payload = {
        "ok": ok,
        "mode": mode,
        "artifact": args.artifact,
        "findings": [asdict(item) for item in findings],
        "summary": {"errors": errors, "warnings": warnings},
    }
    print(json.dumps(payload, ensure_ascii=False, sort_keys=True) if args.json else _render_text(payload))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
