// src/sections/location.js
// Секция "Расположение"

import { escapeHtml } from '../generator/utils.js';

export function renderLocation(config) {
  const { property, complex } = config;
  const address = property?.address || complex?.address || '';

  if (!address) return '';

  return `
<!-- ===== LOCATION ===== -->
<section class="location" id="location">
  <div class="container">
    <h2 class="section-title">Расположение</h2>
    <div class="location-address">
      <p>${escapeHtml(address)}</p>
    </div>
    <div class="location-map">
      <iframe
        src="https://www.openstreetmap.org/export/embed.html?bbox=38.95%2C45.01%2C39.05%2C45.07&layer=mapnik&marker=45.04%2C39.00"
        width="100%"
        height="400"
        style="border:0; border-radius: 12px;"
        allowfullscreen=""
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        title="Карта расположения объекта">
      </iframe>
    </div>
  </div>
</section>`;
}
