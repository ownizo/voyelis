import type { InsuranceProvider } from '../types';

/**
 * No active API: there are no offers to show. Voyelis does not prepare manual proposals —
 * insurance is sold exclusively by HelloSafe.
 */
export const leadCaptureProvider: InsuranceProvider = {
    id: 'none',
    isConfigured: () => true,
    async quote(_request, reference) {
        return { result: { status: 'received', reference } };
    }
};
