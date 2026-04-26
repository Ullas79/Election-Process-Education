/**
 * Quiz API Routes
 * Handles election knowledge quiz endpoints
 */
import { Router } from 'express';
import { quizQuestions } from '../data/electionData.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/quiz
 * Get quiz questions, optionally filtered by category and difficulty
 * @query {string} category - Filter by category (basics, process, technology, constitutional)
 * @query {string} difficulty - Filter by difficulty (easy, medium, hard)
 * @query {number} limit - Number of questions to return (default: 5)
 */
router.get('/', (req, res) => {
  try {
    let { category, difficulty, limit = 5 } = req.query;

    limit = Math.min(Math.max(parseInt(limit) || 5, 1), 15);

    let filtered = [...quizQuestions];

    if (category && ['basics', 'process', 'technology', 'constitutional'].includes(category)) {
      filtered = filtered.filter((q) => q.category === category);
    }

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      filtered = filtered.filter((q) => q.difficulty === difficulty);
    }

    // Shuffle and limit
    const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, limit);

    // Remove correct answer from response (for client-side quiz)
    const questions = shuffled.map(({ correctAnswer, ...rest }) => rest);

    res.json({
      questions,
      total: filtered.length,
      returned: questions.length,
    });
  } catch (error) {
    logger.error('Quiz fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz questions.' });
  }
});

/**
 * POST /api/quiz/check
 * Check answers for submitted quiz
 * @body {Array} answers - Array of { questionId, selectedAnswer }
 */
router.post('/check', (req, res) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers array is required.' });
    }

    if (answers.length > 15) {
      return res.status(400).json({ error: 'Maximum 15 answers allowed.' });
    }

    const results = answers.map((answer) => {
      const question = quizQuestions.find((q) => q.id === answer.questionId);
      if (!question) {
        return { questionId: answer.questionId, valid: false, error: 'Question not found' };
      }

      const isCorrect = question.correctAnswer === answer.selectedAnswer;

      return {
        questionId: answer.questionId,
        valid: true,
        correct: isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      };
    });

    const score = results.filter((r) => r.valid && r.correct).length;
    const total = results.filter((r) => r.valid).length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    let grade;
    if (percentage >= 90) grade = 'Election Expert! 🏆';
    else if (percentage >= 70) grade = 'Informed Citizen! 🌟';
    else if (percentage >= 50) grade = 'Getting There! 📚';
    else grade = 'Keep Learning! 💪';

    logger.info(`Quiz submitted: ${score}/${total} (${percentage}%)`);

    res.json({
      results,
      score,
      total,
      percentage,
      grade,
    });
  } catch (error) {
    logger.error('Quiz check error:', error);
    res.status(500).json({ error: 'Failed to check quiz answers.' });
  }
});

/**
 * GET /api/quiz/categories
 * Get available quiz categories with question counts
 */
router.get('/categories', (_req, res) => {
  const categories = {};
  quizQuestions.forEach((q) => {
    if (!categories[q.category]) {
      categories[q.category] = { count: 0, difficulties: {} };
    }
    categories[q.category].count++;
    categories[q.category].difficulties[q.difficulty] =
      (categories[q.category].difficulties[q.difficulty] || 0) + 1;
  });

  res.json({ categories });
});

export default router;
