/**
 * Election Education - Main Application
 * Handles navigation, theme, particles, fact ticker, and data loading
 */

// ════════════════════════════════════════
// Theme Management
// ════════════════════════════════════════
const ThemeManager = {
  init() {
    const saved = localStorage.getItem('elected-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    this.setTheme(theme);

    document.getElementById('theme-toggle').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      this.setTheme(current === 'dark' ? 'light' : 'dark');
    });
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('elected-theme', theme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';

    // Track theme change in Google Analytics
    if (typeof Analytics !== 'undefined') Analytics.trackThemeSwitch(theme);
  },
};

// ════════════════════════════════════════
// Navigation
// ════════════════════════════════════════
const Navigation = {
  init() {
    const hamburger = document.getElementById('nav-hamburger');
    const navLinks = document.getElementById('nav-links');

    hamburger?.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
      const isOpen = hamburger.classList.contains('active');
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile menu on link click
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger?.classList.remove('active');
        navLinks?.classList.remove('open');
      });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
      }
    });

    // Active section tracking
    this.setupScrollSpy();
  },

  setupScrollSpy() {
    const sections = document.querySelectorAll('.section, .hero');
    const navLinks = document.querySelectorAll('.nav-link');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach((link) => {
              link.classList.toggle('active', link.dataset.section === id);
            });
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
  },
};

// ════════════════════════════════════════
// Particle System
// ════════════════════════════════════════
const ParticleSystem = {
  init() {
    const container = document.getElementById('hero-particles');
    if (!container) return;

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const particleCount = window.innerWidth < 768 ? 8 : 15;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'hero-particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${8 + Math.random() * 12}s`;
      particle.style.animationDelay = `${Math.random() * 10}s`;
      container.appendChild(particle);
    }
  },
};

// ════════════════════════════════════════
// Fact Ticker
// ════════════════════════════════════════
const FactTicker = {
  async init() {
    try {
      const res = await fetch('/api/election/facts?count=12');
      const data = await res.json();
      this.render(data.facts);
    } catch {
      // Fallback facts
      this.render([
        'India is the largest democracy in the world with over 90 crore eligible voters.',
        'The first general election in India was held in 1951-52.',
        'EVMs were first used in 1982 in Kerala.',
        'NOTA was introduced in Indian elections in 2013.',
      ]);
    }
  },

  render(facts) {
    const container = document.getElementById('ticker-content');
    if (!container) return;

    // Duplicate facts for seamless loop
    const allFacts = [...facts, ...facts];
    container.innerHTML = allFacts
      .map(
        (fact) => `
      <span class="ticker-item">
        <span class="ticker-icon" aria-hidden="true">💡</span>
        <span>${fact}</span>
      </span>
    `
      )
      .join('');
  },
};

