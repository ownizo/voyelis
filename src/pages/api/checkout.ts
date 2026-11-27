import type { APIRoute } from 'astro';
import { checkoutSchema } from '../../lib/insurance/schema';
import { CheckoutError, startCheckout } from '../../lib/insurance/service';
import { AtlasError } from '../../lib/insurance/atlas/client';

export const prerender = false;

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

/** The traveller chose an offer: create the partner-attributed purchase link and return it. */
export const POST: APIRoute = async ({ request }) => {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json({ ok: false, error: 'bad_request' }, 400);
    }
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) return json({ ok: false, error: 'bad_request' }, 422);

    try {
        const link = await startCheckout(parsed.data.reference, parsed.data.offerId);
        return json({ ok: true, url: link.url, mode: link.mode });
    } catch (err) {
        if (err instanceof CheckoutError) return json({ ok: false, error: err.code }, err.status);
        if (err instanceof AtlasError) {
            console.error('[checkout] Atlas', err.status, err.code, err.detail);
            return json({ ok: false, error: err.code === 'BAD_OFFER_ID' ? 'offerGone' : 'unavailable' }, 502);
        }
        console.error('[checkout]', err);
        return json({ ok: false, error: 'unavailable' }, 500);
    }
};

export const ALL: APIRoute = () => json({ ok: false, error: 'method_not_allowed' }, 405);
