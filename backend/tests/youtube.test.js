/**
 * YouTube API Route Tests
 * Tests the /api/youtube/videos endpoint
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';

describe('YouTube API Routes', () => {
  describe('GET /api/youtube/videos', () => {
    it('should return an array of videos', async () => {
      const res = await request(app).get('/api/youtube/videos');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('videos');
      expect(Array.isArray(res.body.videos)).toBe(true);
      expect(res.body.videos.length).toBeGreaterThan(0);
    });

    it('should return videos with required fields', async () => {
      const res = await request(app).get('/api/youtube/videos');
      const video = res.body.videos[0];
      expect(video).toHaveProperty('id');
      expect(video).toHaveProperty('title');
      expect(video).toHaveProperty('thumbnail');
      expect(video).toHaveProperty('channel');
    });

    it('should respect maxResults parameter', async () => {
      const res = await request(app).get('/api/youtube/videos?maxResults=3');
      expect(res.status).toBe(200);
      expect(res.body.videos.length).toBeLessThanOrEqual(3);
    });

    it('should cap maxResults at 12', async () => {
      const res = await request(app).get('/api/youtube/videos?maxResults=100');
      expect(res.status).toBe(200);
      expect(res.body.videos.length).toBeLessThanOrEqual(12);
    });

    it('should accept custom search query', async () => {
      const res = await request(app).get('/api/youtube/videos?q=EVM+voting');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('videos');
    });

    it('should include source field', async () => {
      const res = await request(app).get('/api/youtube/videos');
      expect(res.body).toHaveProperty('source');
      expect(['youtube_api', 'curated']).toContain(res.body.source);
    });

    it('should return valid YouTube video IDs', async () => {
      const res = await request(app).get('/api/youtube/videos');
      res.body.videos.forEach((video) => {
        expect(typeof video.id).toBe('string');
        expect(video.id.length).toBeGreaterThan(0);
      });
    });

    it('should return valid thumbnail URLs', async () => {
      const res = await request(app).get('/api/youtube/videos');
      res.body.videos.forEach((video) => {
        expect(video.thumbnail).toMatch(/^https?:\/\//);
      });
    });

    it('should handle invalid maxResults gracefully', async () => {
      const res = await request(app).get('/api/youtube/videos?maxResults=abc');
      expect(res.status).toBe(200);
      expect(res.body.videos.length).toBeGreaterThan(0);
    });

    it('should handle negative maxResults gracefully', async () => {
      const res = await request(app).get('/api/youtube/videos?maxResults=-5');
      expect(res.status).toBe(200);
      expect(res.body.videos.length).toBeGreaterThanOrEqual(1);
    });
  });
});
