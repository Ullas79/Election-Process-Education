/**
 * Election Timeline Module
 * Renders and manages the interactive election process timeline
 */

const Timeline = {
  data: [],

  async init() {
    try {
      const res = await fetch('/api/election/timeline');
      const json = await res.json();
      this.data = json.timeline;
      this.render();
      this.setupScrollAnimation();
    } catch (err) {
      console.warn('Failed to load timeline:', err);
    }
  },

  render() {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    container.innerHTML = this.data
      .map(
        (item) => `
      <div class="timeline-item" role="listitem" id="timeline-step-${item.id}" data-id="${item.id}">
        <div class="timeline-dot" aria-hidden="true">${item.icon}</div>
        <div class="timeline-card">
          <div class="timeline-phase">${item.phase}</div>
          <h3 class="timeline-title">${item.title}</h3>
          <div class="timeline-duration">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            ${item.duration}
          </div>
          <p class="timeline-description">${item.description}</p>
          <button class="timeline-expand-btn"
                  onclick="Timeline.toggleDetails(${item.id})"
                  aria-expanded="false"
                  aria-controls="timeline-details-${item.id}">
            Show Details ▼
          </button>
          <div class="timeline-details" id="timeline-details-${item.id}" aria-hidden="true">
            <ul>
              ${item.details.map((detail) => `<li>${detail}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  },

  toggleDetails(id) {
    const details = document.getElementById(`timeline-details-${id}`);
    const btn = details?.previousElementSibling;
    if (!details || !btn) return;

    const isExpanded = details.classList.contains('expanded');
    details.classList.toggle('expanded');
    details.setAttribute('aria-hidden', isExpanded);
    btn.setAttribute('aria-expanded', !isExpanded);
    btn.textContent = isExpanded ? 'Show Details ▼' : 'Hide Details ▲';
  },

  setupScrollAnimation() {
    const items = document.querySelectorAll('.timeline-item');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    items.forEach((item) => observer.observe(item));
  },
};

// Initialize timeline when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Timeline.init();
});
