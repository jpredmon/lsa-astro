# skatelawrence.com Migration — Phase 1: Scaffold + Deploy Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get an Astro static site deploying to a Cloudflare Pages preview URL with placeholder content, before any real markup is written, with security headers, sitemap, and lint/format tooling in place.

**Architecture:** Astro `minimal` template, static output only (no SSR, no framework runtime — zero planned interactivity beyond two animations built in later phases). `public/` holds pass-through files (`_headers`, `robots.txt`) that Cloudflare Pages reads from the build output root.

**Tech Stack:** Astro (latest), TypeScript (`astro/tsconfigs/strictest`), ESLint flat config + `eslint-plugin-astro`, Oxlint, Prettier + `prettier-plugin-astro`, `@astrojs/sitemap`, Cloudflare Pages + Wrangler CLI.

## Global Constraints

- TypeScript strict mode always, no implicit `any` (user's global convention) — enforced here via Astro's `strictest` tsconfig preset.
- Named exports preferred over default exports where applicable.
- No new functionality beyond what's specified — no speculative config for features not yet built (e.g. no analytics, no CSP allowances for assets that don't exist yet).
- `lsa-site-react-legacy` is a tooling-convention reference only (ESLint/Oxlint/Prettier philosophy) — it is **not** a markup/styling source. See "Scope for Phase 2 onward" below.
- Conventional commits (`feat:`, `chore:`, `docs:`), imperative present tense, no `Co-Authored-By: Claude` trailer.

---

## Context

`lsa-site-migration-spec.md` (`C:\dev\claude-practice\LSA-astro\lsa-site-migration-spec.md`) specifies migrating skatelawrence.com off WordPress/Elementor/Bluehost onto static Astro + Cloudflare Pages, driven by cost (Bluehost ~$250/yr vs. free tier) and load speed. The spec mandates building **section-by-section, foundation first** (9 phases: scaffold → tokens → header → hero → about → parks → who-we-are → donate → footer), with QA after each phase, not just at the end.

This plan covers **Phase 1 only**. Each later phase gets its own plan once the prior phase's real output is known — a 9-phase migration doesn't belong in one document.

**Research done before writing this plan:**

