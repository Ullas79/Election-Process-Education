/**
 * Election Process Education - Express Server
 * Main entry point for the application
 */
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import apicache from 'apicache';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

import { securityHeaders, parameterPollutionProtection } from './middleware/security.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { initializeGemini } from './services/geminiService.js';
import { logger } from './utils/logger.js';

import chatRoutes from './routes/chat.js';
import quizRoutes from './routes/quiz.js';
import electionRoutes from './routes/election.js';
import youtubeRoutes from './routes/youtube.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust the first proxy in Google Cloud Run to correctly parse X-Forwarded-For
app.set('trust proxy', 1);

// ────────────────────────────────────────
// Security Middleware
// ────────────────────────────────────────
app.use(securityHeaders());
app.use(parameterPollutionProtection());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'https://elected-app-1031806887295.asia-south1.run.app',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    maxAge: 86400,
  })
);

// ────────────────────────────────────────
// General Middleware
// ────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// HTTP request logging
app.use(
  morgan('short', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// ────────────────────────────────────────
// Static Files
// ────────────────────────────────────────
app.use(express.static(join(__dirname, '../../frontend'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
}));

// ────────────────────────────────────────
// Rate Limiting
// ────────────────────────────────────────
app.use('/api/', apiLimiter);

// ────────────────────────────────────────
// API Routes
// ────────────────────────────────────────
const cache = apicache.middleware;

app.use('/api/chat', chatRoutes); // Dynamic AI, never cache
app.use('/api/quiz', quizRoutes); // Contains POST for answer-checking, do not cache
app.use('/api/election/timeline', cache('1 hour')); // Static GET data, safe to cache
app.use('/api/election/voter-guide', cache('1 hour'));
app.use('/api/election/types', cache('1 hour'));
app.use('/api/election', electionRoutes); // /facts is randomized, so only specific GETs above are cached
app.use('/api/youtube', cache('1 hour'), youtubeRoutes); // YouTube API — cached to minimize quota usage

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ────────────────────────────────────────
// SPA Fallback - serve index.html for client routes
// ────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '../../frontend/index.html'));
});

// ────────────────────────────────────────
// Error Handling
// ────────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'An unexpected error occurred. Please try again later.',
  });
});

// ────────────────────────────────────────
// Server Startup
// ────────────────────────────────────────
function startServer() {
  // Initialize Gemini AI via Vertex AI
  const geminiReady = initializeGemini(process.env.GCP_PROJECT_ID, process.env.GCP_LOCATION);
  if (!geminiReady) {
    logger.warn('Starting without Gemini AI. Chat will use fallback knowledge base.');
  }

  const server = app.listen(PORT, () => {
    logger.info(`🗳️  Election Education Server running on http://localhost:${PORT}`);
    logger.info(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🤖 AI Chat: ${geminiReady ? 'Gemini Enabled' : 'Fallback Mode'}`);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
}

// Export for testing
export { app, startServer };

// Start server if run directly
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer();
}
