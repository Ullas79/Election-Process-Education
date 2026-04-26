/**
 * Election Data API Routes
 * Serves election process information
 */
import { Router } from 'express';
import {
  electionTimeline,
  voterGuide,
  electionTypes,
  electionFacts,
} from '../data/electionData.js';

const router = Router();

/**
 * GET /api/election/timeline
 * Get the complete election process timeline
 */
router.get('/timeline', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=3600'); // 1 hour — static content
  res.json({ timeline: electionTimeline });
});

/**
 * GET /api/election/voter-guide
 * Get the comprehensive voter guide
 */
router.get('/voter-guide', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({ guide: voterGuide });
});

/**
 * GET /api/election/types
 * Get information about different types of elections
 */
router.get('/types', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({ types: electionTypes });
});

/**
 * GET /api/election/facts
 * Get random election facts
 * @query {number} count - Number of facts to return (default: 3)
 */
router.get('/facts', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 min — randomized output
  const count = Math.min(Math.max(parseInt(req.query.count) || 3, 1), 12);
  const shuffled = [...electionFacts].sort(() => Math.random() - 0.5);
  res.json({ facts: shuffled.slice(0, count) });
});

export default router;
