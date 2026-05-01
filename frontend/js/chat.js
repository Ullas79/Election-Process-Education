/**
 * AI Chat Module
 * Handles the election AI assistant powered by Google Gemini
 */

const Chat = {
  history: [],
  isLoading: false,

  async init() {
    // Setup input handlers
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    });

    sendBtn?.addEventListener('click', () => this.send());

    // Check AI status
    await this.checkStatus();
  },

  async checkStatus() {
    try {
      const res = await fetch('/api/chat/status');
      const data = await res.json();
      const statusDot = document.querySelector('.status-dot');
      const statusText = document.getElementById('chat-status-text');

      if (statusDot) statusDot.classList.add('online');
      if (statusText) {
        statusText.textContent = data.mode;
        statusText.setAttribute('aria-label', `AI Status: ${data.mode}`);
      }
    } catch {
      const statusText = document.getElementById('chat-status-text');
      if (statusText) statusText.textContent = 'Knowledge Base (Offline)';
    }
  },

  async send() {
    const input = document.getElementById('chat-input');
    if (!input) return;

    const message = input.value.trim();
    if (!message || this.isLoading) return;

    // Add user message
    this.addMessage('user', message);
    input.value = '';
    this.isLoading = true;
    this.updateSendButton(true);

    // Track chat message in Google Analytics
    if (typeof Analytics !== 'undefined') Analytics.trackChatMessage(message.length);

    // Show typing indicator
    const typingId = this.showTypingIndicator();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: this.history.slice(-10),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const data = await res.json();

      // Remove typing indicator
      this.removeTypingIndicator(typingId);

      // Add assistant response
      this.addMessage('assistant', data.response);

      // Screen reader announcement
      if (typeof Accessibility !== 'undefined') {
        Accessibility.announce('Assistant responded to your question');
      }

      // Update history
      this.history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: data.response }
      );
    } catch (error) {
      this.removeTypingIndicator(typingId);
      this.addMessage(
        'assistant',
        `Sorry, I encountered an error: ${error.message}. Please try again.`
      );
    } finally {
      this.isLoading = false;
      this.updateSendButton(false);
      input.focus();
    }
  },

  addMessage(role, content) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role} message-enter`;

    const avatar = role === 'user' ? '👤' : '🗳️';
    const formattedContent = this.formatMarkdown(content);

    messageDiv.innerHTML = `
      <div class="message-avatar" aria-hidden="true">${avatar}</div>
      <div class="message-content">${formattedContent}</div>
    `;

    container.appendChild(messageDiv);

    // Scroll to bottom
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  },

  showTypingIndicator() {
    const container = document.getElementById('chat-messages');
    if (!container) return null;

    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.className = 'chat-message assistant';
    div.id = id;
    div.innerHTML = `
      <div class="message-avatar" aria-hidden="true">🗳️</div>
      <div class="message-content">
        <div class="typing-indicator" aria-label="Assistant is typing">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
  },

  removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  },

  updateSendButton(loading) {
    const btn = document.getElementById('chat-send-btn');
    if (btn) {
      btn.disabled = loading;
      if (loading) {
        btn.innerHTML = '<div class="typing-dot" style="width:6px;height:6px;margin:auto"></div>';
      } else {
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        `;
      }
    }
  },

  /**
   * Sanitize HTML to prevent XSS from AI-generated output.
   * Allows only safe formatting tags produced by formatMarkdown.
   * @param {string} html - Raw HTML string
   * @returns {string} Sanitized HTML
   */
  sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove all script, style, iframe, object, embed, form elements
    const dangerous = temp.querySelectorAll('script,style,iframe,object,embed,form,link,meta');
    dangerous.forEach((el) => el.remove());

    // Remove event handler attributes from all elements
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
  },

  /**
   * Basic markdown to HTML formatter with output sanitization
   */
  formatMarkdown(text) {
    if (!text) return '';

    const raw = text
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Unordered lists
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      // Wrap consecutive <li> in <ul>
      .replace(/((<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
      // Line breaks -> paragraphs
      .split('\n\n')
      .map((para) => {
        para = para.trim();
        if (!para) return '';
        if (
          para.startsWith('<h') ||
          para.startsWith('<ul') ||
          para.startsWith('<ol') ||
          para.startsWith('<li')
        ) {
          return para;
        }
        return `<p>${para}</p>`;
      })
      .join('');

    // Sanitize the generated HTML to strip any dangerous content from AI output
    return this.sanitizeHTML(raw);
  },
};

/**
 * Send a suggestion chip message
 * @param {string} text - The suggestion text
 */
window.sendSuggestion = function(text) {
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = text;
    Chat.send();
  }
}

/**
 * Send a message (called from HTML onclick)
 */
window.sendMessage = function() {
  Chat.send();
}

// Initialize chat when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Chat.init();
});
