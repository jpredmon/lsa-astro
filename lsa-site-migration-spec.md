# skatelawrence.com Migration Spec

## 1. Goal & Constraints

- Exact visual/behavioral replica of the current WordPress/Elementor site at skatelawrence.com.
- No new functionality. Content changes limited to swapping photos later.
- Primary driver: cost. Bluehost is ~$250/yr; target is Cloudflare Pages (free tier covers static sites at this scale).
- Secondary driver: load speed. Current site is slow — almost certainly WP/Elementor overhead, not the content itself.
- Deploy target: Cloudflare Pages, custom domain skatelawrence.com.

## 2. Architecture — decided: Astro

Previous state: Vite + React + TS + CSS Modules, no router, no state library, no backend.

Decision: rebuild in **Astro**, static output (no SSR, no @astrojs/cloudflare adapter needed — Cloudflare Pages hosts the plain HTML/CSS/JS output natively). Zero planned interactivity beyond the animation effects, so React's runtime is dead weight; Astro ships zero client-side JS by default and only hydrates what's explicitly marked as an island (nothing on this site needs that).

Keep CSS Modules or scoped `<style>` blocks (Astro supports both) and keep Oxlint/ESLint/Prettier as-is — no reason to change tooling that already works.

## 3. Build methodology — section-by-section, foundation first

Build and visually verify one section at a time rather than the whole page in one pass. Smaller diffs are easier to check against the live site, and a wrong foundation (tokens, breakpoints) caught after section 1 is cheap; caught after the whole page is built on top of it, it isn't.

Order:
1. **Project scaffold + deploy pipeline** — get Astro deploying to a Cloudflare Pages preview URL with placeholder content before writing any real markup. Confirms the deploy story works before CSS/animation debugging starts.
2. **Design tokens** — colors, font family/weights, spacing scale, breakpoints. Everything downstream depends on this being right.
3. Header/Nav
4. Hero (incl. AnimatedHeadline — fully specified in section 6 below)
5. About Us
6. Our Parks
7. Who We Are
8. Support/Donate
9. Footer

**Sourcing the original markup:** don't hand-copy from DevTools for this — Claude Code has real internet access and Elementor server-renders the HTML, so it can fetch `https://skatelawrence.com` directly and read the actual `data-settings`, classes, and structure itself. Reserve manual DevTools work for things that aren't in raw HTML (computed/rendered visual output). For that, use Playwright: have Claude Code screenshot the live site and the local build side-by-side per section, at each breakpoint, and diff them — this closes the loop without manual copy-paste.

## 4. QA checks — one pass per section, not just at the end

Run these after each section from the build order above, not as a single pass at the very end:

- **Playwright pixel diff** — live site vs. local build, per section, per breakpoint (mobile/tablet/desktop). Catches drift a visual skim misses.
- **Three-viewport check** — mobile / tablet / desktop, before moving to the next section. You explicitly care about matching media query behavior, so this can't be a final-pass afterthought.
- **Network tab / page-weight check** — total bytes and request count after each major section, against the PageSpeed baseline (see section 7). Catches weight creep while it's attributable to one section's changes.
- **Lighthouse run per milestone** — after Hero, after Parks, etc., not just once at the end. A regression is traceable to the section that caused it.
- **Content accuracy pass** — separate from visual QA: exact text, alt text, and every link (maps, social, PayPal, email addresses) copied correctly. Easy to nail visually and still get a broken/wrong href.
- **Accessibility spot-check** — quick axe-core or Lighthouse a11y pass per section, since it's free to do now and expensive to retrofit after the fact.
- **Deploy each section to the Pages preview URL as it's finished**, not just once at the end — confirms the pipeline keeps working incrementally rather than surfacing a build config problem after everything's built.

## 5. Asset inventory (must exact-match)

Fetching workflow: links and images are both pulled directly by Claude Code from the live site's HTML — no manual saving/copying needed. For images specifically: pull both size variants per photo (desktop + mobile crop, from the `srcset`/`sizes` attributes, not just whichever loads first), convert to WebP/AVIF locally per the performance targets in section 8, then verify visually via the Playwright diff step in section 4 — compression can introduce artifacts a script won't flag on its own.

Pull these directly from the live site, don't recreate:

