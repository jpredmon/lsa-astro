# skatelawrence.com Migration — Phase 2: Design Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational design token infrastructure (colors, typography scale, spacing, breakpoints, favicon) that all later section phases will consume.

**Architecture:** Four small global CSS/TS files under `src/styles/` imported once into `BaseLayout.astro`. No component markup, no CSS classes for sections — tag-level defaults only, verified via the existing placeholder page.

**Tech Stack:** Astro static CSS custom properties, self-hosted Poppins woff2 (via Google Fonts CDN), `sharp` + `png-to-ico` for favicon generation.

## Global Constraints

- TypeScript strict mode (`astro/tsconfigs/strictest`), no implicit `any`.
- No new functionality beyond token infrastructure — no section markup in this phase.
- Every value sourced from the live site is transcribed verbatim, not approximated; anywhere a value had to be invented is called out explicitly (see "Flagged gaps").
- Conventional commits, imperative present tense, no `Co-Authored-By: Claude` trailer.

---

## Context

Phase 1 (scaffold + deploy pipeline) is complete and live at `lsa-astro.pages.dev` with a working push-to-deploy pipeline. Per the migration spec's build order (scaffold → **tokens** → header → hero → about → parks → who-we-are → donate → footer), this phase establishes the foundational design values everything downstream depends on.

**All values re-verified independently before finalizing this plan:**

- Re-fetched Google Fonts' CSS2 API for Poppins 300/400/500/600/700 and confirmed the exact `/* latin */`-labeled `@font-face` blocks — the 5 `fonts.gstatic.com` URLs and byte sizes (7840/7884/7748/8000/7816 bytes) are exact.
- `sharp` is already an installed transitive dependency (via `astro`'s image service, v0.35.3, actively maintained); `png-to-ico` (v3.0.2, last published 2026-07-06, not deprecated) checked healthy per the Dependency Vetting rule before adding.
- Scraping the WP site's own regenerated Poppins copies is unreliable (2 of 5 test fetches 403'd even with a realistic browser UA, likely Cloudflare bot-fight-mode) — self-hosting from Google's own CDN avoids that.

**Confidence key:** all colors, type-scale values, and spacing values are **HIGH CONFIDENCE** — read verbatim from the live site's own `:root` CSS custom-property block. Breakpoint pixel values are high confidence too (repeated media-query usage) — the only caveat is a CSS limitation (below), not a data-confidence issue.

## Recommended approach

**Token files** — four small files under `src/styles/`, imported once into `BaseLayout.astro`:

- `tokens.css` — pure `:root { --x: y }` data (colors, spacing, radius, container width, font-weight primitives, full responsive type scale).
- `fonts.css` — `@font-face` declarations, kept separate.
- `base.css` — tag-level defaults only (box-sizing reset, bare `body`/`h1`–`h6` rules) — no classes, no section markup.
- `breakpoints.ts` — documented constants for future JS use. **CSS custom properties cannot be referenced inside an `@media` condition** — breakpoint pixel values must be hardcoded literally in every future `@media` rule, with a comment pointing back to this file.

**Responsive type scale:** desktop values live as the `:root` default; `@media (max-width: 1024px)` and `@media (max-width: 767px)` blocks (in that order) redeclare tablet/phone values, each redeclaring the full size/line-height/letter-spacing triple for direct 1:1 auditability against source.

**Naming convention** — semantic, not WordPress's internal `--vamtam-*` names, with the original WP variable/value noted in a comment:

- `--color-highlight-yellow: #EED338` (WP `accent-1`) vs `--color-button-yellow: #FEC415` (WP `--vamtam-btn-bg-color`) — two distinct yellows, kept separate.
- `--color-ink: #1D1C1C` (near-black, multi-role).
- `--color-white` collapses 3 WP variables that are all literally `#FFFFFF`.
- `--color-teal` / `--color-cream-1/2/3` (WP accent-2/3/4/8) — named by appearance, usage confirmed later via Playwright diff.
- `--radius-none: 0px` / `--radius-pill: 30px` — button padding itself not tokenized (single-component value, applied in the Header/Donate phase).
- `--space-xs/sm/md/lg` = 20/30/50/60px (WP's 3 "large" variants collapse to one `--space-lg`, they're identical in source). `--space-content-fluid` stays separate (responsive expression).

