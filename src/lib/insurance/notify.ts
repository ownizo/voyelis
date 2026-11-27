import { env } from './env';

function escape(s: string): string {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Envia um email interno via Resend, se RESEND_API_KEY, NOTIFY_FROM e NOTIFY_TO estiverem definidos. */
export async function sendInternalEmail(subject: string, rows: [string, string][], replyTo?: string): Promise<void> {
    const apiKey = env('RESEND_API_KEY');
    const from = env('NOTIFY_FROM');
    const to = env('NOTIFY_TO');
    if (!apiKey || !from || !to) return;
/** Sends an internal email via Resend when RESEND_API_KEY, NOTIFY_FROM and NOTIFY_TO are set. */
    const html = `<h2>${escape(subject)}</h2><table cellpadding="6">${rows
        .map(([k, v]) => `<tr><td><strong>${escape(k)}</strong></td><td>${escape(v)}</td></tr>`)
        .join('')}</table>`;
    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to: to.split(',').map((s) => s.trim()), ...(replyTo ? { reply_to: replyTo } : {}), subject, html })
        });
        if (!res.ok) console.warn('[notify] Resend replied', res.status, await res.text());
    } catch (err) {
        console.warn('[notify] Email failed:', (err as Error).message);
    }
}
