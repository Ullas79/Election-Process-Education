/**
 * Google Analytics 4 (gtag.js) Integration
 * Tracks meaningful user interactions for educational impact analysis
 *
 * Events tracked:
 * - quiz_start, quiz_complete, quiz_answer
 * - chat_message_sent
 * - video_play
 * - polling_station_search
 * - guide_tab_switch
 * - theme_switch
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4
 */

const Analytics = (() => {
  // GA4 Measurement ID — set to your own or leave empty to disable
  const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

  /**
   * Initialize Google Analytics 4
   * Only loads the script if a valid measurement ID is configured
   */
  function init() {
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
      return; // Skip initialization in dev / unconfigured state
    }

    // Load gtag.js asynchronously
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      anonymize_ip: true,                // GDPR: anonymize IP
      cookie_flags: 'SameSite=None;Secure',
      send_page_view: true,
    });
  }

  /**
   * Track a custom event
   * @param {string} eventName - GA4 event name
   * @param {Object} params - Event parameters
   */
  function trackEvent(eventName, params = {}) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  }

  // ═══════════════════════════════════════
  // Pre-defined Event Trackers
  // ═══════════════════════════════════════

  /**
   * Track quiz lifecycle events
   */
  function trackQuizStart(category, difficulty) {
    trackEvent('quiz_start', {
      event_category: 'engagement',
      quiz_category: category || 'all',
      quiz_difficulty: difficulty || 'all',
    });
  }

  function trackQuizComplete(score, total, percentage) {
    trackEvent('quiz_complete', {
      event_category: 'engagement',
      quiz_score: score,
      quiz_total: total,
      quiz_percentage: percentage,
    });
  }

  function trackQuizAnswer(questionIndex, isCorrect) {
    trackEvent('quiz_answer', {
      event_category: 'engagement',
      question_index: questionIndex,
      is_correct: isCorrect,
    });
  }

  /**
   * Track chat interactions with Gemini AI
   */
  function trackChatMessage(messageLength) {
    trackEvent('chat_message_sent', {
      event_category: 'engagement',
      message_length: messageLength,
    });
  }

  /**
   * Track YouTube video plays
   */
  function trackVideoPlay(videoId, videoTitle) {
    trackEvent('video_play', {
      event_category: 'content',
      video_id: videoId,
      video_title: videoTitle,
    });
  }

  /**
   * Track polling station geolocation search
   */
  function trackPollingStationSearch(success) {
    trackEvent('polling_station_search', {
      event_category: 'feature_usage',
      search_success: success,
    });
  }

  /**
   * Track voter guide tab navigation
   */
  function trackGuideTab(tabName) {
    trackEvent('guide_tab_switch', {
      event_category: 'navigation',
      tab_name: tabName,
    });
  }

  /**
   * Track theme toggle
   */
  function trackThemeSwitch(theme) {
    trackEvent('theme_switch', {
      event_category: 'preference',
      theme: theme,
    });
  }

  /**
   * Track language change via Google Translate
   */
  function trackLanguageChange(language) {
    trackEvent('language_change', {
      event_category: 'accessibility',
      language: language,
    });
  }

  return {
    init,
    trackEvent,
    trackQuizStart,
    trackQuizComplete,
    trackQuizAnswer,
    trackChatMessage,
    trackVideoPlay,
    trackPollingStationSearch,
    trackGuideTab,
    trackThemeSwitch,
    trackLanguageChange,
  };
})();
