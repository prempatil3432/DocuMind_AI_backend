import app from './app.js';
import { ENV } from './config/env.js';

const PORT = ENV.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`   DOCUMIND AI - Intelligent Document Processing      `);
  console.log(`=======================================================`);
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${ENV.NODE_ENV}`);
  console.log(`[Health] Status available at http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Closing server gracefully...');
  server.close(() => {
    console.log('[Server] Process terminated.');
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

export default server;
