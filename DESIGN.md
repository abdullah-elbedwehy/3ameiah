# 3ameiah — Cassette Route Design System

## Creative north star

3ameiah is one working cassette deck, not a stack of generic SaaS sections. The visitor moves through a magnetic-tape journey: a large cassette introduces the product, four colored routes explain the available voices, another cassette records a personal profile, and the same routes carry the visitor to installation.

The visual language combines Egyptian dubbing-shop cassettes, printed J-card labels, carbon plastic, warm paper, hard borders, registration marks, physical buttons, and visibly offset depth. It should feel bold, tactile, contemporary, and human without becoming a nostalgia parody or generic “AI” interface.

Motion belongs to the metaphor. Scrolling plays the tape, advances the counter, turns reels, selects tracks, and reveals routes. The static content and semantics must remain complete without motion.

The public page sequence is intentionally short:

1. Hero
2. Before/after difference
3. Four tone tracks
4. Reusable profile
5. Installation paths
6. FAQ
7. Final CTA
8. Footer

Do not add a public benchmark section between the profile and installation flow. The repository benchmark is an internal deterministic regression suite, not a landing-page claim.

## Color system

| Token | Value | Role |
| --- | --- | --- |
| Cobalt stage | `#0754d8` | Profile and final CTA surfaces |
| Hero cobalt | `#002eaa` | First viewport and navigation field |
| Cobalt deep | `#003db8` | Deeper branded surfaces |
| Cobalt dark | `#062f89` | Structural depth |
| Warm paper | `#f7f0e3` | Main reading surface |
| Strong paper | `#fff9ee` | Cards and high-contrast text |
| Carbon | `#171817` | Text, borders, terminal panels, controls |
| Soft carbon | `#343632` | Supporting copy on paper |
| Mango | `#ffc626` | Primary action and professional route |
| Coral | `#f04d32` | General route and error state |
| Mint | `#54cf92` | Friendly route and success state |
| Friendly green | `#48c48e` | Friendly track surface |
| Franco blue | `#2c88dd` | Franco route |

The route mapping is fixed:

- General = coral.
- Professional = mango.
- Friendly = mint.
- Franco = blue.

Never remap those colors between the hero routes, mode controls, deck cards, progress indicators, or feedback. Mango is intentionally rare: it signals an action, selected mechanism, or printed label rather than an ordinary background.

## Typography and direction

Human-facing Arabic uses `Alexandria Variable`, with `Alexandria` and system UI fallbacks. Machine-facing strings use `SFMono-Regular`, `Cascadia Code`, `Roboto Mono`, `Consolas`, then monospace.

| Level | Size | Weight | Line height |
| --- | --- | --- | --- |
| Hero display | `clamp(4.2rem, 6.35vw, 6.7rem)` | `850` | `1.28` |
| Section headline | `clamp(2.1rem, 3.85vw, 4.1rem)` | `850` | about `1.34` |
| Track title | `1.65rem` | strong | `1.2` |
| Body | `1rem` base | regular | `1.75` |
| Label | `0.62–0.82rem` | `750–900` | compact |
| Mono | `0.7–1.08rem` | `800` | context dependent |

Rules:

- Arabic surfaces are RTL.
- Commands, URLs, package names, counters, and Franco remain exact and direction-isolated as LTR.
- Mono is reserved for the machine layer; do not use it for normal Egyptian copy.
- Hero and major section line breaks are composed intentionally. Do not replace them with arbitrary desktop wrapping.
- At `520px` and below, the installation title is deliberately smaller than other section titles so it does not become a full-screen text wall.

## Layout

Desktop content works inside an approximately `1220px` stage with responsive outer padding and room for the fixed transport deck.

### 1440px desktop

- The fixed header is `70px` high and compresses after scrolling.
- The transport deck stands vertically on the right edge.
- The hero uses a giant cassette cropped into the left edge and claim/action copy on the right.
- Four colored routes occupy the bottom of the hero and visually hand off to the explanation.
- The four tones form one continuous four-column deck strip, not four detached cards.
- Profiles use a two-column cassette/copy layout with a `680px` minimum height.
- Installation uses two unequal paths: easy first, terminal second.

### Intermediate widths

- At `1050px` and below, the four-track deck becomes a `2 × 2` surface.
- At `820px` and below, the vertical transport rail lies down as a horizontal progress bar under the header.
- Main navigation hides on mobile while the brand and GitHub control remain.
- Hero, comparison, profiles, installation, and final CTA become single-column.
- The comparison tape transfer stays an in-flow compact marker between stacked sheets (short ticks + `↓`). Do not rotate the desktop gutter; a full-width `rotate(90deg)` overlays the baseline copy.
- The hero cassette stays oversized and intentionally cropped.

### 390px and 320px

- `320px` is the hard supported minimum.
- Use `18px` section gutters and at least `12px` in the hero.
- No horizontal scrolling is allowed.
- Touch targets remain at least `44px` high.
- Commands and URLs wrap inside their own containers without changing LTR direction.
- The typewriter word keeps a stable minimum inline width so `مصري` and `زيك` do not move the headline.
- Track cards and install paths stack to one column.
- Profile command rows become label-over-code.