- **Legacy project found**: `C:\dev\claude-practice\lsa-site-react-legacy` (Vite+React+TS) is the "current project" the spec references. It has `AnimatedUnderline` (donate-button hover, built with CSS `clip-path` — **not** stroke-dasharray as the spec guessed) and `CursorDot` (rAF cursor trail), plus `Header`/`Hero`/`AnimatedHeadline`/`Nav`/`Logo`/`DonateButton` components and lint/format tooling. No About/Parks/WhoWeAre/Footer exist there yet.
- **Live site fetched directly**: `skatelawrence.com` blocks bare `curl`/WebFetch with a Cloudflare JS challenge (confirms Cloudflare already proxies this domain's DNS — relevant to spec §9), but a realistic browser User-Agent gets through cleanly. Confirmed: font is Poppins, self-hosted by Elementor at weights 300/400/500/600/700 **normal style only** (no italic actually used, despite Elementor loading all 18 weight/style variants — a page-weight fix for later). Confirmed nav structure, hero `data-settings` (matches spec §7 verbatim), PayPal link, Instagram/Facebook URLs, MOKAN SKATES/Harrison Street DIY links, and decoded the Cloudflare-obfuscated contact email: **lawrenceskatersassociation@gmail.com**. MonsterInsights is installed but **unconfigured — no analytics are actually live today**.
- **Decisions closed with the user**: no analytics in the rebuild. GitHub repo created manually by the user (not via `gh` CLI — not authenticated in this environment).

## Recommended approach

Astro `minimal` template, TypeScript `strictest` preset, npm. Lint/format tooling ported from the legacy project but adapted: ESLint's React-specific plugins (`react-hooks`, `react-refresh`) dropped, `jsx-a11y` coverage moves to `eslint-plugin-astro`'s bundled a11y config; Prettier config carries over verbatim plus the Astro parser plugin; Oxlint drops its `react` plugin/rules and is scoped to non-`.astro` files.

Deploy in two steps: `npx wrangler pages deploy dist` first for an immediate one-off preview URL, then connect the GitHub repo to Cloudflare Pages' dashboard for git-push-to-deploy (the repeatable pipeline later phases need). Both require one manual step from the user.

`_headers` (CSP scoped to `paypal.com`, `X-Frame-Options: DENY`) and `robots.txt` live in `public/`. `@astrojs/sitemap` is added now with `site: 'https://skatelawrence.com'` set. A custom 404 page is added since Pages won't generate one automatically.

## File structure (end state of Phase 1)

```
LSA-astro/
├── .git/
├── .gitignore
├── .node-version
├── .oxlintrc.json
├── .prettierrc
├── .prettierignore
├── astro.config.mjs
├── eslint.config.js
├── package.json / package-lock.json
├── tsconfig.json
├── lsa-site-migration-spec.md
├── docs/superpowers/plans/2026-07-26-scaffold-deploy-pipeline.md
├── public/
│   ├── _headers
│   ├── robots.txt
│   ├── favicon.svg / favicon.ico
├── src/
│   ├── layouts/BaseLayout.astro
│   └── pages/
│       ├── index.astro
│       └── 404.astro
```

---

## Task 1: Initialize git repo

**Files:**

- Modify: none (repo metadata only)

- [ ] **Step 1: Init repo and commit the spec**

```bash
cd "C:\dev\claude-practice\LSA-astro"
git init
git branch -m main
git add lsa-site-migration-spec.md
git commit -m "docs: add migration spec"
```

- [ ] **Step 2: Verify**

Run: `git log --oneline`
Expected: one commit; `git status` clean.

---

## Task 2: Scaffold Astro (minimal template)

**Files:**

- Create: `astro.config.mjs`, `package.json`, `tsconfig.json`, `src/pages/index.astro`, `public/favicon.svg`, `.gitignore`

- [ ] **Step 1: Move spec aside, scaffold, restore spec**

```bash
cd "C:\dev\claude-practice\LSA-astro"
mv lsa-site-migration-spec.md ../lsa-site-migration-spec.md.bak
npx create-astro@latest . --template minimal --no-install --no-git --skip-houston -y
mv ../lsa-site-migration-spec.md.bak ./lsa-site-migration-spec.md
```

(`create-astro` scaffolds into a new subdirectory instead of in-place if the target dir isn't empty — hence the move-out/move-back. `--no-git` because Task 1 already ran `git init`.)

- [ ] **Step 2: Verify**

Run: `ls astro.config.mjs package.json src/pages/index.astro`
Expected: all three exist.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: scaffold Astro minimal template"
```

---

## Task 3: Install dependencies

**Files:**

- Create: `package-lock.json`, `node_modules/`

- [ ] **Step 1: Install**

```bash
npm install
```

- [ ] **Step 2: Verify dev server binds**

Run: `npm run dev` (then stop it once it prints a local URL, e.g. Ctrl+C)
Expected: no error, prints `http://localhost:4321` or similar.

- [ ] **Step 3: Commit (only if lockfile changed)**

```bash
git status --porcelain package-lock.json
```

If it shows a diff: `git add package-lock.json && git commit -m "chore: lock base dependencies"`. Otherwise skip.

---

## Task 4: Sitemap integration

**Files:**

- Modify: `astro.config.mjs`, `package.json`, `package-lock.json`

- [ ] **Step 1: Add the integration**

```bash
npx astro add sitemap -y
```

- [ ] **Step 2: Set `site` in astro.config.mjs**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://skatelawrence.com',
  integrations: [sitemap()],
});
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: `dist/sitemap-index.xml` and `dist/sitemap-0.xml` exist; `dist/sitemap-0.xml` references `https://skatelawrence.com/`.

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs package.json package-lock.json
git commit -m "feat: add sitemap integration"
```

---

## Task 5: Strict TypeScript

**Files:**

- Modify: `tsconfig.json`

- [ ] **Step 1: Edit tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strictest",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 2: Verify**

Run: `npx astro check`
Expected: passes with no errors.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore: enable strictest TypeScript config"
```

