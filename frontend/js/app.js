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
      console.warn('Failed to load election types');
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
      console.warn('Failed to load voter guide');
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
          <div class="guide-video-container" style="margin-top: 2rem; border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-md);">
            <h4 style="margin-bottom: 1rem;">Educational Video: How EVM works</h4>
            <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
              <iframe 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
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
  }
});

// ════════════════════════════════════════
// Geolocation Map Features
// ════════════════════════════════════════
window.findNearbyPollingStation = function() {
  const btn = document.getElementById('locate-station-btn');
  const iframe = document.getElementById('google-maps-iframe');
  
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }
  
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<span aria-hidden="true">⏳</span> Locating...';
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      // Update iframe src to search for polling stations near the user
      const mapUrl = `https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d15000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1spolling+station!5e0!3m2!1sen!2sin!4v1`;
      
      iframe.src = mapUrl;
      btn.innerHTML = '<span aria-hidden="true">✅</span> Location Found';
      setTimeout(() => btn.innerHTML = originalHtml, 3000);
    }, 
    (error) => {
      console.warn('Geolocation error:', error);
      alert('Unable to retrieve your location. Please check your browser permissions.');
      btn.innerHTML = originalHtml;
    }
  );
};

// ════════════════════════════════════════
// Initialize Application
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Navigation.init();
  ParticleSystem.init();
  FactTicker.init();
  DataLoader.loadElectionTypes();
  DataLoader.loadVoterGuide();
  ScrollAnimations.init();

  // Log app ready
  console.log('🗳️ ElectEd — Election Education Assistant loaded');
});
