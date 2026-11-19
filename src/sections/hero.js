// src/sections/hero.js
// Hero-секция — первый экран лендинга

import { escapeHtml, formatPrice } from '../generator/utils.js';

export function renderHero(config, sectionConfig) {
  const { property, agent, images } = config;
  const heroImages = (images?.property || []).slice(0, 3);
  const bgImage = heroImages.length > 0 ? `images/${heroImages[0].file}` : '';
  const hasPrice = property.price !== null && property.price !== undefined;
  const hasArea = property.area !== null && property.area !== undefined;
  const hasRooms = property.rooms !== null && property.rooms !== undefined;

  // Определяем ключевые характеристики
  const quickStats = [];
  if (hasRooms) quickStats.push(`${property.rooms}-комн.`);
  if (hasArea) quickStats.push(`${property.area} м²`);
  if (property.floor && property.totalFloors) {
    quickStats.push(`${property.floor}/${property.totalFloors} эт.`);
  }

  return `
<!-- ===== HERO ===== -->
<section class="hero" id="hero">
  <div class="hero-bg" style="${bgImage ? `background-image:url('images/${escapeHtml(heroImages[0].file)}')` : ''}"></div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="container">
      <span class="hero-badge">${escapeHtml(property.title.split(' ').slice(0, 3).join(' '))}</span>
      <h1>${escapeHtml(property.title)}</h1>
      ${hasPrice ? `<div class="hero-price">${formatPrice(property.price, property.currency)}</div>` : ''}
      ${quickStats.length > 0 ? `
      <div class="hero-stats">
        ${quickStats.map(s => `<span>${escapeHtml(s)}</span>`).join('')}
      </div>` : ''}
      <div class="hero-actions">
        <a href="#contacts" class="btn btn-primary">Оставить заявку</a>
        <a href="#property" class="btn btn-outline">Подробнее</a>
      </div>
    </div>
  </div>
</section>`;
}