**Favicon generation** — real static files, not runtime resizing. `sharp` (transitive, added explicitly) resizes the downloaded 512×512 master PNG in-memory; `png-to-ico` assembles a real multi-resolution `.ico`. Runs as a reproducible `scripts/generate-favicons.mjs`.

**No CSP change needed** — self-hosting fonts at same-origin `/fonts/*.woff2` is already covered by `_headers`'s existing `default-src 'self'`.

## Flagged gaps (judgment calls, not silent guesses)

1. **Font fallback stack** — not given by source; using `'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
2. **Font preload** — adding `<link rel="preload">` for weight 400 only, standard practice, not in source data.
3. **ICO internal sizes** — 16/32/48px inside the `.ico` (standard browser-tab trio); the 32/192/180 sizes themselves are from the live site's `<head>`.
4. **accent-2/3/4/8 role mapping** — deferred to later phases' Playwright diffs.

## File structure (end state of Phase 2)

```
LSA-astro/
├── package.json                      # + sharp, png-to-ico devDeps, + generate:favicons script
├── scripts/generate-favicons.mjs     # new
├── src/
│   ├── assets/branding/logo-master.png   # new
│   ├── styles/
│   │   ├── tokens.css                # new
│   │   ├── fonts.css                 # new
│   │   ├── base.css                  # new
│   │   └── breakpoints.ts            # new
│   └── layouts/BaseLayout.astro      # modified
├── public/
│   ├── fonts/poppins-{300,400,500,600,700}.woff2   # new
│   ├── favicon.ico                   # replaced
│   ├── favicon-32x32.png             # new
│   ├── icon-192.png                  # new
│   ├── apple-touch-icon.png          # new
│   └── favicon.svg                   # removed
```

---

## Task 1: Document breakpoints

**Files:**

- Create: `src/styles/breakpoints.ts`

- [x] **Step 1: Create the file**

```ts
/**
 * Documented breakpoint values — Elementor's standard 3-tier breakpoints,
 * confirmed by repeated media-query usage across the live site's stylesheet.
 *
 * CSS custom properties CANNOT be referenced inside an `@media` condition
 * (no browser support). These constants exist for JS use only (matchMedia,
 * responsive component logic). Every `@media` rule anywhere in this codebase
 * MUST hardcode the literal pixel value and reference this file in a comment.
 */
export const BREAKPOINTS = {
  /** `@media (max-width: 767px)` */
  phoneMax: 767,
  /** `@media (min-width: 768px)` */
  tabletMin: 768,
  /** `@media (max-width: 1024px)` */
  tabletMax: 1024,
  /** `@media (min-width: 1025px)` */
  desktopMin: 1025,
} as const;
```

- [x] **Step 2: Verify**

Run: `npm run check && npm run lint`
Expected: both pass.

- [x] **Step 3: Commit**

```bash
git add src/styles/breakpoints.ts
git commit -m "docs: document breakpoint constants for future JS use"
```

---

## Task 2: Colors, spacing, radius, container, typography tokens

**Files:**

- Create: `src/styles/tokens.css`

- [x] **Step 1: Create the file**

```css
/*
 * Design tokens for the skatelawrence.com rebuild.
 * Values transcribed verbatim from the live site's WordPress/Elementor
 * global kit `:root` CSS custom-property block. Original `--vamtam-*` names
 * are noted in comments for traceability back to source.
 */

