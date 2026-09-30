import pdfParse from 'pdf-parse';

/**
 * Validates magic bytes for known file signatures
 */
export function validateMagicBytes(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46 0x2D)
    const header = buffer.slice(0, 5).toString('ascii');
    if (!header.startsWith('%PDF-')) {
      throw new Error('Corrupted or invalid PDF header. File is not a genuine PDF document.');
    }
  }
}

/**
 * Cleans extracted raw text
 */
export function cleanExtractedText(text) {
  if (!text) return '';
  return text
    // Replace non-standard whitespace and control chars (except standard newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize Windows/Mac line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Collapse 3+ consecutive newlines to 2
    .replace(/\n{3,}/g, '\n\n')
    // Strip trailing/leading spaces on lines
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

/**
 * Splits text into logical chunks with estimated page/section references
 */
export function chunkTextWithCitations(text, totalPages = 1) {
  if (!text) return [];

  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;
  
  // Approximate characters per page
  const totalChars = text.length;
  const charsPerPage = Math.max(1, Math.floor(totalChars / Math.max(1, totalPages)));

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    if (!p) continue;

    if ((currentChunk.length + p.length > 1200) && currentChunk.length > 0) {
      const estimatedPage = Math.min(
        totalPages,
        Math.max(1, Math.floor((chunks.length * 1000) / charsPerPage) + 1)
      );

      chunks.push({
        index: chunkIndex++,
        estimatedPage,
        sectionTitle: `Section ${chunkIndex}`,
        content: currentChunk.trim(),
        charCount: currentChunk.length
      });
      currentChunk = p;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + p;
    }
  }

  if (currentChunk.trim().length > 0) {
    const estimatedPage = Math.min(
      totalPages,
      Math.max(1, Math.floor((chunks.length * 1000) / charsPerPage) + 1)
    );
    chunks.push({
      index: chunkIndex++,
      estimatedPage,
      sectionTitle: `Section ${chunkIndex}`,
      content: currentChunk.trim(),
      charCount: currentChunk.length
    });
  }

  return chunks;
}

/**
 * Robust extraction pipeline handling empty, encrypted, scanned, or corrupt PDFs
 */
export async function extractDocumentContent(fileBuffer, originalName, mimeType) {
  // Step 1: Validate file buffer length
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('The uploaded file is empty (0 bytes). Please upload a valid document.');
  }

  // Step 2: Validate magic bytes
  validateMagicBytes(fileBuffer, mimeType);

  let rawText = '';
  let pageCount = 1;
  let isScanned = false;
  let extractionWarning = null;

  // Step 3: Handle Plain Text / Markdown
  if (mimeType === 'text/plain' || mimeType === 'text/markdown' || originalName.endsWith('.txt') || originalName.endsWith('.md')) {
    rawText = fileBuffer.toString('utf-8');
    pageCount = Math.max(1, Math.ceil(rawText.length / 2500));
  } else {
    // Step 4: Parse PDF
    try {
      const pdfData = await pdfParse(fileBuffer, {
        max: 50 // Limit max pages for hackathon demo performance
      });

      rawText = pdfData.text || '';
      pageCount = pdfData.numpages || 1;
    } catch (err) {
      const errMsg = err.message || '';
      if (errMsg.toLowerCase().includes('password') || errMsg.toLowerCase().includes('encrypt')) {
        throw new Error('This PDF is password-protected or encrypted. Please remove password protection before uploading.');
      }
      if (errMsg.toLowerCase().includes('bad xref') || errMsg.toLowerCase().includes('corrupted') || errMsg.toLowerCase().includes('invalid')) {
        throw new Error('The PDF file structure appears corrupted. Please verify the file opens in standard PDF viewers.');
      }
      throw new Error(`Failed to extract text from PDF: ${err.message}`);
    }
  }

  // Step 5: Clean Extracted Text
  const cleanedText = cleanExtractedText(rawText);
  const wordCount = cleanedText ? cleanedText.split(/\s+/).filter(Boolean).length : 0;

  // Step 6: Scanned PDF / Empty Detection
  if (wordCount < 10) {
    if (fileBuffer.length > 30000) {
      // Large file size but almost no text = Scanned image-only PDF
      isScanned = true;
      extractionWarning = 'Scanned or image-only PDF detected. Direct text layer is minimal. AI analysis may have limited insight accuracy.';
    } else {
      throw new Error('Document contains no readable text. Ensure the file contains text content and is not blank.');
    }
  }

  // Step 7: Chunking
  const chunks = chunkTextWithCitations(cleanedText, pageCount);

  // Step 8: Document Health Evaluation
  const healthStatus = {
    quality: isScanned || wordCount < 50 ? 'Limited' : 'Good',
    textStatus: isScanned ? 'Limited (Scanned/Image)' : 'Available',
    analysis: isScanned ? 'Partial' : 'Complete',
    missingCount: 0,
    warning: extractionWarning
  };

  return {
    rawText,
    cleanedText,
    pageCount,
    wordCount,
    chunks,
    healthStatus,
    isScanned
  };
}
