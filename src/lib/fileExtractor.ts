/**
 * Shared file content extraction utility.
 * Supports: PDF, DOCX, DOC, TXT, MD
 * Uses: pdfjs-dist (PDF), remark + remark-html (Markdown)
 */
import * as pdfjsLib from 'pdfjs-dist';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

// Use the local worker copied to /public (reliable, no CDN 404 issues)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/* ─── Result type ─── */
export interface ExtractionResult {
    html: string;
    plainText: string;
    pageCount: number;
    success: boolean;
    error?: string;
    /** Per-page HTML for A4 splitting */
    pages?: string[];
}

/* ─── PDF extraction using pdfjs-dist ─── */
async function extractPDF(buffer: ArrayBuffer): Promise<ExtractionResult> {
    try {
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(buffer),
            useSystemFonts: true,
            cMapUrl: '/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: '/standard_fonts/',
            disableFontFace: false,
            useWorkerFetch: false,
        });
        const pdf = await loadingTask.promise;
        const allPageTexts: string[] = [];
        const perPageHtml: string[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent({ includeMarkedContent: false });

            // Group text items by Y position to reconstruct lines
            const lineMap = new Map<number, { x: number; str: string }[]>();
            for (const item of textContent.items) {
                if (!('str' in item)) continue;
                const text = item.str;
                if (!text && !item.hasEOL) continue;
                // Round Y to 2px to group items on the same line
                const y = Math.round(item.transform[5] / 2) * 2;
                const x = Math.round(item.transform[4]);
                if (!lineMap.has(y)) lineMap.set(y, []);
                if (text) lineMap.get(y)!.push({ x, str: text });
            }

            // Sort lines by Y position (top to bottom = descending Y in PDF coords)
            const sortedLines = Array.from(lineMap.entries())
                .sort((a, b) => b[0] - a[0])
                .map(([, items]) => {
                    // Sort items left to right within same line
                    items.sort((a, b) => a.x - b.x);
                    // Join with appropriate spacing
                    let line = '';
                    for (let i = 0; i < items.length; i++) {
                        if (i > 0) {
                            const gap = items[i].x - (items[i - 1].x + items[i - 1].str.length * 5);
                            line += gap > 15 ? '  ' : ' ';
                        }
                        line += items[i].str;
                    }
                    return line;
                })
                .filter(line => line.trim());

            if (sortedLines.length > 0) {
                const pageText = sortedLines.join('\n');
                allPageTexts.push(pageText);
                perPageHtml.push(textToStyledHTML(pageText));
            }
        }

        const plainText = allPageTexts.join('\n\n');
        if (!plainText.trim()) {
            return {
                html: '',
                plainText: '',
                pageCount: pdf.numPages,
                success: false,
                error: 'No extractable text found (may be scanned/image-based)',
            };
        }

        return {
            html: textToStyledHTML(plainText),
            plainText,
            pageCount: pdf.numPages,
            success: true,
            pages: perPageHtml,
        };
    } catch (err) {
        console.error('PDF extraction error:', err);
        return {
            html: '',
            plainText: '',
            pageCount: 0,
            success: false,
            error: `PDF parsing failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        };
    }
}

/* ─── DOCX extraction (zip → XML → text) ─── */
function extractDOCX(buffer: ArrayBuffer): ExtractionResult {
    try {
        const bytes = new Uint8Array(buffer);
        const raw = new TextDecoder('latin1').decode(bytes);

        if (!raw.startsWith('PK')) {
            return { html: '', plainText: '', pageCount: 1, success: false, error: 'Not a valid DOCX file' };
        }

        // Find all word/document.xml content inside the zip
        // DOCX stores text in <w:t> tags inside <w:p> (paragraph) tags
        const bodyStart = raw.indexOf('<w:body');
        const bodyEnd = raw.indexOf('</w:body>');

        if (bodyStart === -1) {
            return { html: '', plainText: '', pageCount: 1, success: false, error: 'Could not find document body in DOCX' };
        }

        const bodyXml = raw.substring(bodyStart, bodyEnd > bodyStart ? bodyEnd + 9 : undefined);

        // Split by paragraph markers
        const paragraphs: string[] = [];
        const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
        let pMatch: RegExpExecArray | null;

        while ((pMatch = pRegex.exec(bodyXml)) !== null) {
            const pXml = pMatch[0];
            const textParts: string[] = [];
            const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
            let tMatch: RegExpExecArray | null;

            while ((tMatch = tRegex.exec(pXml)) !== null) {
                if (tMatch[1]) textParts.push(tMatch[1]);
            }

            const paragraphText = textParts.join('');
            // Include empty paragraphs as line breaks
            paragraphs.push(paragraphText);
        }

        // Clean up: remove completely empty runs but keep single empty ones as spacing
        const cleanParagraphs: string[] = [];
        let emptyCount = 0;
        for (const p of paragraphs) {
            if (!p.trim()) {
                emptyCount++;
                if (emptyCount <= 2) cleanParagraphs.push('');
            } else {
                emptyCount = 0;
                cleanParagraphs.push(p);
            }
        }

        const plainText = cleanParagraphs.join('\n');
        if (!plainText.trim()) {
            return { html: '', plainText: '', pageCount: 1, success: false, error: 'No text content found in DOCX' };
        }

        return {
            html: textToStyledHTML(plainText),
            plainText,
            pageCount: 1,
            success: true,
        };
    } catch (err) {
        return {
            html: '',
            plainText: '',
            pageCount: 1,
            success: false,
            error: `DOCX parsing failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        };
    }
}

