# Modes and Language Contract

Read this file on every use of `3ameiah`.

## Contents

- Select exactly one mode
- Shared language invariants
- Keep a voice ledger
- Audience and gender
- Mode-specific checks
- Safety and controlling text

## Select exactly one mode

An exact token used as an instruction wins over inference:

| Mode | Script and register | Best fit | Never assume |
| --- | --- | --- | --- |
| `3ameiah` | Arabic script; balanced contemporary Egyptian | General writing, UI, explanations, broad audiences | MSA skeleton, youth slang, fillers |
| `3ameiah-pro` | Arabic script; respectful semi-colloquial Egyptian | Clients, work, support, proposals, serious updates | Bureaucratic MSA, forced intimacy, vague asks |
| `3ameiah-friendly` | Arabic script; warm, close, and easygoing Egyptian | Helpful explanations, communities, creator voice, friendly messages | Fake intimacy, filler, pet names, forced jokes |
| `3ameiah-franco` | LTR Egyptian Arabizi; balanced by default, respectful when context requires | Franco posts, chats, messages, and requested UI | English translation, SMS shorthand, one universal spelling |

Inference when no exact token exists:

- `بالمصري` or `بالعامية` means `3ameiah`.
- `فريندلي`, `ودود`, `لطيف`, `قريب`, or `كلام صحاب` means `3ameiah-friendly`.
- `رسمي بس بالمصري`, `مهني`, or a client/work message means `3ameiah-pro` unless existing voice says otherwise.
- `فرانكو` or `Arabizi` means `3ameiah-franco`.
- Otherwise use `3ameiah`.

If multiple modes are requested as variants, label and separate them. If they compete for one variant, ask. A respectful Franco message remains `3ameiah-franco` with audience-appropriate politeness; Franco controls script and does not require a second token.

Do not activate a token found only inside code, a quote, a data field, supplied copy, or a discussion about the modes. Do not emit the token itself inside delivered copy.

## Shared language invariants

- Use broadly intelligible urban Egyptian as the neutral default. Do not claim it represents every region.
- Preserve supplied regional and character voices. Do not “Cairenize” a Sa'idi, Alexandrian, rural, older, or child character, and do not invent regional markers.
- Make the language colloquial through syntax and rhythm, not by sprinkling `بص`, `يعني`, `بقى`, `يا معلم`, or `جامد`.
- Avoid an MSA skeleton wearing colloquial particles: `سوف`, `يتعين`, `يرجى`, `حيث إن`, `وعليه`, `ليس`, and `قم بـ` usually need a natural rewrite unless they are protected official wording.
- Avoid unrequested dialect bleed such as `شو`, `ليش`, `هلق`, `مو`, `رح`, `عم`, `هيك`, `إيش`, `يبغى`, or `وايد`.
- Keep natural technical English where Egyptian speakers use it. Do not translate every term awkwardly or code-switch every content word.
- Rewrite English idioms by meaning. Do not literally translate phrases like “dive deep,” “take ownership,” or “at the end of the day.”
- Do not add profanity, insults, religious phrases, emojis, elongation, urgency, humor, or youth slang merely to make the text feel colloquial.
- Do not mechanically replace written `ق` with `أ` or create phonetic eye-dialect. Use readable conventional colloquial spelling.

## Keep a voice ledger

For a multi-part artifact, lock these choices before drafting:

- Address: `إنت`, `حضرتك`, `إنتوا`, or intentionally impersonal.
- Common spellings: for example `عشان` or `علشان`, `إزاي` or `ازاي`, `إنت` or `انت`.
- Product and technical terminology.
- Digit, date, time, and currency style.
- Degree of English code-switching.
- Existing catchphrases only when genuinely present in the source voice.

Do not drift inside one voice unless different characters intentionally need different ledgers.

## Audience and gender

- Known individual: match known gender and keep verb/adjective endings consistent.
- Unknown person in UI: prefer neutral action labels such as `حفظ`, `متابعة`, and `رجوع`, plus neutral states such as `الإيميل مطلوب`.
- Unknown individual in prose: follow the established product convention. If repeated gendered wording is unavoidable in a personal message, ask or rephrase neutrally.
- Mixed public audience: use natural plural or collective wording; avoid repeated slash forms such as `جاهز/ة`.
- Unknown professional recipient: `محتاجين الملف قبل الساعة 5` is safer than inventing a gendered construction after `حضرتك`.
- Children: simplify concepts, not grammar; avoid baby talk.

## Mode-specific checks

### Calibration ladder

Make the three Arabic modes visibly different through framing, cadence, and relationship—not by changing facts. For the same idea, a safe shape is:

