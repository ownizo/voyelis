import type { APIRoute } from 'astro';
import { verifyAtlasWebhook } from '../../../lib/insurance/atlas/client';
import { env } from '../../../lib/insurance/env';
import { sendInternalEmail } from '../../../lib/insurance/notify';
import { saveSaleEvent } from '../../../lib/insurance/store';

export const prerender = false;

/**
 * HelloSafe Atlas sales webhook (sale.confirmed / sale.cancelled).
 * Set it up in the HelloSafe dashboard → Técnico → Webhooks with the URL
 * https://voyelis.com/api/webhooks/hellosafe and store the secret in ATLAS_WEBHOOK_SECRET.
 * Answer 2xx within 10 s; repeated deliveries are de-duplicated by event id.
 */
export const POST: APIRoute = async ({ request }) => {
    const secret = env('ATLAS_WEBHOOK_SECRET');
    if (!secret) return new Response('Webhook not configured', { status: 503 });

    const raw = await request.text(); // raw body: the signature is computed over these exact bytes
    const ok = verifyAtlasWebhook(raw, request.headers.get('x-atlas-timestamp'), request.headers.get('x-atlas-signature'), secret);
    if (!ok) return new Response('Invalid signature', { status: 401 });

    let event: any;
    try {
        event = JSON.parse(raw);
    } catch {
        return new Response('Invalid JSON', { status: 400 });
    }

    const id = String(event?.id ?? request.headers.get('x-atlas-event-id') ?? '');
    if (!id) return new Response('Event without id', { status: 400 });

    await saveSaleEvent(id, { receivedAt: new Date().toISOString(), ...event });

    const d = event.data ?? {};
    const fmt = (m?: { amount?: number; currency?: string }) => (m ? `${m.amount} ${m.currency}` : '—');
    await sendInternalEmail(`Voyelis · HelloSafe: ${event.type}${event.liveMode === false ? ' (test)' : ''}`, [
        ['Event', `${event.type} · ${id}`],
        ['Order', String(d.orderId ?? '—')],
        ['Quote reference', String(d.clickRef ?? '—')],
        ['Insurer', String(d.insurer ?? '—')],
        ['Premium', fmt(d.premium)],
        ['Paid by customer', fmt(d.paid)],
        ['Commission', fmt(d.commission)],
        ['Status', `${d.status ?? '—'}${d.reason ? ` (${d.reason})` : ''}`],
        ['Date', String(d.occurredAt ?? event.createdAt ?? '—')]
    ]);

    return new Response('ok', { status: 200 });
};
