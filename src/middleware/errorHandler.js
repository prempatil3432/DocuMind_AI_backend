import multer from 'multer';

export function errorHandler(err, req, res, next) {
  // Log full technical stack trace securely on the backend only
  console.error(`[Error] ${req.method} ${req.url} -`, err);

  // Handle Multer upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'The uploaded file exceeds the 10MB size limit. Please upload a smaller document.',
        code: 'FILE_TOO_LARGE'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload failed: ${err.message}`,
      code: 'UPLOAD_ERROR'
    });
  }

  // Handle custom upload errors
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload in request body.',
      code: 'INVALID_JSON'
    });
  }

  // Standard safe user-facing message
  const statusCode = err.statusCode || (err.status >= 400 && err.status < 600 ? err.status : 500);
  const userMessage = statusCode === 500
    ? 'An unexpected error occurred while processing your request. Please try again shortly.'
    : (err.message || 'Operation failed.');

  return res.status(statusCode).json({
    success: false,
    error: userMessage,
    retryable: statusCode >= 500
  });
}
