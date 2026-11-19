// src/generator/utils.js
// Утилиты для генератора

import { readFileSync, existsSync, mkdirSync, copyFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, resolve, dirname, extname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..', '..');

/**
 * Экранирование HTML-значений
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(str).replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * Форматирование цены
 */
export function formatPrice(price, currency = 'RUB') {
  if (price === null || price === undefined) return '';
  const symbols = { RUB: '₽', USD: '$', EUR: '€' };
  const sym = symbols[currency] || '';
  return price.toLocaleString('ru-RU') + ' ' + sym;
}

/**
 * Форматирование площади
 */
export function formatArea(area) {
  if (area === null || area === undefined) return '';
  return `${area} м²`;
}

/**
 * Форматирование телефона для tel: ссылки
 */
export function telHref(phone) {
  return 'tel:' + phone.replace(/[^+\d]/g, '');
}

/**
 * WhatsApp ссылка
 */
export function waHref(phone) {
  return 'https://wa.me/' + phone.replace(/[^+\d]/g, '');
}

/**
 * Telegram ссылка
 */
export function tgHref(username) {
  return 'https://t.me/' + username.replace(/^@/, '');
}

/**
 * Чтение JSON-файла
 */
export function readJson(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Копирование дерева файлов
 */
export function copyDir(src, dest) {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Удаление директории
 */
export function removeDir(dirPath) {
  if (existsSync(dirPath)) {
    rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Рекурсивный поиск файлов
 */
export function findFiles(dir, exts = []) {
  const results = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, exts));
    } else if (exts.length === 0 || exts.includes(extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Простейшая минификация CSS (удаление комментариев и лишних пробелов)
 */
export function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')  // удалить комментарии
    .replace(/\s+/g, ' ')               // схлопнуть пробелы
    .replace(/\s*([{}:;,>~+])\s*/g, '$1') // убрать пробелы вокруг спецсимволов
    .replace(/;}/g, '}')                 // убрать последнюю ; перед }
    .trim();
}

/**
 * Простейшая минификация JS (без eval, без terser)
 */
export function minifyJs(js) {
  // Удаляем однострочные комментарии
  let result = js
    .replace(/\/\/.*$/gm, '')
    // Удаляем многострочные комментарии
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Схлопываем пробелы в начале строк
    .replace(/^\s+/gm, '')
    // Убираем пустые строки
    .replace(/\n\s*\n/g, '\n');
  return result.trim();
}

export { projectRoot, __dirname };
