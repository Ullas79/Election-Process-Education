/**
 * Rate Limiter Middleware
 * Prevents abuse by limiting request frequency
 */
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again later.',
    retryAfter: '15 minutes',
  },
  handler: (req, res, _next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
});

/**
 * Strict rate limiter for AI chat endpoint
 * More restrictive to prevent API abuse
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many chat requests. Please wait a moment before asking another question.',
    retryAfter: '1 minute',
  },
  handler: (req, res, _next, options) => {
    logger.warn(`Chat rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
});
