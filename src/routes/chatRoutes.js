import express from 'express';
import { chatController } from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.use(authenticateToken);

// Ask question grounded on the document
router.post('/', chatController.askQuestion);

// Get chat history
router.get('/', chatController.getChatHistory);

export default router;
