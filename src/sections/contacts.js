// src/sections/contacts.js
// Секция контактов и форма заявки

import { escapeHtml } from '../generator/utils.js';

export function renderContacts(config, landingConfig) {
  const { agent } = config;
  const crm = landingConfig?.crm || {};
  const showForm = crm.enabled && crm.endpoint;

  if (!agent || !agent.name) return '';

  let html = `
<!-- ===== CONTACTS ===== -->
<section class="contacts" id="contacts">
  <div class="container">
    <h2 class="section-title">Связаться с нами</h2>
    <div class="contacts-grid">
      <div class="contact-info">
        <p class="contact-name">${escapeHtml(agent.name)}</p>
        <div class="contact-links">
          <a href="tel:${escapeHtml(agent.phone.replace(/[^+\d]/g, ''))}" class="btn btn-primary btn-full" data-action="phone-click">
            📞 ${escapeHtml(agent.phone)}
          </a>`;

  if (agent.whatsapp) {
    html += `
          <a href="https://wa.me/${escapeHtml(agent.whatsapp.replace(/[^+\d]/g, ''))}" class="btn btn-wa btn-full" target="_blank" rel="noopener noreferrer" data-action="whatsapp-click">
            Написать в WhatsApp
          </a>`;
  }

  if (agent.telegram) {
    html += `
          <a href="https://t.me/${escapeHtml(agent.telegram.replace(/^@/, ''))}" class="btn btn-tg btn-full" target="_blank" rel="noopener noreferrer" data-action="telegram-click">
            Написать в Telegram
          </a>`;
  }

  html += `
        </div>
      </div>`;

  // Форма заявки — только если CRM включена и endpoint задан
  if (showForm) {
    html += `
      <div class="contact-form-wrapper">
        <form class="contact-form" id="lead-form" novalidate>
          <h3>Оставить заявку</h3>
          <div class="form-group">
            <label for="form-name">Ваше имя *</label>
            <input type="text" id="form-name" name="name" required autocomplete="name" placeholder="Иван Иванов">
            <span class="error-msg" id="err-name"></span>
          </div>
          <div class="form-group">
            <label for="form-phone">Телефон *</label>
            <input type="tel" id="form-phone" name="phone" required autocomplete="tel" placeholder="+7 (___) ___-__-__">
            <span class="error-msg" id="err-phone"></span>
          </div>
          <div class="form-group">
            <label for="form-comment">Комментарий</label>
            <textarea id="form-comment" name="comment" rows="4" placeholder="Интересует..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full" id="form-submit">Отправить заявку</button>
          <div class="form-status" id="form-status" aria-live="polite"></div>
        </form>
      </div>`;
  }

  html += `
    </div>
  </div>
</section>`;

  return html;
}
