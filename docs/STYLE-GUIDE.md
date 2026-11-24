# Structural Integrity Engineering: Design System (style guide)

> The `human-touch-design` skill, the `scan-src` hook and the code comments read this file by section number, so keep
> the headings and numbers. Version: option G ("Dusk"), 1.0, 2026-11-23. The approved reference is
> `incoming/sie-site-assets/option-g-dusk-reference.html` (git-ignored); where this file and the reference disagree on
> the home page, the reference wins. Copy comes only from `incoming/sie-site-assets/copy-deck.md`.

## 1. Direction
A structural engineer's site at dusk: a deep teal page the color of the home photo's evening sky, snow-white type,
and one warm amber, the color of lit windows, for actions and engineering line work. Calm, exact, generous. Real
photography carries the warmth; the interface stays quiet. It is not a SaaS page: no cards with shadows, no gradients
as decoration, no glows, no all-caps labels.

## 2. Color
Values live in `site.config.ts` (`theme.colors`); `npm run sync:config` writes them into `src/app/hl.css` as `--hl-*`,
and Tailwind's own palette is switched off, so only these utilities exist.

| Token | Hex | Use |
| --- | --- | --- |
| `dusk` | `#1C4A50` | Page background, header, contact band (sky teal) |
| `dusk-deep` | `#163A40` | Alternate sections, footer, menu panels, form panel (deep teal) |
| `night` | `#13262B` | Text on amber, form fields, image wells |
| `snow` | `#EEF4F4` | Main text and headings |
| `mist` | `#C2D6D8` | Secondary text, input borders, secondary button outline |
| `amber` | `#F2B266` | Primary buttons, focus ring, current-page underline, line drawings, figures |
| `amber-lit` | amber 72% + snow | Primary button hover (derived in CSS, no new hex) |
| `rule` | `#3D6A70` | Hairlines and dividers only (decorative, 1.7:1: never text or a control boundary) |
| `error` | `#FFB3A6` | Form error text and borders (not in the reference; added for the form) |

AA pairs checked: snow on dusk 9.2:1, on dusk-deep 11.0:1; mist on dusk 6.8:1, on dusk-deep 8.1:1; amber on dusk
5.5:1, on dusk-deep 6.6:1; night on amber 8.5:1; error on dusk 6.0:1. The placeholder chip (`.ph`) sits outside the
palette on purpose: #3A3200 on #FFF3B0 is 11.4:1. The automatic-reply email is light, so it uses night, rule, dusk,
dusk-deep and mist (`src/content/auto-reply.ts`).

## 3. Typography
One typeface: Manrope (variable, 200 to 800), loaded through `next/font/google` in `src/lib/fonts.ts` (generated from
`theme.fonts`). Weights: 500 for h1 and h2, 600 for h3 and h4, 700 for buttons and the wordmark, 300 for big figures.

| Utility | Size | Line height | Tracking | Use |
| --- | --- | --- | --- | --- |
| `text-hero` | clamp(42px, 5.4vw, 78px) | 1.02 | -0.035em | Home H1 |
| `text-title` | clamp(40px, 4.6vw, 66px) | 1.04 | -0.035em | Other pages' H1 |
| `text-band` | clamp(34px, 4.4vw, 64px) | 1.04 | -0.035em | Contact band headline |
| `text-h2` | clamp(32px, 3.6vw, 52px) | 1.08 | -0.03em | Section headings |
| `text-h3` | 26px (24px on phones) | 1.2 | -0.02em | Card titles |
| `text-h4` | 21px (20px on phones) | 1.3 | -0.01em | Item titles |
| `text-figure` | clamp(64px, 7vw, 104px) | 1 | -0.04em | Count-up numbers (weight 300, amber) |
| `text-body` | 18px | 1.6 | | Body (the default) |
| `text-small` | 16px | 1.55 | | Card and item text, submenu |
| `text-fine` | 14px | 1.5 | | Copyright line, form notes |
| `text-nav`, `text-btn`, `text-wordmark` | 16, 17, 17px | | | Menu, buttons, wordmark |

Sentence case everywhere. Measure: keep paragraphs under about 34em (`max-w-[34em]` and similar).

## 4. Space, shape, depth, grid
- Column: `Container`, max 1320px, 48px side padding (22px on phones).
- Sections: `Section` (`tone="dusk" | "deep"`, `spacing="default" | "compact"`): 104px top and bottom (80px on phones),
  or 88px (64px). Pages alternate dusk and deep; the contact band is always dusk, so the section before it is deep.
- Radius by role: `rounded-pill` actions and chips, `rounded-field` (6px) inputs, `rounded-panel` (10px) menu and form
  panels. Photography is square.
- Depth: none. No shadows; layers separate by tone (dusk, dusk-deep, night) and 1px `rule` lines.

## 5. Layout: the Home first screen
Per the reference: header on the sky; centered H1 (`text-hero`), the line under it in mist (max 34em), one amber
Request a quote button; the dusk photo below at its own 2000 x 2499 aspect ratio with the amber line drawing over it
(SVG viewBox 0 0 2000 2499), fading into dusk at the top and dusk-deep at the bottom. Phone (under 900px): the copy
sits above the photo, which is cropped to a 380px stage. Built in task 5 (`HomeHero`, `HeroDrawing`, `.hl-hero*` in
`hl.css`). From 900px the hero slides up under the sticky header by `--hl-header-h`, so the photo sits exactly where the
reference's transparent header row put it, and the sky's dusk fade starts at the header's bottom edge (no seam). The
page then runs: Built for every condition (deep), What we design (dusk), the numbers and Why builders call us back in
one deep band, and the dusk contact band.

