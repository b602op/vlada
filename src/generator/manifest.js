// src/generator/manifest.js
// Генерация PHOTO-MANIFEST.md
// Вызывается из build.js

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { escapeHtml } from './utils.js';

export function generatePhotoManifest(propertyConfig) {
  const imagesRoot = resolve('public/images');
  const lines = [
    '# PHOTO MANIFEST',
    '',
    'Список всех фотографий лендинга. Путь указан относительно `public/images/`.',
    '',
    '## Property',
    '',
  ];

  const propImages = propertyConfig.images?.property || [];
  if (propImages.length === 0) {
    lines.push('*(нет фотографий)*');
  } else {
    lines.push('| Файл | Alt | Статус |');
    lines.push('|------|-----|--------|');
    for (const img of propImages) {
      const exists = existsSync(join(imagesRoot, img.file));
      lines.push(`| ${img.file} | ${escapeHtml(img.alt)} | ${exists ? '✅' : '❌'} |`);
    }
  }

  lines.push('', '## Complex', '');
  const compImages = propertyConfig.images?.complex || [];
  if (compImages.length === 0) {
    lines.push('*(нет фотографий)*');
  } else {
    lines.push('| Файл | Alt | Статус |');
    lines.push('|------|-----|--------|');
    for (const img of compImages) {
      const exists = existsSync(join(imagesRoot, img.file));
      lines.push(`| ${img.file} | ${escapeHtml(img.alt)} | ${exists ? '✅' : '❌'} |`);
    }
  }

  lines.push('', '## Agent', '');
  const agentImages = propertyConfig.images?.agent || [];
  if (agentImages.length === 0) {
    lines.push('*(нет фотографий)*');
  } else {
    lines.push('| Файл | Alt | Статус |');
    lines.push('|------|-----|--------|');
    for (const img of agentImages) {
      const exists = existsSync(join(imagesRoot, img.file));
      lines.push(`| ${img.file} | ${escapeHtml(img.alt)} | ${exists ? '✅' : '❌'} |`);
    }
  }

  lines.push('', '## Итого', '');
  lines.push(`- **Property:** ${propImages.length} фото`);
  lines.push(`- **Complex:** ${compImages.length} фото`);
  lines.push(`- **Agent:** ${agentImages.length} фото`);

  return lines.join('\n') + '\n';
}
