// src/sections/agent.js
// Секция риэлтора

import { escapeHtml } from '../generator/utils.js';

export function renderAgent(config) {
  const { agent, images } = config;
  if (!agent || !agent.name) return '';

  // Ищем фото агента
  let agentPhoto = null;
  if (images?.agent && images.agent.length > 0) {
    agentPhoto = images.agent[0];
  }

  return `
<!-- ===== AGENT ===== -->
<section class="agent" id="agent">
  <div class="container">
    <h2 class="section-title">Ваш риэлтор</h2>
    <div class="agent-card">
      ${agentPhoto ? `
        <img class="agent-photo" src="/images/${escapeHtml(agentPhoto.file)}" alt="${escapeHtml(agentPhoto.alt)}" width="150" height="150" loading="lazy" decoding="async">
      ` : `
        <div class="agent-avatar-placeholder" aria-hidden="true">${escapeHtml(agent.name.charAt(0))}</div>
      `}
      <div class="agent-info">
        <h3>${escapeHtml(agent.name)}</h3>
        ${agent.description ? `<p class="agent-description">${escapeHtml(agent.description)}</p>` : ''}
        <div class="agent-contacts">
          <a href="tel:${escapeHtml(agent.phone.replace(/[^+\d]/g, ''))}" class="agent-phone-link" data-action="phone-click">
            📞 ${escapeHtml(agent.phone)}
          </a>
          ${agent.whatsapp ? `
            <a href="https://wa.me/${escapeHtml(agent.whatsapp.replace(/[^+\d]/g, ''))}" class="agent-messenger-link wa" target="_blank" rel="noopener noreferrer" data-action="whatsapp-click">
              WhatsApp
            </a>` : ''}
          ${agent.telegram ? `
            <a href="https://t.me/${escapeHtml(agent.telegram.replace(/^@/, ''))}" class="agent-messenger-link tg" target="_blank" rel="noopener noreferrer" data-action="telegram-click">
              Telegram
            </a>` : ''}
        </div>
      </div>
    </div>
  </div>
</section>`;
}