:root {
  /* Colors */
  --color-white: #ffffff; /* WP default-bg / accent-5 / accent-7 (identical) */
  --color-ink: #1d1c1c; /* WP accent-6 — primary text/link, sticky header bg, button hover bg */
  --color-teal: #1cb1d9; /* WP accent-2 */
  --color-cream-1: #f8f9f3; /* WP accent-3 */
  --color-cream-2: #f8f5ef; /* WP accent-4 */
  --color-cream-3: #fcf8f1; /* WP accent-8 */
  --color-highlight-yellow: #eed338; /* WP accent-1 — underline highlight marker color */
  --color-button-yellow: #fec415; /* WP --vamtam-btn-bg-color */

  --color-button-bg: var(--color-button-yellow);
  --color-button-text: var(--color-ink);
  --color-button-bg-hover: var(--color-ink);
  --color-button-text-hover: var(--color-white);

  /* Radius */
  --radius-none: 0px; /* WP global border-radius default */
  --radius-pill: 30px; /* confirmed button override */
  /* Button padding (18px 55px) is intentionally NOT tokenized — a single-
     component value, applied directly in the Header/Donate-button phase. */

  /* Spacing (Elementor's ad hoc set, named by ascending magnitude) */
  --space-xs: 20px; /* WP --vamtam-small-padding */
  --space-sm: 30px; /* WP --vamtam-vertical-padding */
  --space-md: 50px; /* WP --vamtam-horizontal-padding */
  --space-lg: 60px; /* WP --vamtam-horizontal-padding-large /
                        --vamtam-vertical-padding-large /
                        --vamtam-box-outer-padding (identical, collapsed) */
  --space-content-fluid: min(6vh, 35px); /* WP --vamtam-content-space-l (desktop) */

  /* Layout */
  --container-max-width: 1260px;

  /* Font family & weight primitives */
  --font-family-base: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Type scale — desktop (default) */
  --font-size-body: 16px;
  --line-height-body: 1.875em;
  --letter-spacing-body: normal;
  --font-weight-body: var(--font-weight-regular);

  --font-size-h1: 70px;
  --line-height-h1: 1.29em;
  --letter-spacing-h1: normal;
  --font-weight-h1: var(--font-weight-bold);

  --font-size-h2: 50px;
  --line-height-h2: 1.2em;
  --letter-spacing-h2: normal;
  --font-weight-h2: var(--font-weight-bold);

  --font-size-h3: 24px;
  --line-height-h3: 1.33em;
  --letter-spacing-h3: normal;
  --font-weight-h3: var(--font-weight-bold);

  --font-size-h4: 20px;
  --line-height-h4: 1.5em;
  --letter-spacing-h4: normal;
  --font-weight-h4: var(--font-weight-medium);
  --text-transform-h4: uppercase;

  --font-size-h5: 18px;
  --line-height-h5: 1.44em;
  --letter-spacing-h5: normal;
  --font-weight-h5: var(--font-weight-semibold);

  --font-size-h6: 16px;
  --line-height-h6: 1.5em;
  --letter-spacing-h6: normal;
  --font-weight-h6: var(--font-weight-bold);
}

@media (max-width: 1024px) {
  :root {
    --space-content-fluid: 25px; /* WP --vamtam-content-space-l (tablet/phone) */

    --font-size-body: 16px;
    --line-height-body: 1.7em;
    --letter-spacing-body: 0.2px;

    --font-size-h1: 50px;
    --line-height-h1: 1.4em;
    --letter-spacing-h1: 0.2px;

    --font-size-h2: 30px;
    --line-height-h2: 1.5em;
    --letter-spacing-h2: 0.2px;

    --font-size-h3: 22px;
    --line-height-h3: 1.5em;
    --letter-spacing-h3: 0.2px;

    --font-size-h4: 20px;
    --line-height-h4: 1.4em;
    --letter-spacing-h4: 0.2px;

    --font-size-h5: 16px;
    --line-height-h5: 1.5em;
    --letter-spacing-h5: 0.2px;

    --font-size-h6: 12px;
    --line-height-h6: 1.5em;
    --letter-spacing-h6: 0.3px;
  }
}

