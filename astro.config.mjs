import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';

const SITE = 'https://voyelis.com';

// Last update of each guide (frontmatter), used for <lastmod> in the sitemap. Key: "lang/slug".
const guideDates = {};
for (const lang of readdirSync('./src/content/guides')) {
    for (const f of readdirSync(`./src/content/guides/${lang}`).filter((f) => f.endsWith('.md'))) {
        const fm = readFileSync(`./src/content/guides/${lang}/${f}`, 'utf8');
        guideDates[`${lang}/${f.replace(/\.md$/, '')}`] = fm.match(/^updatedDate:\s*(\S+)/m)?.[1] ?? fm.match(/^pubDate:\s*(\S+)/m)?.[1];
    }
}
const GUIDE_BASES = { en: '/guides/', de: '/de/ratgeber/', fr: '/fr/guides/', es: '/es/guias/' };
const buildDate = new Date().toISOString();

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
                const path = new URL(item.url).pathname;
                let date;
                for (const [lang, base] of Object.entries(GUIDE_BASES)) {
                    if (path.startsWith(base) && path.length > base.length) date = guideDates[`${lang}/${path.slice(base.length)}`];
                }
                const isHome = ['/', '', '/de', '/fr', '/es'].includes(path);
                const isCompare = /^\/(compare|de\/vergleich|fr\/comparer|es\/comparar)$/.test(path);
                return {
                    ...item,
                    lastmod: date ? new Date(date).toISOString() : buildDate,
                    changefreq: date ? 'monthly' : 'weekly',
                    priority: isHome ? 1.0 : isCompare ? 0.9 : date ? 0.7 : 0.5
                };
            }
        })
    ],
    adapter: netlify()
});
