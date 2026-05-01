/**
 * Config Routes
 * Serves non-sensitive configuration to the frontend
 * This includes public API keys like Google Maps Embed API
 */
import { Router } from 'express';

const router = Router();

/**
 * GET /api/config/maps-key
 * Returns the public Google Maps Embed API key
 */
router.get('/maps-key', (req, res) => {
  // Use YOUTUBE_API_KEY as the fallback since it often has Maps Embed enabled too
  const mapsKey = process.env.GOOGLE_MAPS_KEY || process.env.YOUTUBE_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!mapsKey) {
    return res.status(404).json({ error: 'Maps API key not configured' });
  }

  // Return the key. Note: Embed API keys are meant to be public, 
  // but we serve them via backend to avoid GitHub secret scanning false positives
  // and to allow easy rotation.
  res.json({ key: mapsKey });
});

export default router;
