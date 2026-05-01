/**
 * Quiz Module
 * Interactive election knowledge quiz with scoring and accessibility support
 */

const Quiz = {
  questions: [],
  currentIndex: 0,
  answers: [],
  submitted: false,

  /**
   * Show an inline error message instead of alert()
   * @param {string} message - Error text
   */
  showError(message) {
    const container = document.getElementById('quiz-container');
    const controls = document.getElementById('quiz-controls');
    const target = container?.style.display !== 'none' ? container : controls;
    if (!target) return;

    // Remove any existing error
    const existing = target.querySelector('.quiz-error-msg');
    if (existing) existing.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'quiz-error-msg';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    errorDiv.textContent = message;

    target.prepend(errorDiv);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) errorDiv.remove();
    }, 5000);
  },

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
        this.showError('No questions available for the selected filters. Try different options.');
        return;
      }

      this.questions = data.questions;
      this.currentIndex = 0;
      this.answers = new Array(data.questions.length).fill(null);
      this.submitted = false;

      // Track quiz start in Google Analytics
      if (typeof Analytics !== 'undefined') Analytics.trackQuizStart(category, difficulty);

      // Show quiz, hide controls and results
      document.getElementById('quiz-controls').style.display = 'none';
      document.getElementById('quiz-results').style.display = 'none';
      document.getElementById('quiz-container').style.display = 'block';

      this.renderQuestion();
    } catch (_err) {
      this.showError('Failed to load quiz questions. Please try again.');
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
        <div class="quiz-progress-bar" role="progressbar" aria-valuenow="${this.currentIndex + 1}" aria-valuemin="1" aria-valuemax="${totalQuestions}">
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
                    data-answer-index="${i}"
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
        <button class="btn btn-outline quiz-nav-prev ${this.currentIndex === 0 ? 'quiz-nav-disabled' : ''}" data-action="prev" ${this.currentIndex === 0 ? 'disabled' : ''}>
          ← Previous
        </button>
        ${
          this.currentIndex === totalQuestions - 1
            ? `<button class="btn btn-primary ${this.answers.includes(null) ? 'quiz-nav-disabled' : ''}" data-action="submit" id="quiz-submit-btn" ${this.answers.includes(null) ? 'disabled' : ''}>
                Submit Quiz ✓
              </button>`
            : `<button class="btn btn-primary" data-action="next">
                Next →
              </button>`
        }
      </div>
    `;

    // Attach event listeners via delegation (no inline onclick)
    container.addEventListener('click', this._handleContainerClick.bind(this), { once: true });

    // Focus the question card for screen readers
    const card = document.getElementById('quiz-question-card');
    if (card) card.focus();
  },

  /**
   * Event delegation handler for quiz container clicks
   * @param {Event} e - Click event
   */
  _handleContainerClick(e) {
    const optionBtn = e.target.closest('[data-answer-index]');
    if (optionBtn) {
      this.selectAnswer(parseInt(optionBtn.dataset.answerIndex, 10));
      return;
    }

    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const action = actionBtn.dataset.action;
      if (action === 'prev') this.prevQuestion();
      else if (action === 'next') this.nextQuestion();
      else if (action === 'submit') this.submit();
    }
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
      this.showError('Please answer all questions before submitting.');
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
    } catch (_err) {
      this.showError('Failed to submit quiz. Please try again.');
    }
  },

  showResults(data) {
    const container = document.getElementById('quiz-container');
    const results = document.getElementById('quiz-results');

    if (container) container.style.display = 'none';
    if (!results) return;

    results.style.display = 'block';

    // Screen reader announcement
    if (typeof Accessibility !== 'undefined') {
      Accessibility.announce(`Quiz complete. You scored ${data.score} out of ${data.total}. ${data.grade}`);
    }

    // Track quiz completion in Google Analytics
    if (typeof Analytics !== 'undefined') Analytics.trackQuizComplete(data.score, data.total, data.percentage);

    // Determine theme class for score
    let scoreClass = '';
    if (data.percentage >= 70) scoreClass = 'quiz-score-high';
    else if (data.percentage < 50) scoreClass = 'quiz-score-low';

    results.innerHTML = `
      <div class="quiz-results-card" tabindex="-1" id="quiz-results-focus">
        <div class="quiz-score-circle ${scoreClass}" style="--score-deg: ${data.percentage * 3.6}deg">
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

        <div class="quiz-explanations">
          ${data.results
            .filter((r) => r.valid)
            .map((r, i) => {
              const q = this.questions.find((q) => q.id === r.questionId);
              return `
              <div class="quiz-explanation ${r.correct ? 'quiz-explanation-correct' : 'quiz-explanation-wrong'}">
                <strong>${r.correct ? '✅' : '❌'} Q${i + 1}: ${q?.question || 'Question'}</strong>
                <p>${r.explanation}</p>
              </div>
            `;
            })
            .join('')}
        </div>

        <div class="quiz-results-actions">
          <button class="btn btn-primary" data-action="restart">Try Again</button>
          <button class="btn btn-outline" data-action="ask-ai">Ask AI for Help</button>
        </div>
      </div>
    `;

    // Attach event listeners for result action buttons
    results.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'restart') Quiz.restart();
      else if (btn.dataset.action === 'ask-ai') {
        if (typeof navigateTo === 'function') navigateTo('chat');
      }
    });

    // Move focus to results card for keyboard/screen reader users
    requestAnimationFrame(() => {
      const focusTarget = document.getElementById('quiz-results-focus');
      if (focusTarget) focusTarget.focus();
    });
  },

  restart() {
    const controls = document.getElementById('quiz-controls');
    const container = document.getElementById('quiz-container');
    const results = document.getElementById('quiz-results');

    if (controls) controls.style.display = 'flex';
    if (container) container.style.display = 'none';
    if (results) results.style.display = 'none';

    // Move focus back to the start button
    const startBtn = document.getElementById('start-quiz-btn');
    if (startBtn) startBtn.focus();
  },
};

/**
 * Start quiz (called from HTML onclick)
 */
window.startQuiz = function() {
  Quiz.start();
}

// No DOMContentLoaded init needed — quiz starts on user action
