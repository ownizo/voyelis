import { env } from '../env';
import { atlasCredentials, atlasRequest, isSandboxKey } from '../atlas/client';
import type { CheckoutLink, InsuranceProvider, ProviderQuote, QuoteOffer, TravelQuoteRequest, TripPurpose } from '../types';

/**
 * HelloSafe Atlas provider.
 *
 * Environment variables (Netlify → Project configuration → Environment variables):
 *   ATLAS_KEY_ID            ak_test_… (sandbox) or ak_live_… (production)
 *   ATLAS_SIGNING_SECRET    signing secret (shown only once when the key is created)
 *   ATLAS_ALLOW_SANDBOX     "true" to accept a sandbox key (use only in Deploy Previews)
 *   ATLAS_WEBHOOK_SECRET    sales webhook secret (see /api/webhooks/hellosafe)
 */

// Trip.intent values of the Atlas API.
const INTENT: Record<TripPurpose, string> = {
    leisure: 'forTourism',
    business: 'forTourism',
    annual: 'annual',
    schengen: 'schengenArea',
    cancellation: 'cancellation',
    study: 'studyInternship',
    'working-holiday': 'whv',
    cruise: 'cruise',
    nomad: 'digitalNomad',
    expat: 'expat',
    'au-pair': 'auPair',
    humanitarian: 'humanitarian'
};

interface AtlasOffer {
    id: number;
    name: string;
    plan?: string;
    insurer?: { name?: string; logoUrl?: string | null };
    iconUrl?: string;
    price: { amount: number; currency: string; isStartingPrice?: boolean };
    guaranteeCurrency?: string;
    guarantees?: Record<string, { state: string; value?: number | null; franchise?: number; franchiseDetails?: string }>;
    highlights?: { included?: string[]; excluded?: string[] };
    documents?: { cgvUrl?: string | null; ipidUrl?: string | null };
    position?: number;
}

interface AtlasQuoteResponse {
    ok: boolean;
    mode: 'sandbox' | 'live';
    sessionId: string;
    offers: AtlasOffer[];
    trip: unknown;
    quote?: { expiresAt?: string };
    meta?: { notice?: string };
}

interface AtlasLinkResponse {
    ok: boolean;
    url: string;
    orderRef?: string | null;
    subscriptionId?: string;
}

export function toAtlasTrip(req: TravelQuoteRequest) {
    return {
        intent: INTENT[req.purpose] ?? 'forTourism',
        startDate: req.departureDate,
        endDate: req.returnDate,
        countryResidence: req.residence,
        arrivalCountries: req.destinations,
        travellers: req.travellers.map((t) => ({ age: t.age })),
        currency: req.currency,
        ...(req.cancellation
            ? { shouldCoverCancellation: true, tripPrice: req.tripPrice, ...(req.tripBookedDate ? { tripBoughtDate: req.tripBookedDate } : {}) }
            : {}),
        ...(req.extremeSports ? { shouldCoverExtremeSports: true } : {})
    };
}

export function fromAtlasOffer(o: AtlasOffer): QuoteOffer {
    return {
        provider: 'hellosafe',
        offerId: o.id,
        productName: o.name,
        plan: o.plan,
        insurer: o.insurer?.name ?? '',
        // Since v2.0.0 logoUrl is the offer pictogram (or the insurer logo when there is none).
        imageUrl: o.insurer?.logoUrl ?? o.iconUrl ?? null,
        price: { amount: o.price.amount, currency: o.price.currency, isStartingPrice: Boolean(o.price.isStartingPrice) },
        guaranteeCurrency: o.guaranteeCurrency ?? o.price.currency,
        guarantees: o.guarantees ?? {},
        highlights: { included: o.highlights?.included ?? [], excluded: o.highlights?.excluded ?? [] },
        documents: { cgvUrl: o.documents?.cgvUrl ?? null, ipidUrl: o.documents?.ipidUrl ?? null },
        position: o.position ?? 0
    };
}

export const hellosafeProvider: InsuranceProvider = {
    id: 'hellosafe',

    isConfigured() {
        const creds = atlasCredentials();
        if (!creds) return false;
        // A sandbox key returns fictitious prices and its link opens the real funnel:
        // never show it to real travellers. It is only used when explicitly allowed.
        if (isSandboxKey(creds.keyId) && env('ATLAS_ALLOW_SANDBOX') !== 'true') return false;
        return true;
    },

    async quote(req, reference): Promise<ProviderQuote> {
        const creds = atlasCredentials()!;
        const trip = toAtlasTrip(req);
        // The funnel opens in the visitor's language (en, de, fr, es are all supported by Atlas).
        const language = req.language;
        const { data } = await atlasRequest<AtlasQuoteResponse>(creds, 'POST', '/api/v1/travel/quotes', { trip, language });

        const offers = (data.offers ?? []).map(fromAtlasOffer);
        // Diagnostics (Netlify → Logs → Functions): key mode and number of offers.
        console.log(`[atlas] ${reference} mode=${data.mode} lang=${language} intent=${trip.intent} residence=${trip.countryResidence} currency=${trip.currency} offers=${offers.length}`);
        if (offers.length === 0) return { result: { status: 'received', reference } };

        return {
            result: { status: 'offers', reference, mode: data.mode, offers, expiresAt: data.quote?.expiresAt, notice: data.meta?.notice },
            session: { provider: 'hellosafe', sessionId: data.sessionId, trip, language, mode: data.mode }
        };
    },

    async checkout(session, offerId, clickRef): Promise<CheckoutLink> {
        const creds = atlasCredentials()!;
        const body: Record<string, unknown> = { sessionId: session.sessionId, trip: session.trip, offerId, language: session.language };
        if (clickRef) body.clickRef = clickRef;
        const { data } = await atlasRequest<AtlasLinkResponse>(creds, 'POST', '/api/v1/travel/links', body);
        return { url: data.url, orderRef: data.orderRef ?? null, mode: session.mode };
    }
};
