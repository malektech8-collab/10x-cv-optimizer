import Anthropic from '@anthropic-ai/sdk';

const MIN_TEXT_LENGTH = 50;

/**
 * Extract text from a resume file (PDF or image).
 *
 * - PDF: uses pdf-parse (fast, no AI cost).
 *   Falls back to Claude vision if extracted text is too short (scanned PDF).
 * - Image: uses Claude vision directly.
 */
export async function extractText(
    fileBase64: string,
    mimeType: string,
    anthropic: Anthropic,
): Promise<string> {
    if (mimeType === 'application/pdf') {
        return extractFromPdf(fileBase64, mimeType, anthropic);
    }
    if (mimeType.startsWith('image/')) {
        return extractWithVision(fileBase64, mimeType, anthropic);
    }
    throw new Error(`Unsupported file type: ${mimeType}`);
}

// ── PDF extraction ──────────────────────────────────────────────────────────

async function extractFromPdf(
    fileBase64: string,
    mimeType: string,
    anthropic: Anthropic,
): Promise<string> {
    // Dynamic require — pdf-parse has no proper ESM/TS types
    const pdfParse = require('pdf-parse');
    const buffer = Buffer.from(fileBase64, 'base64');
    const parsed = await pdfParse(buffer);
    const text = (parsed.text || '').trim();

    // If too little text extracted, it's likely a scanned PDF → use vision
    if (text.length < MIN_TEXT_LENGTH) {
        return extractWithVision(fileBase64, mimeType, anthropic);
    }

    return text;
}

// ── Vision extraction (scanned PDFs & images) ──────────────────────────────

async function extractWithVision(
    fileBase64: string,
    mimeType: string,
    anthropic: Anthropic,
): Promise<string> {
    // Build content blocks with correct types for PDF vs image
    const content: Anthropic.Messages.ContentBlockParam[] = [];

    if (mimeType === 'application/pdf') {
        content.push({
            type: 'document',
            source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: fileBase64,
            },
        });
    } else {
        content.push({
            type: 'image',
            source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: fileBase64,
            },
        });
    }

    content.push({
        type: 'text',
        text: 'Extract ALL text from this document verbatim. Preserve the original structure (sections, bullet points, dates, contact information). Output ONLY the extracted text, nothing else.',
    });

    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [{ role: 'user', content }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    return textBlock?.text?.trim() || '';
}