/* ─── DOC (old binary) extraction ─── */
function extractDOC(buffer: ArrayBuffer): ExtractionResult {
    try {
        const bytes = new Uint8Array(buffer);
        const runs: string[] = [];
        let currentRun = '';

        for (let i = 0; i < bytes.length; i++) {
            const b = bytes[i];
            if ((b >= 32 && b < 127) || b === 10 || b === 13 || b === 9) {
                currentRun += String.fromCharCode(b);
            } else {
                if (currentRun.trim().length >= 4) runs.push(currentRun.trim());
                currentRun = '';
            }
        }
        if (currentRun.trim().length >= 4) runs.push(currentRun.trim());

        // Filter: keep runs with real words, skip binary metadata-like strings
        const validRuns = runs.filter(r => {
            if (r.length > 2000) return false;
            // Must have at least one word of 3+ letters
            if (!/[a-zA-Z]{3,}/.test(r)) return false;
            // Skip strings that look like binary metadata
            if (r.charCodeAt(0) < 32 || r.charCodeAt(0) === 127) return false;
            return true;
        });

        const plainText = validRuns.join('\n');
        if (!plainText.trim()) {
            return { html: '', plainText: '', pageCount: 1, success: false, error: 'Could not extract text from .doc file' };
        }

        return {
            html: textToStyledHTML(plainText),
            plainText,
            pageCount: 1,
            success: true,
        };
    } catch (err) {
        return {
            html: '',
            plainText: '',
            pageCount: 1,
            success: false,
            error: `DOC parsing failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        };
    }
}

/* ─── Plain text extraction ─── */
function extractPlainText(text: string): ExtractionResult {
    return {
        html: textToStyledHTML(text),
        plainText: text,
        pageCount: 1,
        success: !!text.trim(),
        error: text.trim() ? undefined : 'File is empty',
    };
}

/* ─── Markdown extraction using remark ─── */
async function extractMarkdown(text: string): Promise<ExtractionResult> {
    try {
        const result = await remark().use(remarkHtml, { sanitize: false }).process(text);
        const rawHtml = String(result);

        // Apply proper PDF-like styling to markdown HTML elements
        const styledHtml = rawHtml
            .replace(/<h1([^>]*)>/g, '<h1$1 style="font-size:28px;font-weight:700;margin:24px 0 12px;color:#1c1917;line-height:1.3;border-bottom:2px solid #e7e5e4;padding-bottom:8px;">')
            .replace(/<h2([^>]*)>/g, '<h2$1 style="font-size:22px;font-weight:700;margin:20px 0 10px;color:#1c1917;line-height:1.35;">')
            .replace(/<h3([^>]*)>/g, '<h3$1 style="font-size:18px;font-weight:600;margin:18px 0 8px;color:#292524;line-height:1.4;">')
            .replace(/<h4([^>]*)>/g, '<h4$1 style="font-size:16px;font-weight:600;margin:16px 0 6px;color:#292524;line-height:1.4;">')
            .replace(/<h5([^>]*)>/g, '<h5$1 style="font-size:14px;font-weight:600;margin:14px 0 6px;color:#44403c;line-height:1.4;">')
            .replace(/<h6([^>]*)>/g, '<h6$1 style="font-size:13px;font-weight:600;margin:12px 0 4px;color:#57534e;line-height:1.4;">')
            .replace(/<p([^>]*)>/g, '<p$1 style="margin-bottom:12px;line-height:1.75;font-size:11pt;color:#1c1917;">')
            .replace(/<ul([^>]*)>/g, '<ul$1 style="margin:8px 0 12px 24px;list-style-type:disc;line-height:1.75;font-size:11pt;">')
            .replace(/<ol([^>]*)>/g, '<ol$1 style="margin:8px 0 12px 24px;list-style-type:decimal;line-height:1.75;font-size:11pt;">')
            .replace(/<li([^>]*)>/g, '<li$1 style="margin-bottom:4px;color:#1c1917;">')
            .replace(/<blockquote([^>]*)>/g, '<blockquote$1 style="border-left:4px solid #d6d3d1;padding-left:16px;margin:12px 0;color:#57534e;font-style:italic;">')
            .replace(/<code([^>]*)>/g, '<code$1 style="background:#f5f5f4;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:10pt;color:#dc2626;">')
            .replace(/<pre([^>]*)>/g, '<pre$1 style="background:#1c1917;color:#fafaf9;padding:16px;border-radius:8px;overflow-x:auto;margin:12px 0;font-size:10pt;line-height:1.6;">')
            .replace(/<hr\s*\/?>/g, '<hr style="border:none;border-top:1px solid #d6d3d1;margin:24px 0;"/>')
            .replace(/<strong([^>]*)>/g, '<strong$1 style="font-weight:700;color:#0c0a09;">')
            .replace(/<table([^>]*)>/g, '<table$1 style="width:100%;border-collapse:collapse;margin:12px 0;font-size:11pt;">')
            .replace(/<th([^>]*)>/g, '<th$1 style="border:1px solid #d6d3d1;padding:8px 12px;background:#f5f5f4;font-weight:600;text-align:left;">')
            .replace(/<td([^>]*)>/g, '<td$1 style="border:1px solid #d6d3d1;padding:8px 12px;">');

        const htmlContent = `<div style="line-height:1.75;font-family:Inter,sans-serif;">${styledHtml}</div>`;

        return {
            html: htmlContent,
            plainText: text,
            pageCount: 1,
            success: !!styledHtml.trim(),
            error: styledHtml.trim() ? undefined : 'Empty markdown file',
        };
    } catch (err) {
        // Fallback: treat as plain text
        return extractPlainText(text);
    }
}

/* ─── Convert plain text → styled HTML ─── */
function textToStyledHTML(text: string): string {
    if (!text.trim()) return '';

    const paragraphs = text.split(/\n{2,}/).filter(p => p.trim());
    return paragraphs
        .map(p => {
            const lines = p.split('\n').filter(l => l.trim());
            // Detect headings (all caps, short lines, or lines ending with colon)
            if (lines.length === 1 && lines[0].length < 80) {
                const line = lines[0];
                if (line === line.toUpperCase() && /[A-Z]{3,}/.test(line)) {
                    return `<h2 style="font-size:16px;font-weight:700;margin:20px 0 10px;color:#1c1917;">${escapeHTML(line)}</h2>`;
                }
            }
            return `<p style="margin-bottom:10px;line-height:1.75;">${lines.map(escapeHTML).join('<br/>')}</p>`;
        })
        .join('');
}

function escapeHTML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* ═══════════════════════════════
   MAIN EXPORT: extractFileContent
   ═══════════════════════════════ */
export async function extractFileContent(file: File): Promise<ExtractionResult> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    switch (ext) {
        case 'pdf': {
            const buffer = await file.arrayBuffer();
            return extractPDF(buffer);
        }
        case 'docx': {
            const buffer = await file.arrayBuffer();
            return extractDOCX(buffer);
        }
        case 'doc': {
            const buffer = await file.arrayBuffer();
            return extractDOC(buffer);
        }
        case 'md': {
            const text = await file.text();
            return extractMarkdown(text);
        }
        case 'txt': {
            const text = await file.text();
            return extractPlainText(text);
        }
        default:
            return {
                html: '',
                plainText: '',
                pageCount: 0,
                success: false,
                error: `Unsupported file type: .${ext}`,
            };
    }
}

/** Supported file extensions for extraction */
export const EXTRACTABLE_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'md'];
export const ALL_ACCEPTED_EXTENSIONS = [...EXTRACTABLE_EXTENSIONS, 'png', 'jpg', 'jpeg'];
export const ACCEPT_STRING = ALL_ACCEPTED_EXTENSIONS.map(e => `.${e}`).join(',');
