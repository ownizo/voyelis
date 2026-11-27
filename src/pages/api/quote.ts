import type { APIRoute } from 'astro';
import { quoteRequestSchema, toDomain } from '../../lib/insurance/schema';
import { requestQuote } from '../../lib/insurance/service';

export const prerender = false;

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async ({ request }) => {
    if (!request.headers.get('content-type')?.includes('application/json')) {
        return json({ ok: false, error: 'bad_content_type' }, 415);
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json({ ok: false, error: 'bad_request' }, 400);
    }

    const parsed = quoteRequestSchema.safeParse(body);
    if (!parsed.success) {
        // Each issue carries a code (residence, destinations, departureDate…) that the form translates.
        const fieldErrors = parsed.error.issues.map((i) => ({ field: i.path.join('.'), code: i.message }));
        return json({ ok: false, error: 'validation', fieldErrors }, 422);
    }

    // Honeypot filled in: answer as a success without processing.
    if (parsed.data.website) return json({ ok: true, result: { status: 'received', reference: 'VY-OK' } });

    const result = await requestQuote(toDomain(parsed.data));
    return json({ ok: true, result });
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method_not_allowed' }, 405);