@media (max-width: 767px) {
  :root {
    --font-size-body: 15px;
    --line-height-body: 1.7em;
    --letter-spacing-body: 0.2px;

    --font-size-h1: 35px;
    --line-height-h1: 1.4em;
    --letter-spacing-h1: 0.1px;

    --font-size-h2: 26px;
    --line-height-h2: 1.5em;
    --letter-spacing-h2: 0.2px;

    --font-size-h3: 22px;
    --line-height-h3: 1.5em;
    --letter-spacing-h3: 0.2px;

    --font-size-h4: 18px;
    --line-height-h4: 1.6em;
    --letter-spacing-h4: 0.3px;

    --font-size-h5: 15px;
    --line-height-h5: 1.6em;
    --letter-spacing-h5: 0.3px;

    --font-size-h6: 12px;
    --line-height-h6: 1.25em;
    --letter-spacing-h6: 1px;
  }
}
```

- [x] **Step 2: Verify**

Run: `npm run build && npm run lint && npm run format`
Expected: all pass. Manually diff every value against this doc's table — highest-stakes accuracy check in the phase.

- [x] **Step 3: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat: add design tokens (colors, spacing, radius, container, typography)"
```

---

## Task 3: Download self-hosted Poppins font files

**Files:**

- Create: `public/fonts/poppins-300.woff2`, `poppins-400.woff2`, `poppins-500.woff2`, `poppins-600.woff2`, `poppins-700.woff2`

- [x] **Step 1: Download**

```bash
mkdir -p public/fonts
curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -o public/fonts/poppins-300.woff2 "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLDz8Z1xlFQ.woff2"
curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -o public/fonts/poppins-400.woff2 "https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfecg.woff2"
curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -o public/fonts/poppins-500.woff2 "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2"
curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -o public/fonts/poppins-600.woff2 "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2"
curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -o public/fonts/poppins-700.woff2 "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2"
```

- [x] **Step 2: Verify**

All 5 files exist, exact sizes 7840/7884/7748/8000/7816 bytes respectively. First 4 bytes of each = `wOF2` magic (hex `774f4632`).

- [x] **Step 3: Commit**

```bash
git add public/fonts
git commit -m "feat: self-host Poppins font files (weights 300/400/500/600/700, latin subset)"
```

---

## Task 4: `@font-face` declarations

**Files:**

- Create: `src/styles/fonts.css`

- [x] **Step 1: Create the file**

```css
/*
 * Self-hosted Poppins — weights actually used by the live site (confirmed by
 * cross-referencing every font-weight declaration against font-family:
 * Poppins in the rendered CSS). Normal style only — no italic is used
 * anywhere. Latin subset only (unicode-range below is Google's own "latin"
 * subset definition for Poppins v24). Downloaded from Google Fonts' CDN
 * rather than scraped from the WP site's own regenerated copies, which
 * intermittently 403'd during research even with a good User-Agent.
 */

@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url('/fonts/poppins-300.woff2') format('woff2');
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
    U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/poppins-400.woff2') format('woff2');
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
    U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/poppins-500.woff2') format('woff2');
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
    U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/poppins-600.woff2') format('woff2');
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
    U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/poppins-700.woff2') format('woff2');
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
    U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

- [x] **Step 2: Verify**

Run: `npm run lint && npm run format`
Expected: both pass.

- [x] **Step 3: Commit**

```bash
git add src/styles/fonts.css
git commit -m "feat: add @font-face declarations for self-hosted Poppins"
```

---

## Task 5: Global base styles (tag-level only)

**Files:**

- Create: `src/styles/base.css`

- [x] **Step 1: Create the file**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-body);
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
  letter-spacing: var(--letter-spacing-body);
  color: var(--color-ink);
  background-color: var(--color-white);
}

h1,
h2,
h3,
h4,
h5,
h6 {
  margin: 0;
  font-family: var(--font-family-base);
}

h1 {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-h1);
  line-height: var(--line-height-h1);
  letter-spacing: var(--letter-spacing-h1);
}

h2 {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-h2);
  line-height: var(--line-height-h2);
  letter-spacing: var(--letter-spacing-h2);
}

h3 {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-h3);
  line-height: var(--line-height-h3);
  letter-spacing: var(--letter-spacing-h3);
}

h4 {
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-h4);
  line-height: var(--line-height-h4);
  letter-spacing: var(--letter-spacing-h4);
  text-transform: var(--text-transform-h4);
}

h5 {
  font-size: var(--font-size-h5);
  font-weight: var(--font-weight-h5);
  line-height: var(--line-height-h5);
  letter-spacing: var(--letter-spacing-h5);
}

h6 {
  font-size: var(--font-size-h6);
  font-weight: var(--font-weight-h6);
  line-height: var(--line-height-h6);
  letter-spacing: var(--letter-spacing-h6);
}

a {
  color: var(--color-ink);
}
```

