# lsa-astro

Static Astro rebuild of [skatelawrence.com](https://skatelawrence.com), migrating off WordPress/Elementor/Bluehost onto Cloudflare Pages.

See `lsa-site-migration-spec.md` for the full migration spec, and `docs/superpowers/plans/` for the phase-by-phase implementation plans (build order: scaffold → tokens → header → hero → about → parks → who-we-are → donate → footer).

## Commands

| Command           | Action                                     |
| :---------------- | :----------------------------------------- |
| `npm install`     | Install dependencies                       |
| `npm run dev`     | Start local dev server at `localhost:4321` |
| `npm run build`   | Build the production site to `./dist/`     |
| `npm run preview` | Preview the build locally                  |
| `npm run check`   | Type-check `.astro`/`.ts` files            |
| `npm run lint`    | Run oxlint + eslint                        |
| `npm run format`  | Format with Prettier                       |

## Deploy

Pushes to `main` auto-deploy to Cloudflare Pages at [lsa-astro.pages.dev](https://lsa-astro.pages.dev).
