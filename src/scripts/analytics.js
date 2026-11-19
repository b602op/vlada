// src/scripts/analytics.js
// Яндекс Метрика + собственные события

(function () {
  'use strict';

  const CONFIG = window.__ANALYTICS_CONFIG__ || {};
  const METRIKA_ENABLED = !!CONFIG.enabled;
  const COUNTER_ID = CONFIG.counterId || '';

  /**
   * Отправка события Яндекс Метрики
   */
  function trackEvent(category, action, label) {
    if (METRIKA_ENABLED && window.yaCounter && typeof window.yaCounter.hit === 'function') {
      window.yaCounter.hit(category + ':' + action, {
        title: label || '',
      });
    }
  }

  /**
   * Отслеживание кликов по якорным ссылкам
   */
  function initAnchorTracking() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        const href = this.getAttribute('href');
        if (href) {
          trackEvent('navigation', 'anchor_click', href);
        }
      });
    });
  }

  /**
   * Отслеживание кликов по контактам (data-action)
   */
  function initClickTracking() {
    var elements = document.querySelectorAll('[data-action]');
    elements.forEach(function (el) {
      var action = el.getAttribute('data-action');
      el.addEventListener('click', function () {
        trackEvent('contact', action, el.textContent.trim());
      });
    });
  }

  /**
   * Отслеживание открытия галереи
   */
  function initGalleryTracking() {
    var items = document.querySelectorAll('.gallery-item');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        var caption = item.getAttribute('data-caption') || '';
        trackEvent('gallery', 'open', caption);
      });
    });
  }

  // Инициализация
  if (METRIKA_ENABLED) {
    initAnchorTracking();
    initClickTracking();
    initGalleryTracking();
  }
})();
