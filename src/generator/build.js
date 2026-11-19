// src/generator/build.js
// Основной сборщик — компилирует JSON-конфиги в единый HTML.
//
// CLI:
//   node src/generator/build.js [--config=config/<dir>] [--out=dist]
// По умолчанию используется каталог config/ и выход dist/.

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

import {
  escapeHtml,
  readJson,
  minifyCss,
  projectRoot,
} from './utils.js';

import { generateAllJsonLd } from './jsonld.js';
import { renderHero } from '../sections/hero.js';
import { renderProperty } from '../sections/property.js';
import { renderGallery } from '../sections/gallery.js';
import { renderComplex } from '../sections/complex.js';
import { renderLocation } from '../sections/location.js';
import { renderAgent } from '../sections/agent.js';
import { renderContacts } from '../sections/contacts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Обязательные JS-файлы клиента
export const DEFAULT_JS_FILES = [
  'src/scripts/main.js',
  'src/scripts/gallery.js',
  'src/scripts/analytics.js',
];

// Обязательные CSS-файлы (файл темы добавляется отдельно)
export const DEFAULT_CSS_FILES = [
  'src/styles/base.css',
  'src/styles/sections/hero.css',
  'src/styles/sections/property.css',
  'src/styles/sections/gallery.css',
  'src/styles/sections/complex.css',
  'src/styles/sections/location.css',
  'src/styles/sections/agent.css',
  'src/styles/sections/contacts.css',
];

const VALID_SECTION_IDS = ['hero', 'property', 'gallery', 'complex', 'location', 'agent', 'contacts'];

const SECTION_LABELS = {
  hero: '',
  property: 'Об объекте',
  gallery: 'Фотографии',
  complex: 'Комплекс',
  location: 'Расположение',
  agent: 'Риэлтор',
  contacts: 'Контакты',
};

const SECTION_RENDERERS = {
  hero: renderHero,
  property: renderProperty,
  gallery: renderGallery,
  complex: renderComplex,
  location: renderLocation,
  agent: renderAgent,
  contacts: renderContacts,
};

/**
 * Читает обязательные файлы. Любой отсутствующий файл — ошибка сборки,
 * а не предупреждение с продолжением работы.
 */
export function collectAssets(files, root, kind) {
  const parts = [];
  const missing = [];

  for (const file of files) {
    const fullPath = resolve(root, file);
    if (!existsSync(fullPath)) {
      missing.push(file);
      continue;
    }
    parts.push(readFileSync(fullPath, 'utf-8'));
  }

  if (missing.length > 0) {
    throw new Error(
      `Не найдены обязательные ${kind}-файлы (${missing.length}):\n` +
      missing.map((file) => `  - ${file}`).join('\n')
    );
  }

  return parts.join('\n');
}

/**
 * Сериализация значения для вставки внутрь <script>.
 * `<` экранируется, чтобы значение не могло закрыть тег.
 */
export function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function writeFileSyncSafe(filePath, content) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, content, 'utf-8');
}