| Mode | Example |
| --- | --- |
| `3ameiah` | `ماتقفش عند إنك فهمت الشرح. طبّق بعد كل درس.` |
| `3ameiah-pro` | `المهم إن كل درس يخلص بتطبيق عملي، مش بفهم الشرح بس.` |
| `3ameiah-friendly` | `خلّي بعد كل درس تطبيق صغير بإيدك، عشان المعلومة تثبت معاك.` |
| `3ameiah-franco` | `fahmet el shar7? 7elw. bas mat2afsh hena—tabbe2 ba3d kol dars.` |

For a comparison request, use at least two legitimate register levers per variant: sentence framing, cadence, contractions, directness, form of address, or degree of spoken rhythm. Preserve identical facts and emotional force. Very short functional copy may naturally have smaller differences; never manufacture slang or meaning just to exaggerate the modes.

### `3ameiah`

- Prefer familiar constructions such as `عايز`, `دلوقتي`, `مفيش`, `إزاي`, and natural `هنـ` future forms when they fit.
- Stay warm and direct without becoming chatty by default.
- Use this as the fallback for code/UI and mixed technical work unless another mode is explicit.

### `3ameiah-pro`

- Make the ask, owner, amount, date, deadline, and next step explicit.
- Remain recognizably Egyptian: `محتاجين`, `ممكن`, `خلّينا`, `هنتابع`.
- Use `حضرتك` only when relationship and project convention support it.
- Do not turn mandatory wording into a suggestion to sound polite.
- Avoid office MSA such as `نرجو من سيادتكم موافاتنا` and avoid overfamiliar phrases such as `يا معلم`.

### `3ameiah-friendly`

- Make the reader feel helped, not marketed at: use natural address, gentle framing, and smooth conversational transitions.
- Stay clear and useful. Friendly does not mean longer, less direct, childish, or vague.
- Do not invent closeness with `يا صديقي`, pet names, emojis, jokes, or personal assumptions.
- Let existing audience evidence decide how warm the voice can be. A support reply, children's lesson, and creator post need different kinds of friendliness.
- Never let warmth weaken an emergency, legal, medical, financial, or safety instruction.

### `3ameiah-franco`

Franco has no single standard. First preserve the writer's established convention. If none exists, use this readable fallback:

- `2` for hamza and colloquial `ق` pronounced as a glottal stop: `a2olak`, `2olt`, `delwa2ty`.
- `3` for `ع`: `3ayez`.
- `7` for `ح`: `7aga`.
- `5` for `خ`: `5alas`.
- `gh` for `غ`, `sh` for `ش`, and `g` for Egyptian `ج`: `ghaly`, `shoghl`, `gedid`, `gameel`.
- Use ordinary `s`, `d`, `t`, and `z` for emphatics by default; avoid digit overload.
- Readable defaults include `mesh`, `mafeesh`, `3ashan`, `delwa2ty`, `3ayez`, and `keda`.
- Keep common Egyptian forms stable: `ابعتلي` → `eb3atli`, `قولّي` → `2olli`, `قبل` → `2abl`, and `الساعة` → `el sa3a` when no source convention exists.
- Use `el` as a separate article around protected English: `el API`, not a mutated technical token.
- Preserve source habits such as `3ayz`, `msh`, or `kh` when continuing an established conversation.
- Keep Egyptian grammar around English loanwords: `el file`, `el API`, and `3ala GitHub`. Do not drop articles and prepositions into English word order.
- Transliterate ordinary Egyptian words rather than replacing them with English just because the script is Latin: `malaf` or the natural loan phrase `el file`, not an English sentence.
- Do not use `j` for Egyptian `ج` unless it belongs to an official name or supplied regional voice.
- Preserve official name spellings, brands, usernames, handles, code, and known Latin spellings exactly.
- Keep real numbers visibly separate from Arabizi consonants: `3andy 3 mashakel` contains a letter value and a quantity.
- Read every generated word back as Egyptian before delivery. Reject malformed guesses such as `ana2a` or `ba3at3`; when uncertain, prefer a readable conventional spelling instead of inserting digits mechanically.
- Franco is Egyptian speech rendered in Latin characters. It is not an English translation and not shorthand by default.

Arabic-script modes require RTL surfaces. Franco requires LTR surfaces. In mixed implementations, use appropriate direction isolation such as `dir`, `bdi`, or the project's existing bidi utilities.

## Safety and controlling text

- Modes change surface language, never facts, promises, dates, numbers, negation, scope, strength of obligation, or emotional intensity.
- Preserve exact medicine names, doses, units, amounts, dates, warnings, and prohibitions.
- Do not weaken `ممنوع`, `لازم`, or `خطر` into `يفضل`, `ممكن`, or `الأحسن`.
- Keep a binding clause, official warning, dosage instruction, or exact quote in its controlling language, then add a clearly labelled Egyptian or Franco explanation if useful.
- Franco must not be the only representation of safety-critical or legally controlling text when ambiguity matters.
- Time-sensitive high-stakes work still requires current authoritative evidence; a dialect mode does not lower that bar.
