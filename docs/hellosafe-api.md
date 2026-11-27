# HelloSafe Atlas integration

HelloSafe travel insurance API (`https://atlas.hellosafe.com`, v1). Server to server: the signing secret never reaches the browser.

## Flow

```
compare form ──POST /api/quote {language, trip…}──▶ validation (schema.ts)
                     └▶ HelloSafe POST /api/v1/travel/quotes {trip, language}  → offers + sessionId
                        ├─ offers returned to the browser (without sessionId)
                        └─ quote + sessionId + trip stored in Netlify Blobs ("voyelis-quotes")
traveller picks an offer ──POST /api/checkout {reference, offerId}──▶
                     └▶ HelloSafe POST /api/v1/travel/links (sessionId, trip, offerId, language, clickRef = Voyelis reference)
                        └─ returns the URL → redirect to the HelloSafe funnel (purchase and payment)
HelloSafe ──POST /api/webhooks/hellosafe──▶ sale.confirmed / sale.cancelled
                     └▶ signature checked, event stored in Blobs ("voyelis-sales") + internal email (Resend)
```

- **Language:** the site language (`en`, `de`, `fr`, `es`) is sent to Atlas, so the HelloSafe funnel opens in the same language. Atlas supports 26 funnel languages (bg, cs, da, de, el, en, es, et, fi, fr, hr, hu, is, it, lt, lv, mt, nl, no, pl, pt, ro, sk, sl, sv, tr) — no Chinese or Hebrew.
- **Currency:** derived from the country of residence (`src/lib/countries.ts`: GBP for the UK, USD for the US, CHF for Switzerland, CAD, AUD…, EUR otherwise). `tripPrice` is read in that currency.
- **Reference:** `VY-yymmdd-XXXX`, sent as `clickRef` to attribute the sale.

Without credentials, with a sandbox key that is not allowed, with no offers or on an API error, the visitor sees "No offers right now".

## Files

| File | Role |
| --- | --- |
| `src/lib/insurance/atlas/client.ts` | Signature v2 (`${ts}.${METHOD}.${pathname}.${rawBody}`), requests, errors, webhook verification (v1) |
| `src/lib/insurance/providers/hellosafe.ts` | Request → Atlas `trip` mapping and Atlas offer → `QuoteOffer`; `/quotes` and `/links` |
| `src/lib/insurance/service.ts` | Provider choice, storage, checkout |
| `src/pages/api/quote.ts`, `checkout.ts`, `webhooks/hellosafe.ts` | Serverless endpoints |
| `src/components/QuoteForm.astro` | Form, offer list (sort by medical cover or price), choice |

## Activate

1. **Netlify → Environment variables**, *Deploy Previews* context: `ATLAS_KEY_ID` (ak_test_…), `ATLAS_SIGNING_SECRET`, `ATLAS_ALLOW_SANDBOX=true`. Test on a deploy preview — the "TEST MODE" banner appears.
   ⚠️ The sandbox link opens the real HelloSafe funnel: any payment is real.
2. To request the production key, HelloSafe requires 10 prices and 1 link made in sandbox and an approved partner account.
3. With the `ak_live_…` key: set `ATLAS_KEY_ID` and `ATLAS_SIGNING_SECRET` in the *Production* context (without `ATLAS_ALLOW_SANDBOX`).
4. **Webhooks** (HelloSafe dashboard → Técnico → Webhooks): URL `https://voyelis.com/api/webhooks/hellosafe`; store the secret in `ATLAS_WEBHOOK_SECRET`.

## HelloSafe rules

- Do not cache prices for long; always show the insurer name and documents (IPID, conditions) with each offer.
- Never show sandbox prices or links to real travellers.
- Sandbox quotas: 200 prices and 50 links per day, 60 requests per minute.

## Records

```bash
netlify blobs:list voyelis-quotes
netlify blobs:get voyelis-quotes VY-261127-AB12
netlify blobs:list voyelis-sales
```