- [x] **Step 2: Verify**

Run: `npm run build && npm run lint && npm run format`
Expected: all pass.

- [x] **Step 3: Commit**

```bash
git add src/styles/base.css
git commit -m "feat: add global body/heading base styles consuming design tokens"
```

---

## Task 6: Wire tokens/fonts/base into BaseLayout, verify visually

**Files:**

- Modify: `src/layouts/BaseLayout.astro`

- [x] **Step 1: Edit the file**

```astro
---
import '../styles/fonts.css';
import '../styles/tokens.css';
import '../styles/base.css';

interface Props {
  title: string;
}
const { title } = Astro.props;
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preload" href="/fonts/poppins-400.woff2" as="font" type="font/woff2" crossorigin />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

(Favicon `<link>` tags added in Task 9, once those files exist.)

- [x] **Step 2: Verify**

Start dev server in background, load `localhost:4321`. Confirm in devtools: `h1` computed `font-family` is Poppins, `font-weight: 700`, `font-size: 70px` at desktop width, shrinking to 50px/35px at ≤1024px/≤767px. Confirm `font-weight: 400` on the `<p>`. Stop the dev server. Then `npm run build && npm run check && npm run lint && npm run format`.

- [x] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: wire design tokens, fonts, and base styles into BaseLayout"
```

---

## Task 7: Add favicon-generation dependencies, fetch master logo

**Files:**

- Modify: `package.json`, `package-lock.json`
- Create: `src/assets/branding/logo-master.png`

- [x] **Step 1: Install and fetch**

```bash
npm install -D sharp png-to-ico
mkdir -p src/assets/branding
curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -o src/assets/branding/logo-master.png "https://skatelawrence.com/wp-content/uploads/2020/04/logo-512x512-1.png"
```

- [x] **Step 2: Verify**

Run: `node -e "require('sharp')('src/assets/branding/logo-master.png').metadata().then(m => console.log(m.width, m.height, m.format))"`
Expected: prints `512 512 png`. `npm run lint` passes.

- [x] **Step 3: Commit**

```bash
git add package.json package-lock.json src/assets/branding/logo-master.png
git commit -m "chore: add favicon-generation deps, fetch master logo asset"
```

---

## Task 8: Write and run the favicon generator script

**Files:**

- Create: `scripts/generate-favicons.mjs`
- Modify: `package.json` (add script)
- Create: `public/favicon.ico` (replace), `public/favicon-32x32.png`, `public/icon-192.png`, `public/apple-touch-icon.png`
- Delete: `public/favicon.svg`

- [x] **Step 1: Create the generator script**

```js
// One-off (but re-runnable) favicon generator. Regenerates all static favicon
// files from src/assets/branding/logo-master.png. Re-run via
// `npm run generate:favicons` if the master logo is ever replaced.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const SRC = fileURLToPath(new URL('../src/assets/branding/logo-master.png', import.meta.url));
const OUT = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

async function main() {
  const [png16, png32, png48, png192, appleTouch180] = await Promise.all([
    sharp(SRC).resize(16, 16).png().toBuffer(),
    sharp(SRC).resize(32, 32).png().toBuffer(),
    sharp(SRC).resize(48, 48).png().toBuffer(),
    sharp(SRC).resize(192, 192).png().toBuffer(),
    sharp(SRC).resize(180, 180).png().toBuffer(),
  ]);

  const ico = await pngToIco([png16, png32, png48]);

  await Promise.all([
    writeFile(OUT('favicon.ico'), ico),
    writeFile(OUT('favicon-32x32.png'), png32),
    writeFile(OUT('icon-192.png'), png192),
    writeFile(OUT('apple-touch-icon.png'), appleTouch180),
  ]);

  console.log(
    'Favicons generated: favicon.ico, favicon-32x32.png, icon-192.png, apple-touch-icon.png'
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
```

