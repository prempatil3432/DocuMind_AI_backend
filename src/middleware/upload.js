import multer from 'multer';
import path from 'path';
import { ENV } from '../config/env.js';

// Use memory storage for fast, clean in-memory buffer processing without disk clutter
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown'
];

export function sanitizeFilename(filename) {
  if (!filename) return 'unnamed_document.pdf';
  // Strip directory paths and dangerous characters
  const basename = path.basename(filename);
  return basename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 100);
}

const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();

  const isAllowedExt = ['.pdf', '.txt', '.md'].includes(ext);
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(mime) || mime === 'application/octet-stream';

  if (isAllowedExt && isAllowedMime) {
    file.sanitizedName = sanitizeFilename(file.originalname);
    return cb(null, true);
  }

  cb(new Error('Invalid file type. Only PDF documents (.pdf) and plain text documents (.txt, .md) are supported.'));
};

export const upload = multer({
  storage,
  limits: {
    fileSize: ENV.MAX_FILE_SIZE_MB * 1024 * 1024 // e.g. 10MB
  },
  fileFilter
});