- Hero photo: `IMG_5230-scaled.jpeg` (1024×768 desktop crop) + `BABsmall.jpeg` (480×360 mobile crop)
- Logo: `logo-512x512-1.png`
- Park photos ×5 (Centennial, Corey Lawrence Vert Ramp, Edgewood DIY, Holcom, Deerfield), each with a `-large` (1024×682) and `-small` (480×320) variant — match the breakpoint where WP swaps them
- OG image: `LSA_Logo_FullColor-2-large.png` (3075×3075)
- Favicon / apple-touch-icon — grab from page `<head>`, not yet pulled
- Font family — page metadata shows `google_font-enabled`; need to identify the actual family/weights from the live site's `<head>` (`<link>` tags or `@font-face`) before build

## 6. Section/component breakdown

Maps 1:1 to what's live now:

1. **Header/Nav** — logo, anchor links (Home / About Us / Our Parks / Contact), Donate button in nav. **Corrected during Phase 3 build:** there is no working mobile hamburger menu on the live site — the mobile/tablet header is logo + Donate button only, no toggle, no menu items. Confirmed via live DOM inspection and replicated exactly (a live behavior to match, not a bug to fix).
2. **Hero** — kicker text "Our mission is simple", AnimatedHeadline ("Make Lawrence" + highlighted "Skateable"), hero photo with caption/photo-credit. **Corrected during Phase 4 build:** the caption is not an overlay — it's a normal static in-flow element directly below the photo (`position: static`), confirmed via live `getComputedStyle`.
3. **About Us** — **corrected during Phase 5 build:** not two text blocks — the live section is five pieces in sequence: an "About us" headline, an embedded YouTube video, then "What we do" headline + body text, then "Why we do it" headline + body text.
4. **Our Parks** — **corrected during Phase 6 build:** not a grid — a single-column vertical stack of 5 full-width images (even at desktop), each with caption, photo credit, and external link (Google Maps, YouTube, or Instagram). Confirmed via live `getComputedStyle` (`display: flex; flex-direction: column`).
5. **Who We Are** — short team blurb. **Confirmed during Phase 7 build:** the live site's "Contact" nav item doesn't lead to a separate contact section — it's the anchor for the "Who We Are" headline/blurb section itself (a live mislabeling, replicated exactly, not fixed).
6. **Support/Donate** — CTA text, PayPal donate link, MOKAN SKATES partner mention, tax-receipt email
7. **Footer** — Instagram/Facebook links, copyright, org name

## 7. Animation specs (captured from live DOM)

**AnimatedHeadline** — confirmed via `data-settings` JSON on the live widget:
```json
{
  "highlighted_text": "Skateable",
  "marker": "underline",
  "highlight_iteration_delay": 5000,
  "_animation": "pulse",
  "headline_style": "highlight",
  "loop": "yes",
  "highlight_animation_duration": 1200
}
```
- Entrance: `pulse` = Animate.css standard keyframe (scale 1 → 1.05 → 1, ~1s)
- Underline: SVG path draws via `stroke-dasharray`/`stroke-dashoffset`, 0→full over 1200ms, repeats every 5000ms while `loop: yes`
- Path data (verbatim, reuse as-is): `M7.7,145.6C109,125,299.9,116.2,401,121.3c42.1,2.2,87.6,11.8,87.3,25.7`

**Note (confirmed during Phase 5 build):** `highlight_iteration_delay: 5000` above is specific to the Hero instance only. Every other AnimatedHeadline instance on the live site (About us / What we do / Why we do it / Our parks / Who we are) uses `8000` instead. Draw duration (1200ms) and fade duration (400ms) are constant across every instance — only the cycle length differs, which changes the underline animation's keyframe percentages.

**AnimatedUnderline (donate button hover)** — **corrected during Phase 3 build:** this doesn't correspond to any real live behavior. The donate button's hover is a plain background-color crossfade, not an SVG underline-draw animation — confirmed via live DOM/CSS inspection. Not built. The only real SVG-underline-draw logic on the live site belongs to AnimatedHeadline (above).

**CursorDot** — already built, carries over.

**Mobile menu toggle** — **corrected during Phase 3 build:** there is no mobile menu toggle to capture. The live mobile/tablet header has no hamburger icon or menu at all (logo + Donate button only) — see the corrected Header/Nav entry in section 6.

## 8. Performance targets

WP/Elementor baseline is slow due to (standard for this stack, not something I measured directly on your site): jQuery + Elementor core JS/CSS loaded on every page, a separate auto-generated CSS file per page, hero/park images served larger than displayed size without modern formats, Font Awesome icon font, and analytics scripts (MonsterInsights shows on your Site Health screen) adding blocking requests.

