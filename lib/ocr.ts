export interface OCRCheckResult {
  passed: boolean;
  text: string;
  charCount: number;
  pageCount: number;
  warning?: string;
}

export async function checkPDFLegibility(buffer: Buffer): Promise<OCRCheckResult> {
  try {
    // Dynamic import to handle CJS/ESM module compatibility
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text || '';
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const charCount = cleanText.length;
    const pageCount = pdfData.numpages || 1;

    const MIN_CHAR_COUNT = 30;
    const passed = charCount >= MIN_CHAR_COUNT;

    let warning: string | undefined = undefined;
    if (!passed) {
      warning = `Extracted text length is minimal (${charCount} characters). Ensure the document scan is clear and all payroll approval pages are visible.`;
    }

    return {
      passed,
      text: cleanText,
      charCount,
      pageCount,
      warning,
    };
  } catch (err: unknown) {
    console.warn('PDF parsing exception in OCR pre-check:', err);
    return {
      passed: true,
      text: '',
      charCount: 0,
      pageCount: 1,
      warning: 'Notice: Automated text pre-check could not parse structure. Manual reviewer verification will apply.',
    };
  }
}