---

## Task 6: Port lint/format tooling (Astro-adapted)

**Files:**

- Create: `eslint.config.js`, `.oxlintrc.json`, `.prettierrc`, `.prettierignore`
- Modify: `package.json`

- [ ] **Step 1: Install tooling deps**

```bash
npm install -D @astrojs/check typescript eslint @eslint/js typescript-eslint eslint-plugin-astro astro-eslint-parser eslint-plugin-simple-import-sort globals oxlint prettier prettier-plugin-astro
```

- [ ] **Step 2: Create eslint.config.js**

```js
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  { ignores: ['dist', '.astro'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  ...eslintPluginAstro.configs['jsx-a11y-recommended'],
  {
    files: ['**/*.{ts,astro}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  }
);
```

- [ ] **Step 3: Create .oxlintrc.json**

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "oxc"],
  "ignorePatterns": ["dist", "*.astro"]
}
```

- [ ] **Step 4: Create .prettierrc and .prettierignore**

`.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-astro"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

`.prettierignore`:

```
dist
.astro
node_modules
```

- [ ] **Step 5: Add npm scripts**

Edit `package.json` `scripts`:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "check": "astro check",
    "lint:oxlint": "oxlint .",
    "lint:eslint": "eslint .",
    "lint": "npm run lint:oxlint && npm run lint:eslint",
    "format": "prettier --write ."
  }
}
```

- [ ] **Step 6: Verify**

Run: `npm run format && npm run lint && npm run check && npm run build`
Expected: all four exit 0.

- [ ] **Step 7: Commit**

```bash
git add eslint.config.js .oxlintrc.json .prettierrc .prettierignore package.json package-lock.json
git commit -m "chore: port lint/format tooling from legacy project"
```

---

## Task 7: Placeholder pages, security headers, robots.txt

**Files:**

- Create: `src/layouts/BaseLayout.astro`, `src/pages/404.astro`, `public/_headers`, `public/robots.txt`, `.node-version`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create src/layouts/BaseLayout.astro**

```astro
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Replace src/pages/index.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Lawrence Skateparks Association">
  <main>
    <h1>Lawrence Skateparks Association</h1>
    <p>Site scaffold placeholder — Phase 1 (project scaffold + deploy pipeline).</p>
  </main>
</BaseLayout>
```

- [ ] **Step 3: Create src/pages/404.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="404 — Page Not Found | Lawrence Skateparks Association">
  <main>
    <h1>404 — Page not found</h1>
    <p>Sorry, that page doesn't exist. <a href="/">Return home</a>.</p>
  </main>
</BaseLayout>
```

- [ ] **Step 4: Create public/\_headers**

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://*.paypal.com; frame-src https://*.paypal.com; object-src 'none'
  X-Frame-Options: DENY
```

- [ ] **Step 5: Create public/robots.txt**

```
User-agent: *
Allow: /