## Material, shape, and depth

The system is square and mechanical:

- Paper sheets and installation panels use `2–3px` carbon borders.
- Labels use low `2–5px` radii.
- Pills are reserved for tone chips and tape mechanisms.
- Circles are reserved for reels, switches, screws, copy icons, and FAQ controls.
- The hero URL control uses an irregular polygon edge like an applied cassette label.
- Active track state stays inside the shared card borders; it must not lift and tear the deck apart.

Depth is structural, not glassmorphic. Prefer hard, visibly offset shadows:

- Deck strip: `0 18px 0 rgba(7, 18, 34, 0.16)`.
- Paper sheet: roughly `10px 12px 0 rgba(23, 24, 23, 0.12)`.
- Hero label: `10px 10px 0 rgba(4, 30, 97, 0.7)`.
- Install path: `12px 14px 0 rgba(23, 24, 23, 0.16)`.
- Cassette and logo imagery use restrained hard drop shadows.

Do not apply the largest shadows to ordinary paragraphs or every container.

## Motion system

Routine feedback lasts `140–220ms`, content changes `260–320ms`, section entrances `480–620ms`, and the authored hero entrance can reach `760ms`. Default arrival easing is `cubic-bezier(0.16, 1, 0.3, 1)`.

Continuous motion uses one `requestAnimationFrame` writer and cached layout metrics. Layout is remeasured after resize, orientation changes, page restore, font readiness, FAQ changes, or `ResizeObserver` invalidation. Do not add independent scroll listeners that read and write layout on every event.

Sections have two different states:

- `has-entered` is sticky and ensures content never disappears when the user scrolls back.
- `is-in-view` is transient and controls only active loops and viewport-sensitive effects.

### Hero typewriter

The typewriter has no visible caret.

The supporting paragraph types once after a `620ms` pause:

- Normal character: `24ms`.
- Space: `34ms`.
- Comma, colon, or dash: `105ms`.
- Sentence punctuation: `220ms`.

The fixed paragraph footprint is preserved with an invisible measurement layer, so the CTA below it does not jump while letters appear.

The headline word starts looping between `مصري` and `زيك` immediately, in parallel with the paragraph typewriter:

- Hold completed word: `2000ms`.
- Delete each character: `92ms`.
- Empty pause: `220ms`.
- Type each character: `128ms`.

The full H1 remains available through a stable Arabic `aria-label`; the paragraph keeps a complete screen-reader-only copy. Animated visual spans are hidden from assistive technology. The sequence pauses when the hero is less than `18%` visible, the document is hidden, or reduced motion is active.

### Transport deck

- Desktop: vertical rail with PLAY label, `00–99` counter, moving head, progress fill, and real section links.
- Mobile: horizontal progress bar with section marks under the header.
- Mark positions are measured from the real section offsets.
- The current scroll position updates the fill, counter, rotating head, and passed marks.

### Mode and profile motion

- The before/after result uses a bounded `320ms` slide/fade on tone change.
- The four-track deck scrubs vertically and rotates in shallow perspective.
- Track switches turn at different rates and the active track follows section progress.
- Profile reels turn from scroll progress and the local counter runs from `000` to `999`.
- Scroll amplitudes are reduced on mobile.

### Copy, FAQ, and final CTA

- Buttons press to `scale(.965)` for about `180ms`.
- Successful copy states become mint; failures become coral and expose a manual-copy field.
- Copy sparks use the four route colors and are disabled under reduced motion.
- FAQ answers enter in about `260ms`, while opening a row invalidates cached layout measurements.
- Final tape lanes reveal from section progress and remain fully visible in reduced motion.

## Reduced motion

When `prefers-reduced-motion: reduce` is active:

- Smooth scrolling is disabled.
- The transport deck is hidden.
- Routes render complete.
- Entrance, parallax, reel, card, logo, tape, spark, and feedback animations are removed.
- Motion items stay fully visible.
- Final tape lanes are shown without clipping.
- The typewriter resolves immediately to the complete paragraph and static `مصري`.
- Copy, focus, disclosure, and navigation behavior remain functional.

## Preservation checklist

Do:

- Preserve the cassette-route metaphor from hero to final CTA.
- Keep the four track colors semantically consistent.
- Use the cleaned cassette assets as identity anchors.
- Keep actions tactile and expose success, failure, and manual recovery.
- Keep core content present without JavaScript.
- Test structural changes at `320 × 568`, `390 × 844`, and `1440 × 900`.
- Stop nonessential loops when their section leaves the viewport.

Do not:

- Replace the hero with a centered SaaS headline, dashboard mockup, or generic feature-card stack.
- Add neon AI gradients, glass cards, glowing brains, robots, pyramids, or pharaonic decoration.
- Turn every section into detached rounded cards.
- Change command, URL, code, or factual values for visual effect.
- Add typewriter words without checking the headline at all supported widths.
- Hide content until JavaScript runs.
- Leave motion active under reduced motion.
- Insert new public sections between the profile and installation handoff without redesigning the tape journey.
