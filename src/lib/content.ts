import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/routes';

/** Slug of a guide: file name without the language folder. */
export const guideSlug = (post: CollectionEntry<'guides'>) => post.id.split('/').pop()!;

export async function guidesFor(locale: Locale) {
    return (await getCollection('guides', (p) => p.data.lang === locale)).sort(
        (a, b) => a.data.order - b.data.order || b.data.pubDate.getTime() - a.data.pubDate.getTime()
    );
}
