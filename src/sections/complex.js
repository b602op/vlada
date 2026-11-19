// src/sections/complex.js
// Секция жилого комплекса

import { escapeHtml } from '../generator/utils.js';

export function renderComplex(config) {
  const { complex } = config;

  if (!complex || !complex.name) return '';

  let html = `
<!-- ===== COMPLEX ===== -->
<section class="complex" id="complex">
  <div class="container">
    <h2 class="section-title">${escapeHtml(complex.name)}</h2>
    ${complex.description ? `<div class="complex-description"><p>${escapeHtml(complex.description)}</p></div>` : ''}
    ${complex.developer ? `<p class="complex-developer"><span>Девелопер:</span> <strong>${escapeHtml(complex.developer)}</strong></p>` : ''}
    ${complex.address ? `<p class="complex-address"><span>Адрес:</span> ${escapeHtml(complex.address)}</p>` : ''}
    ${complex.features && complex.features.length > 0 ? `
    <div class="complex-features">
      <h3>Инфраструктура комплекса</h3>
      <ul class="feature-list feature-list--complex">
        ${complex.features.map(f => `<li class="feature-item"><span class="feature-icon">✓</span>${escapeHtml(f)}</li>`).join('')}
      </ul>
    </div>` : ''}
  </div>
</section>`;

  return html;
}
