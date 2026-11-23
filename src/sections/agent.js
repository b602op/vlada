// src/sections/agent.js
// Секция заявки на связь с риэлтором

import { escapeHtml } from '../generator/utils.js';

export function renderAgent(config) {
  const { agent } = config;
  if (!agent || !agent.name) return '';

  return `
<!-- ===== AGENT / LEAD FORM ===== -->
<section class="agent" id="agent">
  <div class="container">
    <h2 class="section-title">Оставьте заявку</h2>
    <div class="agent-card">
      <p class="agent-form-intro">
        Оставьте свои контакты — ${escapeHtml(agent.name)} свяжется с вами удобным способом и ответит на вопросы.
      </p>
      <form class="lead-form agent-form" id="agent-form" novalidate>
        <div class="form-group">
          <label for="agent-name">Ваше имя *</label>
          <input type="text" id="agent-name" name="name" required autocomplete="name" placeholder="Иван Иванов">
          <span class="error-msg" data-error="name"></span>
        </div>
        <div class="form-group">
          <label for="agent-phone">Телефон *</label>
          <input type="tel" id="agent-phone" name="phone" required autocomplete="tel" placeholder="+7 (___) ___-__-__">
          <span class="error-msg" data-error="phone"></span>
        </div>
        <fieldset class="form-group contact-method">
          <legend>Удобный способ связи (можно выбрать несколько)</legend>
          <div class="contact-method-options">
            <label class="contact-method-option">
              <input type="checkbox" name="contactMethods" value="telegram">
              <span>Telegram</span>
            </label>
            <label class="contact-method-option">
              <input type="checkbox" name="contactMethods" value="max">
              <span>MAX</span>
            </label>
            <label class="contact-method-option">
              <input type="checkbox" name="contactMethods" value="whatsapp">
              <span>WhatsApp</span>
            </label>
            <label class="contact-method-option">
              <input type="checkbox" name="contactMethods" value="phone">
              <span>Звонок на телефон</span>
            </label>
          </div>
        </fieldset>
        <div class="form-group">
          <label for="agent-comment">Комментарий (необязательно)</label>
          <textarea id="agent-comment" name="comment" rows="3" placeholder="Удобное время для связи или короткое сообщение для риэлтора"></textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-full">Отправить заявку</button>
        <div class="form-status" aria-live="polite"></div>
      </form>
    </div>
  </div>
</section>`;
}