function copyRecursive(src, dest) {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function generatePhotoManifest(propertyConfig, imagesRoot) {
  const lines = [
    '# PHOTO MANIFEST',
    '',
    'Список всех фотографий лендинга. Путь указан относительно `public/images/`.',
    '',
  ];

  const groups = [
    ['Property', 'property'],
    ['Complex', 'complex'],
    ['Agent', 'agent'],
  ];

  for (const [title, key] of groups) {
    lines.push(`## ${title}`, '');
    const images = propertyConfig.images?.[key] || [];

    if (images.length === 0) {
      lines.push('*(нет фотографий)*', '');
      continue;
    }

    lines.push('| Файл | Alt | Статус |');
    lines.push('|------|-----|--------|');
    for (const img of images) {
      const exists = existsSync(join(imagesRoot, img.file));
      lines.push(`| ${img.file} | ${escapeHtml(img.alt)} | ${exists ? '✅' : '❌'} |`);
    }
    lines.push('');
  }

  lines.push('## Итого', '');
  lines.push(`- **Property:** ${(propertyConfig.images?.property || []).length} фото`);
  lines.push(`- **Complex:** ${(propertyConfig.images?.complex || []).length} фото`);
  lines.push(`- **Agent:** ${(propertyConfig.images?.agent || []).length} фото`);

  return lines.join('\n') + '\n';
}

/**
 * Собирает лендинг.
 *
 * @param {object} [options]
 * @param {string} [options.configDir] каталог с property.json и landing.json
 * @param {string} [options.outDir] каталог результата
 * @param {string} [options.root] корень проекта (для src/ и public/)
 * @param {string[]} [options.jsFiles] переопределение списка JS
 * @param {string[]} [options.cssFiles] переопределение списка CSS
 * @returns {{ outFile: string, html: string }}
 */
export function buildLanding(options = {}) {
  const root = options.root || projectRoot;
  const configDir = options.configDir || resolve('config');
  const outDir = options.outDir || resolve('dist');
  const jsFiles = options.jsFiles || DEFAULT_JS_FILES;

  const propertyConfig = readJson(join(configDir, 'property.json'));
  const landingConfig = readJson(join(configDir, 'landing.json'));

  const theme = landingConfig.theme || 'light';
  const seo = landingConfig.seo || {};
  const analytics = landingConfig.analytics?.yandexMetrika || {};
  const crm = landingConfig.crm || {};

  const mergedConfig = {
    property: propertyConfig.property,
    agent: propertyConfig.agent,
    complex: propertyConfig.complex || null,
    images: propertyConfig.images || {},
    landing: landingConfig,
  };

  // ===== Секции =====
  const sectionOrder = (landingConfig.sections || [])
    .filter((section) => section.enabled !== false)
    .map((section) => section.id);

  let sectionsHtml = '';
  for (const id of sectionOrder) {
    if (!VALID_SECTION_IDS.includes(id)) continue;
    const renderer = SECTION_RENDERERS[id];
    if (!renderer) continue;
    sectionsHtml += renderer(mergedConfig, landingConfig, landingConfig) + '\n';
  }

  // ===== Навигация =====
  let navLinks = '';
  for (const id of sectionOrder) {
    if (!SECTION_LABELS[id]) continue;
    navLinks += `<li><a href="#${id}">${escapeHtml(SECTION_LABELS[id])}</a></li>\n`;
  }

  // ===== CSS =====
  const cssFiles = options.cssFiles || [
    DEFAULT_CSS_FILES[0],
    `src/styles/themes/${theme}.css`,
    ...DEFAULT_CSS_FILES.slice(1),
  ];
  const allCss = collectAssets(cssFiles, root, 'CSS');
  const minifiedCss = minifyCss(allCss);

  // ===== JS =====
  // Минификация JavaScript не выполняется: исходный код встраивается как есть.
  let allJs = collectAssets(jsFiles, root, 'JS');

  // Конфигурация CRM и аналитики передаётся клиенту как JSON-литерал.
  // https:// внутри строки остаётся нетронутым, т.к. JS не минифицируется.
  if (crm.enabled && crm.endpoint) {
    allJs = `window.__CRM_CONFIG__ = ${jsonForScript({ endpoint: crm.endpoint })};\n` + allJs;
  }

  if (analytics.enabled && analytics.counterId) {
    allJs = `window.__ANALYTICS_CONFIG__ = ${jsonForScript({ enabled: true, counterId: analytics.counterId })};\n` + allJs;
  } else {
    allJs = `window.__ANALYTICS_CONFIG__ = ${jsonForScript({ enabled: false })};\n` + allJs;
  }

  // ===== SEO =====
  const title = seo.title || propertyConfig.property.title;
  const description = seo.description || propertyConfig.property.description || '';
  const keywords = seo.keywords ? seo.keywords.join(', ') : '';
  const canonicalUrl = seo.canonicalUrl || '';
  const ogImage = seo.ogImage || '';
  const robots = seo.robots || 'index, follow';

  const keywordsMeta = keywords
    ? `<meta name="keywords" content="${escapeHtml(keywords)}">`
    : '';

  const faviconPath = resolve(root, 'public/favicon.ico');
  const faviconLink = existsSync(faviconPath)
    ? '<link rel="icon" href="favicon.ico" type="image/x-icon">'
    : '';

  const jsonLd = generateAllJsonLd(mergedConfig);

  const logoText = escapeHtml(propertyConfig.property.title.split(' ').slice(-2).join(' '));
  const footerText = `${propertyConfig.agent.name}${propertyConfig.complex?.name ? ', ' + propertyConfig.complex.name : ''}`;

  // ===== Шаблон =====
  const templatePath = resolve(__dirname, '..', 'templates', 'landing.html');
  let output = readFileSync(templatePath, 'utf-8');

  output = output.replace(/{{THEME}}/g, theme);
  output = output.replace(/{{TITLE}}/g, escapeHtml(title));
  output = output.replace(/{{DESCRIPTION}}/g, escapeHtml(description));
  output = output.replace(/{{KEYWORDS_META}}/g, keywordsMeta);
  output = output.replace(/{{CANONICAL_URL}}/g, escapeHtml(canonicalUrl));
  output = output.replace(/{{OG_TITLE}}/g, escapeHtml(title));
  output = output.replace(/{{OG_DESCRIPTION}}/g, escapeHtml(description));

  let ogImageFull = '';
  if (ogImage) {
    if (ogImage.startsWith('http')) {
      ogImageFull = ogImage;
    } else if (canonicalUrl) {
      try {
        ogImageFull = new URL(ogImage, canonicalUrl).href;
      } catch {
        ogImageFull = '';
      }
    }
  }
  output = output.replace(/{{OG_IMAGE}}/g, escapeHtml(ogImageFull));
  output = output.replace(/{{ROBOTS}}/g, escapeHtml(robots));
  output = output.replace(/{{FAVICON}}/g, faviconLink);
  output = output.replace(/{{CSS}}/g, minifiedCss);
  output = output.replace(/{{SCRIPT}}/g, allJs);
  output = output.replace(/{{SECTIONS}}/g, sectionsHtml);
  output = output.replace(/{{NAV_LINKS}}/g, navLinks);
  output = output.replace(/{{LOGO_TEXT}}/g, logoText);
  output = output.replace(/{{FOOTER_TEXT}}/g, escapeHtml(footerText));
  output = output.replace(/{{YEAR}}/g, String(new Date().getFullYear()));

  output = output.replace('</body>', jsonLd + '\n</body>');

  // ===== Яндекс Метрика =====
  let analyticsScript = '';
  if (analytics.enabled && analytics.counterId) {
    analyticsScript = `<script type="text/javascript">
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
ym(${parseInt(analytics.counterId, 10)}, "init", {clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true});
<\/script>`;
  }
  output = output.replace('{{ANALYTICS_SCRIPT}}', analyticsScript);

  // ===== Запись результата =====
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const publicSrc = resolve(root, 'public');
  if (existsSync(publicSrc)) {
    copyRecursive(publicSrc, outDir);
  }

  const outFile = join(outDir, 'index.html');
  writeFileSyncSafe(outFile, output);

  const robotsTxt = `User-agent: *\nAllow: /\n${canonicalUrl ? `Sitemap: ${canonicalUrl}/sitemap.xml\n` : ''}`;
  writeFileSyncSafe(join(outDir, 'robots.txt'), robotsTxt);

  if (canonicalUrl) {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${escapeHtml(canonicalUrl)}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`;
    writeFileSyncSafe(join(outDir, 'sitemap.xml'), sitemap);
  }

  const manifest = generatePhotoManifest(propertyConfig, resolve(root, 'public/images'));
  writeFileSyncSafe(join(outDir, 'PHOTO-MANIFEST.md'), manifest);

  return { outFile, html: output };
}

// ===== CLI =====
function parseArgs(argv) {
  const options = {};
  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match) options[match[1]] = match[2];
  }
  return options;
}

const isMainModule = process.argv[1] && resolve(process.argv[1]) === __filename;

if (isMainModule) {
  const args = parseArgs(process.argv.slice(2));
  const configDir = args.config ? resolve(args.config) : resolve('config');
  const outDir = args.out ? resolve(args.out) : resolve('dist');

  try {
    const { outFile, html } = buildLanding({ configDir, outDir });
    const relOut = relative(process.cwd(), outFile) || outFile;
    console.log(`✅  ${relOut} создан (${Math.round(Buffer.byteLength(html) / 1024)} KB)`);
    console.log(`✅  ${relative(process.cwd(), join(outDir, 'PHOTO-MANIFEST.md'))} создан`);
    if (existsSync(join(outDir, 'sitemap.xml'))) {
      console.log(`✅  ${relative(process.cwd(), join(outDir, 'sitemap.xml'))} создан`);
    }
  } catch (error) {
    console.error('❌  Ошибка сборки:', error.message);
    process.exit(1);
  }
}
