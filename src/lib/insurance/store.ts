import { getStore } from '@netlify/blobs';
import type { ProviderSession, QuoteResult, TravelQuoteRequest } from './types';

const QUOTES = 'voyelis-quotes';
const SALES = 'voyelis-sales';

export interface StoredQuote {
    reference: string;
    createdAt: string;
    provider: string;
    request: TravelQuoteRequest;
    /** Result summary (without repeating the full offers). */
    result: { status: QuoteResult['status']; offers?: number; mode?: string };
    /** Provider session: never sent to the browser. */
    session?: ProviderSession;
    checkouts?: { offerId: number; orderRef?: string | null; at: string }[];
    error?: string;
}

function store(name: string) {
    return getStore({ name, consistency: 'strong' });
}

export async function saveQuote(record: StoredQuote): Promise<boolean> {
    try {
        await store(QUOTES).setJSON(record.reference, record, { metadata: { createdAt: record.createdAt } });
        return true;
    } catch (err) {
        // Outside Netlify (e.g. dev without `netlify dev`) Blobs may be unavailable.
        console.warn('[quote] Netlify Blobs unavailable:', (err as Error).message);
        return false;
    }
}

export async function loadQuote(reference: string): Promise<StoredQuote | null> {
    try {
        return ((await store(QUOTES).get(reference, { type: 'json' })) as StoredQuote | null) ?? null;
    } catch (err) {
        console.warn('[quote] Blobs read failed:', (err as Error).message);
        return null;
    }
}

export async function saveSaleEvent(id: string, event: unknown): Promise<void> {
    await store(SALES).setJSON(id, event);
}

export function newReference(): string {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
    return `VY-${date}-${rand}`;
}
