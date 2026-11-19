// src/sections/gallery.js
// Секция галереи с полноэкранным просмотром

import { escapeHtml } from '../generator/utils.js';

export function renderGallery(config, sectionConfig, landingConfig) {
  const { images } = config;
  const galleryConfig = landingConfig?.gallery || {};
  const showProperty = galleryConfig.showProperty !== false;
  const showComplex = galleryConfig.showComplex !== false;
  const maxProperty = galleryConfig.maxPropertyImages || 10;
  const maxComplex = galleryConfig.maxComplexImages || 5;

  const propertyImages = (images?.property || []).slice(0, maxProperty);
  const complexImages = (showComplex ? (images?.complex || []).slice(0, maxComplex) : []);
  const allImages = [...propertyImages, ...complexImages];

  if (allImages.length === 0) return '';

  // Определяем layout
  const layout = galleryConfig.layout || 'grid';

  let html = `
<!-- ===== GALLERY ===== -->
<section class="gallery" id="gallery">
  <div class="container">
    <h2 class="section-title">Фотографии</h2>
    <div class="gallery-layout gallery-layout--${layout}">`;

  if (showProperty && propertyImages.length > 0) {
    html += `
      <div class="gallery-group">
        <h3 class="gallery-group-title">Объект</h3>
        <div class="gallery-grid">
          ${propertyImages.map(img => `
            <div class="gallery-item" data-index="${allImages.indexOf(img)}" data-caption="${escapeHtml(img.alt)}" tabindex="0" role="button" aria-label="Открыть: ${escapeHtml(img.alt)}">
              <img src="/images/${escapeHtml(img.file)}" alt="${escapeHtml(img.alt)}" loading="lazy" width="800" height="600" decoding="async">
            </div>`).join('')}
        </div>
      </div>`;
  }

  if (showComplex && complexImages.length > 0) {
    html += `
      <div class="gallery-group">
        <h3 class="gallery-group-title">Комплекс</h3>
        <div class="gallery-grid">
          ${complexImages.map(img => `
            <div class="gallery-item" data-index="${allImages.indexOf(img)}" data-caption="${escapeHtml(img.alt)}" tabindex="0" role="button" aria-label="Открыть: ${escapeHtml(img.alt)}">
              <img src="/images/${escapeHtml(img.file)}" alt="${escapeHtml(img.alt)}" loading="lazy" width="800" height="600" decoding="async">
            </div>`).join('')}
        </div>
      </div>`;
  }

  html += `
    </div>
  </div>
</section>

<!-- Lightbox -->
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Просмотр изображения" hidden>
  <div class="lightbox-backdrop"></div>
  <div class="lightbox-content">
    <button class="lightbox-close" aria-label="Закрыть">&times;</button>
    <button class="lightbox-prev" aria-label="Предыдущее изображение">&#8249;</button>
    <div class="lightbox-image-container">
      <img class="lightbox-img" id="lightbox-img" src="" alt="">
      <div class="lightbox-caption" id="lightbox-caption"></div>
    </div>
    <button class="lightbox-next" aria-label="Следующее изображение">&#8250;</button>
  </div>
</div>`;

  return html;
}
