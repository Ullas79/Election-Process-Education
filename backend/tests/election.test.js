/**
 * Election Data API Tests
 */
import { jest } from '@jest/globals';

// Mock Gemini service
jest.unstable_mockModule('../src/services/geminiService.js', () => ({
  generateResponse: jest.fn(),
  isGeminiAvailable: jest.fn().mockReturnValue(false),
  initializeGemini: jest.fn(),
}));

const { default: supertest } = await import('supertest');
const { app } = await import('../src/server.js');

const request = supertest(app);

describe('Election Data API', () => {
  describe('GET /api/election/timeline', () => {
    it('should return the election timeline', async () => {
      const res = await request.get('/api/election/timeline').expect(200);

      expect(res.body).toHaveProperty('timeline');
      expect(Array.isArray(res.body.timeline)).toBe(true);
      expect(res.body.timeline.length).toBeGreaterThan(0);
    });

    it('should include required fields for each timeline item', async () => {
      const res = await request.get('/api/election/timeline').expect(200);

      const item = res.body.timeline[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('phase');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('duration');
      expect(item).toHaveProperty('icon');
      expect(item).toHaveProperty('details');
      expect(Array.isArray(item.details)).toBe(true);
    });
  });

  describe('GET /api/election/voter-guide', () => {
    it('should return the voter guide', async () => {
      const res = await request.get('/api/election/voter-guide').expect(200);

      expect(res.body).toHaveProperty('guide');
      expect(res.body.guide).toHaveProperty('eligibility');
      expect(res.body.guide).toHaveProperty('registration');
      expect(res.body.guide).toHaveProperty('pollingDay');
      expect(res.body.guide).toHaveProperty('documents');
    });

    it('should include registration steps', async () => {
      const res = await request.get('/api/election/voter-guide').expect(200);

      expect(res.body.guide.registration).toHaveProperty('steps');
      expect(Array.isArray(res.body.guide.registration.steps)).toBe(true);
      expect(res.body.guide.registration.steps.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/election/types', () => {
    it('should return election types', async () => {
      const res = await request.get('/api/election/types').expect(200);

      expect(res.body).toHaveProperty('types');
      expect(Array.isArray(res.body.types)).toBe(true);
      expect(res.body.types.length).toBeGreaterThanOrEqual(3);
    });

    it('should include detailed information for each type', async () => {
      const res = await request.get('/api/election/types').expect(200);

      const type = res.body.types[0];
      expect(type).toHaveProperty('id');
      expect(type).toHaveProperty('title');
      expect(type).toHaveProperty('description');
      expect(type).toHaveProperty('details');
    });
  });

  describe('GET /api/election/facts', () => {
    it('should return election facts', async () => {
      const res = await request.get('/api/election/facts').expect(200);

      expect(res.body).toHaveProperty('facts');
      expect(Array.isArray(res.body.facts)).toBe(true);
      expect(res.body.facts.length).toBe(3); // Default count
    });

    it('should respect the count parameter', async () => {
      const res = await request.get('/api/election/facts?count=5').expect(200);

      expect(res.body.facts.length).toBe(5);
    });

    it('should cap count at 12', async () => {
      const res = await request.get('/api/election/facts?count=50').expect(200);

      expect(res.body.facts.length).toBeLessThanOrEqual(12);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request.get('/api/health').expect(200);

      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('version');
    });
  });
});
