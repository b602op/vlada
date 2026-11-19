// src/generator/build.js
// Основной сборщик — компилирует JSON-конфиги в единый HTML

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

import {
  escapeHtml, formatPrice, formatArea, telHref, waHref, tgHref,
  readJson, minifyCss, minifyJs, projectRoot
} from './utils.js';

import { generateAllJsonLd } from './jsonld.js';
import { renderHero } from '../sections/hero.js';
import { renderProperty } from '../sections/property.js';
import { renderGallery } from '../sections/gallery.js';
import { renderComplex } from '../sections/complex.js';
import { renderLocation } from '../sections/location.js';
import { renderAgent } from '../sections/agent.js';
import { renderContacts } from '../sections/contacts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ===== Read configs =====
const configDir = resolve('config');
const propertyConfig = readJson(join(configDir, 'property.json'));
const landingConfig = readJson(join(configDir, 'landing.json'));

const theme = landingConfig.theme || 'light';
const seo = landingConfig.seo || {};
const analytics = landingConfig.analytics?.yandexMetrika || {};
const crm = landingConfig.crm || {};

// Merge images into a unified config for sections
const mergedConfig = {
  property: propertyConfig.property,
  agent: propertyConfig.agent,
  complex: propertyConfig.complex || null,
  images: propertyConfig.images || {},
  landing: landingConfig,
};

// ===== Sections =====
const enabledSections = (landingConfig.sections || []).filter(s => s.enabled !== false);
const sectionOrder = enabledSections.map(s => s.id);
const validSectionIds = ['hero', 'property', 'gallery', 'complex', 'location', 'agent', 'contacts'];

const sectionRenderers = {
  hero: renderHero,
  property: renderProperty,
  gallery: renderGallery,
  complex: renderComplex,
  location: renderLocation,
  agent: renderAgent,
  contacts: renderContacts,
};

let html = '';
for (const id of sectionOrder) {
  if (!validSectionIds.includes(id)) continue;
  const renderer = sectionRenderers[id];
  if (!renderer) continue;
  html += renderer(mergedConfig, landingConfig, landingConfig) + '\n';
}

// ===== Build nav links =====
const sectionLabels = {
  hero: '',
  property: 'Об объекте',
  gallery: 'Фотографии',
  complex: 'Комплекс',
  location: 'Расположение',
  agent: 'Риэлтор',
  contacts: 'Контакты',
};

let navLinks = '';
for (const id of sectionOrder) {
  if (!sectionLabels[id]) continue;
  navLinks += `<li><a href="#${id}">${escapeHtml(sectionLabels[id])}</a></li>\n`;
}

// ===== CSS assembly =====
const cssFiles = [
  'src/styles/base.css',
  `src/styles/themes/${theme}.css`,
  'src/styles/sections/hero.css',
  'src/styles/sections/property.css',
  'src/styles/sections/gallery.css',
  'src/styles/sections/complex.css',
  'src/styles/sections/location.css',
  'src/styles/sections/agent.css',
  'src/styles/sections/contacts.css',
];

let allCss = '';
for (const f of cssFiles) {
  const full = resolve(projectRoot, f);
  if (existsSync(full)) {
    allCss += readFileSync(full, 'utf-8') + '\n';
  } else {
    console.warn(`⚠️   CSS not found: ${f}`);
  }
}

// ===== JS assembly =====
const jsFiles = [
  'src/scripts/main.js',
  'src/scripts/gallery.js',
  'src/scripts/analytics.js',
];

let allJs = '';
for (const f of jsFiles) {
  const full = resolve(projectRoot, f);
  if (existsSync(full)) {
    allJs += readFileSync(full, 'utf-8') + '\n';
  } else {
    console.warn(`⚠️   JS not found: ${f}`);
  }
}

// Inject CRM and Analytics config as globals
if (crm.enabled && crm.endpoint) {
  allJs = `window.__CRM_CONFIG__ = ${JSON.stringify({ endpoint: crm.endpoint })};\n` + allJs;
}

if (analytics.enabled && analytics.counterId) {
  allJs = `window.__ANALYTICS_CONFIG__ = ${JSON.stringify({ enabled: true, counterId: analytics.counterId })};\n` + allJs;
} else {
  allJs = `window.__ANALYTICS_CONFIG__ = ${JSON.stringify({ enabled: false })};\n` + allJs;
}

// Minify
const minifiedCss = minifyCss(allCss);
const minifiedJs = minifyJs(allJs);

// ===== SEO =====
const title = seo.title || propertyConfig.property.title;
const description = seo.description || propertyConfig.property.description || '';
const keywords = seo.keywords ? seo.keywords.join(', ') : '';
const canonicalUrl = seo.canonicalUrl || '';
const ogImage = seo.ogImage || '';
const robots = seo.robots || 'index, follow';

let keywordsMeta = '';
if (keywords) {
  keywordsMeta = `<meta name="keywords" content="${escapeHtml(keywords)}">`;
}

