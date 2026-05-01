/**
 * Security Middleware Configuration
 * Implements helmet, HPP, and custom security headers
 *
 * CSP Policy Notes:
 * - Google Translate requires inline scripts and translate.googleapis.com
 * - Google Maps embed requires google.com/maps iframes
 * - YouTube embeds require youtube.com iframes
 * - Google Fonts requires fonts.googleapis.com/fonts.gstatic.com
 */
import helmet from 'helmet';
import hpp from 'hpp';

/**
 * Configure Helmet security headers
 * Whitelists only the exact Google Service domains we integrate
 */
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://translate.google.com',
          'https://translate.googleapis.com',
          'https://translate-pa.googleapis.com',
          'https://www.googletagmanager.com',
          'https://www.google-analytics.com',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://translate.googleapis.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.youtube.com',
          'https://*.ytimg.com',
          'https://*.ggpht.com',
          'https://*.google.com',
          'https://*.gstatic.com',
          'https://*.googleusercontent.com',
          'https://img.youtube.com',
          'https://i.ytimg.com',
          'https://lh3.googleusercontent.com',
          'https://www.gstatic.com',
          'https://*.google-analytics.com',
          'https:',
        ],
        connectSrc: [
          "'self'",
          'https://*.googleapis.com',
          'https://*.google-analytics.com',
          'https://*.analytics.google.com',
          'https://*.google.com',
        ],
        frameSrc: [
          "'self'",
          'https://*.google.com',
          'https://www.google.com',
          'https://*.youtube.com',
          'https://youtube.com',
          'https://*.youtube-nocookie.com',
          'https://youtube-nocookie.com',
          'https://*.googleapis.com',
          'https://*.google-analytics.com',
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        scriptSrcAttr: ["'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
}

/**
 * Configure HTTP Parameter Pollution protection
 */
export function parameterPollutionProtection() {
  return hpp();
}

/**
 * Sanitize user input to prevent XSS
 * Strips dangerous patterns while preserving legitimate text content
 * @param {string} input - Raw user input
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')             // Strip angle brackets
    .replace(/javascript\s*:/gi, '')  // Strip javascript: protocol
    .replace(/data\s*:/gi, '')        // Strip data: URI scheme
    .replace(/vbscript\s*:/gi, '')    // Strip vbscript: protocol
    .replace(/on\w+\s*=/gi, '')       // Strip inline event handlers
    .replace(/expression\s*\(/gi, '') // Strip CSS expression()
    .trim()
    .substring(0, 2000);              // Enforce length limit
}
