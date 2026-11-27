// Languages and localised URLs.
// English lives at the root (/), the other languages under their prefix (/de, /fr, /es).
// Only languages supported by the HelloSafe Atlas subscription funnel are offered.

export const LOCALES = ['en', 'de', 'fr', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_META: Record<Locale, { label: string; short: string; htmlLang: string; ogLocale: string; intl: string }> = {
    en: { label: 'English', short: 'EN', htmlLang: 'en', ogLocale: 'en_GB', intl: 'en-GB' },
    de: { label: 'Deutsch', short: 'DE', htmlLang: 'de', ogLocale: 'de_DE', intl: 'de-DE' },
    fr: { label: 'Français', short: 'FR', htmlLang: 'fr', ogLocale: 'fr_FR', intl: 'fr-FR' },
    es: { label: 'Español', short: 'ES', htmlLang: 'es', ogLocale: 'es_ES', intl: 'es-ES' }
};

export type PageKey = 'home' | 'compare' | 'guides' | 'about' | 'privacy' | 'terms' | 'cookies' | 'notice';

/** Path (without leading slash) of each page in each language. */
export const PAGE_PATHS: Record<PageKey, Record<Locale, string>> = {
    home: { en: '', de: 'de', fr: 'fr', es: 'es' },
    compare: { en: 'compare', de: 'de/vergleich', fr: 'fr/comparer', es: 'es/comparar' },
    guides: { en: 'guides', de: 'de/ratgeber', fr: 'fr/guides', es: 'es/guias' },
    about: { en: 'about', de: 'de/ueber-uns', fr: 'fr/a-propos', es: 'es/quienes-somos' },
    privacy: { en: 'privacy', de: 'de/datenschutz', fr: 'fr/confidentialite', es: 'es/privacidad' },
    terms: { en: 'terms', de: 'de/agb', fr: 'fr/conditions-generales', es: 'es/condiciones' },
    cookies: { en: 'cookies', de: 'de/cookies', fr: 'fr/cookies', es: 'es/cookies' },
    notice: { en: 'legal-notice', de: 'de/impressum', fr: 'fr/mentions-legales', es: 'es/aviso-legal' }
};

/** Absolute path (leading slash, no trailing slash) of a page. */
export function pagePath(key: PageKey, locale: Locale): string {
    return '/' + PAGE_PATHS[key][locale];
}

export function guidePath(locale: Locale, slug: string): string {
    return `${pagePath('guides', locale)}/${slug}`;
}