let faviconLink = '';
const faviconPath = resolve(projectRoot, 'public/favicon.ico');
if (existsSync(faviconPath)) {
  faviconLink = '<link rel="icon" href="/favicon.ico" type="image/x-icon">';
}

// ===== JSON-LD =====
const jsonLd = generateAllJsonLd(mergedConfig);

// ===== Logo text =====
const logoText = escapeHtml(propertyConfig.property.title.split(' ').slice(-2).join(' '));
const footerText = `${propertyConfig.agent.name}${propertyConfig.complex?.name ? ', ' + propertyConfig.complex.name : ''}`;

// ===== Render template =====
const templatePath = resolve(__dirname, '..', 'templates', 'landing.html');
let output = readFileSync(templatePath, 'utf-8');

output = output.replace(/{{THEME}}/g, theme);
output = output.replace(/{{TITLE}}/g, escapeHtml(title));
output = output.replace(/{{DESCRIPTION}}/g, escapeHtml(description));
output = output.replace(/{{KEYWORDS_META}}/g, keywordsMeta);
output = output.replace(/{{CANONICAL_URL}}/g, escapeHtml(canonicalUrl));
output = output.replace(/{{OG_TITLE}}/g, escapeHtml(title));
output = output.replace(/{{OG_DESCRIPTION}}/g, escapeHtml(description));
// OG image: если задан полный URL (http...) — использовать как есть, иначе резолвить относительно canonicalUrl
let ogImageFull = '';
if (ogImage) {
  if (ogImage.startsWith('http')) {
    ogImageFull = ogImage;
  } else if (canonicalUrl) {
    try { ogImageFull = new URL(ogImage, canonicalUrl).href; } catch { ogImageFull = ''; }
  }
}
output = output.replace(/{{OG_IMAGE}}/g, escapeHtml(ogImageFull));
output = output.replace(/{{ROBOTS}}/g, escapeHtml(robots));
output = output.replace(/{{FAVICON}}/g, faviconLink);
output = output.replace(/{{CSS}}/g, minifiedCss);
output = output.replace(/{{SCRIPT}}/g, minifiedJs);
output = output.replace(/{{SECTIONS}}/g, html);
output = output.replace(/{{NAV_LINKS}}/g, navLinks);
output = output.replace(/{{LOGO_TEXT}}/g, logoText);
output = output.replace(/{{FOOTER_TEXT}}/g, escapeHtml(footerText));
output = output.replace(/{{YEAR}}/g, String(new Date().getFullYear()));

// Insert JSON-LD before </head> or at end of <body>
output = output.replace('</body>', jsonLd + '\n</body>');

// ===== Analytics script tag =====
let analyticsScript = '';
if (analytics.enabled && analytics.counterId) {
  analyticsScript = `<script type="text/javascript">
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
ym(${parseInt(analytics.counterId)}, "init", {clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true});
<\/script>`;
}

output = output.replace('{{ANALYTICS_SCRIPT}}', analyticsScript);

// ===== Write to dist =====
const distDir = resolve('dist');
if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

// Copy public assets to dist root (dist/images, dist/favicon.ico etc.)
const publicSrc = resolve(projectRoot, 'public');
if (existsSync(publicSrc)) {
  copyRecursive(publicSrc, distDir);
}

// Write index.html
writeFileSyncSafe(join(distDir, 'index.html'), output);

// Robots.txt
const robotsTxt = `User-agent: *\nAllow: /\n${canonicalUrl ? `Sitemap: ${canonicalUrl}/sitemap.xml\n` : ''}`;
writeFileSyncSafe(join(distDir, 'robots.txt'), robotsTxt);

// sitemap.xml
if (canonicalUrl) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${escapeHtml(canonicalUrl)}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`;
  writeFileSyncSafe(join(distDir, 'sitemap.xml'), sitemap);
  console.log('✅  sitemap.xml создан');
}

console.log('✅  dist/index.html создан (' + Math.round(Buffer.byteLength(output) / 1024) + ' KB)');

// Helper functions
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

// ===== PHOTO-MANIFEST.md =====
function generatePhotoManifest() {
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
      const exists = existsSync(join(resolve('public/images'), img.file));
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
      const exists = existsSync(join(resolve('public/images'), img.file));
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
      const exists = existsSync(join(resolve('public/images'), img.file));
      lines.push(`| ${img.file} | ${escapeHtml(img.alt)} | ${exists ? '✅' : '❌'} |`);
    }
  }

  // Summary counts
  lines.push('', '## Итого', '');
  lines.push(`- **Property:** ${propImages.length} фото`);
  lines.push(`- **Complex:** ${compImages.length} фото`);
  lines.push(`- **Agent:** ${agentImages.length} фото`);

  return lines.join('\n') + '\n';
}

const manifestContent = generatePhotoManifest();
writeFileSyncSafe(join(distDir, 'PHOTO-MANIFEST.md'), manifestContent);
console.log('✅  dist/PHOTO-MANIFEST.md создан');
