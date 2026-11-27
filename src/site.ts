// Central brand, operator and partner data.
// Changing a value here updates the header, footer, legal pages and structured data in every language.

export const SITE = {
    name: 'Voyelis',
    url: 'https://voyelis.com',
    email: 'info@voyelis.com'
} as const;

/** Company that runs the platform (marketing and information only; it does not sell insurance). */
export const OPERATOR = {
    legalName: 'Ownizo, Unipessoal Lda.',
    street: 'Av. do Atlântico 16, Esc. 5.07',
    postalCode: '1990-019',
    city: 'Lisboa',
    country: 'Portugal',
    countryCode: 'PT',
    address: 'Av. do Atlântico 16, Esc. 5.07, 1990-019 Lisboa, Portugal',
    /** NIPC / VAT number. Fill in to show it in the legal notice (Impressum / mentions légales / aviso legal). */
    taxId: '',
    groupUrl: 'https://ownizo.com'
} as const;

/** Partner that sells the insurance (subscription, payment and after-sales support). */
export const PARTNER = {
    name: 'HelloSafe',
    legalName: 'HELLO SAFE SAS',
    registry: 'RCS Rennes 883 069 593',
    address: '5 allée de la Grande Treille, 35200 Rennes, France',
    orias: '21008038',
    oriasUrl: 'https://www.orias.fr',
    website: 'https://hellosafe.com'
} as const;

/** ISO date of the last update of the legal pages. */
export const LEGAL_UPDATED = '2026-11-27';
