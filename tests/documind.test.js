import test from 'node:test';
import assert from 'node:assert/strict';
import { getRelativeDeadline, parseDate, formatStandardDate } from '../src/utils/dateHelper.js';
import { cleanExtractedText, chunkTextWithCitations } from '../src/services/pdfService.js';
import { generateDeterministicIntelligence, answerDocumentQuestion } from '../src/services/geminiService.js';
import { store } from '../src/models/store.js';
import { signToken } from '../src/middleware/auth.js';

test('1. Date Helper - Normalization and Relative Deadline Detection', () => {
  // Test valid date parsing
  const parsed = parseDate('15 October 2026');
  assert.ok(parsed !== null, 'Date should be parsed');
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 9); // October is month index 9
  assert.equal(parsed.getDate(), 15);

  // Test formatting
  const formatted = formatStandardDate(parsed);
  assert.equal(formatted, '15 Oct 2026');

  // Test empty date handling
  const emptyRes = getRelativeDeadline('');
  assert.equal(emptyRes.display, 'No deadline found in the document.');
  assert.equal(emptyRes.normalized, 'None');

  // Test relative deadline calculation
  const baseDate = new Date(2026, 9, 15); // 15 Oct 2026
  
  // Today test
  const todayRes = getRelativeDeadline('15 Oct 2026', baseDate);
  assert.equal(todayRes.display, 'Today');

  // Tomorrow test
  const tomorrowRes = getRelativeDeadline('16 Oct 2026', baseDate);
  assert.equal(tomorrowRes.display, 'Tomorrow');

  // In 3 days
  const in3DaysRes = getRelativeDeadline('18 Oct 2026', baseDate);
  assert.equal(in3DaysRes.display, 'In 3 days');

  // Overdue
  const overdueRes = getRelativeDeadline('10 Oct 2026', baseDate);
  assert.ok(overdueRes.isOverdue);
  assert.ok(overdueRes.display.includes('Overdue'));
});

test('2. Text Cleaning & Chunking with Citations', () => {
  const dirtyText = "Header \x00\x08 \r\n\r\n Paragraph 1. \r\n\r\n\r\n\r\n Paragraph 2. ";
  const cleaned = cleanExtractedText(dirtyText);
  assert.ok(!cleaned.includes('\x00'));
  assert.ok(!cleaned.includes('\r\n'));
  assert.ok(cleaned.includes('Paragraph 1.'));

  // Test chunking
  const sampleDocText = `
Section 1: General Requirements.
All applicants must submit their formal financial audits by October 15, 2026.

Section 2: Intellectual Property.
Applicants must retain uncontested title to all licensed software components.
`.repeat(10);

  const chunks = chunkTextWithCitations(sampleDocText, 3);
  assert.ok(chunks.length > 0, 'Should create at least one chunk');
  assert.ok(chunks[0].estimatedPage >= 1, 'Chunk should have page citation');
  assert.ok(chunks[0].content.length > 0, 'Chunk should have text');
});

test('3. Document Intelligence Extraction (12-Field Schema)', () => {
  const sampleContractText = `
GRANT AGREEMENT GTICR-2026
Effective Date: 15 October 2026
Deadline: 15 October 2026

1. Eligibility Requirements:
- Applicant must submit certified financial audit reports.
- Applicant must upload proof of patent ownership.

2. Action Items:
- Submit Phase 1 application dossier before 15 October 2026.
- Upload income certificate and balance sheets.
- Complete cybersecurity baseline verification.

3. Penalties:
- Late submissions will face immediate disqualification.
`;

  const intelligence = generateDeterministicIntelligence(sampleContractText, 'Grant_Agreement.pdf', 2);

  // Validate the 12 fields are present
  assert.ok(intelligence.documentType, 'Must have documentType');
  assert.ok(typeof intelligence.confidence === 'number', 'Must have numeric confidence estimate');
  assert.ok(intelligence.confidenceLabel.includes('confidence estimate'), 'Must label confidence clearly');
  assert.ok(intelligence.executiveSummary, 'Must have executiveSummary');
  assert.ok(Array.isArray(intelligence.keyPoints), 'Must have keyPoints array');
  assert.ok(Array.isArray(intelligence.importantDates), 'Must have importantDates array');
  assert.ok(Array.isArray(intelligence.requirements), 'Must have requirements array');
  assert.ok(Array.isArray(intelligence.actionItems), 'Must have actionItems array');
  assert.ok(Array.isArray(intelligence.entities), 'Must have entities array');
  assert.ok(Array.isArray(intelligence.risks), 'Must have risks array');
  assert.ok(Array.isArray(intelligence.missingInformation), 'Must have missingInformation array');
  assert.ok(Array.isArray(intelligence.decisions), 'Must have decisions array');
  assert.ok(Array.isArray(intelligence.sourceReferences), 'Must have sourceReferences array');

  // Check auditability: action items must have sources
  assert.ok(intelligence.actionItems.length > 0, 'Must extract action items');
  assert.ok(intelligence.actionItems[0].source, 'Action items must have source citation');
});

test('4. Document-Grounded Chat & Fallback Defense', async () => {
  const docText = `The grant application closing date is 15 October 2026. Non-dilutive capital of $250,000 will be awarded.`;
  const docTitle = `Grant_Overview.pdf`;

  // Grounded answer
  const answerFound = await answerDocumentQuestion('What is the capital amount?', docText, docTitle);
  assert.ok(answerFound.answer.includes('$250,000') || answerFound.answer.includes('capital'), 'Answer should be grounded in text');

  // Missing info question -> strict fallback
  const answerMissing = await answerDocumentQuestion('What is the secret recipe for chocolate cake?', docText, docTitle);
  assert.equal(answerMissing.answer, "I couldn't find this information in the uploaded document.");
});

test('5. Auth and User Data Ownership Isolation', async () => {
  // Create test user 1
  const user1 = await store.createUser({
    email: 'user1@test.com',
    password_hash: 'hashedpassword',
    name: 'Alice User'
  });
  const token1 = signToken(user1);
  assert.ok(token1, 'Token should be generated');

  // Create test user 2
  const user2 = await store.createUser({
    email: 'user2@test.com',
    password_hash: 'hashedpassword',
    name: 'Bob User'
  });

  // User 1 creates a document
  const doc1 = await store.createDocument({
    user_id: user1.id,
    title: 'Confidential Strategy Alice',
    original_name: 'alice.pdf',
    file_size: 1024,
    mime_type: 'application/pdf',
    text_content: 'Confidential strategy content for Alice.',
    page_count: 1,
    word_count: 10
  });

  // User 1 can access it
  const retrievedByOwner = await store.getDocumentById(doc1.id, user1.id);
  assert.ok(retrievedByOwner !== null, 'Owner can access document');
  assert.equal(retrievedByOwner.title, 'Confidential Strategy Alice');

  // User 2 CANNOT access User 1 document
  const retrievedByOther = await store.getDocumentById(doc1.id, user2.id);
  assert.equal(retrievedByOther, null, 'Non-owner must NOT access another user document');
});
