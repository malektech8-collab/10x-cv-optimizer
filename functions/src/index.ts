import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

admin.initializeApp();

// Use process.env for local .env or Firebase functions config
const geminiApiKey = process.env.GEMINI_API_KEY || '';

const ANALYSIS_SYSTEM_INSTRUCTION = (targetLang: 'en' | 'ar') => `You are an Expert Resume Analyst and ATS Specialist.
Analyze the provided resume and return a JSON object with the following structure:
{
  "score": number (0-100),
  "grammarIssues": string[] (max 3, specific examples),
  "structureGaps": string[] (max 3, e.g., missing contact info, poor formatting),
  "atsCompatibility": "Low" | "Medium" | "High",
  "impactOptimizations": string[] (max 3, e.g., "Use action verbs", "Quantify results"),
  "summary": string (A short, compelling call to action explaining why optimizing this resume will land them more interviews)
}

IMPORTANT: Provide ALL the JSON values (strings and arrays) entirely in ${targetLang === 'ar' ? 'Arabic (Modern Standard Arabic)' : 'English'}, but KEEP the JSON keys exactly as shown above. Respond ONLY with valid JSON. Do not include markdown fences like \`\`\`json.`;

export const analyzeResume = functions.https.onCall(
    { cors: true },
    async (request) => {
        // Require authentication - users must be logged in to analyze
        if (!request.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to analyze your resume.');
        }

        const { fileBase64, mimeType, targetLang } = request.data;

        if (!fileBase64 || !mimeType || !targetLang) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required arguments');
        }

        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        parts: [
                            {
                                inlineData: {
                                    data: fileBase64,
                                    mimeType: mimeType,
                                },
                            },
                            {
                                text: "Please analyze this resume and provide the analysis report in JSON.",
                            },
                        ],
                    },
                ],
                config: {
                    systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION(targetLang),
                    temperature: 0.1,
                    responseMimeType: "application/json",
                },
            });

            let text = response.text || "";
            if (text.includes('```')) {
                text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            }

            return JSON.parse(text);
        } catch (error: any) {
            console.error("Gemini API Error (Analysis):", error);
            throw new functions.https.HttpsError('internal', error.message || 'Analysis failed');
        }
    }
);

const OPTIMIZE_SYSTEM_INSTRUCTION = (targetLang: 'en' | 'ar') => `You are an Expert Resume Writer and ATS (Applicant Tracking System) Optimization Specialist.

OBJECTIVE
Rewrite the provided resume into a high-impact, ATS-optimized, professional resume.
1. Easy for ATS software to parse.
2. Compelling for recruiters.
7. Best Practices 2026: Use standard fonts, single-column layout, simple bullet points, strongly quantify achievements (e.g., 'Increased sales by 15%'), use action verbs, naturally embed exact keywords from job description. No complex formatting.

You must rewrite the content completely, enhancing bullet points with action verbs and quantifiable results.

USER PREFERENCE OVERRIDE (MANDATORY)
- If the user provides specific "Comments" or "Custom Instructions", you ABSOLUTELY MUST prioritize them over other general instructions. This includes requests to change tone, hide certain information, or focus on a specific career path.

LANGUAGE RULE
- You MUST output the ENTIRE optimized resume content in ${targetLang === 'ar' ? 'professional Modern Standard Arabic' : 'English'}.
- Do not mix languages unless strictly necessary for names or technical terms.

OUTPUT FORMAT — STRICT HTML ONLY
- Return ONLY valid HTML.
- DO NOT use markdown code fences (like \`\`\`html).
- DO NOT provide any introductory or concluding text.
- Start directly with <!DOCTYPE html>.

HTML STRUCTURE
- Use <!DOCTYPE html><html dir="${targetLang === 'ar' ? 'rtl' : 'ltr'}"><head><title>Resume</title><style>@page { size: letter; margin: 0; } * { box-sizing: border-box; } body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333; margin: 0 auto; padding: 0.5in; max-width: 8.5in; word-wrap: break-word; overflow-wrap: break-word; ${targetLang === 'ar' ? 'direction: rtl; text-align: right;' : 'direction: ltr; text-align: left;'} } h1 { color: #4D2B8C; margin-top: 0; } h2 { color: #4D2B8C; border-bottom: 1px solid #eee; padding-bottom: 4px; } h3 { font-weight: bold; margin-bottom: 2px; } p, ul { margin-top: 4px; }</style></head><body>...</body></html>
- Use <h1> for the name.
- Use <h2> for section headings (e.g., Professional Summary, Work Experience, Education, Skills).
- Use <h3> for Job Titles and Company names.
- Use <ul> and <li> for simple bullet points. Avoid decorative symbols.
- Use <p> for contact info and descriptions.
- DO NOT use external stylesheets or inline styles (rely on the <style> block above).

CONTENT RULES
- ❌ No hallucinations. Use only provided info.
- ❌ No tables, columns, text boxes, or graphics.
- ❌ No icons or photos.
- ❌ No keyword stuffing. Integrate keywords naturally.
- Ensure the header includes Name, Phone, Email, LinkedIn, and Location if available.`;

