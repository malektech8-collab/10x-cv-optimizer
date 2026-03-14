import Anthropic from '@anthropic-ai/sdk';
import { PROMPTS } from './prompts';

const JSON_SCHEMA = `{
  "contact": {
    "name": "string (REQUIRED — full name)",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedin": "string or null",
    "website": "string or null"
  },
  "summary": "string or null",
  "workExperience": [
    {
      "jobTitle": "string",
      "company": "string",
      "dateRange": "string (e.g. Jan 2022 – Present)",
      "location": "string or null",
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "dateRange": "string or null",
      "gpa": "string or null",
      "honors": "string or null"
    }
  ],
  "skills": ["string"],
  "certifications": [
    { "name": "string", "issuer": "string or null", "date": "string or null" }
  ],
  "languages": ["string"],
  "additionalSections": [
    { "heading": "string", "content": ["string"] }
  ]
}`;

// ─── Parse: faithful extraction only ────────────────────────────────────────

const PARSE_SYSTEM = (targetLang: 'en' | 'ar') => `You are an expert resume parser.

TASK
Extract ALL information from the provided resume text into structured JSON. This is a FAITHFUL EXTRACTION — do NOT enhance, rewrite, embellish, or add anything that is not explicitly present in the source text.

LANGUAGE RULE
- ALL string values in the JSON MUST be in ${targetLang === 'ar' ? 'the same language as the source (preserve Arabic if present, otherwise use Arabic)' : 'the same language as the source (preserve English if present, otherwise use English)'}.
- JSON keys must remain in English exactly as specified.

OUTPUT FORMAT — STRICT JSON ONLY
- Respond ONLY with valid JSON matching the schema below.
- DO NOT use markdown code fences.
- DO NOT add introductory or concluding text.

JSON SCHEMA:
${JSON_SCHEMA}

RULES
- Extract verbatim — do not rephrase, summarize, or improve any text.
- Preserve all dates, numbers, and proper nouns exactly as written.
- If a section has no data, use null or omit the key.
- skills: flat list of individual skill strings exactly as listed.
- bullets: extract bullet points exactly as written in the source.`;