## 6. Signature elements
- The text wordmark (Manrope 700, 17px) until a logo file exists.
- Amber line work: the hero overlay and the four design-condition glyphs (2px amber strokes, round caps).
- "Build smarter. Build faster." closes every page in the footer.

## 7. Components
### 7.1 Header and menu (`Header`, `HeaderNav`)
Sticky, solid dusk. Wordmark left. From 1024px: Services (with a chevron), About, Contact and a compact Request a
quote button. The Services submenu (`.hl-sub`) is a dusk-deep panel that opens on hover and while keyboard focus is in
it (no JavaScript needed); Escape closes it. The current page and its section get a 2px amber underline. Below
1024px: a Menu button (two bars that become a cross) opens a full-width panel: Services with its three pages indented
behind a rule line, About, Contact, then a full-width Request a quote button. Escape closes it and returns focus.

### 7.10 Buttons and links (`Button`, `buttonClass`, `TextLink`)
- Primary: amber pill, night label, 700, 54px tall (44px `size="compact"`), hover `amber-lit`.
- Secondary: transparent pill, 1.5px mist outline, snow label; outline and label turn amber on hover.
- Standalone link: snow 600 (or `muted`: mist 500), 44px target, amber on hover with the slow amber underline (`.hl-u`).
- Inline link: underlined in mist at 60%, amber on hover.
- No arrows after link text.

### 7.20 Contact band (`ContactBand`)
Ends every page. Centered on dusk: "Ready to get started?" (`text-band`), the line in mist, then Request a quote,
the phone number and the email. Optional photo (`contactBand.photo` in `src/content/shared.ts`) behind an 88% dusk wash.

### 7.26 Footer (`Footer`)
Dusk-deep. Wordmark with "Build smarter. Build faster." (`text-h3`), the menu links (service pages indented, mist),
email and phone; under a rule line, the copyright with the legal name and the Privacy link.

### 7.27 Placeholder chip
`[[...]]` renders as a yellow chip (`.ph`); a development marker, never shipped.

### 7.29 FAQ (`Faq`)
Native details/summary; mist ring that gains an amber dot when open.

## 8. Line art and icons
2px strokes, round caps and joins, amber on dusk; 64 x 40 glyphs for the design conditions. Decorative SVG is
`aria-hidden`. Small UI icons (chevron, menu bars) use `currentColor`.

## 9. Motion
Tokens: `--ease-site`, `--duration-feedback` (150ms), `--duration-panel` (200ms) in `globals.css`.
- The home hero's line drawing is the one focal animation (`HeroDrawing`, `.hl-draw`, `.hl-draw-fade`, `.hl-draw-push`):
  the roof, floor and columns draw in from 0.4s, the dimension lines fade in at 2s, the wind arrows push in at 2.4s and
  the labels appear at 2.7s. Each keyframe starts hidden with `backwards` fill, so the finished drawing is the resting
  state.
- The home numbers count up from 0 when they scroll into view (`CountUp`, `IntersectionObserver`, 1.4s ease-out),
  held at their final width so the unit beside them stays still. The real value is in the HTML; without JavaScript,
  under reduced motion or when already on screen at load, the final value shows.
- `.reveal`: rise 44px and fade in as an element enters the viewport (CSS scroll timeline, no JavaScript), for section
  headings and photo cards as in the reference. `.reveal-zoom`: a photo eases from 110% to 100% across the viewport.
- Menus: the submenu fades and drops 4px; the mobile panel opens by grid rows.
- 9.1: in-page anchors use native smooth scroll.
- 9.2: under `prefers-reduced-motion: reduce` nothing animates or transitions; every element shows its end state.

## 10. Responsive
Breakpoints: 768px (`md`, type and spacing step up), 900px (the home hero switches layout, as in the reference),
1024px (`lg`, the full menu replaces the Menu button). Check every page at 390 x 844 and 1440 x 900.

## 11. Accessibility (WCAG 2.2 AA; the `a11y` check)
AA contrast per §2; 3px amber focus ring 3px out on every focusable element (`globals.css`); 44px targets; one H1;
labelled `nav` landmarks (Main, Mobile, Footer); the submenu stays in the tab order; current page marked with
`aria-current` and an underline, not color alone; reduced motion per §9.2.

## 12. Performance budget (the `lighthouse` check: 90 or higher on mobile, all four categories)
One self-hosted variable font; client JavaScript only in `HeaderNav`, `ContactForm` and `CountUp`; photos
pre-sized (task 4) and lazy below the fold.

## 13. Banned
Shadows, glows, gradient washes as decoration, all-caps labels, mono type, a second typeface, arrows after link text,
middle-dot meta strings, numbered markers on anything that is not a sequence (the six "How we work" steps are the one
real sequence), carousels, parallax, scroll hijacking.

## 14. Acceptance check
`npm run check`, `test:a11y` and `test:lighthouse` pass; screenshots at 390 and 1440 match the reference's palette,
type and spacing; no hex values in components (`git grep -nE "#[0-9a-fA-F]{6}" src/components src/app/\(site\)`).
