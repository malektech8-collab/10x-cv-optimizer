import * as functions from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import * as crypto from 'crypto';
import { extractText } from './extractText';
import {
    parseResumeToJson,
    detectCareerStage, extractKeywords, enhanceBullets,
    rewriteWithPipeline, validateATS,
    generateCoverLetter, generateLinkedInGuide,
} from './claudeService';

admin.initializeApp();

// ─── API Keys ───────────────────────────────────────────────────────────────
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');

// ─── Paymob Secrets ─────────────────────────────────────────────────────────
const PAYMOB_SECRET_KEY = defineSecret('PAYMOB_SECRET_KEY');
const PAYMOB_HMAC_SECRET = defineSecret('PAYMOB_HMAC_SECRET');
const PAYMOB_INTEGRATION_IDS = defineSecret('PAYMOB_INTEGRATION_IDS');

const PAYMOB_BASE_URL = 'https://ksa.paymob.com';
const FUNCTIONS_BASE_URL = process.env.FUNCTIONS_BASE_URL
    || 'https://us-central1-x-cv-optimizer.cloudfunctions.net';
const HOSTING_BASE_URL = process.env.HOSTING_BASE_URL
    || 'https://x-cv-optimizer.web.app';

// ════════════════════════════════════════════════════════════════════════════
//  RESUME ANALYSIS — Text extraction + Claude parse + Gemini ATS (parallel)
// ════════════════════════════════════════════════════════════════════════════