// ════════════════════════════════════════
// Data Loaders
// ════════════════════════════════════════
const DataLoader = {
  async loadElectionTypes() {
    try {
      const res = await fetch('/api/election/types');
      const data = await res.json();
      this.renderElectionTypes(data.types);
    } catch {
      // Graceful degradation: section renders empty if data fails to load
    }
  },

  renderElectionTypes(types) {
    const grid = document.getElementById('election-types-grid');
    if (!grid) return;

    grid.innerHTML = types
      .map(
        (type) => `
      <article class="election-type-card" id="election-type-${type.id}">
        <div class="election-type-icon" aria-hidden="true">${type.icon}</div>
        <h3 class="election-type-title">${type.title}</h3>
        <p class="election-type-subtitle">${type.subtitle}</p>
        <p class="election-type-description">${type.description}</p>
        <div class="election-type-details">
          ${Object.entries(type.details)
            .map(
              ([key, value]) => `
            <div class="election-type-detail">
              <span class="election-type-detail-label">${this.formatLabel(key)}</span>
              <span class="election-type-detail-value">${value}</span>
            </div>
          `
            )
            .join('')}
        </div>
      </article>
    `
      )
      .join('');
  },

  async loadVoterGuide() {
    try {
      const res = await fetch('/api/election/voter-guide');
      const data = await res.json();
      window._voterGuide = data.guide;
      this.renderGuideTab('eligibility');
    } catch {
      // Graceful degradation: voter guide renders empty if data fails to load
    }
  },

  renderGuideTab(tabName) {
    const guide = window._voterGuide;
    if (!guide) return;

    const content = document.getElementById('guide-content');
    if (!content) return;

    const section = guide[tabName];
    if (!section) return;

    // Update active tab
    document.querySelectorAll('.guide-tab').forEach((tab) => {
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });

    let html = '<div class="guide-panel">';

    if (tabName === 'eligibility') {
      html += '<div class="guide-requirements">';
      section.requirements.forEach((req) => {
        html += `<div class="guide-requirement">${req}</div>`;
      });
      html += '</div>';
    } else if (tabName === 'registration' || tabName === 'pollingDay') {
      html += '<div class="guide-steps stagger-children">';
      section.steps.forEach((step) => {
        html += `
          <div class="guide-step" id="guide-step-${step.step}">
            <div class="guide-step-number">${step.step}</div>
            <div class="guide-step-content">
              <h4>${step.title}</h4>
              <p>${step.description}</p>
            </div>
          </div>
        `;
      });
      html += '</div>';
      
      if (tabName === 'pollingDay') {
        html += `
          <div class="guide-video-container">
            <h4>Educational Video: How EVM works</h4>
            <div class="guide-video-wrapper">
              <iframe 
                class="guide-video-iframe"
                src="https://www.youtube.com/embed/QtZIlxw871I" 
                title="How to Vote using EVM-VVPAT" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                loading="lazy"
                allowfullscreen>
              </iframe>
            </div>
          </div>
        `;
      }
    } else if (tabName === 'documents') {
      html += '<div class="guide-list">';
      section.list.forEach((doc) => {
        html += `<div class="guide-list-item">${doc}</div>`;
      });
      html += '</div>';
    }

    html += '</div>';
    content.innerHTML = html;
  },

  formatLabel(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  },
};

// ════════════════════════════════════════
// Scroll Animations
// ════════════════════════════════════════
const ScrollAnimations = {
  init() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
  },
};

// ════════════════════════════════════════
// Global Navigation Helper
// ════════════════════════════════════════
function navigateTo(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.section === sectionId);
    });
  }
}

// ════════════════════════════════════════
// Guide Tab Event Handlers
// ════════════════════════════════════════
document.addEventListener('click', (e) => {
  const tab = e.target.closest('.guide-tab');
  if (tab) {
    DataLoader.renderGuideTab(tab.dataset.tab);
    // Track guide tab navigation in Google Analytics
    if (typeof Analytics !== 'undefined') Analytics.trackGuideTab(tab.dataset.tab);
  }
});

/**
 * Show an inline toast notification instead of alert()
 * @param {string} message - Text to display
 * @param {string} type - 'error' | 'info'
 */
function showToast(message, type = 'error') {
  // Remove any existing toast
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

window.findNearbyPollingStation = function() {
  const btn = document.getElementById('locate-station-btn');
  const iframe = document.getElementById('google-maps-iframe');
  
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser');
    return;
  }
  
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<span aria-hidden="true">⏳</span> Locating...';
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      // Use Google Maps Embed API to search for polling stations near the user's coordinates
      const mapUrl = `https://www.google.com/maps/embed/v1/search?key=${encodeURIComponent('AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8')}&q=polling+station+near+${lat},${lng}&zoom=14`;
      
      iframe.src = mapUrl;
      btn.innerHTML = '<span aria-hidden="true">✅</span> Location Found';
      if (typeof Analytics !== 'undefined') Analytics.trackPollingStationSearch(true);
      setTimeout(() => btn.innerHTML = originalHtml, 3000);
    }, 
    () => {
      showToast('Unable to retrieve your location. Please check your browser permissions.');
      if (typeof Analytics !== 'undefined') Analytics.trackPollingStationSearch(false);
      btn.innerHTML = originalHtml;
    }
  );
};