export const optimizeResume = functions.https.onCall(
    { cors: true },
    async (request) => {
        // Require authentication - users must be logged in to optimize
        if (!request.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to optimize your resume.');
        }

        const { fileBase64, mimeType, targetLang, userComments, optimizationId } = request.data;

        // Verify payment status in Firestore if optimizationId is provided (existing optimization)
        if (optimizationId) {
            const docRef = admin.firestore().collection('optimizations').doc(optimizationId);
            const doc = await docRef.get();
            // If the record doesn't exist or belongs to a different user, deny access
            if (!doc.exists || doc.data()?.user_id !== request.auth.uid) {
                throw new functions.https.HttpsError('permission-denied', 'Unauthorized access to this optimization record.');
            }
            // Check if payment is required for existing optimization
            if (!doc.data()?.is_paid) {
                throw new functions.https.HttpsError('failed-precondition', 'Payment required for export and premium access. Please unlock your resume to proceed.');
            }
        }
        // For new optimizations (no ID yet), payment will be enforced when saving to Firestore

        if (!fileBase64 || !mimeType || !targetLang) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required arguments');
        }

        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        try {
            const response = await ai.models.generateContent({
                // Using Pro for higher quality on paid tier
                model: 'gemini-2.5-pro',
                contents: [
                    {
                        parts: [
                            {
                                inlineData: {
                                    data: fileBase64,
                                    mimeType: mimeType,
                                },
                            },
                            {
                                text: `Please rewrite this resume. Follow the ATS optimization instructions perfectly. Ensure the output is valid HTML and contains all the professional sections.\n\n${userComments ? `\n\n=====================\nCRITICAL USER INSTRUCTIONS:\nThe user explicitly requested the following changes. You MUST apply them:\n"${userComments}"\n=====================\n\n` : ''}`,
                            },
                        ],
                    },
                ],
                config: {
                    systemInstruction: OPTIMIZE_SYSTEM_INSTRUCTION(targetLang),
                    temperature: 0.1,
                },
            });

            let text = response.text || "";
            if (text.includes('```')) {
                text = text.replace(/```html/g, '').replace(/```/g, '').trim();
            }

            if (!text || text.length < 50) {
                throw new Error("The AI returned an empty or insufficient response.");
            }

            return { html: text };
        } catch (error: any) {
            console.error("Gemini API Error (Optimization):", error);
            throw new functions.https.HttpsError('internal', error.message || 'Optimization failed');
        }
    }
);

const CHATBOT_SYSTEM_INSTRUCTION = (targetLang: 'en' | 'ar') => `You are a Career Consultant and HR Expert.
Your primary role is to answer questions about CV building, ATS navigation, interview answers, and career advice.
Keep your responses fairly short, concise, and helpful. Do not write essays. Use formatting like bullet points when helpful.
Always respond in ${targetLang === 'ar' ? 'Arabic' : 'English'}, matching the language of the prompt.`;

