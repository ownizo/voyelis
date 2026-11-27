import { SITE } from '../site';

export const absoluteUrl = (path: string) => (path === '/' ? `${SITE.url}/` : `${SITE.url}${path}`);

/** schema.org BreadcrumbList from [name, path] pairs. */
export function breadcrumbLd(items: [string, string][]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absoluteUrl(path) }))
    };
}

export function faqLd(faqs: { q: string; a: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
    };
}
