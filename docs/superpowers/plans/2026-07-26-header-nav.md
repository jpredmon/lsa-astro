# skatelawrence.com Migration — Phase 3: Header/Nav Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the site header (logo, nav, donate button) fresh from the live site, matching desktop and mobile/tablet behavior exactly including the mobile/tablet header's lack of a working nav menu.

**Architecture:** `Header.astro` composing `Logo`/`Nav`/`DonateButton` sub-components, two sibling bars (desktop/mobile) toggled via `display: none` at documented breakpoints.

**Tech Stack:** Astro components, CSS custom properties from `tokens.css`, `astro:assets` `<Image>` for the logo.

## Global Constraints

- TypeScript strict mode, no implicit `any`.
- No new functionality: mobile/tablet header replicates the live site's actual (nav-less) behavior exactly.
- `lsa-site-react-legacy` is not a markup source for this phase.
- Conventional commits, imperative present tense, no `Co-Authored-By: Claude` trailer.

---

## Context

Phases 1 (scaffold+deploy) and 2 (design tokens) are complete and live at `lsa-astro.pages.dev`. This phase builds the header: logo, nav, and donate button — built fresh from the live site.

**Research method:** fetched live HTML/CSS via `curl` with a realistic browser UA, plus live Chrome browser automation against `https://skatelawrence.com` (computed styles, hover states, DOM queries).

**Verification caveat that shaped this plan and will matter for every future phase:** `resize_window` does not actually change `window.innerWidth` in this environment — the browser window stays at its real ~1536px width regardless of the size requested. Any "live" computed-style check depending on a tablet/phone-specific `@media` block being active cannot be trusted from browser automation here. Properties that aren't breakpoint-gated (colors, border widths, transition timing, transforms) remain reliable from live checks regardless of viewport. **Two corrections were caught this way** during planning (see below) — future phases should default to trusting static source CSS over "live" viewport-dependent checks unless a real device/DevTools resize is used.

## Key discovery: mobile/tablet has no nav menu at all

Confirmed via live DOM inspection: both instances of the nav-menu widget and the hamburger toggle element exist only inside a section classed `elementor-hidden-tablet elementor-hidden-phone` (desktop-only, ≥1025px). The mobile/tablet-only sticky bar (`elementor-hidden-desktop`, shown ≤1024px) contains only a logo and a donate button — zero nav-related elements. The hamburger toggle markup exists in the DOM but is never reachable at any real viewport width.

**Decision (confirmed with user): replicate this exactly.** Mobile/tablet header = logo + donate button only, no nav menu, no hamburger.

## Recommended approach

**Component structure:**

```
src/components/
  Header.astro              # sticky wrapper, composes both bars
  header/
    Logo.astro               # variant: 'desktop' | 'mobile'
    Nav.astro                 # desktop-only, no variant needed
    DonateButton.astro        # variant: 'desktop' | 'mobile'
```