export const chatWithConsultant = functions.https.onCall(
    { cors: true },
    async (request) => {
        const { messages, targetLang } = request.data;

        if (!messages || !Array.isArray(messages)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid messages array');
        }

        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        try {
            const formattedHistory = messages.slice(0, -1).map((msg: any) => ({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));
            const latestMessage = messages[messages.length - 1];

            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: CHATBOT_SYSTEM_INSTRUCTION(targetLang),
                    temperature: 0.7,
                },
                history: formattedHistory
            });

            const response = await chat.sendMessage({ message: latestMessage.text });
            return { text: response.text || "" };
        } catch (error: any) {
            console.error("Gemini Chat API Error:", error);
            throw new functions.https.HttpsError('internal', error.message || 'Chat failed');
        }
    }
);

// Paymob Payment Integration
const PAYMOB_BASE_URL = 'https://api.paymob.com/api/acceptance';
const PAYMOB_AUTH_URL = 'https://accept.paymobsolutions.com/api/auth/tokens';

// Helper function to get Paymob credentials
function getPaymobCredentials() {
    try {
        const config = require('firebase-functions').config;
        const apiKey = config().paymob?.api_key || process.env.PAYMOB_API_KEY || '';
        const merchantId = config().paymob?.merchant_id || process.env.PAYMOB_MERCHANT_ID || '';
        return { apiKey, merchantId };
    } catch (error) {
        console.error('Error reading Paymob config:', error);
        return { apiKey: process.env.PAYMOB_API_KEY || '', merchantId: process.env.PAYMOB_MERCHANT_ID || '' };
    }
}

interface PaymentInitiateRequest {
    amount: number; // Amount in cents
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
    optimizationId?: string;
    language: 'en' | 'ar';
}

/**
 * Cloud Function: Initiate a payment with Paymob
 * Creates an auth token, then processes the payment
 */
