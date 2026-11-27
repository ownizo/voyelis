import type { APIRoute } from 'astro';
import { SITE, OPERATOR, PARTNER } from '../site';
import { LOCALES, LOCALE_META, pagePath, guidePath } from '../i18n/routes';
import { UI_STRINGS } from '../i18n/ui';
import { guidesFor, guideSlug } from '../lib/content';

// Summary of the site for language models (llmstxt.org).
export const GET: APIRoute = async () => {
    const lines: string[] = [
        `# ${SITE.name}`,
        '',
        `> ${UI_STRINGS.en.brand.tagline} ${SITE.name} is a digital marketing and comparison platform for travel insurance, available in English, German, French and Spanish. It does not sell insurance: policies are sold by ${PARTNER.legalName} (${PARTNER.name}), an insurance broker registered in France with ORIAS no. ${PARTNER.orias}. Offers are ranked by medical cover by default.`,
        '',
        `Operator: ${OPERATOR.legalName}, ${OPERATOR.address}. Contact: ${SITE.email}.`,
        ''
    ];
    for (const locale of LOCALES) {
        const ui = UI_STRINGS[locale];
        lines.push(`## ${LOCALE_META[locale].label}`, '');
        lines.push(`- [${ui.compare.title}](${SITE.url}${pagePath('compare', locale)}): ${ui.compare.description}`);
        for (const g of await guidesFor(locale)) lines.push(`- [${g.data.title}](${SITE.url}${guidePath(locale, guideSlug(g))}): ${g.data.description}`);
        lines.push('');
    }
    return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
