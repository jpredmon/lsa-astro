// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://skatelawrence.com',
  integrations: [sitemap()],
  build: {
    // Astro's default ('auto') inlines page-specific CSS directly into the
    // HTML as a <style> tag when it's small/only used on one page. Our CSP
    // (public/_headers) has no 'unsafe-inline' in style-src, so the browser
    // silently drops those inline styles rather than applying them — found
    // live on skatelawrence.com's Hero section (font-size never applied in
    // production despite working in dev, where CSP isn't enforced).
    // 'never' forces all component styles into the external, CSP-allowed
    // stylesheet instead of weakening the CSP with 'unsafe-inline'.
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Same CSP issue as inlineStylesheets above, but for scripts: Vite
      // inlines very small JS chunks (like CursorDot's tiny handler) directly
      // as an inline <script> tag, which our CSP (no 'unsafe-inline' in
      // script-src) silently drops — found live, the cursor-follower never
      // ran at all in production. 0 disables the size threshold so all
      // scripts stay external, CSP-'self'-allowed files.
      assetsInlineLimit: 0,
    },
  },
});