Target for the rebuild:
- Serve images as WebP/AVIF at the actual displayed size with `srcset`, not the current oversized JPEGs
- No render-blocking CSS/JS beyond what the two animations need
- Let Cloudflare's edge CDN handle caching — no origin server round-trips for a static site

Get a real baseline before you start: run the current live site through PageSpeed Insights once. I can't measure actual load time from here, so treat the causes above as informed guesses, not measured facts, until you have that number.

**Analytics:** the live site runs MonsterInsights (Google Analytics). Decide before build whether to carry tracking over — a script addition works somewhat against the minimize-JS goal above, so this is worth an explicit yes/no rather than defaulting either way. If yes, use GA4's standard lightweight snippet or a lighter privacy-focused alternative (e.g. Cloudflare's own free Web Analytics, which needs zero client-side script since it's edge-injected) rather than the full MonsterInsights plugin equivalent.

**404 page:** not present in the current rebuild — add a simple custom 404 matching the site's design, since Astro/Pages won't generate one automatically.

**robots.txt / sitemap.xml:** WordPress auto-generates both; a static Astro build won't unless explicitly configured. Add both at build time (Astro has a sitemap integration) to preserve the SEO parity covered in section 2.

## 9. Deployment / DNS note

The site's contact email uses `/cdn-cgi/l/email-protection` — that's Cloudflare's email-obfuscation feature, which only appears when Cloudflare is already proxying this domain's DNS. Worth confirming in your Cloudflare dashboard: if DNS is already pointed through Cloudflare (common setup — DNS on Cloudflare, hosting on Bluehost), cutover to Pages may just mean changing where the domain's traffic resolves to, not a full DNS migration.

Confirmed: the contact address is Gmail-hosted, not Bluehost — no separate mailbox migration needed. The `mailto:` link carries over unchanged; Cloudflare's email obfuscation keeps working automatically once the domain stays proxied through Cloudflare.

**Cutover plan (go-live sequence):**
1. Finish and QA the full build on the Cloudflare Pages preview URL (not the live domain yet)
2. Do a final side-by-side pass against the live site — every section, every breakpoint — using the Playwright diff workflow from section 4
3. Point the custom domain at Cloudflare Pages (DNS change — likely just an update within Cloudflare if DNS is already proxied there, per the note above)
4. Monitor immediately after cutover: load the live domain fresh (incognito, no cache) and re-check links, images, and animations actually work in production, not just on the preview URL
5. Keep Bluehost hosting active but don't renew/rebill for a short buffer window (a few days to a week) in case DNS propagation issues or an overlooked detail need a fast rollback
6. Only cancel Bluehost once the live domain has been stable on Cloudflare Pages for that buffer period

## 10. Security

Migrating off WordPress removes most of the attack surface by default — no admin panel, no database, no PHP execution for an attacker to exploit. The PayPal donate link (`paypal.com/donate/?hosted_button_id=A9V2ZVQJDLTSQ&source=qr`) is baked into a static HTML file at build time; there's no live "edit this page" surface to compromise.

Real risk shifts to three accounts instead — lock these down:
- **GitHub (or wherever the source repo lives)** — this is the new front door. Enable 2FA, keep collaborator access tight. A compromised repo means the next deploy ships an attacker's change.
- **Cloudflare account** — controls both DNS and the Pages deployment; highest-value target now. 2FA required.
- **Domain registrar** — controls where the domain's nameservers point. A registrar hijack bypasses both GitHub and Cloudflare. 2FA plus a registrar lock if available.

Build-time hardening (part of initial scaffold, not an afterthought):
- Add a `_headers` file to the Astro output setting a Content-Security-Policy that only allows scripts/frames from `paypal.com` for the donate flow, and `X-Frame-Options` to prevent the page being embedded elsewhere. Doesn't stop a source-level compromise, but closes off injected-third-party-script attacks if any dependency is ever compromised.

## 11. Open questions to resolve before handing this to Claude Code

- [x] Font family/weights — resolved during Phase 2 build: Poppins, self-hosted, weights 300–700.
- [x] Favicon/apple-touch-icon assets — resolved during Phase 2 build: pulled from live `<head>` and in place.
- [x] Mobile menu animation — resolved during Phase 3 build: there is no mobile menu to animate. The live mobile/tablet header has no hamburger toggle at all (logo + Donate button only) — see the corrected Header/Nav entry in section 6.
- [ ] Baseline PageSpeed number on current live site, for a real before/after comparison
