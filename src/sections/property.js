// src/sections/property.js
// Секция "О свойстве" — характеристики, описание, особенности

import { escapeHtml, formatPrice, formatArea } from '../generator/utils.js';

export function renderProperty(config) {
  const { property } = config;
  const hasPrice = property.price !== null && property.price !== undefined;
  const hasRooms = property.rooms !== null && property.rooms !== undefined;
  const hasArea = property.area !== null && property.area !== undefined;
  const hasFloor = property.floor !== null && property.floor !== undefined;
  const hasTotalFloors = property.totalFloors !== null && property.totalFloors !== undefined;
  const hasFeatures = property.features && property.features.length > 0;
  const hasChars = property.characteristics && Object.keys(property.characteristics).length > 0;

  // Определяем какие характеристики показывать
  const charItems = [];
  if (hasRooms) charItems.push({ label: 'Комнат', value: String(property.rooms) });
  if (hasArea) charItems.push({ label: 'Площадь', value: `${property.area} м²` });
  if (hasFloor && hasTotalFloors) charItems.push({ label: 'Этаж', value: `${property.floor} из ${property.totalFloors}` });
  if (property.type === 'apartment' && hasPrice) charItems.push({ label: 'Цена', value: formatPrice(property.price, property.currency) });

  // Дополнительные характеристики из конфигурации
  if (hasChars) {
    for (const [key, val] of Object.entries(property.characteristics)) {
      charItems.push({ label: key, value: val });
    }
  }

  let html = `
<!-- ===== PROPERTY ===== -->
<section class="property" id="property">
  <div class="container">
    <h2 class="section-title">${escapeHtml(property.title)}</h2>
    ${property.description ? `<div class="property-description"><p>${escapeHtml(property.description)}</p></div>` : ''}
    ${charItems.length > 0 ? `
    <div class="property-grid">
      ${charItems.map(item => `
        <div class="property-card">
          <span class="property-card-label">${escapeHtml(item.label)}</span>
          <span class="property-card-value">${escapeHtml(String(item.value))}</span>
        </div>`).join('')}
    </div>` : ''}
    ${hasFeatures ? `
    <div class="property-features">
      <h3>Особенности</h3>
      <ul class="feature-list">
        ${property.features.map(f => `<li class="feature-item">${escapeHtml(f)}</li>`).join('')}
      </ul>
    </div>` : ''}
  </div>
</section>`;

  return html;
}
