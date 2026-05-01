/**
 * YouTube API Routes
 * Fetches election education videos from YouTube Data API v3
 * Keeps API key server-side for security
 */
import { Router } from 'express';
import { logger } from '../utils/logger.js';

const router = Router();

// Curated fallback videos in case the API call fails or quota is exceeded const FALLBACK_VIDEOS = [
  {
    id: 'QtZIlxw871I',
    title: 'How to Vote using EVM-VVPAT',
    thumbnail: 'https://img.youtube.com/vi/QtZIlxw871I/mqdefault.jpg',
    channel: 'Election Commission of India',
  },
  {
    id: 'bTVMGO80cEo',
    title: 'What is EVM? Electronic Voting Machine Explained',
    thumbnail: 'https://img.youtube.com/vi/bTVMGO80cEo/mqdefault.jpg',
    channel: 'Election Education',
  },
  {
    id: 'YFjxBqS8bss',
    title: 'Indian Election Process Explained',
    thumbnail: 'https://img.youtube.com/vi/YFjxBqS8bss/mqdefault.jpg',
    channel: 'Democracy Education',
  },
  {
    id: 'A-4dIImaodQ',
    title: 'NOTA in Indian Elections',
    thumbnail: 'https://img.youtube.com/vi/A-4dIImaodQ/mqdefault.jpg',
    channel: 'Civic Education',
  },
  {
    id: 'U3OwSEBCL-g',
    title: 'How Elections Work in India',
    thumbnail: 'https://img.youtube.com/vi/U3OwSEBCL-g/mqdefault.jpg',
    channel: 'Education Channel',
  },
  {
    id: 'dQw4w9WgXcQ',
    title: 'Understanding Democracy and Voting Rights',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    channel: 'Democracy Today',
  },
// Curated fallback videos with actual, working YouTube IDs
const FALLBACK_VIDEOS = [
  {
    id: 'QtZIlxw871I',
    title: 'How to Vote using EVM-VVPAT',
    thumbnail: 'https://img.youtube.com/vi/QtZIlxw871I/mqdefault.jpg',
    channel: 'Election Commission of India',
  },
  {
    id: 'QWs2Mx6Xo2g',
    title: 'What is EVM? Electronic Voting Machine Explained',
    thumbnail: 'https://img.youtube.com/vi/QWs2Mx6Xo2g/mqdefault.jpg',
    channel: 'Republic TV',
  },
  {
    id: 'On3jplIQaXs',
    title: 'Indian Election Process Explained',
    thumbnail: 'https://img.youtube.com/vi/On3jplIQaXs/mqdefault.jpg',
    channel: 'Dr Sidharth Arora',
  },
  {
    id: 'zRuTXeUwalA',
    title: 'Understanding the Election System in India',
    thumbnail: 'https://img.youtube.com/vi/zRuTXeUwalA/mqdefault.jpg',
    channel: 'NCERT Foundation',
  },
  {
    id: 'cRm6GkeV83w',
    title: 'How Elections Work in India',
    thumbnail: 'https://img.youtube.com/vi/cRm6GkeV83w/mqdefault.jpg',
    channel: 'ANI Podcast',
  },
  {
    id: 'MVmKqsFZiT0',
    title: 'Right to Vote | Polity Primer',
    thumbnail: 'https://img.youtube.com/vi/MVmKqsFZiT0/mqdefault.jpg',
    channel: 'Drishti IAS English',
  },
];

/**
 * GET /api/youtube/videos
 * Search for election education videos using the YouTube Data API v3
 * Falls back to curated list when API key is missing or quota exceeded
 *
 * @query {string} q - Search query (default: 'Indian election process education')
 * @query {number} maxResults - Number of results (default: 6, max: 12)
 */
router.get('/videos', async (req, res) => {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GEMINI_API_KEY;
  const query = req.query.q || 'Indian election process education voting EVM';
  const maxResults = Math.min(Math.max(parseInt(req.query.maxResults) || 6, 1), 12);

  // If no API key available, return curated fallback
  if (!apiKey) {
    logger.warn('YouTube API key not configured, serving fallback videos');
    return res.json({
      videos: FALLBACK_VIDEOS.slice(0, maxResults),
      source: 'curated',
    });
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: maxResults.toString(),
      order: 'relevance',
      safeSearch: 'strict',
      relevanceLanguage: 'en',
      regionCode: 'IN',
      videoCategoryId: '27', // Education category
      key: apiKey,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000), // 5s timeout
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`YouTube API error ${response.status}: ${errorBody}`);
      // Fall back gracefully
      return res.json({
        videos: FALLBACK_VIDEOS.slice(0, maxResults),
        source: 'curated',
      });
    }

    const data = await response.json();
    const videos = (data.items || []).map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      channel: item.snippet.channelTitle,
      description: item.snippet.description?.substring(0, 120),
      publishedAt: item.snippet.publishedAt,
    }));

    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.json({
      videos: videos.length > 0 ? videos : FALLBACK_VIDEOS.slice(0, maxResults),
      source: videos.length > 0 ? 'youtube_api' : 'curated',
      query,
    });
  } catch (err) {
    logger.error(`YouTube API fetch failed: ${err.message}`);
    res.json({
      videos: FALLBACK_VIDEOS.slice(0, maxResults),
      source: 'curated',
    });
  }
});

export default router;
