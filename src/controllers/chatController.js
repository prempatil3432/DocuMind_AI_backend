import { store } from '../models/store.js';
import { answerDocumentQuestion } from '../services/geminiService.js';

export const chatController = {
  /**
   * Ask question strictly grounded on the uploaded document
   */
  async askQuestion(req, res, next) {
    try {
      const { id: documentId } = req.params;
      const { question } = req.body;
      const userId = req.user.id;

      if (!question || !question.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a non-empty question.'
        });
      }

      // 1. Verify user ownership of the document
      const document = await store.getDocumentById(documentId, userId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found or you do not have permission to access it.'
        });
      }

      // 2. Fetch existing chat history for context
      const chatHistory = await store.getChatHistory(documentId, userId);

      // 3. Save User Message
      await store.saveChatMessage({
        documentId,
        userId,
        role: 'user',
        content: question.trim(),
        sourceReferences: []
      });

      // 4. Execute Document-Grounded Answer
      const { answer, sources } = await answerDocumentQuestion(
        question.trim(),
        document.text_content,
        document.title,
        chatHistory
      );

      // 5. Save Assistant Message with Citations
      const assistantMessage = await store.saveChatMessage({
        documentId,
        userId,
        role: 'assistant',
        content: answer,
        sourceReferences: sources
      });

      return res.status(200).json({
        success: true,
        data: assistantMessage
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get chat history for a document
   */
  async getChatHistory(req, res, next) {
    try {
      const { id: documentId } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const document = await store.getDocumentById(documentId, userId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found or permission denied.'
        });
      }

      const history = await store.getChatHistory(documentId, userId);

      return res.status(200).json({
        success: true,
        data: history
      });
    } catch (err) {
      next(err);
    }
  }
};