export const initiatePayment = functions.https.onCall(
    { cors: true },
    async (request) => {
        const data = request.data as PaymentInitiateRequest;

        if (!data.amount || !data.cardNumber || !data.cvv || !data.cardholderName) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required payment information');
        }

        const { apiKey: PAYMOB_API_KEY, merchantId: PAYMOB_MERCHANT_ID } = getPaymobCredentials();

        if (!PAYMOB_API_KEY || !PAYMOB_MERCHANT_ID) {
            console.error('Paymob API credentials not configured');
            throw new functions.https.HttpsError('internal', 'Payment service not properly configured');
        }

        try {
            // Step 1: Get authentication token from Paymob
            const authResponse = await fetch(PAYMOB_AUTH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: PAYMOB_API_KEY })
            });

            if (!authResponse.ok) {
                throw new Error('Failed to authenticate with Paymob');
            }

            const authData = await authResponse.json();
            const authToken = authData.token;

            // Step 2: Create payment order/transaction
            const orderResponse = await fetch(`${PAYMOB_BASE_URL}/orders/payment_processes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${authToken}`
                },
                body: JSON.stringify({
                    merchant_id: PAYMOB_MERCHANT_ID,
                    amount_cents: data.amount,
                    currency: 'EGP', // or SAR if preferred
                    payment_type: 'card',
                    items: [
                        {
                            name: 'Resume Optimization',
                            description: 'Professional resume optimization and ATS enhancement',
                            amount_cents: data.amount,
                            quantity: 1
                        }
                    ],
                    billing_data: {
                        apartment: 'N/A',
                        email: 'user@example.com',
                        floor: 'N/A',
                        first_name: data.cardholderName.split(' ')[0] || 'User',
                        last_name: data.cardholderName.split(' ')[1] || 'User',
                        phone_number: request.auth?.uid || 'N/A',
                        postal_code: '00000',
                        street: 'N/A',
                        town: 'N/A',
                        country: 'SA' // Saudi Arabia
                    }
                })
            });

            if (!orderResponse.ok) {
                const errorData = await orderResponse.json();
                console.error('Paymob order creation failed:', errorData);
                throw new Error('Failed to create payment order');
            }

            const orderData = await orderResponse.json();
            const orderId = orderData.id;

            // Step 3: Process card payment
            const paymentResponse = await fetch(`${PAYMOB_BASE_URL}/payments/card`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${authToken}`
                },
                body: JSON.stringify({
                    source: {
                        identifier: data.cardNumber,
                        source_type: 'card',
                        pan: data.cardNumber,
                        expiry_month: parseInt(data.expiryMonth),
                        expiry_year: parseInt(data.expiryYear),
                        cvv: data.cvv,
                        cardholder_name: data.cardholderName
                    },
                    payment_details: {
                        amount_cents: data.amount,
                        order_id: orderId,
                        billing_reference: `RES-${Date.now()}`,
                        notification_url: '',
                        order_registration_data: {
                            bill_reference: `RES-${Date.now()}`
                        }
                    }
                })
            });

            if (!paymentResponse.ok) {
                const errorData = await paymentResponse.json();
                console.error('Paymob payment failed:', errorData);

                // Check if it's a card decline
                if (errorData.detail === 'Insufficient balance') {
                    throw new Error('Your card has insufficient balance');
                }
                if (errorData.detail?.includes('declined')) {
                    throw new Error('Your card has been declined');
                }
                throw new Error('Payment processing failed. Please check your card details.');
            }

            const paymentData = await paymentResponse.json();
            const transactionId = paymentData.id;

            // Step 4: Update Firestore with payment record
            if (data.optimizationId && request.auth) {
                try {
                    await admin.firestore().collection('optimizations').doc(data.optimizationId).update({
                        is_paid: true,
                        payment_transaction_id: transactionId,
                        payment_amount: data.amount / 100, // Convert back to normal amount
                        payment_currency: 'SAR',
                        payment_date: new Date().toISOString(),
                        payment_method: 'paymob_card'
                    });
                } catch (firestoreErr) {
                    console.error('Failed to update Firestore with payment:', firestoreErr);
                    // Don't fail the payment - just log the error
                }
            }

            return {
                success: true,
                message: 'Payment processed successfully',
                transactionId: transactionId,
                orderId: orderId
            };
        } catch (error: any) {
            console.error('Payment processing error:', error);
            const errorMessage = error.message || 'An error occurred while processing your payment';
            throw new functions.https.HttpsError('internal', errorMessage);
        }
    }
);

/**
 * Cloud Function: Verify payment status
 * Checks if a transaction was successful
 */
export const verifyPaymentStatus = functions.https.onCall(
    { cors: true },
    async (request) => {
        const { transactionId } = request.data;

        if (!transactionId) {
            throw new functions.https.HttpsError('invalid-argument', 'Transaction ID is required');
        }

        const { apiKey: PAYMOB_API_KEY } = getPaymobCredentials();

        if (!PAYMOB_API_KEY) {
            throw new functions.https.HttpsError('internal', 'Payment service not configured');
        }

        try {
            // Get authentication token
            const authResponse = await fetch(PAYMOB_AUTH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: PAYMOB_API_KEY })
            });

            const authData = await authResponse.json();
            const authToken = authData.token;

            // Query transaction status
            const statusResponse = await fetch(
                `${PAYMOB_BASE_URL}/payments/${transactionId}`,
                {
                    headers: { 'Authorization': `Token ${authToken}` }
                }
            );

            if (!statusResponse.ok) {
                throw new Error('Failed to verify payment status');
            }

            const statusData = await statusResponse.json();

            return {
                success: statusData.success || false,
                status: statusData.status,
                message: statusData.error_occured ? 'Payment failed' : 'Payment successful'
            };
        } catch (error: any) {
            console.error('Payment verification error:', error);
            throw new functions.https.HttpsError('internal', 'Failed to verify payment status');
        }
    }
);
