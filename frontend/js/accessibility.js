/**
 * Accessibility Module
 * Enhances accessibility features for the Election Education app
 */

const Accessibility = {
  init() {
    this.setupKeyboardNavigation();
    this.setupAriaLiveRegions();
    this.setupReducedMotion();
    this.setupFocusManagement();
  },

  /**
   * Enhanced keyboard navigation
   */
  setupKeyboardNavigation() {
    // Handle Escape key to close mobile menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const hamburger = document.getElementById('nav-hamburger');
        const navLinks = document.getElementById('nav-links');
        if (hamburger?.classList.contains('active')) {
          hamburger.classList.remove('active');
          navLinks?.classList.remove('open');
          hamburger.focus();
        }
      }
    });

    // Nav link keyboard support
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      link.addEventListener('keydown', (e) => {
        const links = Array.from(navLinks);
        const index = links.indexOf(e.currentTarget);

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = links[(index + 1) % links.length];
          next.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = links[(index - 1 + links.length) % links.length];
          prev.focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          links[0].focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          links[links.length - 1].focus();
        }
      });
    });

    // Tab key navigation for guide tabs
    document.querySelectorAll('.guide-tab').forEach((tab) => {
      tab.addEventListener('keydown', (e) => {
        const tabs = Array.from(document.querySelectorAll('.guide-tab'));
        const index = tabs.indexOf(e.currentTarget);

        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const next = tabs[(index + 1) % tabs.length];
          next.focus();
          next.click();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = tabs[(index - 1 + tabs.length) % tabs.length];
          prev.focus();
          prev.click();
        }
      });
    });
  },

  /**
   * Setup ARIA live regions for dynamic content
   */
  setupAriaLiveRegions() {
    // Ensure chat messages area is a live region
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      chatMessages.setAttribute('aria-live', 'polite');
      chatMessages.setAttribute('aria-relevant', 'additions');
    }

    // Quiz container for status updates
    const quizContainer = document.getElementById('quiz-container');
    if (quizContainer) {
      quizContainer.setAttribute('aria-live', 'polite');
    }
  },

  /**
   * Handle reduced motion preference
   */
  setupReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleMotionPreference = (e) => {
      document.documentElement.classList.toggle('reduce-motion', e.matches);
    };

    handleMotionPreference(mediaQuery);
    mediaQuery.addEventListener('change', handleMotionPreference);
  },

  /**
   * Manage focus for modal-like interactions
   */
  setupFocusManagement() {
    // Track focus for chat input restoration
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.addEventListener('focus', () => {
        chatInput.parentElement?.classList.add('focused');
      });
      chatInput.addEventListener('blur', () => {
        chatInput.parentElement?.classList.remove('focused');
      });
    }
  },

  /**
   * Announce a message to screen readers
   * @param {string} message - The message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    document.body.appendChild(announcer);

    setTimeout(() => announcer.remove(), 1000);
  },
};

// Initialize accessibility features
document.addEventListener('DOMContentLoaded', () => {
  Accessibility.init();
});