One `<header>` landmark wrapping two sibling bars (`.site-header__bar--desktop` / `--mobile`), toggled via `display: none` at documented breakpoints (`1024px`/`767px` literals, per `src/styles/breakpoints.ts`'s convention). `Logo`/`DonateButton` each take one `variant` prop. `Nav` has no variant since it only exists on desktop.

**New token:** `--color-nav-active: #191919` added to `tokens.css`, next to `--color-ink` (`#1D1C1C`) — confirmed via live `getComputedStyle` that nav hover/active uses a distinct near-black.

## Real data (all HIGH CONFIDENCE — directly observed)

**Desktop header** (visible only ≥1025px), 3-column grid, background `--color-cream-2` (`#F8F5EF`), edge-to-edge (no max-width container), `position: sticky; top: 0; z-index: 100`, no box-shadow, no scroll-triggered background change:

- Logo column (17%): logo image, 160×160px. ~10px vertical padding.
- Nav column (57.33%, use `1fr`): Home (→ `/`), About Us (→ `#about-us-id`), Our Parks (→ `#parks-id`), Contact (→ `#contact-id` — anchor actually points at the Support/Donate section, a live-site naming quirk, replicated exactly). Poppins 600, 16px, `48px` gap between items. Hover/active: `::after` pseudo, 1px height, full width, `background-color: var(--color-nav-active)`, opacity 0→1, `transition: 0.3s cubic-bezier(0.58, 0.3, 0.005, 1)` (verified independently — opacity crossfade, `transform: none`).
- Donate column (25%, centered): transparent bg, `border: 2.4px solid var(--color-ink)`, `border-radius: var(--radius-pill)`, `padding: 18px 55px`, `font-weight: 700`. Hover: background fills to ink, text white, `transition: all 0.3s ease`.

**Mobile/tablet header** (visible ≤1024px), 2-column grid, same background/sticky:

- Logo column: 30% width tablet, 45% phone. Image width 100% at tablet, 80% at phone (confirmed from static source CSS — three declarations found; an initial live-automation check falsely suggested a flat 100%, superseded by static CSS per the caveat above).
- Donate column: 70% width tablet, 55% phone. **Right-aligned** — confirmed directly via the live source HTML's own class list (`elementor-align-right elementor-tablet-align-right`, `.elementor-align-right { text-align: right }`). Filled `--color-highlight-yellow` bg, `border: 1px solid var(--color-ink)`, `padding: 12px 35px`, Poppins 700 at h6 scale — a deliberately different visual style from the desktop button.

## File structure

| Action | File                                       |
| ------ | ------------------------------------------ |
| Modify | `src/styles/tokens.css`                    |
| Create | `src/components/header/Logo.astro`         |
| Create | `src/components/header/DonateButton.astro` |
| Create | `src/components/header/Nav.astro`          |
| Create | `src/components/Header.astro`              |
| Modify | `src/layouts/BaseLayout.astro`             |

No changes to `public/_headers`, `astro.config.mjs`, or `breakpoints.ts`.

---

## Task 1: Add `--color-nav-active` token

**Files:**

- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Add the token**

Add directly below the existing `--color-ink` line:

```css
--color-nav-active: #191919; /* distinct near-black, confirmed via live getComputedStyle on nav hover/active — NOT the same value as --color-ink (#1D1C1C) */
```

- [ ] **Step 2: Verify**

Run: `npm run check && npm run lint`

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat: add nav active/hover color token"
```

---

## Task 2: Create `Logo.astro`

**Files:**

- Create: `src/components/header/Logo.astro`

- [ ] **Step 1: Create the file**

```astro
---
import { Image } from 'astro:assets';

import logoMaster from '../../assets/branding/logo-master.png';

interface Props {
  variant: 'desktop' | 'mobile';
}

const { variant } = Astro.props;
---

<a
  href="/"
  class={`logo-link logo-link--${variant}`}
  aria-label="Lawrence Skaters Association home"
>
  <Image
    src={logoMaster}
    alt="Lawrence Skaters Association logo"
    width={320}
    height={320}
    format="webp"
    loading="eager"
    class="logo-image"
  />
</a>

<style>
  .logo-link {
    display: block;
    line-height: 0;
  }

  .logo-image {
    display: block;
    height: auto;
  }

  /* Desktop: fixed 160px cap — measured live via getBoundingClientRect (160x160). */
  .logo-link--desktop .logo-image {
    width: 160px;
  }

  /* Mobile/tablet: fills its grid column. Confirmed from static source CSS:
     100% width at tablet (768-1024px), overridden to 80% at phone (<=767px). */
  .logo-link--mobile .logo-image {
    width: 100%;
  }

  @media (max-width: 767px) {
    .logo-link--mobile .logo-image {
      width: 80%;
    }
  }
</style>
```

- [ ] **Step 2: Verify**

Run: `npm run check && npm run lint`

- [ ] **Step 3: Commit**

```bash
git add src/components/header/Logo.astro
git commit -m "feat: add Header logo component"
```

---

## Task 3: Create `DonateButton.astro`

**Files:**

- Create: `src/components/header/DonateButton.astro`

- [ ] **Step 1: Create the file**

```astro
---
interface Props {
  variant: 'desktop' | 'mobile';
}

const { variant } = Astro.props;

const DONATE_URL = 'https://www.paypal.com/donate/?hosted_button_id=A9V2ZVQJDLTSQ&source=qr';
---

<a href={DONATE_URL} class={`donate-button donate-button--${variant}`}>Donate</a>

<style>
  .donate-button {
    display: inline-block;
    border-radius: var(--radius-pill);
    font-family: var(--font-family-base);
    font-weight: var(--font-weight-bold);
    text-align: center;
    text-decoration: none;
    white-space: nowrap;
  }

  .donate-button--desktop {
    padding: 18px 55px;
    background-color: transparent;
    border: 2.4px solid var(--color-ink);
    color: var(--color-ink);
    transition: all 0.3s ease;
  }

  .donate-button--desktop:hover,
  .donate-button--desktop:focus-visible {
    background-color: var(--color-ink);
    color: var(--color-white);
  }

  .donate-button--mobile {
    padding: 12px 35px;
    background-color: var(--color-highlight-yellow);
    border: 1px solid var(--color-ink);
    color: var(--color-ink);
    font-size: var(--font-size-h6);
  }
</style>
```

**Open item (flagged, not resolved):** no `target`/`rel` specified anywhere in source or live data — defaulting to same-tab.

- [ ] **Step 2: Verify**

Run: `npm run check && npm run lint`

- [ ] **Step 3: Commit**

```bash
git add src/components/header/DonateButton.astro
git commit -m "feat: add Header donate button component"
```

---

## Task 4: Create `Nav.astro`

**Files:**

- Create: `src/components/header/Nav.astro`

- [ ] **Step 1: Create the file**

```astro
---
interface NavLink {
  href: string;
  label: string;
  current?: boolean;
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Home', current: true },
  { href: '#about-us-id', label: 'About Us' },
  { href: '#parks-id', label: 'Our Parks' },
  { href: '#contact-id', label: 'Contact' },
];
---

<nav class="site-nav" aria-label="Primary">
  <ul class="site-nav__list">
    {
      navLinks.map((link) => (
        <li class="site-nav__item">
          <a
            href={link.href}
            class="site-nav__link"
            aria-current={link.current ? 'page' : undefined}
          >
            {link.label}
          </a>
        </li>
      ))
    }
  </ul>
</nav>

<style>
  .site-nav__list {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 48px; /* measured live via getBoundingClientRect between nav items */
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .site-nav__link {
    position: relative;
    display: inline-block;
    padding: 1px 0;
    font-family: var(--font-family-base);
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-ink);
    text-decoration: none;
  }

  .site-nav__link::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 1px;
    background-color: var(--color-nav-active);
    opacity: 0;
    transition: opacity 0.3s cubic-bezier(0.58, 0.3, 0.005, 1);
  }

  .site-nav__link:hover,
  .site-nav__link:focus-visible,
  .site-nav__link[aria-current='page'] {
    color: var(--color-nav-active);
  }

  .site-nav__link:hover::after,
  .site-nav__link:focus-visible::after,
  .site-nav__link[aria-current='page']::after {
    opacity: 1;
  }
