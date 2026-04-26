/**
 * Chat API Routes
 * Handles AI-powered election Q&A interactions
 */
import { Router } from 'express';
import { generateResponse, isGeminiAvailable } from '../services/geminiService.js';
import { sanitizeInput } from '../middleware/security.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../utils/logger.js';
import validator from 'validator';

const router = Router();

/**
 * POST /api/chat
 * Send a message to the Election AI Assistant
 * @body {string} message - The user's question
 * @body {Array} history - Conversation history for context
 */
router.post('/', chatLimiter, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string.',
      });
    }

    // Sanitize input
    const sanitizedMessage = sanitizeInput(message);

    if (validator.isEmpty(sanitizedMessage)) {
      return res.status(400).json({
        error: 'Message cannot be empty after sanitization.',
      });
    }

    if (sanitizedMessage.length > 2000) {
      return res.status(400).json({
        error: 'Message exceeds maximum length of 2000 characters.',
      });
    }

    // Validate history format
    const validHistory = Array.isArray(history)
      ? history
          .filter(
            (msg) =>
              msg &&
              typeof msg.role === 'string' &&
              typeof msg.content === 'string' &&
              ['user', 'assistant'].includes(msg.role)
          )
          .slice(-10) // Keep last 10 messages for context
          .map((msg) => ({
            role: msg.role,
            content: sanitizeInput(msg.content),
          }))
      : [];

    logger.info(`Chat request: "${sanitizedMessage.substring(0, 80)}..."`);

    // Generate response
    const response = await generateResponse(sanitizedMessage, validHistory);

    res.json({
      response,
      isAI: isGeminiAvailable(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'An error occurred while processing your question. Please try again.',
    });
  }
});

/**
 * GET /api/chat/status
 * Check the status of the AI chat service
 */
router.get('/status', (_req, res) => {
  res.json({
    available: isGeminiAvailable(),
    mode: isGeminiAvailable() ? 'AI-Powered (Gemini)' : 'Knowledge Base (Offline)',
  });
});

export default router;
