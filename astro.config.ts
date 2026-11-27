import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';
import { LOCALES, LOCALE_META, PAGE_PATHS, guidePath, type Locale } from './src/i18n/routes';

const SITE = 'https://voyelis.com';

// Guides: last update (for <lastmod>) and the URL of each translation (for hreflang).
type Guide = { lang: Locale; path: string; key: string; date?: string };
const guides: Guide[] = [];
for (const lang of LOCALES) {
    for (const f of readdirSync(`./src/content/guides/${lang}`).filter((f) => f.endsWith('.md'))) {
        const fm = readFileSync(`./src/content/guides/${lang}/${f}`, 'utf8');
        guides.push({
            lang,
            path: guidePath(lang, f.replace(/\.md$/, '')),
            key: fm.match(/^translationKey:\s*(\S+)/m)?.[1] ?? f,
            date: fm.match(/^updatedDate:\s*(\S+)/m)?.[1] ?? fm.match(/^pubDate:\s*(\S+)/m)?.[1]
        });
    }
}

// Every URL → its versions in all languages (pages from src/i18n/routes.ts, guides by translationKey).
const alternates = new Map<string, { lang: string; url: string }[]>();
const abs = (path: string) => (path === '/' ? `${SITE}/` : `${SITE}${path}`);
for (const paths of Object.values(PAGE_PATHS)) {
    const links = LOCALES.map((l) => ({ lang: LOCALE_META[l].htmlLang, url: abs('/' + paths[l]) }));
    for (const l of links) alternates.set(l.url, links);
}
for (const g of guides) {
    const links = guides.filter((o) => o.key === g.key).map((o) => ({ lang: LOCALE_META[o.lang].htmlLang, url: abs(o.path) }));
    alternates.set(abs(g.path), links);
}
const guideDate = new Map(guides.map((g) => [abs(g.path), g.date]));
const buildDate = new Date().toISOString();
const HOMES = new Set(LOCALES.map((l) => abs('/' + PAGE_PATHS.home[l])));
const COMPARE = new Set(LOCALES.map((l) => abs('/' + PAGE_PATHS.compare[l])));
const LEGAL = new Set((['privacy', 'terms', 'cookies', 'notice'] as const).flatMap((k) => LOCALES.map((l) => abs('/' + PAGE_PATHS[k][l]))));

// https://astro.build/config
export default defineConfig({
    site: SITE,
    trailingSlash: 'never',
    build: { format: 'file' },
    vite: {
        plugins: [tailwindcss()]
    },
    integrations: [
        sitemap({
            filter: (page) => !page.includes('/404'),
            serialize(item) {
                const url = item.url.replace(/\/$/, '') || item.url;
                const key = url === SITE ? `${SITE}/` : url;
                const date = guideDate.get(key);
                const links = alternates.get(key);
                return {
                    ...item,
                    url: key,
                    lastmod: date ? new Date(date).toISOString() : buildDate,
                    changefreq: date ? 'monthly' : LEGAL.has(key) ? 'yearly' : 'weekly',
                    priority: HOMES.has(key) ? 1.0 : COMPARE.has(key) ? 0.9 : date ? 0.8 : LEGAL.has(key) ? 0.2 : 0.6,
                    // hreflang: each URL lists its versions in the other languages, plus x-default (English)
                    ...(links && links.length > 1
                        ? { links: [...links, { lang: 'x-default', url: links.find((l) => l.lang === 'en')?.url ?? links[0].url }] }
                        : {})
                };
            }
        })
    ],
    adapter: netlify()
});
