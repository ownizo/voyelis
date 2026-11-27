// Countries (ISO 3166-1 alpha-2). Names are generated at build time with Intl, in each site language.
const CODES =
    'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'.split(' ');

export const COUNTRY_CODES = new Set(CODES);

const cache = new Map<string, { code: string; name: string }[]>();

/** Countries sorted by name in the given Intl locale (e.g. 'de-DE'). */
export function countries(intlLocale: string): { code: string; name: string }[] {
    if (!cache.has(intlLocale)) {
        const names = new Intl.DisplayNames([intlLocale], { type: 'region' });
        const collator = new Intl.Collator(intlLocale);
        cache.set(
            intlLocale,
            CODES.map((code) => ({ code, name: names.of(code) ?? code })).sort((a, b) => collator.compare(a.name, b.name))
        );
    }
    return cache.get(intlLocale)!;
}

// Currency the prices are shown in, derived from the country of residence (default EUR).
// All of these are among the currencies supported by the HelloSafe Atlas API.
const CURRENCY_BY_COUNTRY: Record<string, string> = {
    GB: 'GBP', GG: 'GBP', JE: 'GBP', IM: 'GBP', GI: 'GBP',
    US: 'USD', PR: 'USD', GU: 'USD', VI: 'USD', AS: 'USD', MP: 'USD', EC: 'USD', SV: 'USD', PA: 'USD',
    CH: 'CHF', LI: 'CHF',
    CA: 'CAD', AU: 'AUD', NZ: 'NZD',
    SE: 'SEK', NO: 'NOK', DK: 'DKK', IS: 'ISK',
    PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON',
    BR: 'BRL', MX: 'MXN', MA: 'MAD', ZA: 'ZAR', TR: 'TRY', IN: 'INR', HK: 'HKD', SG: 'SGD', AE: 'AED', JP: 'JPY', KR: 'KRW', PH: 'PHP'
};

export function currencyFor(residence: string): string {
    return CURRENCY_BY_COUNTRY[residence?.toUpperCase()] ?? 'EUR';
}
