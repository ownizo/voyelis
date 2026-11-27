/**
 * Travel-insurance domain model, independent of the provider.
 *
 * The site and the quote form only know these types. Each provider has an adapter in ./providers
 * that maps them to and from its API (today: HelloSafe Atlas).
 */

export const SITE_LANGUAGES = ['en', 'de', 'fr', 'es'] as const;
export type SiteLanguage = (typeof SITE_LANGUAGES)[number];

export const TRIP_PURPOSES = [
    'leisure',
    'business',
    'annual',
    'schengen',
    'cancellation',
    'study',
    'working-holiday',
    'cruise',
    'nomad',
    'expat',
    'au-pair',
    'humanitarian'
] as const;
export type TripPurpose = (typeof TRIP_PURPOSES)[number];

export interface Traveller {
    /** Age on the departure date. */
    age: number;
}

export interface TravelQuoteRequest {
    /** Language of the site and of the HelloSafe funnel. */
    language: SiteLanguage;
    /** Country of residence, ISO 3166-1 alpha-2. */
    residence: string;
    /** Destination countries, ISO 3166-1 alpha-2 (1 to 20). */
    destinations: string[];
    departureDate: string; // yyyy-mm-dd
    returnDate: string; // yyyy-mm-dd
    purpose: TripPurpose;
    travellers: Traveller[];
    cancellation: boolean;
    /** Total trip cost for the whole group, in `currency`. Required with cancellation. */
    tripPrice?: number;
    /** Date the trip was booked (yyyy-mm-dd). */
    tripBookedDate?: string;
    extremeSports: boolean;
    /** ISO 4217 currency for prices and tripPrice. */
    currency: string;
    source?: Record<string, string>;
}

export interface Money {
    amount: number;
    currency: string;
}

export interface Guarantee {
    state: string;
    value?: number | null;
    franchise?: number;
    franchiseDetails?: string;
}

export interface QuoteOffer {
    provider: string;
    /** Provider offer id, needed to continue to the purchase. */
    offerId: number;
    productName: string;
    plan?: string;
    insurer: string;
    imageUrl?: string | null;
    price: Money & { isStartingPrice: boolean };
    guaranteeCurrency: string;
    guarantees: Record<string, Guarantee>;
    highlights: { included: string[]; excluded: string[] };
    documents: { cgvUrl?: string | null; ipidUrl?: string | null };
    position: number;
}

export type QuoteResult =
    | {
          status: 'offers';
          reference: string;
          mode: 'sandbox' | 'live';
          offers: QuoteOffer[];
          expiresAt?: string;
          notice?: string;
      }
    | { status: 'received'; reference: string };

/** Data kept on the server only, to resume the provider session. */
export interface ProviderSession {
    provider: string;
    sessionId: string;
    trip: unknown;
    language: string;
    mode: 'sandbox' | 'live';
}

export interface ProviderQuote {
    result: QuoteResult;
    session?: ProviderSession;
}

export interface CheckoutLink {
    url: string;
    orderRef?: string | null;
    mode: 'sandbox' | 'live';
}

export interface InsuranceProvider {
    readonly id: string;
    /** true when the credentials are set and allowed in this environment. */
    isConfigured(): boolean;
    quote(request: TravelQuoteRequest, reference: string): Promise<ProviderQuote>;
    /** Creates the purchase link for the chosen offer. */
    checkout?(session: ProviderSession, offerId: number, clickRef?: string): Promise<CheckoutLink>;
}