const ATS_ANALYSIS_SYSTEM = (targetLang: 'en' | 'ar') => `You are an Expert Resume Analyst and ATS Specialist.
Analyze the provided resume text and return a JSON object with the following structure:
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
    { cors: true, secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 180, memory: '512MiB' },
    async (request) => {
        const { fileBase64, mimeType, targetLang } = request.data;

        if (!fileBase64 || !mimeType || !targetLang) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required arguments');
        }

        const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        try {
            // Step 1: Extract text from file
            const extractedText = await extractText(fileBase64, mimeType, anthropic);

            if (!extractedText || extractedText.length < 20) {
                throw new Error('Could not extract meaningful text from the uploaded file.');
            }

            // Step 2: Run Claude parse + Gemini ATS analysis in parallel
            const [parsedJson, analysisReport] = await Promise.all([
                // Claude Sonnet: parse resume into structured JSON
                parseResumeToJson(extractedText, targetLang, anthropic),

                // Gemini Flash: ATS diagnostics (plain text, not base64)
                (async () => {
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `Here is the resume text to analyze:\n\n${extractedText}`,
                                    },
                                ],
                            },
                        ],
                        config: {
                            systemInstruction: ATS_ANALYSIS_SYSTEM(targetLang),
                            temperature: 0.1,
                            responseMimeType: "application/json",
                        },
                    });

                    let text = response.text || "";
                    if (text.includes('```')) {
                        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
                    }
                    return JSON.parse(text);
                })(),
            ]);

            // Step 3: Store parse session in Firestore for the rewrite step
            const sessionRef = admin.firestore().collection('parse_sessions').doc();
            await sessionRef.set({
                user_id: request.auth?.uid || null,
                extracted_text: extractedText,
                parsed_json: parsedJson,
                target_lang: targetLang,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Return analysis report + session ID + parsed JSON for deterministic scoring
            return {
                report: analysisReport,
                sessionId: sessionRef.id,
                parsedJson,
            };
        } catch (error: any) {
            console.error("Analysis pipeline error:", error);
            throw new functions.https.HttpsError('internal', error.message || 'Analysis failed');
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  RESUME OPTIMIZATION — Claude Sonnet rewrite (reads from parse session)
// ════════════════════════════════════════════════════════════════════════════

export const optimizeResume = functions.https.onCall(
    { cors: true, secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 300, memory: '1GiB' },
    async (request) => {
        const { sessionId, targetLang, userComments, optimizationId, jobTitle, industry, jobDescription } = request.data;

        if (!sessionId || !targetLang) {
            throw new functions.https.HttpsError('invalid-argument', 'sessionId and targetLang are required');
        }

        // Payment gate: only enforce when an optimizationId is provided
        if (optimizationId) {
            if (!request.auth) {
                throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to access this optimization.');
            }
            const docRef = admin.firestore().collection('optimizations').doc(optimizationId);
            const doc = await docRef.get();
            if (!doc.exists) {
                throw new functions.https.HttpsError('not-found', 'Optimization record not found.');
            }
            if (doc.data()?.user_id !== request.auth.uid) {
                throw new functions.https.HttpsError('permission-denied', 'Unauthorized access to this optimization record.');
            }
            if (!doc.data()?.is_paid) {
                throw new functions.https.HttpsError('failed-precondition', 'Payment is required before optimization can proceed.');
            }
        }

        try {
            // Read the stored parse session
            const sessionSnap = await admin.firestore().collection('parse_sessions').doc(sessionId).get();
            if (!sessionSnap.exists) {
                throw new functions.https.HttpsError('not-found', 'Parse session expired or not found. Please re-upload your resume.');
            }

            const session = sessionSnap.data()!;
            const extractedText = session.extracted_text as string;
            const parsedJson = session.parsed_json as Record<string, any>;

            const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });

            // ── Multi-Stage AI Pipeline ──
            // Stage 2 & 3: Run career stage detection and keyword extraction in parallel
            const [careerStage, keywords] = await Promise.all([
                detectCareerStage(parsedJson, anthropic),
                extractKeywords(targetLang, jobTitle, industry, jobDescription, anthropic),
            ]);

            // Stage 4: Enhance bullet points
            const enhanced = await enhanceBullets(parsedJson, targetLang, anthropic);

            // Stage 5: Context-aware rewrite using all pipeline outputs
            const resumeData = await rewriteWithPipeline({
                parsedJson,
                extractedText,
                careerStage,
                keywords,
                enhancedBullets: enhanced,
                targetLang,
                userComments,
            }, anthropic);

            // Stage 6: ATS validation + extras (non-blocking, run in parallel)
            let atsValidation = null;
            let coverLetter = null;
            let linkedinGuide = null;

            const extras = await Promise.allSettled([
                validateATS(resumeData, keywords, targetLang, anthropic),
                generateCoverLetter(resumeData, targetLang, jobTitle, undefined, anthropic),
                generateLinkedInGuide(resumeData, targetLang, jobTitle, industry, anthropic),
            ]);

            if (extras[0].status === 'fulfilled') atsValidation = extras[0].value;
            else console.warn('ATS validation failed (non-critical):', extras[0].reason);

            if (extras[1].status === 'fulfilled') coverLetter = extras[1].value;
            else console.warn('Cover letter generation failed (non-critical):', extras[1].reason);

            if (extras[2].status === 'fulfilled') linkedinGuide = extras[2].value;
            else console.warn('LinkedIn guide generation failed (non-critical):', extras[2].reason);

            return { resumeData, atsValidation, coverLetter, linkedinGuide };
        } catch (error: any) {
            console.error("Optimization pipeline error:", error);
            if (error instanceof functions.https.HttpsError) throw error;
            throw new functions.https.HttpsError('internal', error.message || 'Optimization failed');
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  CREATE RESUME SESSION — For AI Resume Builder (interview → optimization)
// ════════════════════════════════════════════════════════════════════════════

export const createResumeSession = functions.https.onCall(
    { cors: true },
    async (request) => {
        const { resumeData, targetLang } = request.data;

        if (!resumeData || !targetLang) {
            throw new functions.https.HttpsError('invalid-argument', 'resumeData and targetLang are required');
        }

        try {
            // Build a text summary from the structured JSON for pipeline compatibility
            const lines: string[] = [];
            if (resumeData.contact?.name) lines.push(`Name: ${resumeData.contact.name}`);
            if (resumeData.contact?.email) lines.push(`Email: ${resumeData.contact.email}`);
            if (resumeData.contact?.phone) lines.push(`Phone: ${resumeData.contact.phone}`);
            if (resumeData.contact?.location) lines.push(`Location: ${resumeData.contact.location}`);
            if (resumeData.contact?.linkedin) lines.push(`LinkedIn: ${resumeData.contact.linkedin}`);
            if (resumeData.summary) lines.push(`\nSummary:\n${resumeData.summary}`);
            if (resumeData.workExperience?.length) {
                lines.push('\nWork Experience:');
                for (const exp of resumeData.workExperience) {
                    lines.push(`${exp.jobTitle} at ${exp.company} (${exp.dateRange})`);
                    for (const b of exp.bullets || []) lines.push(`  - ${b}`);
                }
            }
            if (resumeData.education?.length) {
                lines.push('\nEducation:');
                for (const edu of resumeData.education) {
                    lines.push(`${edu.degree} — ${edu.institution}${edu.dateRange ? ` (${edu.dateRange})` : ''}`);
                }
            }
            if (resumeData.skills?.length) lines.push(`\nSkills: ${resumeData.skills.join(', ')}`);

            const extractedText = lines.join('\n');

            const sessionRef = admin.firestore().collection('parse_sessions').doc();
            await sessionRef.set({
                user_id: request.auth?.uid || null,
                extracted_text: extractedText,
                parsed_json: resumeData,
                target_lang: targetLang,
                source: 'resume_builder',
                created_at: admin.firestore.FieldValue.serverTimestamp(),
            });

            return { sessionId: sessionRef.id };
        } catch (error: any) {
            console.error('createResumeSession error:', error);
            throw new functions.https.HttpsError('internal', error.message || 'Failed to create resume session');
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  CAREER CONSULTANT CHATBOT — GPT-4o
// ════════════════════════════════════════════════════════════════════════════

const CHATBOT_SYSTEM = (targetLang: 'en' | 'ar') => `You are a Career Consultant and HR Expert.
Your primary role is to answer questions about CV building, ATS navigation, interview answers, and career advice.
Keep your responses fairly short, concise, and helpful. Do not write essays. Use formatting like bullet points when helpful.
Always respond in ${targetLang === 'ar' ? 'Arabic' : 'English'}, matching the language of the prompt.`;

export const chatWithConsultant = functions.https.onCall(
    { cors: true, secrets: [OPENAI_API_KEY] },
    async (request) => {
        const { messages, targetLang } = request.data;

        if (!messages || !Array.isArray(messages)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid messages array');
        }

        const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() });

        try {
            const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                { role: 'system', content: CHATBOT_SYSTEM(targetLang) },
                ...messages.map((msg: any) => ({
                    role: (msg.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user',
                    content: msg.text,
                })),
            ];

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: formattedMessages,
                temperature: 0.7,
            });

            return { text: response.choices[0]?.message?.content || '' };
        } catch (error: any) {
            console.error("OpenAI Chat API Error:", error);
            throw new functions.https.HttpsError('internal', error.message || 'Chat failed');
        }
    }
);

// ════════════════════════════════════════════════════════════════════════════
//  PAYMOB INTEGRATION (unchanged)
// ════════════════════════════════════════════════════════════════════════════

export const createPaymobIntention = functions.https.onCall(
    { cors: true, secrets: [PAYMOB_SECRET_KEY, PAYMOB_INTEGRATION_IDS] },
    async (request) => {
        if (!request.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to initiate payment.');
        }

        const { amount, currency, firstName, lastName, email, phone, optimizationId: existingOptimizationId } = request.data;

        if (!amount || !currency || !email) {
            throw new functions.https.HttpsError('invalid-argument', 'amount, currency, and email are required.');
        }

        const secretKey = PAYMOB_SECRET_KEY.value();
        const amountCents = Math.round(amount * 100);

        let orderRef: admin.firestore.DocumentReference;

        if (existingOptimizationId) {
            orderRef = admin.firestore().collection('optimizations').doc(existingOptimizationId);
            await orderRef.update({
                user_id: request.auth.uid,
                amount: amountCents,
                currency: currency.toUpperCase(),
                email,
            });
        } else {
            orderRef = admin.firestore().collection('optimizations').doc();
            await orderRef.set({
                user_id: request.auth.uid,
                is_paid: false,
                amount: amountCents,
                currency: currency.toUpperCase(),
                email,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        const optimizationId = orderRef.id;

        const response = await fetch(`${PAYMOB_BASE_URL}/v1/intention/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${secretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amountCents,
                currency: currency.toUpperCase(),
                payment_methods: PAYMOB_INTEGRATION_IDS.value().split(',').map(Number).filter(Boolean),
                items: [{
                    name: '10-x CV Optimization',
                    amount: amountCents,
                    description: 'AI-powered ATS Resume Optimization',
                    quantity: 1,
                }],
                billing_data: {
                    first_name: firstName || 'Customer',
                    last_name: lastName || 'User',
                    email: email,
                    phone_number: phone || '+966500000000',
                },
                customer: {
                    first_name: firstName || 'Customer',
                    last_name: lastName || 'User',
                    email: email,
                },
                special_reference: optimizationId,
                notification_url: `${FUNCTIONS_BASE_URL}/paymobWebhook`,
                redirection_url: `${HOSTING_BASE_URL}/payment-result?oid=${optimizationId}`,
                expiration: 3600,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Paymob Intention Error:', errText);
            throw new functions.https.HttpsError('internal', 'Failed to create payment intention.');
        }

        const data = await response.json();
        const clientSecret = data.client_secret;

        if (!clientSecret) {
            throw new functions.https.HttpsError('internal', 'Paymob did not return a client_secret.');
        }

        await orderRef.update({
            paymob_order_id: data.id || '',
            paymob_intention_id: data.intention_order_id || '',
            expires_at: admin.firestore.Timestamp.fromMillis(Date.now() + 3600 * 1000),
        });

        return { clientSecret, optimizationId };
    }
);

export const paymobWebhook = functions.https.onRequest(
    { secrets: [PAYMOB_HMAC_SECRET] },
    async (req, res) => {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        try {
            const hmacSecret = PAYMOB_HMAC_SECRET.value();
            const receivedHmac = (req.query.hmac as string) || '';
            const obj = req.body?.obj || {};

            const hmacFields = [
                obj.amount_cents,
                obj.created_at,
                obj.currency,
                obj.error_occured,
                obj.has_parent_transaction,
                obj.id,
                obj.integration_id,
                obj.is_3d_secure,
                obj.is_auth,
                obj.is_capture,
                obj.is_refunded,
                obj.is_standalone_payment,
                obj.is_voided,
                obj.order?.id,
                obj.owner,
                obj.pending,
                obj.source_data?.pan,
                obj.source_data?.sub_type,
                obj.source_data?.type,
                obj.success,
            ].map(v => String(v ?? '')).join('');

            const computedHmac = crypto
                .createHmac('sha512', hmacSecret)
                .update(hmacFields)
                .digest('hex');

            if (computedHmac !== receivedHmac) {
                console.error('Paymob HMAC mismatch — potential forgery attempt.');
                res.status(401).send('Invalid HMAC signature.');
                return;
            }

            if (obj.success === true && !obj.is_refunded && !obj.is_voided) {
                const optimizationId = obj.order?.merchant_order_id ||
                    (await admin.firestore().collection('optimizations')
                        .where('paymob_order_id', '==', String(obj.order?.id || ''))
                        .limit(1)
                        .get()
                        .then(snap => snap.empty ? null : snap.docs[0].id));

                if (optimizationId) {
                    await admin.firestore().collection('optimizations').doc(optimizationId).update({
                        is_paid: true,
                        paid_at: admin.firestore.FieldValue.serverTimestamp(),
                        paymob_transaction_id: obj.id,
                    });
                    console.log(`Payment confirmed for optimization: ${optimizationId}`);
                } else {
                    console.warn('Webhook received but no matching optimizationId found.');
                }
            }

            res.status(200).send('OK');
        } catch (error: any) {
            console.error('Webhook processing error:', error);
            res.status(500).send('Internal error');
        }
    }
);