- [x] **Step 2: Add npm script**

Add to `package.json` `scripts`: `"generate:favicons": "node scripts/generate-favicons.mjs"`

- [x] **Step 3: Run it and remove the starter placeholder**

```bash
npm run generate:favicons
rm public/favicon.svg
```

- [x] **Step 4: Verify**

- 4 files exist in `public/`: `favicon.ico`, `favicon-32x32.png`, `icon-192.png`, `apple-touch-icon.png`; `favicon.svg` no longer exists.
- `favicon.ico` first 4 bytes = `00 00 01 00` (valid ICO magic header).
- `apple-touch-icon.png` metadata = 180×180; `icon-192.png` = 192×192; `favicon-32x32.png` = 32×32.
- Visually open `apple-touch-icon.png` — confirm it's recognizably the LSA logo.
- `npm run lint && npm run format` pass.

- [x] **Step 5: Commit**

```bash
git add scripts/generate-favicons.mjs package.json public/favicon.ico public/favicon-32x32.png public/icon-192.png public/apple-touch-icon.png
git rm public/favicon.svg
git commit -m "feat: generate real static favicons from master logo, drop starter placeholder"
```

---

## Task 9: Wire favicon links into BaseLayout

**Files:**

- Modify: `src/layouts/BaseLayout.astro`

- [x] **Step 1: Add favicon links**

Add inside `<head>`, after the font preload:

```astro
<link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
<link rel="icon" type="image/png" href="/icon-192.png" sizes="192x192" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
```

- [x] **Step 2: Verify**

Run: `npm run build`, preview locally — browser tab shows the LSA logo favicon. `npm run check && npm run lint && npm run format` pass.

- [x] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: link favicon and apple-touch-icon in BaseLayout head"
```

---

## Task 10: Full verification and deploy

**Files:** none

- [x] **Step 1: Full pipeline check**

```bash
npm run format && npm run lint && npm run check && npm run build
```

Expected: all exit 0. `dist/` contains bundled CSS, `dist/fonts/poppins-*.woff2`, `dist/favicon.ico`, `dist/favicon-32x32.png`, `dist/icon-192.png`, `dist/apple-touch-icon.png`.

- [x] **Step 2: Confirm no CSP change needed**

`cat public/_headers` — confirm unchanged from Phase 1.

- [x] **Step 3: Push and verify live deploy**

Push to `main` (triggers the Phase-1-verified auto-deploy pipeline). Load the live preview, confirm Poppins renders (not a fallback sans-serif) and the favicon shows in the tab.

- [x] **Step 4: Mark this plan complete**

```bash
git add docs/superpowers/plans/2026-07-26-design-tokens.md
git commit -m "docs: mark phase 2 design tokens complete"
git push
```

---

## Out of scope for this phase

- No `Header`/`Nav`/`Hero`/etc. component files or markup, no CSS classes for sections.
- Button padding/pill-radius _application_ deferred to the Header/Donate-button phase — only the `--radius-pill` token itself is created now.
- accent-2/3/4/8 → section usage mapping deferred to later phases' Playwright diffs.

## Verification summary

1. `npm run build`, `check`, `lint`, `format` all pass after every task.
2. Devtools computed styles on the existing placeholder `<h1>`/`<p>` confirm Poppins at the right weights/sizes across all 3 breakpoints.
3. Favicon files are real (ICO magic bytes, correct pixel dimensions per `sharp` metadata), not placeholders.
4. Deployed preview shows the LSA favicon and correct font rendering, no console errors for missing assets.
