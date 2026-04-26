/**
 * Quiz Module
 * Interactive election knowledge quiz with scoring
 */

const Quiz = {
  questions: [],
  currentIndex: 0,
  answers: [],
  submitted: false,

  async start() {
    const category = document.getElementById('quiz-category')?.value || '';
    const difficulty = document.getElementById('quiz-difficulty')?.value || '';

    try {
      const params = new URLSearchParams({ limit: '5' });
      if (category) params.set('category', category);
      if (difficulty) params.set('difficulty', difficulty);

      const res = await fetch(`/api/quiz?${params}`);
      const data = await res.json();

      if (!data.questions || data.questions.length === 0) {
        alert('No questions available for the selected filters. Try different options.');
        return;
      }

      this.questions = data.questions;
      this.currentIndex = 0;
      this.answers = new Array(data.questions.length).fill(null);
      this.submitted = false;

      // Show quiz, hide controls and results
      document.getElementById('quiz-controls').style.display = 'none';
      document.getElementById('quiz-results').style.display = 'none';
      document.getElementById('quiz-container').style.display = 'block';

      this.renderQuestion();
    } catch (err) {
      console.error('Failed to load quiz:', err);
      alert('Failed to load quiz questions. Please try again.');
    }
  },

  renderQuestion() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    const question = this.questions[this.currentIndex];
    const letters = ['A', 'B', 'C', 'D'];
    const totalQuestions = this.questions.length;
    const progress = ((this.currentIndex + 1) / totalQuestions) * 100;

    container.innerHTML = `
      <div class="quiz-progress">
        <div class="quiz-progress-bar">
          <div class="quiz-progress-fill" style="width: ${progress}%"></div>
        </div>
        <span class="quiz-progress-text">${this.currentIndex + 1} / ${totalQuestions}</span>
      </div>

      <div class="quiz-question-card" id="quiz-question-card">
        <div class="quiz-question-meta">
          <span class="quiz-category-badge">${question.category}</span>
          <span class="quiz-difficulty-badge ${question.difficulty}">${question.difficulty}</span>
        </div>

        <p class="quiz-question-text" id="quiz-question-text">${question.question}</p>

        <div class="quiz-options" role="radiogroup" aria-labelledby="quiz-question-text">
          ${question.options
            .map(
              (option, i) => `
            <button class="quiz-option ${this.answers[this.currentIndex] === i ? 'selected' : ''}"
                    onclick="Quiz.selectAnswer(${i})"
                    role="radio"
                    aria-checked="${this.answers[this.currentIndex] === i}"
                    id="quiz-option-${i}">
              <span class="quiz-option-letter">${letters[i]}</span>
              <span>${option}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="quiz-nav">
        <button class="btn btn-outline" onclick="Quiz.prevQuestion()" ${this.currentIndex === 0 ? 'disabled style="opacity:0.5;pointer-events:none"' : ''}>
          ← Previous
        </button>
        ${
          this.currentIndex === totalQuestions - 1
            ? `<button class="btn btn-primary" onclick="Quiz.submit()" id="quiz-submit-btn" ${this.answers.includes(null) ? 'disabled style="opacity:0.6"' : ''}>
                Submit Quiz ✓
              </button>`
            : `<button class="btn btn-primary" onclick="Quiz.nextQuestion()">
                Next →
              </button>`
        }
      </div>
    `;
  },

  selectAnswer(index) {
    this.answers[this.currentIndex] = index;
    this.renderQuestion();
  },

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.renderQuestion();
    }
  },

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderQuestion();
    }
  },

  async submit() {
    if (this.answers.includes(null)) {
      alert('Please answer all questions before submitting.');
      return;
    }

    try {
      const payload = this.answers.map((answer, i) => ({
        questionId: this.questions[i].id,
        selectedAnswer: answer,
      }));

      const res = await fetch('/api/quiz/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      });

      const data = await res.json();
      this.showResults(data);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      alert('Failed to submit quiz. Please try again.');
    }
  },

  showResults(data) {
    const container = document.getElementById('quiz-container');
    const results = document.getElementById('quiz-results');

    if (container) container.style.display = 'none';
    if (!results) return;

    results.style.display = 'block';

    // Determine theme color for score
    let scoreColor = 'var(--primary-500)';
    if (data.percentage >= 70) scoreColor = 'var(--success-500)';
    else if (data.percentage < 50) scoreColor = 'var(--error-500)';

    results.innerHTML = `
      <div class="quiz-results-card">
        <div class="quiz-score-circle" style="--score-percent: ${data.percentage}; background: conic-gradient(${scoreColor} ${data.percentage * 3.6}deg, var(--bg-tertiary) 0);">
          <div class="quiz-score-inner">
            <span class="quiz-score-number">${data.percentage}%</span>
            <span class="quiz-score-label">${data.score}/${data.total} correct</span>
          </div>
        </div>

        <h3 class="quiz-grade">${data.grade}</h3>

        <p class="quiz-results-summary">
          You answered ${data.score} out of ${data.total} questions correctly.
          ${data.percentage >= 70 ? 'Great job! You have a solid understanding of the election process.' : 'Keep learning! Explore our timeline and voter guide to improve your knowledge.'}
        </p>

        <div style="margin-bottom: 1.5rem;">
          ${data.results
            .filter((r) => r.valid)
            .map((r, i) => {
              const q = this.questions.find((q) => q.id === r.questionId);
              return `
              <div class="quiz-explanation" style="text-align: left; margin-bottom: 0.75rem; ${r.correct ? 'border-left-color: var(--success-500)' : 'border-left-color: var(--error-500)'}">
                <strong>${r.correct ? '✅' : '❌'} Q${i + 1}: ${q?.question || 'Question'}</strong>
                <p style="margin-top: 0.25rem">${r.explanation}</p>
              </div>
            `;
            })
            .join('')}
        </div>

        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="Quiz.restart()">Try Again</button>
          <button class="btn btn-outline" onclick="navigateTo('chat')">Ask AI for Help</button>
        </div>
      </div>
    `;
  },

  restart() {
    const controls = document.getElementById('quiz-controls');
    const container = document.getElementById('quiz-container');
    const results = document.getElementById('quiz-results');

    if (controls) controls.style.display = 'flex';
    if (container) container.style.display = 'none';
    if (results) results.style.display = 'none';
  },
};

/**
 * Start quiz (called from HTML onclick)
 */
function startQuiz() {
  Quiz.start();
}

// No DOMContentLoaded init needed — quiz starts on user action