</style>
```

- [ ] **Step 2: Verify**

Run: `npm run check && npm run lint`

- [ ] **Step 3: Commit**

```bash
git add src/components/header/Nav.astro
git commit -m "feat: add Header nav component"
```

---

## Task 5: Create `Header.astro`

**Files:**

- Create: `src/components/Header.astro`

- [ ] **Step 1: Create the file**

```astro
---
import DonateButton from './header/DonateButton.astro';
import Logo from './header/Logo.astro';
import Nav from './header/Nav.astro';
---

<header class="site-header">
  <div class="site-header__bar site-header__bar--desktop">
    <div class="site-header__logo">
      <Logo variant="desktop" />
    </div>
    <Nav />
    <div class="site-header__donate site-header__donate--desktop">
      <DonateButton variant="desktop" />
    </div>
  </div>

  <div class="site-header__bar site-header__bar--mobile">
    <div class="site-header__logo">
      <Logo variant="mobile" />
    </div>
    <div class="site-header__donate site-header__donate--mobile">
      <DonateButton variant="mobile" />
    </div>
  </div>
</header>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 100;
    width: 100%;
    background-color: var(--color-cream-2);
  }

  .site-header__bar--desktop {
    display: grid;
    grid-template-columns: 17% 1fr 25%;
    align-items: center;
    padding: 10px var(--space-sm);
  }

  .site-header__donate--desktop {
    display: flex;
    justify-content: center;
  }

  .site-header__bar--mobile {
    display: none;
  }

  /* Elementor 3-tier breakpoints — see src/styles/breakpoints.ts */
  @media (max-width: 1024px) {
    .site-header__bar--desktop {
      display: none;
    }

    .site-header__bar--mobile {
      display: grid;
      grid-template-columns: 30% 70%;
      align-items: center;
      padding: 10px var(--space-sm);
    }

    .site-header__donate--mobile {
      display: flex;
      justify-content: flex-end;
    }
  }

  @media (max-width: 767px) {
    .site-header__bar--mobile {
      grid-template-columns: 45% 55%;
    }
  }
