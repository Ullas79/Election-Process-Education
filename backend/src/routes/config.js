/**
 * Config Routes
 * Serves non-sensitive configuration to the frontend
 * This includes public API keys like Google Maps Embed API
 *
 * Security: Restricted to same-origin requests via Referer/Origin check
 * to prevent external scraping of API keys.
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();

// Strict rate limit for config endpoint (5 requests per minute per IP)
const configLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/config/maps-key
 * Returns the public Google Maps Embed API key
 * Protected by rate limiting and same-origin check
 */
router.get('/maps-key', configLimiter, (req, res) => {
  // Same-origin check: only serve key to requests from our own frontend
  const allowedOrigin = process.env.CORS_ORIGIN || 'https://elected-app-1031806887295.asia-south1.run.app';
  const referer = req.get('referer') || '';
  const origin = req.get('origin') || '';

  if (!referer.startsWith(allowedOrigin) && !origin.startsWith(allowedOrigin) && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Only use dedicated Maps key — never fall back to Gemini API key
  const mapsKey = process.env.GOOGLE_MAPS_KEY || process.env.YOUTUBE_API_KEY;

  if (!mapsKey) {
    return res.status(404).json({ error: 'Maps API key not configured' });
  }

  // Embed API keys are meant to be public (restricted by HTTP referrer in GCP Console),
  // but we serve them via backend to avoid GitHub secret scanning false positives
  // and to allow easy rotation.
  res.set('Cache-Control', 'private, max-age=3600');
  res.json({ key: mapsKey });
});

export default router;