// ════════════════════════════════════════
// YouTube Video Loader (YouTube Data API v3)
// ════════════════════════════════════════
const YouTubeLoader = {
  async init() {
    await this.loadVideos();
    this.setupSearch();
  },

  /**
   * Fetch videos from the backend YouTube API proxy
   * @param {string} query - Search query
   */
  async loadVideos(query) {
    const grid = document.getElementById('video-grid');
    const loading = document.getElementById('video-loading');
    if (!grid) return;

    // Show loading state
    if (loading) loading.style.display = 'flex';

    try {
      const params = new URLSearchParams({ maxResults: '6' });
      if (query) params.set('q', query);

      const res = await fetch(`/api/youtube/videos?${params.toString()}`);
      const data = await res.json();

      this.renderVideos(data.videos, data.source);
    } catch {
      // Graceful fallback: show a message
      grid.innerHTML = `
        <div class="video-error" role="alert">
          <p>Unable to load videos. Please try again later.</p>
        </div>
      `;
    }
  },

  /**
   * Render video cards into the grid
   * @param {Array} videos - Video objects from API
   * @param {string} source - 'youtube_api' or 'curated'
   */
  renderVideos(videos, source) {
    const grid = document.getElementById('video-grid');
    if (!grid) return;

    if (!videos || videos.length === 0) {
      grid.innerHTML = '<p class="video-empty">No videos found. Try a different search term.</p>';
      return;
    }

    grid.innerHTML = videos.map(video => `
      <article class="video-card" role="listitem" id="video-${video.id}">
        <button class="video-thumbnail-btn" 
                data-video-id="${video.id}" 
                data-video-title="${video.title.replace(/"/g, '&quot;')}"
                aria-label="Play video: ${video.title.replace(/"/g, '&quot;')}">
          <img 
            src="${video.thumbnail}" 
            alt="Thumbnail for ${video.title.replace(/"/g, '&quot;')}"
            class="video-thumbnail"
            loading="lazy"
            width="320"
            height="180"
          />
          <div class="video-play-overlay" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        </button>
        <div class="video-info">
          <h3 class="video-title">${video.title}</h3>
          <p class="video-channel">${video.channel}</p>
          ${source === 'youtube_api' ? '<span class="video-badge">YouTube API</span>' : ''}
        </div>
      </article>
    `).join('');

    // Event delegation for video play clicks
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.video-thumbnail-btn');
      if (!btn) return;

      const videoId = btn.dataset.videoId;
      const videoTitle = btn.dataset.videoTitle;
      this.playVideo(videoId, btn);

      // Track video play in Google Analytics
      if (typeof Analytics !== 'undefined') Analytics.trackVideoPlay(videoId, videoTitle);
    });
  },

  /**
   * Replace thumbnail with embedded YouTube player
   * @param {string} videoId - YouTube video ID
   * @param {HTMLElement} btn - The thumbnail button to replace
   */
  playVideo(videoId, btn) {
    const card = btn.closest('.video-card');
    if (!card) return;

    const player = document.createElement('div');
    player.className = 'guide-video-wrapper';
    player.innerHTML = `
      <iframe 
        class="guide-video-iframe"
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    `;

    btn.replaceWith(player);
  },

  /**
   * Setup search functionality
   */
  setupSearch() {
    const searchInput = document.getElementById('video-search-input');
    const searchBtn = document.getElementById('video-search-btn');
    if (!searchInput || !searchBtn) return;

    const doSearch = () => {
      const query = searchInput.value.trim();
      if (query) {
        this.loadVideos(query + ' Indian election education');
      }
    };

    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });
  },
};

// ════════════════════════════════════════
// Initialize Application
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Google Analytics 4
  if (typeof Analytics !== 'undefined') Analytics.init();

  ThemeManager.init();
  Navigation.init();
  ParticleSystem.init();
  FactTicker.init();
  DataLoader.loadElectionTypes();
  DataLoader.loadVoterGuide();
  YouTubeLoader.init();
  ScrollAnimations.init();

  // Observe Google Translate language changes
  const translateObserver = new MutationObserver(() => {
    const htmlLang = document.documentElement.lang;
    if (htmlLang && htmlLang !== 'en' && typeof Analytics !== 'undefined') {
      Analytics.trackLanguageChange(htmlLang);
    }
  });
  translateObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
});
