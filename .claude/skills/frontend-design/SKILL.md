---
name: frontend-design
description: Design rules for the «حاسِب» site — type scale, 8px spacing grid, brand colours, component patterns, and an explicit ban on the generic AI-website look. Read before building or changing any page, section or component in this repo.
---

> **Current direction (Oct 2026): «أريد أن أعرف…».** Deep-emerald stage (#06291f, glow #13785b, dot grid) with the nav floating over it; a white "machine" card (radius 28) that overlaps the stage and holds the sentence; the answer in a dark display with mint counter digits, one cell per digit (`odo()` in lib/format.ts — always keeps a screen-reader copy). Calculators shown as coloured tiles (`tone` in data/calculators.ts, white text must pass 4.5:1). All copy is Modern Standard Arabic (فصحى), never Gulf dialect. Where older rules below conflict with this, this wins.

# حاسِب — design skill

Direction: **Arabic Editorial Calculator.** A digital magazine about numbers, not a SaaS landing page.
*The numbers are the design.* Every page is built from typography, hairline rules, editorial numbering and
small measuring-instrument ticks. All tokens live in `src/styles/global.css` — use the tokens, never raw values.

## 1. Typeface
- **Readex Pro only** (self-hosted via `@fontsource/readex-pro`, weights 200 300 400 500 600). No second family.
- Body weight 300. Headings 500. Giant numbers 200. Never bold (700) for body copy.
- Numbers: Western digits `123`, `en-US` grouping (`1,234.56`), `font-variant-numeric: tabular-nums`, `direction: ltr` inside RTL text (`.num` / `.nums`).

## 2. Type scale
| Token | Value | Use |
|---|---|---|
| `--t-giant` | `clamp(3.6rem, 13vw, 8.5rem)` | the one result number per calculator |
| `--t-display` | `clamp(2.6rem, 7.2vw, 5.6rem)` | home page title only |
| `--t-h1` | `clamp(2.1rem, 5vw, 3.6rem)` | page H1 (one per page, = the user's question) |
| `--t-sentence` | `clamp(1.35rem, 2.9vw, 1.85rem)` | the calculator sentence |
| `--t-h2` | `1.35rem` (articles `1.45rem`) | section headings |
| `--t-body` | `1.0625rem` / line-height 1.85 | running text, max `--measure` (66ch) |
| `--t-small` | `.875rem` | secondary text, actions |
| `--t-micro` | `.76rem`, letter-spacing .05em | kickers, labels, ticks |
Never invent an in-between size. Line length for prose ≤ 66ch.

## 3. Spacing — 8px grid
Tokens: `--s-1` 8 · `--s-2` 16 · `--s-3` 24 · `--s-4` 32 · `--s-5` 40 · `--s-6` 48 · `--s-7` 56 · `--s-8` 64 · `--s-10` 80 · `--s-12` 96 (`--s-half` 4px only for hairline nudges).
- Every margin, padding and gap is a multiple of 8. Section rhythm: 56–96px between major blocks; 16–24px inside a block.
- Side gutter: `max(22px, env(safe-area-inset-*))` on `.container` (max 1200px).
- Use `gap` on flex/grid, not per-element margins.

## 4. Colour
| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#f6f8f8` | `#111718` | page |
| `--surface` | `#ffffff` | `#182022` | hover rows, popovers (rarely a "card") |
| `--ink` | `#1d2a2d` | `#e3eae9` | text, strong rules |
| `--muted` / `--soft` | `#5f6d70` / `#5a686b` | `#8d9c9d` / `#9eadae` | secondary text (brand grey `#6d7b7e` darkened to pass AA) |
| `--line` / `--rule` | `#e2e8e8` / `#c9d3d3` | `#243032` / `#34423f` | hairlines |
| `--accent` | `#2b7871` | `#6fc1b6` | the single sea-green: numbers in inputs, editorial numbers, the active state |
| `--accent-bg` | `#e5f0ee` | `#18302d` | focus underlay, normal BMI zone |
| `--warn` | `#9a5b13` | `#e7b26d` | errors and "minus" operations only |
One accent. Use it sparingly — it should mark *what matters on this screen*. Text contrast ≥ 4.5:1 in both themes.

## 5. Component patterns (already built — reuse them)
- **Editorial index** `CalcIndex.astro`: one calculator per line — `01` number · question · one-line blurb · category · `←` that slides 8px on hover. Top rule in `--ink`, hairlines between rows. Never a card grid.
- **Calculator sentence**: inputs live inside the sentence (`NumIn`, `DateIn`, `Pills`), underline only, no boxes. Results update on input, no "calculate" button.
- **Result** `ResultCard.astro`: ruler with ticks → label → giant number + unit → editorial `dl` rows → text-link actions → `details.how` with formula, notes and sources.
- **Exhibit per calculator** (`lib/exhibits.ts`): timeline (end of service), equation (VAT), schedule table (loan), price chain (discount), Y/M/D trio (age), measuring scale (BMI), ledger (zakat). Pick the clearest form; not everything is a chart.
- **Meta column**: `03 / 08`, category, review date — left/start column on wide screens, a single row on phones.
- **Ad zone** `AdSlot.astro`: separated by rules, labelled «إعلان», reserved height, never between inputs and result.
- **Motion** `components/motion/Reveal.tsx` (framer-motion): reveal/stagger for below-the-fold blocks only, `client:idle`. Server renders the final state. 200–450ms, ease `[0.2,0.7,0.2,1]`. Respect `prefers-reduced-motion`. No parallax, no looping animation.

## 6. Banned: the generic AI-website look
Do **not** ship any of these unless the owner explicitly asks for it in writing:
- Centered hero (big title + paragraph + button) over a card grid; purple/blue or teal/blue gradient heroes; gradient text.
- Grids of identical white rounded cards with soft shadows; icon-in-a-rounded-square next to every heading.
- Glassmorphism, blobs, floating 3D shapes, decorative grids/dots behind content, emoji as icons.
- "Why choose us" / "Trusted by" / testimonial blocks, invented stats ("10,000+ users"), fake ratings or reviews.
- Default shadcn/Tailwind-UI look (rounded-lg + shadow-sm + slate text everywhere) without re-styling to these tokens.
- Inter / Poppins / Space Grotesk or a second display font.
- Filler sections added only to make the page longer.
Before finishing, look at the page (Playwright screenshot, desktop 1280 + phone 390, light + dark). If it could be any startup's template, it is not done.

## 7. Using 21st.dev and Skiper UI components
These libraries are allowed as a **starting structure** for a new section, never as the finished look:
1. Copy the component into `src/components/` (React island only if it needs interactivity; otherwise port it to `.astro`).
2. Strip Tailwind/shadcn default styling and restyle with the tokens above (rules not cards, one accent, Readex Pro, 8px grid).
3. Replace placeholder copy with real Arabic content; no invented numbers or testimonials.
4. RTL check: logical properties (`inset-inline-*`, `margin-inline-*`), arrows point `←`, numbers stay LTR.
5. Keep the server-rendered content visible without JS; hydrate with `client:idle`/`client:visible` only when needed.

## 8. Done means
`npm run verify` passes (38 calc tests + build + page checks), `scripts/interaction_test.py` passes, no horizontal scroll at 375/768/1024/1440, Lighthouse mobile ≥ 95 on performance and 100 on accessibility/SEO.
