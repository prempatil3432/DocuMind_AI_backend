import express from 'express';
import { documentController } from '../controllers/documentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All document routes require authentication
router.use(authenticateToken);

// Document Ingestion & Processing
router.post('/upload', uploadLimiter, upload.single('file'), documentController.uploadAndProcess);

// Load bundled realistic fictional sample document for Demo Mode
router.post('/demo/sample', documentController.loadSampleDocument);

// Search inside documents
router.get('/search', documentController.searchDocuments);

// List user documents & dashboard stats
router.get('/', documentController.listDocuments);

// Get single document with intelligence & action items
router.get('/:id', documentController.getDocumentById);

// Delete document
router.delete('/:id', documentController.deleteDocument);

// Interactive Action Center: Toggle action status (Pending / Completed)
router.patch('/:id/actions/:actionId', documentController.toggleActionItem);

export default router;
