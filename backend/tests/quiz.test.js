/**
 * Quiz API Tests
 */
import { jest } from '@jest/globals';

// Mock Gemini service to prevent initialization
jest.unstable_mockModule('../src/services/geminiService.js', () => ({
  generateResponse: jest.fn(),
  isGeminiAvailable: jest.fn().mockReturnValue(false),
  initializeGemini: jest.fn(),
}));

const { default: supertest } = await import('supertest');
const { app } = await import('../src/server.js');

const request = supertest(app);

describe('Quiz API', () => {
  describe('GET /api/quiz', () => {
    it('should return quiz questions', async () => {
      const res = await request.get('/api/quiz').expect(200);

      expect(res.body).toHaveProperty('questions');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('returned');
      expect(Array.isArray(res.body.questions)).toBe(true);
      expect(res.body.returned).toBeLessThanOrEqual(5); // Default limit
    });

    it('should filter by category', async () => {
      const res = await request.get('/api/quiz?category=basics').expect(200);

      res.body.questions.forEach((q) => {
        expect(q.category).toBe('basics');
      });
    });

    it('should filter by difficulty', async () => {
      const res = await request.get('/api/quiz?difficulty=easy').expect(200);

      res.body.questions.forEach((q) => {
        expect(q.difficulty).toBe('easy');
      });
    });

    it('should respect the limit parameter', async () => {
      const res = await request.get('/api/quiz?limit=3').expect(200);

      expect(res.body.returned).toBeLessThanOrEqual(3);
    });

    it('should cap limit at 15', async () => {
      const res = await request.get('/api/quiz?limit=100').expect(200);

      expect(res.body.returned).toBeLessThanOrEqual(15);
    });

    it('should not include correct answers in response', async () => {
      const res = await request.get('/api/quiz').expect(200);

      res.body.questions.forEach((q) => {
        expect(q).not.toHaveProperty('correctAnswer');
      });
    });

    it('should include question metadata', async () => {
      const res = await request.get('/api/quiz?limit=1').expect(200);

      if (res.body.questions.length > 0) {
        const q = res.body.questions[0];
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('category');
        expect(q).toHaveProperty('difficulty');
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('options');
        expect(Array.isArray(q.options)).toBe(true);
      }
    });
  });

  describe('POST /api/quiz/check', () => {
    it('should check correct answers and return score', async () => {
      const res = await request
        .post('/api/quiz/check')
        .send({
          answers: [
            { questionId: 1, selectedAnswer: 1 }, // 18 years - correct
            { questionId: 2, selectedAnswer: 2 }, // ECI - correct
          ],
        })
        .expect(200);

      expect(res.body).toHaveProperty('results');
      expect(res.body).toHaveProperty('score');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('percentage');
      expect(res.body).toHaveProperty('grade');
      expect(res.body.score).toBe(2);
      expect(res.body.total).toBe(2);
    });

    it('should identify incorrect answers', async () => {
      const res = await request
        .post('/api/quiz/check')
        .send({
          answers: [
            { questionId: 1, selectedAnswer: 0 }, // Wrong answer
          ],
        })
        .expect(200);

      expect(res.body.results[0].correct).toBe(false);
      expect(res.body.results[0]).toHaveProperty('explanation');
      expect(res.body.score).toBe(0);
    });

    it('should reject empty answers array', async () => {
      const res = await request
        .post('/api/quiz/check')
        .send({ answers: [] })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should reject missing answers', async () => {
      const res = await request
        .post('/api/quiz/check')
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should handle invalid question IDs', async () => {
      const res = await request
        .post('/api/quiz/check')
        .send({
          answers: [{ questionId: 9999, selectedAnswer: 0 }],
        })
        .expect(200);

      expect(res.body.results[0].valid).toBe(false);
    });

    it('should limit to maximum 15 answers', async () => {
      const tooManyAnswers = Array.from({ length: 20 }, (_, i) => ({
        questionId: i + 1,
        selectedAnswer: 0,
      }));

      const res = await request
        .post('/api/quiz/check')
        .send({ answers: tooManyAnswers })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should return grade based on score', async () => {
      // All correct answers
      const res = await request
        .post('/api/quiz/check')
        .send({
          answers: [
            { questionId: 1, selectedAnswer: 1 },
            { questionId: 2, selectedAnswer: 2 },
            { questionId: 6, selectedAnswer: 1 },
            { questionId: 10, selectedAnswer: 1 },
            { questionId: 13, selectedAnswer: 1 },
          ],
        })
        .expect(200);

      expect(res.body.percentage).toBe(100);
      expect(res.body.grade).toContain('Expert');
    });
  });

  describe('GET /api/quiz/categories', () => {
    it('should return quiz categories with counts', async () => {
      const res = await request.get('/api/quiz/categories').expect(200);

      expect(res.body).toHaveProperty('categories');
      expect(res.body.categories).toHaveProperty('basics');
      expect(res.body.categories).toHaveProperty('process');
      expect(res.body.categories.basics).toHaveProperty('count');
      expect(res.body.categories.basics).toHaveProperty('difficulties');
    });
  });
});
