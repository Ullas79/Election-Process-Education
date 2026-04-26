/**
 * Chat API Tests
 */
import { jest } from '@jest/globals';

// Mock Gemini service
const mockGenerateResponse = jest.fn();
const mockIsGeminiAvailable = jest.fn();
const mockInitializeGemini = jest.fn();

jest.unstable_mockModule('../src/services/geminiService.js', () => ({
  generateResponse: mockGenerateResponse,
  isGeminiAvailable: mockIsGeminiAvailable,
  initializeGemini: mockInitializeGemini,
}));

// Must dynamically import after mocking
const { default: supertest } = await import('supertest');
const { app } = await import('../src/server.js');

const request = supertest(app);

describe('Chat API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsGeminiAvailable.mockReturnValue(true);
  });

  describe('POST /api/chat', () => {
    it('should return a response for a valid message', async () => {
      mockGenerateResponse.mockResolvedValue('Test response about elections');

      const res = await request
        .post('/api/chat')
        .send({ message: 'How do I register to vote?' })
        .expect(200);

      expect(res.body).toHaveProperty('response');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body.response).toBe('Test response about elections');
    });

    it('should reject empty messages', async () => {
      const res = await request
        .post('/api/chat')
        .send({ message: '' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should reject missing message', async () => {
      const res = await request
        .post('/api/chat')
        .send({})
        .expect(400);

      expect(res.body.error).toContain('required');
    });

    it('should reject non-string messages', async () => {
      const res = await request
        .post('/api/chat')
        .send({ message: 12345 })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should handle conversation history', async () => {
      mockGenerateResponse.mockResolvedValue('Follow up about EVMs');

      const history = [
        { role: 'user', content: 'What is an EVM?' },
        { role: 'assistant', content: 'An EVM is an Electronic Voting Machine.' },
      ];

      const res = await request
        .post('/api/chat')
        .send({ message: 'Tell me more', history })
        .expect(200);

      expect(res.body.response).toBe('Follow up about EVMs');
      expect(mockGenerateResponse).toHaveBeenCalledWith(
        'Tell me more',
        expect.arrayContaining([
          expect.objectContaining({ role: 'user' }),
          expect.objectContaining({ role: 'assistant' }),
        ])
      );
    });

    it('should sanitize input by stripping HTML tags', async () => {
      mockGenerateResponse.mockResolvedValue('Sanitized response');

      const res = await request
        .post('/api/chat')
        .send({ message: 'Hello <script>alert("xss")</script>' })
        .expect(200);

      // The message should be sanitized before being sent to Gemini
      expect(mockGenerateResponse).toHaveBeenCalledWith(
        expect.not.stringContaining('<script>'),
        expect.any(Array)
      );
    });

    it('should handle Gemini service errors gracefully', async () => {
      mockGenerateResponse.mockRejectedValue(new Error('API Error'));

      const res = await request
        .post('/api/chat')
        .send({ message: 'Test question' })
        .expect(500);

      expect(res.body).toHaveProperty('error');
    });

    it('should filter invalid history entries', async () => {
      mockGenerateResponse.mockResolvedValue('Response');

      const history = [
        { role: 'user', content: 'Valid' },
        { role: 'invalid', content: 'Invalid role' },
        { role: 'assistant', content: 123 }, // Invalid content type
        { role: 'user', content: 'Also valid' },
      ];

      await request
        .post('/api/chat')
        .send({ message: 'Test', history })
        .expect(200);

      expect(mockGenerateResponse).toHaveBeenCalledWith(
        'Test',
        expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'Valid' }),
          expect.objectContaining({ role: 'user', content: 'Also valid' }),
        ])
      );
    });
  });

  describe('GET /api/chat/status', () => {
    it('should return AI availability status', async () => {
      mockIsGeminiAvailable.mockReturnValue(true);

      const res = await request.get('/api/chat/status').expect(200);

      expect(res.body).toHaveProperty('available', true);
      expect(res.body).toHaveProperty('mode', 'AI-Powered (Gemini)');
    });

    it('should indicate offline mode when Gemini is unavailable', async () => {
      mockIsGeminiAvailable.mockReturnValue(false);

      const res = await request.get('/api/chat/status').expect(200);

      expect(res.body).toHaveProperty('available', false);
      expect(res.body.mode).toContain('Offline');
    });
  });
});
