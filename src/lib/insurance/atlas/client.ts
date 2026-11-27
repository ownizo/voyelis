import { createHmac } from 'node:crypto';
import { env } from '../env';

/**
 * HelloSafe Atlas client (travel insurance API).
 * Docs: https://atlas.hellosafe.com — signature scheme v2.
 *
 * Server to server only: the signing secret must never reach the browser.
 */

export const ATLAS_BASE_URL = 'https://atlas.hellosafe.com';

export class AtlasError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string,
        public readonly detail?: unknown
    ) {
        super(`Atlas ${status} ${code}`);
    }
}

export interface AtlasCredentials {
    keyId: string;
    secret: string;
    baseUrl: string;
}

export function atlasCredentials(): AtlasCredentials | undefined {
    const keyId = env('ATLAS_KEY_ID');
    const secret = env('ATLAS_SIGNING_SECRET');
    if (!keyId || !secret) return undefined;
    return { keyId, secret, baseUrl: env('ATLAS_BASE_URL') ?? ATLAS_BASE_URL };
}

export const isSandboxKey = (keyId: string) => keyId.startsWith('ak_test_');

/** Signed message v2: `${ts}.${METHOD}.${pathname}.${rawBody}` (GET: empty body). */
export function signV2(secret: string, ts: string, method: string, pathname: string, rawBody: string): string {
    return 'v2=' + createHmac('sha256', secret).update(`${ts}.${method}.${pathname}.${rawBody}`).digest('hex');
}

export async function atlasRequest<T>(
    creds: AtlasCredentials,
    method: 'GET' | 'POST',
    pathname: string,
    payload?: unknown,
    timeoutMs = 26000
): Promise<{ data: T; status: number; headers: Headers }> {
    // Serialise ONCE and send exactly the string that was signed.
    const rawBody = method === 'POST' ? JSON.stringify(payload ?? {}) : '';
    const ts = Math.floor(Date.now() / 1000).toString();
    const signature = signV2(creds.secret, ts, method, pathname, rawBody);

    const res = await fetch(creds.baseUrl + pathname, {
        method,
        headers: {
            ...(method === 'POST' ? { 'content-type': 'application/json' } : {}),
            accept: 'application/json',
            'x-atlas-key-id': creds.keyId,
            'x-atlas-timestamp': ts,
            'x-atlas-signature': signature
        },
        body: method === 'POST' ? rawBody : undefined,
        signal: AbortSignal.timeout(timeoutMs)
    });

    const text = await res.text();
    let data: any;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new AtlasError(res.status, 'NON_JSON_RESPONSE', text.slice(0, 200));
    }
    if (!res.ok || data?.ok === false) {
        throw new AtlasError(res.status, String(data?.error ?? `HTTP_${res.status}`), data?.detail ?? data?.field);
    }
    return { data: data as T, status: res.status, headers: res.headers };
}

/**
 * Verifies the signature of a sales webhook (webhook scheme v1):
 * `X-Atlas-Signature: v1=<hex HMAC-SHA256 of "${ts}.${rawBody}">`, with the webhook secret.
 * During a secret rotation two comma-separated signatures may arrive.
 */
export function verifyAtlasWebhook(rawBody: string, timestamp: string | null, signatureHeader: string | null, secret: string): boolean {
    if (!timestamp || !signatureHeader) return false;
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
    const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
    return signatureHeader
        .split(',')
        .map((s) => s.trim().replace(/^v1=/, ''))
        .some((sig) => sig.length === expected.length && timingSafeEqualHex(sig, expected));
}

function timingSafeEqualHex(a: string, b: string): boolean {
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}
