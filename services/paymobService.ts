import { getFunctions, httpsCallable } from 'firebase/functions';

interface PaymobIntentionRequest {
    amount: number;       // in major currency units (e.g. 99.00 for EGP 99)
    currency: string;     // e.g. 'EGP', 'USD'
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    optimizationId?: string; // existing Firestore doc to reuse instead of creating a new one
}

interface PaymobIntentionResponse {
    clientSecret: string;
    optimizationId: string;
}

/**
 * Calls the `createPaymobIntention` Firebase Cloud Function.
 * The Cloud Function handles all secret-key communication with Paymob server-side.
 * Returns a clientSecret (for the iFrame) and an optimizationId (Firestore record ID).
 */
export const createPaymentIntention = async (
    data: PaymobIntentionRequest
): Promise<PaymobIntentionResponse> => {
    const functions = getFunctions();
    const createIntention = httpsCallable<PaymobIntentionRequest, PaymobIntentionResponse>(
        functions,
        'createPaymobIntention'
    );

    const result = await createIntention(data);
    return result.data;
};

/**
 * Builds the Paymob Unified Checkout iFrame URL.
 * Uses the PUBLIC key (safe to be in the client) and the clientSecret from the server.
 */
export const buildPaymobCheckoutUrl = (clientSecret: string): string => {
    // Access Vite env variables safely (avoids tsconfig type conflicts)
    const env = (import.meta as any).env ?? {};
    const publicKey = env.VITE_PAYMOB_PUBLIC_KEY;
    if (!publicKey || publicKey === 'YOUR_PAYMOB_PUBLIC_KEY_HERE') {
        throw new Error('VITE_PAYMOB_PUBLIC_KEY is not configured in environment variables.');
    }
    const base = env.VITE_PAYMOB_BASE_URL || 'https://accept.paymob.com';
    return `${base}/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${clientSecret}`;
};
