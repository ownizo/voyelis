# Voyelis

**Go further. Fully covered.** — voyelis.com

Digital marketing and comparison platform for travel insurance, in **English, German, French and Spanish**. Voyelis does not sell insurance: offers come in real time from the HelloSafe Atlas API and the purchase happens on HelloSafe (HELLO SAFE SAS, ORIAS 21008038). Run by Ownizo, Unipessoal Lda.

Languages are limited to those supported by the HelloSafe subscription funnel (26 languages, no Chinese or Hebrew).

## Stack

Astro 6 (static pages + Netlify Functions for the API), Tailwind CSS 4, Netlify Blobs.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build
```

## Structure

| Path | Content |
| --- | --- |
| `src/pages/[...path].astro` | Single router for every page in every language |
| `src/i18n/routes.ts` | Languages and localised URLs (`/`, `/de`, `/fr`, `/es`) |
| `src/i18n/ui.ts` | All interface text, per language (slogan, home page, form, footer, cookie banner) |
| `src/views/` | Page templates (home, compare, guides, guide, about, legal) |
| `src/content/guides/<lang>/` | Guides (Markdown). `translationKey` links translations for hreflang |
| `src/content/legal/<lang>/` | Privacy policy, terms, cookie policy, legal notice |
| `src/lib/insurance/` | HelloSafe Atlas integration (see `docs/hellosafe-api.md`) |
| `src/site.ts` | Brand, operator (Ownizo) and partner (HelloSafe) details |

## Adding a guide

Create `src/content/guides/<lang>/<slug>.md` with the frontmatter used by the existing guides. Use the same `translationKey` for the versions of one guide in different languages.

## Deploy

Netlify detects Astro automatically (build `npm run build`, publish `dist`). Set the environment variables listed in `.env.example`, and see `docs/hellosafe-api.md` to activate the API.