export async function parseResumeToJson(
    extractedText: string,
    targetLang: 'en' | 'ar',
    anthropic: Anthropic,
): Promise<Record<string, any>> {
    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: PARSE_SYSTEM(targetLang),
        messages: [
            {
                role: 'user',
                content: `Here is the resume text to parse into JSON:\n\n${extractedText}`,
            },
        ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    let text = textBlock?.text?.trim() || '';

    // Strip markdown fences if present
    if (text.includes('```')) {
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    }

    const parsed = JSON.parse(text);
    if (!parsed?.contact?.name) {
        throw new Error('Claude returned JSON missing the required contact.name field.');
    }

    return parsed;
}

// ─── Rewrite: ATS-optimized enhancement ─────────────────────────────────────

const REWRITE_SYSTEM = (targetLang: 'en' | 'ar') => `You are an Expert Resume Writer and ATS (Applicant Tracking System) Optimization Specialist.

OBJECTIVE
Rewrite the provided resume into high-impact, ATS-optimized structured JSON.
Best Practices 2026: Use action verbs, strongly quantify achievements (e.g., "Increased sales by 15%"), naturally embed exact keywords. No hallucinations — use only information present in the source resume.

USER PREFERENCE OVERRIDE (MANDATORY)
- If the user provides specific "Comments" or "Custom Instructions", you ABSOLUTELY MUST apply them. This includes requests to change tone, hide certain information, or focus on a specific career path.

LANGUAGE RULE
- ALL string values in the JSON output MUST be written entirely in ${targetLang === 'ar' ? 'professional Modern Standard Arabic' : 'English'}.
- JSON keys must remain in English exactly as specified below.
- Do not mix languages unless strictly necessary for proper nouns or technical terms.

OUTPUT FORMAT — STRICT JSON ONLY
- Respond ONLY with valid JSON matching the schema below.
- DO NOT use markdown code fences.
- DO NOT provide any introductory or concluding text.

JSON SCHEMA:
${JSON_SCHEMA}

CONTENT RULES
- No hallucinations. Use only information present in the source resume.
- skills: flat list of individual skill strings (e.g. "Python", "Project Management").
- bullets: lead every bullet with a strong action verb; quantify where data exists.
- additionalSections: use for any section not modelled above (volunteer work, publications, etc.).
- Omit any field that has no data (use null or omit the key).`;

export async function rewriteResume(
    parsedJson: Record<string, any>,
    extractedText: string,
    targetLang: 'en' | 'ar',
    userComments: string | undefined,
    anthropic: Anthropic,
): Promise<Record<string, any>> {
    const userMessage = [
        'Here is the parsed resume JSON:',
        '```json',
        JSON.stringify(parsedJson, null, 2),
        '```',
        '',
        'And here is the original raw text for reference:',
        '```',
        extractedText,
        '```',
    ];

    if (userComments) {
        userMessage.push(
            '',
            '=====================',
            'CRITICAL USER INSTRUCTIONS (MANDATORY):',
            `"${userComments}"`,
            '=====================',
        );
    }

    userMessage.push('', 'Please rewrite this resume into optimized structured JSON. Follow the schema exactly.');

    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: REWRITE_SYSTEM(targetLang),
        messages: [
            {
                role: 'user',
                content: userMessage.join('\n'),
            },
        ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    let text = textBlock?.text?.trim() || '';

    if (text.includes('```')) {
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    }

    if (!text || text.length < 10) {
        throw new Error('Claude returned an empty or insufficient response.');
    }

    const resumeData = JSON.parse(text);
    if (!resumeData?.contact?.name) {
        throw new Error('Claude returned JSON missing the required contact.name field.');
    }

    return resumeData;
}

// ─── Helper: call Claude and parse JSON response ─────────────────────────────

async function callClaudeJson(
    anthropic: Anthropic,
    systemPrompt: string,
    userContent: string,
    maxTokens = 4096,
): Promise<Record<string, any>> {
    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    let text = textBlock?.text?.trim() || '';

    if (text.includes('```')) {
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    }

    return JSON.parse(text);
}

// ─── Stage 2: Career Stage Detection ─────────────────────────────────────────

export async function detectCareerStage(
    parsedJson: Record<string, any>,
    anthropic: Anthropic,
): Promise<Record<string, any>> {
    return callClaudeJson(
        anthropic,
        PROMPTS.detectCareerStage,
        `Analyze this resume:\n\n${JSON.stringify(parsedJson, null, 2)}`,
        1024,
    );
}

// ─── Stage 3: Job Keyword Extraction ─────────────────────────────────────────

export async function extractKeywords(
    targetLang: 'en' | 'ar',
    jobTitle?: string,
    industry?: string,
    jobDescription?: string,
    anthropic?: Anthropic,
): Promise<Record<string, any>> {
    if (!anthropic) throw new Error('Anthropic client required');

    const parts: string[] = [];
    if (jobTitle) parts.push(`Target Job Title: ${jobTitle}`);
    if (industry) parts.push(`Target Industry: ${industry}`);
    if (jobDescription) parts.push(`Job Description:\n${jobDescription}`);

    if (parts.length === 0) {
        parts.push('No specific job target provided. Extract general professional keywords based on common ATS requirements.');
    }

    return callClaudeJson(
        anthropic,
        PROMPTS.extractKeywords(targetLang),
        parts.join('\n\n'),
        2048,
    );
}

// ─── Stage 4: Achievement Enhancement ────────────────────────────────────────

export async function enhanceBullets(
    parsedJson: Record<string, any>,
    targetLang: 'en' | 'ar',
    anthropic: Anthropic,
): Promise<Record<string, any>> {
    const experience = parsedJson.workExperience || [];
    if (experience.length === 0) {
        return { enhancedExperience: [] };
    }

    return callClaudeJson(
        anthropic,
        PROMPTS.enhanceBullets(targetLang),
        `Here are the work experience entries to enhance:\n\n${JSON.stringify(experience, null, 2)}`,
        4096,
    );
}

// ─── Stage 5: Context-Aware Rewrite ──────────────────────────────────────────

export interface PipelineContext {
    parsedJson: Record<string, any>;
    extractedText: string;
    careerStage: Record<string, any>;
    keywords: Record<string, any>;
    enhancedBullets: Record<string, any>;
    targetLang: 'en' | 'ar';
    userComments?: string;
}

export async function rewriteWithPipeline(
    ctx: PipelineContext,
    anthropic: Anthropic,
): Promise<Record<string, any>> {
    const userMessage = [
        '=== PARSED RESUME ===',
        JSON.stringify(ctx.parsedJson, null, 2),
        '',
        '=== CAREER STAGE ANALYSIS ===',
        JSON.stringify(ctx.careerStage, null, 2),
        '',
        '=== TARGET KEYWORDS ===',
        JSON.stringify(ctx.keywords, null, 2),
        '',
        '=== ENHANCED BULLET POINTS ===',
        JSON.stringify(ctx.enhancedBullets, null, 2),
        '',
        '=== ORIGINAL RAW TEXT (for reference) ===',
        ctx.extractedText,
    ];

    if (ctx.userComments) {
        userMessage.push(
            '',
            '=====================',
            'CRITICAL USER INSTRUCTIONS (MANDATORY):',
            `"${ctx.userComments}"`,
            '=====================',
        );
    }

    userMessage.push('', 'Rewrite this resume into optimized structured JSON using all the context above.');

    const resumeData = await callClaudeJson(
        anthropic,
        PROMPTS.rewriteWithContext(ctx.targetLang, JSON_SCHEMA),
        userMessage.join('\n'),
        8192,
    );

    if (!resumeData?.contact?.name) {
        throw new Error('Pipeline rewrite returned JSON missing required contact.name field.');
    }

    return resumeData;
}

// ─── Stage 6: ATS Validation ─────────────────────────────────────────────────

export async function validateATS(
    resumeJson: Record<string, any>,
    targetKeywords: Record<string, any>,
    targetLang: 'en' | 'ar',
    anthropic: Anthropic,
): Promise<Record<string, any>> {
    return callClaudeJson(
        anthropic,
        PROMPTS.validateATS(targetLang),
        `=== OPTIMIZED RESUME ===\n${JSON.stringify(resumeJson, null, 2)}\n\n=== TARGET KEYWORDS ===\n${JSON.stringify(targetKeywords, null, 2)}`,
        2048,
    );
}

// ─── Extras: Cover Letter & LinkedIn Guide ───────────────────────────────────

export async function generateCoverLetter(
    resumeJson: Record<string, any>,
    targetLang: 'en' | 'ar',
    jobTitle?: string,
    companyName?: string,
    anthropic?: Anthropic,
): Promise<Record<string, any>> {
    if (!anthropic) throw new Error('Anthropic client required');

    const parts = [
        `Resume:\n${JSON.stringify(resumeJson, null, 2)}`,
    ];
    if (jobTitle) parts.push(`Target Job Title: ${jobTitle}`);
    if (companyName) parts.push(`Company: ${companyName}`);

    return callClaudeJson(
        anthropic,
        PROMPTS.generateCoverLetter(targetLang),
        parts.join('\n\n'),
        2048,
    );
}

export async function generateLinkedInGuide(
    resumeJson: Record<string, any>,
    targetLang: 'en' | 'ar',
    jobTitle?: string,
    industry?: string,
    anthropic?: Anthropic,
): Promise<Record<string, any>> {
    if (!anthropic) throw new Error('Anthropic client required');

    const parts = [
        `Resume:\n${JSON.stringify(resumeJson, null, 2)}`,
    ];
    if (jobTitle) parts.push(`Target Job Title: ${jobTitle}`);
    if (industry) parts.push(`Target Industry: ${industry}`);

    return callClaudeJson(
        anthropic,
        PROMPTS.generateLinkedInGuide(targetLang),
        parts.join('\n\n'),
        2048,
    );
}
