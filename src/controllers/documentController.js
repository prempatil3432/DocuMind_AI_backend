import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { store } from '../models/store.js';
import { extractDocumentContent } from '../services/pdfService.js';
import { analyzeDocumentIntelligence } from '../services/geminiService.js';
import { getRelativeDeadline } from '../utils/dateHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const documentController = {
  /**
   * Upload and process a new document through the IDP pipeline
   */
  async uploadAndProcess(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file was uploaded. Please select a PDF or plain text document.'
        });
      }

      const fileBuffer = req.file.buffer;
      const originalName = req.file.sanitizedName || req.file.originalname || 'document.pdf';
      const mimeType = req.file.mimetype || 'application/pdf';
      const fileSize = req.file.size;
      const userId = req.user.id;

      // 1. Ingestion & Extraction Pipeline
      let extractionResult;
      try {
        extractionResult = await extractDocumentContent(fileBuffer, originalName, mimeType);
      } catch (extractErr) {
        return res.status(422).json({
          success: false,
          error: `Document processing failed: ${extractErr.message}`,
          retryable: true
        });
      }

      const { cleanedText, pageCount, wordCount, chunks, healthStatus } = extractionResult;

      // 2. Intelligent Document Intelligence Analysis (12-Field Schema)
      let intelligence;
      try {
        intelligence = await analyzeDocumentIntelligence(cleanedText, originalName, pageCount);
      } catch (aiErr) {
        console.error('[AI] Pipeline error during intelligence generation:', aiErr);
        return res.status(500).json({
          success: false,
          error: 'Document analysis failed because the AI service encountered an issue. Please retry.',
          retryable: true
        });
      }

      // 3. Update Health Status with missing information count
      const missingCount = Array.isArray(intelligence.missingInformation) ? intelligence.missingInformation.length : 0;
      const finalHealthStatus = {
        ...healthStatus,
        missingCount,
        analysis: missingCount > 3 ? 'Partial' : 'Complete'
      };

      // 4. Save Document Record
      const docRecord = await store.createDocument({
        user_id: userId,
        title: originalName.replace(/\.[^/.]+$/, ''),
        original_name: originalName,
        file_size: fileSize,
        mime_type: mimeType,
        text_content: cleanedText,
        page_count: pageCount,
        word_count: wordCount,
        document_type: intelligence.documentType,
        confidence: intelligence.confidence,
        confidence_label: intelligence.confidenceLabel || 'AI confidence estimate',
        executive_summary: intelligence.executiveSummary,
        key_points: intelligence.keyPoints,
        important_dates: intelligence.importantDates,
        requirements: intelligence.requirements,
        action_items: intelligence.actionItems,
        entities: intelligence.entities,
        risks: intelligence.risks,
        missing_information: intelligence.missingInformation,
        decisions: intelligence.decisions,
        source_references: intelligence.sourceReferences,
        health_status: finalHealthStatus,
        processing_status: 'completed'
      });

      // 5. Populate Interactive Action Center Items
      if (Array.isArray(intelligence.actionItems)) {
        for (const item of intelligence.actionItems) {
          const relDeadline = getRelativeDeadline(item.deadline);
          await store.createActionItem({
            document_id: docRecord.id,
            user_id: userId,
            task: item.task,
            deadline: relDeadline.normalized !== 'None' ? relDeadline.normalized : item.deadline,
            relative_deadline: relDeadline.display,
            status: 'pending',
            priority: item.priority || 'medium',
            source_reference: item.source || 'Document Directive'
          });
        }
      }

      const savedActions = await store.getActionItemsByDocument(docRecord.id, userId);

      return res.status(201).json({
        success: true,
        message: 'Document successfully processed and analyzed.',
        data: {
          ...docRecord,
          action_items: savedActions
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Load the bundled realistic fictional sample document for Demo Mode
   */
  async loadSampleDocument(req, res, next) {
    try {
      const candidatePaths = [
        path.resolve(__dirname, '../../sample-docs/Global_Tech_Innovation_Grant_2026.txt'),
        path.resolve(process.cwd(), 'sample-docs/Global_Tech_Innovation_Grant_2026.txt'),
        path.resolve(__dirname, '../../../sample-docs/Global_Tech_Innovation_Grant_2026.txt'),
        path.resolve(process.cwd(), '../sample-docs/Global_Tech_Innovation_Grant_2026.txt')
      ];
      const samplePath = candidatePaths.find(p => fs.existsSync(p));
      if (!samplePath) {
        return res.status(404).json({
          success: false,
          error: 'Sample document file not found on server.'
        });
      }

      const sampleBuffer = fs.readFileSync(samplePath);
      const originalName = 'Global_Tech_Innovation_Grant_2026.txt';
      const mimeType = 'text/plain';
      const fileSize = sampleBuffer.length;
      const userId = req.user.id;

      // Check if user already loaded this sample
      const existingDocs = await store.getDocumentsByUserId(userId);
      const alreadyLoaded = existingDocs.find(d => d.original_name === originalName);
      if (alreadyLoaded) {
        const actions = await store.getActionItemsByDocument(alreadyLoaded.id, userId);
        return res.status(200).json({
          success: true,
          message: 'Sample document retrieved from your workspace.',
          data: {
            ...alreadyLoaded,
            action_items: actions
          }
        });
      }

      // Process sample document through the real pipeline
      const extractionResult = await extractDocumentContent(sampleBuffer, originalName, mimeType);
      const intelligence = await analyzeDocumentIntelligence(
        extractionResult.cleanedText,
        originalName,
        extractionResult.pageCount
      );

      const docRecord = await store.createDocument({
        user_id: userId,
        title: 'Global Tech Innovation Grant 2026',
        original_name: originalName,
        file_size: fileSize,
        mime_type: mimeType,
        text_content: extractionResult.cleanedText,
        page_count: extractionResult.pageCount,
        word_count: extractionResult.wordCount,
        document_type: intelligence.documentType,
        confidence: intelligence.confidence,
        confidence_label: 'AI confidence estimate',
        executive_summary: intelligence.executiveSummary,
        key_points: intelligence.keyPoints,
        important_dates: intelligence.importantDates,
        requirements: intelligence.requirements,
        action_items: intelligence.actionItems,
        entities: intelligence.entities,
        risks: intelligence.risks,
        missing_information: intelligence.missingInformation,
        decisions: intelligence.decisions,
        source_references: intelligence.sourceReferences,
        health_status: {
          quality: 'Good',
          textStatus: 'Available',
          analysis: 'Complete',
          missingCount: intelligence.missingInformation?.length || 0
        },
        processing_status: 'completed'
      });

      // Populate interactive action items
      if (Array.isArray(intelligence.actionItems)) {
        for (const item of intelligence.actionItems) {
          const relDeadline = getRelativeDeadline(item.deadline);
          await store.createActionItem({
            document_id: docRecord.id,
            user_id: userId,
            task: item.task,
            deadline: relDeadline.normalized !== 'None' ? relDeadline.normalized : item.deadline,
            relative_deadline: relDeadline.display,
            status: 'pending',
            priority: item.priority || 'high',
            source_reference: item.source || 'Section 5, Compliance Checklist'
          });
        }
      }

      const actions = await store.getActionItemsByDocument(docRecord.id, userId);

      return res.status(201).json({
        success: true,
        message: 'Sample document loaded and analyzed via live pipeline.',
        data: {
          ...docRecord,
          action_items: actions
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get all documents with Dashboard summary statistics
   */
  async listDocuments(req, res, next) {
    try {
      const userId = req.user.id;
      const documents = await store.getDocumentsByUserId(userId);
      const allActions = await store.getAllActionItemsByUserId(userId);

      const pendingActions = allActions.filter(a => a.status === 'pending');
      const completedActions = allActions.filter(a => a.status === 'completed');

      // Aggregate upcoming deadlines across documents
      const upcomingDeadlines = [];
      for (const doc of documents) {
        if (Array.isArray(doc.important_dates)) {
          for (const d of doc.important_dates) {
            const rel = getRelativeDeadline(d.date);
            upcomingDeadlines.push({
              documentId: doc.id,
              documentTitle: doc.title,
              title: d.title,
              date: rel.normalized,
              relativeDisplay: rel.display,
              isOverdue: rel.isOverdue,
              daysDiff: rel.daysDiff
            });
          }
        }
      }

      // Sort upcoming deadlines by proximity
      upcomingDeadlines.sort((a, b) => {
        if (a.daysDiff === null) return 1;
        if (b.daysDiff === null) return -1;
        return a.daysDiff - b.daysDiff;
      });

      return res.status(200).json({
        success: true,
        data: {
          documents,
          stats: {
            totalDocuments: documents.length,
            processedCount: documents.filter(d => d.processing_status === 'completed').length,
            pendingActionsCount: pendingActions.length,
            completedActionsCount: completedActions.length,
            upcomingDeadlinesCount: upcomingDeadlines.filter(d => !d.isOverdue && d.daysDiff !== null).length
          },
          upcomingDeadlines: upcomingDeadlines.slice(0, 5),
          pendingActions: pendingActions.slice(0, 5)
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get document by ID with action items & citations
   */
  async getDocumentById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const document = await store.getDocumentById(id, userId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found or you do not have permission to access it.'
        });
      }

      const actions = await store.getActionItemsByDocument(id, userId);

      return res.status(200).json({
        success: true,
        data: {
          ...document,
          action_items: actions
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete document by ID (verifying ownership)
   */
  async deleteDocument(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deleted = await store.deleteDocument(id, userId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Document not found or you do not have permission to delete it.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Document and its associated data were deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Toggle Action Item status (Pending <-> Completed)
   */
  async toggleActionItem(req, res, next) {
    try {
      const { id, actionId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      // Verify document ownership
      const document = await store.getDocumentById(id, userId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found or permission denied.'
        });
      }

      const newStatus = status === 'completed' ? 'completed' : 'pending';
      const updated = await store.updateActionItemStatus(actionId, userId, newStatus);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Action item not found.'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Action marked as ${newStatus}.`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Document Search inside title, extracted text, type, requirements, dates
   */
  async searchDocuments(req, res, next) {
    try {
      const userId = req.user.id;
      const query = (req.query.q || '').trim().toLowerCase();

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a search query via ?q=...'
        });
      }

      const documents = await store.getDocumentsByUserId(userId);
      const matches = [];

      for (const doc of documents) {
        const titleMatch = (doc.title || '').toLowerCase().includes(query);
        const textMatch = (doc.text_content || '').toLowerCase().includes(query);
        const typeMatch = (doc.document_type || '').toLowerCase().includes(query);

        // Search within requirements
        const matchingReqs = (doc.requirements || []).filter(r =>
          (r.requirement || '').toLowerCase().includes(query)
        );

        // Search within dates
        const matchingDates = (doc.important_dates || []).filter(d =>
          (d.title || '').toLowerCase().includes(query) || (d.date || '').toLowerCase().includes(query)
        );

        if (titleMatch || textMatch || typeMatch || matchingReqs.length > 0 || matchingDates.length > 0) {
          // Find text snippet excerpt around query match
          let snippet = '';
          if (textMatch && doc.text_content) {
            const idx = doc.text_content.toLowerCase().indexOf(query);
            const start = Math.max(0, idx - 60);
            const end = Math.min(doc.text_content.length, idx + query.length + 60);
            snippet = '...' + doc.text_content.substring(start, end).replace(/\n/g, ' ') + '...';
          }

          matches.push({
            id: doc.id,
            title: doc.title,
            documentType: doc.document_type,
            snippet: snippet || doc.executive_summary || 'Match found in document structure',
            pageCount: doc.page_count,
            matchingRequirements: matchingReqs,
            matchingDates: matchingDates,
            createdAt: doc.created_at
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          query,
          totalMatches: matches.length,
          results: matches
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
