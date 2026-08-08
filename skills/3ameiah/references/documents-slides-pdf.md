# PDF, DOCX, Slides, and Formatted Documents

Use this playbook for PDFs, Word documents, presentations, reports, proposals, CVs, handbooks, worksheets, and print-ready files.

## Establish the contract

1. Identify the requested final formats and the editable source of truth.
2. Use the matching PDF, document, or presentation capability when available, and follow its instructions before editing.
3. Prefer editing the source document over modifying an exported PDF when a source exists.
4. Identify whether text is source-locked, meaning-preserving, legally controlling, or creatively adaptable.
5. Inventory styles, masters, page/slide count, notes, comments, tracked changes, links, TOC, headers/footers, footnotes, tables, charts, forms, and embedded assets.

## Edit without losing structure

- Preserve hierarchy, styles, layout intent, citations, links, references, comments, tracked changes, speaker notes, alt text, and metadata that remain in scope.
- Keep code, formulas, field names, official terms, and LTR spans readable inside RTL documents.
- Use fonts with verified Arabic glyph support and appropriate shaping.
- Respect page/slide size, margins, print settings, table widths, master layouts, and template constraints.
- Do not create filler to reach a page count. Use only useful, supported material.
- For a scanned PDF, distinguish OCR uncertainty from editable text and verify sensitive values against the page image.
- For binding or official text, retain the controlling version and add a clearly labelled Egyptian explanation instead of replacing it.

## Render and inspect

Completion requires the actual file and visual verification:

1. Save/export the requested format.
2. Render every page or slide to images.
3. Inspect text overflow, clipping, missing glyphs, broken shaping, direction, line wrapping, table splits, chart labels, image placement, footnotes, headers/footers, and blank pages.
4. Check hyperlinks, TOC/bookmarks, comments/notes, forms, searchability, page/slide count, and file integrity where applicable.
5. Compare key text, facts, amounts, dates, formulas, and references with the source.

## Format-specific gates

- **PDF:** opens cleanly, correct page size/count, searchable when expected, embedded fonts/glyphs valid, links/bookmarks/forms work, print view acceptable.
- **DOCX:** styles and lists remain stable, tables fit, comments/tracked changes handled as requested, headers/footers and TOC remain correct.
- **PPTX:** master/layout inheritance holds, text fits each slide, speaker notes are adapted when requested, charts and diagrams stay legible, slideshow order is correct.

## Edge handling

- If fonts, editable sources, OCR, or render tools are unavailable, try a safe recovery path and report exactly what could not be verified.
- Do not claim visual correctness from file parsing alone.
- Preserve the original unless the user explicitly requested an in-place overwrite and that operation is safe.
- If localization causes overflow, first tighten wording and layout within the design system; do not shrink text below readable size just to make it fit.
