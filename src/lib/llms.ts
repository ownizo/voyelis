// Content of /llms.txt and /llms-full.txt (llmstxt.org): a plain-text map of the site for AI assistants and AI search engines.
import { getCollection } from 'astro:content';
import { SITE, OPERATOR, PARTNER } from '../site';
import { LOCALES, LOCALE_META, pagePath, guidePath, type Locale } from '../i18n/routes';
import { UI_STRINGS } from '../i18n/ui';
import { guidesFor, guideSlug } from './content';

const url = (path: string) => (path === '/' ? `${SITE.url}/` : `${SITE.url}${path}`);

function header(): string[] {
    const ui = UI_STRINGS.en;
    return [
        `# ${SITE.name}`,
        '',
        `> ${SITE.name} (${SITE.url}) is a digital marketing and comparison platform for travel insurance, in English, German, French and Spanish. Slogan: "${ui.brand.slogan}" ${ui.brand.tagline}`,
        '',
        '## Key facts',
        '',
        `- ${SITE.name} does not sell insurance and is not an insurance intermediary. Policies are sold by ${PARTNER.legalName} (${PARTNER.name}), ${PARTNER.registry}, an insurance broker registered in France with ORIAS no. ${PARTNER.orias}. Purchase, payment and customer service take place on the ${PARTNER.name} platform.`,
        `- Travellers compare real-time offers from several insurers by entering trip details only (residence, destinations, dates, ages, optional trip cost for cancellation). No name, email or phone number is requested.`,
        `- Offers are ranked by medical expenses cover by default (highest first, ties by price) and can be sorted by price. No position is paid for. Each offer links to its IPID and general conditions.`,
        `- ${SITE.name} is paid by ${PARTNER.name} for each policy bought through the site; the price shown is the same as on ${PARTNER.name}.`,
        `- Prices are shown in the currency of the traveller's country of residence (EUR, GBP, USD, CHF, CAD, AUD and others).`,
        `- Trip types: holiday, business, annual multi-trip, Schengen visa, cancellation only, study/internship, working holiday, cruise, digital nomad / long stay, expatriation, au pair, humanitarian mission.`,
        `- Operator: ${OPERATOR.legalName} (NIPC ${OPERATOR.taxId}), ${OPERATOR.address}. Contact: ${SITE.email} (no telephone support).`,
        ''
    ];
}

async function pages(locale: Locale, full: boolean): Promise<string[]> {
    const ui = UI_STRINGS[locale];
    const out = [`## ${LOCALE_META[locale].label} (${LOCALE_META[locale].htmlLang})`, ''];
    out.push(`- [${ui.compare.title}](${url(pagePath('compare', locale))}): ${ui.compare.description}`);
    out.push(`- [${ui.guides.title}](${url(pagePath('guides', locale))}): ${ui.guides.description}`);
    out.push(`- [${ui.about.title}](${url(pagePath('about', locale))}): ${ui.about.description}`);
    out.push('');
    out.push(`### ${ui.guides.eyebrow}`, '');
    const posts = await guidesFor(locale);
    for (const g of posts) out.push(`- [${g.data.title}](${url(guidePath(locale, guideSlug(g)))}): ${g.data.description}`);
    out.push('');
    if (!full) {
        const legal = (await getCollection('legal', (d) => d.data.lang === locale)).sort((a, b) => a.data.key.localeCompare(b.data.key));
        out.push(`### ${ui.legal.eyebrow}`, '');
        for (const d of legal) out.push(`- [${d.data.title}](${url(pagePath(d.data.key, locale))}): ${d.data.description}`);
        out.push('');
        return out;
    }
    for (const g of posts) {
        out.push(`---`, '', `# ${g.data.title}`, '', `Source: ${url(guidePath(locale, guideSlug(g)))}`, '', g.data.description, '');
        // Internal links become absolute so they still work out of context.
        out.push((g.body ?? '').trim().replace(/\]\(\//g, `](${SITE.url}/`), '');
        if (g.data.faqs.length) {
            out.push(`## ${ui.guides.faq}`, '');
            for (const { q, a } of g.data.faqs) out.push(`**${q}**`, '', a, '');
        }
    }
    return out;
}

export async function llmsTxt(full: boolean): Promise<string> {
    const lines = header();
    if (!full) lines.push(`Full text of every guide: ${SITE.url}/llms-full.txt`, '');
    for (const locale of LOCALES) lines.push(...(await pages(locale, full)));
    return lines.join('\n');
}