Sitemap: https://skatelawrence.com/sitemap-index.xml
```

- [ ] **Step 6: Create .node-version**

```
22
```

- [ ] **Step 7: Verify**

```bash
npm run build
npx astro preview
```

Expected:

- `dist/index.html` contains "Lawrence Skateparks Association"
- `dist/404.html` exists
- `dist/_headers` and `dist/robots.txt` exist with exact content above
- Local preview: homepage shows placeholder text; a nonexistent path serves the 404 page

- [ ] **Step 8: Commit**

```bash
git add src public/_headers public/robots.txt .node-version
git commit -m "feat: add placeholder pages, security headers, robots.txt"
```

---

## Task 8: First deploy — Cloudflare Pages preview via wrangler

**Files:** none (deploy only)

- [ ] **Step 1 (USER ACTION REQUIRED): authenticate wrangler**

`npx wrangler whoami` currently reports not logged in. Run interactively (e.g. via `! npx wrangler login` in the Claude Code session so output lands in the transcript):

```bash
npx wrangler login
```

- [ ] **Step 2: Create project and deploy**

```bash
npx wrangler pages project create lsa-astro --production-branch main
npm run build
npx wrangler pages deploy dist --project-name=lsa-astro --branch=main
```

- [ ] **Step 3: Verify**

```bash
curl -sI https://lsa-astro.pages.dev | grep -i -E "content-security-policy|x-frame-options"
curl -s https://lsa-astro.pages.dev | grep "Lawrence Skateparks Association"
```

Expected: both commands find matches, confirming the preview URL is live with the security headers active.

---

## Task 9: Connect GitHub + Cloudflare Pages dashboard (ongoing pipeline)

**Files:** none (external service wiring)

- [ ] **Step 1 (USER ACTION REQUIRED): create GitHub repo**

Create a repo (e.g. `lsa-astro`) at github.com and share the URL back.

- [ ] **Step 2: Add remote and push**

```bash
git remote add origin <the-repo-url>
git push -u origin main
```

- [ ] **Step 3 (USER ACTION REQUIRED): connect Cloudflare Pages dashboard**

Cloudflare dashboard → Workers & Pages → Create → Pages → "Connect to Git" → authorize the repo → set production branch `main`, build command `npm run build`, output directory `dist` (set `NODE_VERSION=22` as a build env var if the dashboard doesn't pick up `.node-version` automatically) → Deploy.

- [ ] **Step 4: Verify pipeline end-to-end**

Confirm the dashboard-triggered build's `*.pages.dev` URL matches Task 8's output. Push a trivial change (e.g. a `README.md` edit) and confirm a new deployment fires automatically.

---

## Scope for Phase 2 onward (legacy project boundary)

`lsa-site-react-legacy` is **not** a markup/styling source for the rebuild. Header/Nav/Hero/Logo/DonateButton (and every later section) get built fresh from the live `skatelawrence.com` fetch — its actual DOM structure, classes, `data-settings`, copy, and computed styles — not from the legacy React components, which were an earlier, incomplete, pre-spec attempt. The only two things carried over from that folder are:

1. **`screenshots/`** — kept as historical record of prior failed attempts (e.g. `stroke-not-quite.png`).
2. **`AnimatedUnderline` / `CursorDot` timing and easing values** — reusable _if_ they check out against a live-site re-diff (spec §7 flags `AnimatedUnderline` needs this verification before being treated as final). If the live site's actual easing/timing differs, the live site wins.

Everything else in that folder (component structure, CSS Modules architecture, component implementations, `tokens.css`) is disregarded for markup/styling purposes.

## What's explicitly deferred to later phases

- Real design tokens (colors, Poppins weights 300/400/500/600/700, spacing, breakpoints), favicon/logo — Phase 2
- Header/Nav, Hero (incl. both animations), About, Parks, Who We Are, Donate, Footer — Phases 3–9, built fresh from the live site per the scope note above
- Custom domain cutover to `skatelawrence.com` — final phase per spec §9
- Any analytics (explicitly decided against for now)
- CSP loosening for fonts/images once Phase 2 picks the actual asset hosting approach

## Verification summary for this phase

1. `npm run build`, `npm run check`, `npm run lint`, `npm run format` all pass locally.
2. Local `astro preview` shows placeholder homepage + working 404.
3. `https://lsa-astro.pages.dev` (or dashboard-connected equivalent) is reachable, serves the placeholder, and returns the CSP/X-Frame-Options headers.
4. A git push triggers an automatic Cloudflare Pages deploy (proves the pipeline for Phases 2–9).
