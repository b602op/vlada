// tests/build.test.js
// Автоматические тесты сборщика: CRM endpoint, альтернативный каталог конфигов,
// обязательные CSS/JS-файлы.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  buildLanding,
  DEFAULT_CSS_FILES,
  DEFAULT_JS_FILES,
} from '../src/generator/build.js';

const SECTION_IDS = ['hero', 'property', 'gallery', 'complex', 'location', 'agent'];

/**
 * Создаёт временный каталог конфигурации с валидными property.json и landing.json.
 */
function createConfigDir({ endpoint = null, title = 'Тестовый объект' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'relg-config-'));

  const property = {
    property: {
      type: 'apartment',
      title,
      price: null,
      currency: 'RUB',
      rooms: 2,
      area: null,
      floor: null,
      totalFloors: null,
      address: 'Краснодар, ул. Тестовая, 1',
      description: 'Описание тестового объекта.',
      features: [],
      characteristics: {},
    },
    agent: {
      name: 'Тестовый Риэлтор',
      phone: '+79000000000',
      whatsapp: null,
      telegram: null,
      description: null,
    },
    complex: null,
    images: {
      property: [{ file: 'property/main.webp', alt: 'Тестовое фото' }],
    },
  };

  const landing = {
    theme: 'light',
    sections: SECTION_IDS.map((id) => ({ id, enabled: true })),
    gallery: {
      layout: 'grid',
      showProperty: true,
      showComplex: true,
      maxPropertyImages: 10,
      maxComplexImages: 5,
    },
    images: {
      property: { minCount: 0, maxCount: 10 },
      complex: { minCount: 0, maxCount: 5 },
      agent: { minCount: 0, maxCount: 1 },
    },
    analytics: { yandexMetrika: { enabled: false, counterId: null } },
    crm: endpoint
      ? { enabled: true, provider: 'custom', endpoint }
      : { enabled: false, provider: null, endpoint: null },
    seo: {
      title: `${title} — тест`,
      description: 'Тестовое описание для сборки.',
      keywords: [],
      canonicalUrl: null,
      ogImage: null,
      robots: 'noindex, nofollow',
    },
  };

  writeFileSync(join(dir, 'property.json'), JSON.stringify(property, null, 2), 'utf-8');
  writeFileSync(join(dir, 'landing.json'), JSON.stringify(landing, null, 2), 'utf-8');

  return dir;
}

function createOutDir() {
  return mkdtempSync(join(tmpdir(), 'relg-dist-'));
}

function cleanup(...dirs) {
  for (const dir of dirs) {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('CRM endpoint с HTTPS передаётся в клиентский код без искажений', (t) => {
  const endpoint = 'https://api.example.com/v1/leads';
  const configDir = createConfigDir({ endpoint });
  const outDir = createOutDir();
  t.after(() => cleanup(configDir, outDir));

  const { outFile } = buildLanding({ configDir, outDir });
  const html = readFileSync(outFile, 'utf-8');

  assert.ok(html.includes('window.__CRM_CONFIG__'), 'конфиг CRM должен попасть в HTML');
  assert.ok(
    html.includes('https://api.example.com/v1/leads'),
    'HTTPS-endpoint должен остаться нетронутым (без обрезки по //)'
  );
  assert.ok(
    html.includes('{"endpoint":"https://api.example.com/v1/leads"}'),
    'endpoint должен быть корректным JSON-литералом'
  );
  assert.ok(html.includes('id="agent-form"'), 'форма заявки должна быть отрисована');
});

test('CRM endpoint с HTTP передаётся в клиентский код без искажений', (t) => {
  const endpoint = 'http://localhost:8080/api/leads';
  const configDir = createConfigDir({ endpoint });
  const outDir = createOutDir();
  t.after(() => cleanup(configDir, outDir));

  const { outFile } = buildLanding({ configDir, outDir });
  const html = readFileSync(outFile, 'utf-8');

  assert.ok(html.includes('window.__CRM_CONFIG__'), 'конфиг CRM должен попасть в HTML');
  assert.ok(
    html.includes('http://localhost:8080/api/leads'),
    'HTTP-endpoint должен остаться нетронутым'
  );
  assert.ok(
    html.includes('{"endpoint":"http://localhost:8080/api/leads"}'),
    'endpoint должен быть корректным JSON-литералом'
  );
});

test('сборка с альтернативным каталогом конфигурации', (t) => {
  const title = 'Дом у озера 777';
  const configDir = createConfigDir({ title });
  const outDir = createOutDir();
  t.after(() => cleanup(configDir, outDir));

  const { outFile } = buildLanding({ configDir, outDir });
  const html = readFileSync(outFile, 'utf-8');

  assert.ok(html.includes(`<title>${title} — тест</title>`), 'title должен браться из указанного каталога');
  assert.ok(html.includes(title), 'данные объекта должны браться из указанного каталога');
  assert.ok(!html.includes('Сказка Град'), 'данные из config/ не должны подмешиваться');
});

test('отсутствие обязательного JS-файла приводит к ошибке сборки', (t) => {
  const configDir = createConfigDir();
  const outDir = createOutDir();
  t.after(() => cleanup(configDir, outDir));

  const missing = 'src/scripts/__missing__.js';

  assert.throws(
    () => buildLanding({
      configDir,
      outDir,
      jsFiles: [...DEFAULT_JS_FILES, missing],
    }),
    (error) => {
      assert.match(error.message, /Не найдены обязательные JS-файлы/);
      assert.ok(error.message.includes(missing), 'в ошибке должен быть указан отсутствующий файл');
      return true;
    }
  );
});

test('отсутствие обязательного CSS-файла приводит к ошибке сборки', (t) => {
  const configDir = createConfigDir();
  const outDir = createOutDir();
  t.after(() => cleanup(configDir, outDir));

  const missing = 'src/styles/sections/__missing__.css';

  assert.throws(
    () => buildLanding({
      configDir,
      outDir,
      cssFiles: [...DEFAULT_CSS_FILES, missing],
    }),
    (error) => {
      assert.match(error.message, /Не найдены обязательные CSS-файлы/);
      assert.ok(error.message.includes(missing), 'в ошибке должен быть указан отсутствующий файл');
      return true;
    }
  );
});