</style>
```

- [ ] **Step 2: Verify**

Run: `npm run check && npm run lint`

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat: compose desktop and mobile Header bars"
```

---

## Task 6: Wire `Header` into `BaseLayout.astro`

**Files:**

- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Add import and render**

Add to frontmatter (below existing CSS imports):

```astro
import Header from '../components/Header.astro';
```

Body:

```astro
<body>
  <Header />
  <slot />
</body>
```

- [ ] **Step 2: Verify**

Run: `npm run check && npm run lint`. If `simple-import-sort/imports` flags order, run `npx eslint src/layouts/BaseLayout.astro --fix`.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: render Header in BaseLayout"
```

---

## Task 7: Full pipeline verification

**Files:** none

- [ ] **Step 1: Run full pipeline**

```bash
npm run format && npm run lint && npm run check && npm run build
```

Expected: all exit 0. `dist/` contains built pages with header markup and a bundled logo asset.

---

## Task 8: Live desktop verification

**Files:** none (verification only)

- [ ] **Step 1: Start dev server and inspect**

Navigate Chrome to `http://localhost:4321/`. Confirm via computed styles: logo 160×160, `.site-header` sticky/`z-index:100`/background `rgb(248,245,239)`, nav default color `rgb(29,28,28)`, "Home" `aria-current="page"` with `--color-nav-active` color and `::after opacity:1`, hover another link and confirm the crossfade, donate button transparent→black-fill on hover.

- [ ] **Step 2: Screenshot and fix if needed**

Fix + commit as `fix: correct Header desktop styling per live verification` if anything's off.

---

## Task 9: Tablet/phone sanity check

**Files:** none (verification only)

- [ ] **Step 1: Source-level confirmation**

Confirm `.site-header__bar--desktop` has `display:none` and `.site-header__bar--mobile` shows only logo+donate at ≤1024px in the written CSS (Task 5). Real breakpoint pixel verification deferred to the project's built-in Playwright QA pass in a later phase, given the `resize_window` environment limitation.

---

## Task 10: Deploy and mark phase complete

**Files:**

- Create: `docs/superpowers/plans/2026-07-26-header-nav.md` (this file, checkboxes marked)

- [ ] **Step 1: Push and verify production**

Push to `main`. Load `lsa-astro.pages.dev` fresh, confirm header renders and sticks on scroll in production.

- [ ] **Step 2: Commit plan completion**

```bash
git add docs/superpowers/plans/2026-07-26-header-nav.md
git commit -m "docs: mark phase 3 header/nav complete"
git push
```

---

## Out of scope for this phase

- No Hero, About, Parks, Who We Are, Donate, or Footer markup.
- No `AnimatedUnderline` or `CursorDot` — the nav underline built here is a simple opacity-crossfade `::after`. `CursorDot`'s real live behavior was incidentally discovered this session (fixed cursor-follower, CSS-transition based — NOT the legacy project's rAF+lerp approach; base color confirmed `--color-highlight-yellow`, grows to 70×70px with `.over-link` class on hover) — worth remembering for whichever phase builds it, but not built now.
- No working mobile nav/hamburger — matches the live site's actual behavior.
- No changes to `public/_headers`/CSP.

## Verification summary

1. `npm run build/check/lint/format` all pass after every task.
2. Desktop computed styles match measured live values (Task 8).
3. Mobile/tablet header shows only logo+donate, no nav, matching confirmed live DOM structure.
4. Deployed preview at `lsa-astro.pages.dev` shows a working sticky header in production.
