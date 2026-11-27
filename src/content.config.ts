import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const lang = z.enum(['en', 'de', 'fr', 'es']);

// Guides: src/content/guides/<lang>/<slug>.md → /<guides-path>/<slug>
// `translationKey` links the versions of the same guide in different languages (hreflang).
const guides = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
    schema: z.object({
        lang,
        translationKey: z.string(),
        title: z.string(),
        description: z.string().max(200),
        category: z.enum(['essentials', 'cancellation', 'destinations', 'medical', 'trip-types']),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        readingTime: z.number().int(),
        featured: z.boolean().default(false),
        order: z.number().int().default(100),
        faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([])
    })
});

// Legal pages: src/content/legal/<lang>/<key>.md
const legal = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
    schema: z.object({
        lang,
        key: z.enum(['privacy', 'terms', 'cookies', 'notice']),
        title: z.string(),
        description: z.string().max(200)
    })
});

export const collections = { guides, legal };
