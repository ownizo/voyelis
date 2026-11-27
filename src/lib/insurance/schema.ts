import { z } from 'astro/zod';
import { COUNTRY_CODES, currencyFor } from '../countries';
import { SITE_LANGUAGES, TRIP_PURPOSES, type TravelQuoteRequest } from './types';

// Error messages are codes: the browser translates them into the visitor's language.
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date');
const country = z
    .string()
    .trim()
    .toUpperCase()
    .refine((c) => COUNTRY_CODES.has(c), 'destinations');

export const quoteRequestSchema = z
    .object({
        language: z.enum(SITE_LANGUAGES).default('en'),
        residence: z
            .string()
            .trim()
            .toUpperCase()
            .refine((c) => COUNTRY_CODES.has(c), 'residence'),
        destinations: z.array(country).min(1, 'destinations').max(20, 'destinations'),
        departureDate: isoDate,
        returnDate: isoDate,
        purpose: z.enum(TRIP_PURPOSES),
        travellers: z
            .array(z.object({ age: z.coerce.number().int().min(0).max(120) }))
            .min(1, 'travellers')
            .max(50, 'travellers'),
        cancellation: z.coerce.boolean().default(false),
        tripPrice: z.coerce.number().min(0).max(10000000).optional(),
        tripBookedDate: isoDate.optional(),
        extremeSports: z.coerce.boolean().default(false),
        source: z.record(z.string(), z.string().max(200)).optional(),
        // Anti-spam honeypot: must arrive empty
        website: z.string().max(0).optional()
    })
    .refine((d) => d.returnDate >= d.departureDate, { message: 'returnDate', path: ['returnDate'] })
    .refine((d) => d.departureDate >= new Date().toISOString().slice(0, 10), { message: 'departureDate', path: ['departureDate'] })
    .refine((d) => !(d.cancellation || d.purpose === 'cancellation') || (d.tripPrice ?? 0) > 0, { message: 'tripPrice', path: ['tripPrice'] });

export function toDomain(input: z.output<typeof quoteRequestSchema>): TravelQuoteRequest {
    // "Cancellation only" is always cancellation cover: it needs the trip cost.
    const cancellation = input.cancellation || input.purpose === 'cancellation';
    return {
        language: input.language,
        residence: input.residence,
        destinations: [...new Set(input.destinations)],
        departureDate: input.departureDate,
        returnDate: input.returnDate,
        purpose: input.purpose,
        travellers: input.travellers,
        cancellation,
        tripPrice: cancellation ? input.tripPrice : undefined,
        tripBookedDate: cancellation ? input.tripBookedDate : undefined,
        extremeSports: input.extremeSports,
        currency: currencyFor(input.residence),
        source: input.source
    };
}

export const checkoutSchema = z.object({
    reference: z.string().regex(/^VY-\d{6}-[A-Z0-9]{4}$/),
    offerId: z.coerce.number().int().positive()
});
