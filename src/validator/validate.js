// src/validator/validate.js
// Валидация JSON-конфигов и проверка фотографий

import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, relative, dirname, extname, basename } from 'node:path';

const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

/**
 * Загрузка и парсинг JSON-файла с обработкой ошибок
 */
export function loadJson(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Файл не найден: ${filePath}`);
  }
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Проверка пути изображения:
 * - расширение в допустимом списке
 * - не выходит за пределы папки public/images/
 * - файл существует на диске
 */
export function validateImagePath(imagePath, imagesRoot) {
  const errors = [];
  const abs = resolve(imagesRoot, imagePath);
  const rel = relative(imagesRoot, abs);

  // Проверка на выход за пределы images/
  if (rel.startsWith('..') || rel.includes('..')) {
    errors.push(`Путь выходит за пределы папки images: "${imagePath}"`);
    return { errors, exists: false };
  }

  // Проверка расширения
  const ext = extname(imagePath).toLowerCase();
  if (!VALID_EXTENSIONS.includes(ext)) {
    errors.push(`Недопустимое расширение файла "${imagePath}": ${ext || '(пустое)'}`);
  }

  // Проверка существования
  const exists = existsSync(abs);
  if (!exists) {
    errors.push(`Файл не найден: ${imagePath}`);
    return { errors, exists: false };
  }

  // Проверка размера
  try {
    const st = statSync(abs);
    if (st.size > MAX_FILE_SIZE) {
      errors.push(`Файл слишком большой: ${imagePath} (${Math.round(st.size / 1024)} KB)`);
    }
  } catch {
    // ignore stat errors
  }

  return { errors, exists };
}

/**
 * Проверка всех изображений в property.json
 */
export function validatePropertyImages(propertyPath, imagesRoot) {
  const config = loadJson(propertyPath);
  const errors = [];
  const warnings = [];
  const foundImages = { property: [], complex: [], agent: [] };

  const groups = ['property', 'complex', 'agent'];
  for (const group of groups) {
    if (!config.images || !config.images[group]) {
      warnings.push(`Нет группы изображений: ${group}`);
      continue;
    }
    for (const img of config.images[group]) {
      const result = validateImagePath(img.file, imagesRoot);
      if (result.errors.length > 0) {
        for (const e of result.errors) {
          errors.push(`[images.${group}] ${img.alt}: ${e}`);
        }
      } else {
        foundImages[group].push({ file: img.file, alt: img.alt });
      }
    }
  }

  return { errors, warnings, foundImages };
}

/**
 * Проверка ограничений на количество изображений из landing.json
 */
export function validateImageCounts(propertyPath, landingPath, imagesRoot) {
  const config = loadJson(propertyPath);
  const landing = loadJson(landingPath);
  const errors = [];

  const limits = landing.images || {};
  const groups = ['property', 'complex', 'agent'];

  for (const group of groups) {
    const images = config.images?.[group] || [];
    const limit = limits[group];
    if (!limit) continue;

    const min = limit.minCount ?? 0;
    const max = limit.maxCount ?? Infinity;

    if (images.length < min) {
      errors.push(`Группа "${group}": найдено ${images.length} фото, минимум ${min}`);
    }
    if (images.length > max) {
      errors.push(`Группа "${group}": найдено ${images.length} фото, максимум ${max}`);
    }
  }

  return { errors };
}

/**
 * Полная валидация конфига property.json (структура)
 */
export function validatePropertyConfig(propertyPath) {
  // Пытаемся загрузить schema
  const schemaPath = join(dirname(propertyPath), 'property.schema.json');
  const errors = [];
  const warnings = [];

  if (!existsSync(propertyPath)) {
    errors.push(`property.json не найден: ${propertyPath}`);
    return { valid: false, errors, warnings };
  }

  let config;
  try {
    config = loadJson(propertyPath);
  } catch (e) {
    errors.push(`Ошибка парсинга property.json: ${e.message}`);
    return { valid: false, errors, warnings };
  }

  // Обязательные поля property
  if (!config.property) {
    errors.push('Отсутствует секция "property"');
  } else {
    if (!config.property.type) {
      errors.push('property.type — обязательное поле');
    } else if (!['apartment', 'house', 'commercial', 'land'].includes(config.property.type)) {
      errors.push(`property.type: допустимые значения: apartment, house, commercial, land`);
    }
    if (!config.property.title) {
      errors.push('property.title — обязательное поле');
    }
    if (!config.property.address) {
      errors.push('property.address — обязательное поле');
    }
  }

  // Обязательные поля agent
  if (!config.agent) {
    errors.push('Отсутствует секция "agent"');
  } else {
    if (!config.agent.name) {
      errors.push('agent.name — обязательное поле');
    }
    if (!config.agent.phone) {
      errors.push('agent.phone — обязательное поле');
    }
  }

  // Если complex существует — проверка
  if (config.complex !== null && config.complex !== undefined) {
    if (!config.complex.name) {
      errors.push('complex.name — обязательное поле');
    }
  }

  // images.property обязателен
  if (!config.images?.property || config.images.property.length === 0) {
    errors.push('images.property — обязательная группа, должна содержать хотя бы 1 фотографию');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Полная валидация конфига landing.json (структура)
 */
export function validateLandingConfig(landingPath) {
  const errors = [];
  const warnings = [];

  if (!existsSync(landingPath)) {
    errors.push(`landing.json не найден: ${landingPath}`);
    return { valid: false, errors, warnings };
  }

  let config;
  try {
    config = loadJson(landingPath);
  } catch (e) {
    errors.push(`Ошибка парсинга landing.json: ${e.message}`);
    return { valid: false, errors, warnings };
  }

  // Тема
  if (config.theme && !['light', 'dark', 'minimal'].includes(config.theme)) {
    errors.push(`theme: допустимые значения: light, dark, minimal`);
  }

  // Секции
  const validSectionIds = ['hero', 'property', 'gallery', 'complex', 'location', 'agent', 'contacts'];
  if (!config.sections || config.sections.length === 0) {
    warnings.push('Секции не заданы — будут использованы все по умолчанию');
  } else {
    for (const sec of config.sections) {
      if (!validSectionIds.includes(sec.id)) {
        errors.push(`sections[].id: неизвестная секция "${sec.id}". Допустимые: ${validSectionIds.join(', ')}`);
      }
    }
    // Проверка дубликатов
    const ids = config.sections.map(s => s.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) {
      errors.push(`Дубликаты секций: ${[...new Set(dupes)].join(', ')}`);
    }
  }

  // SEO
  if (!config.seo) {
    warnings.push('seo не задан — будут использованы значения из property.json');
  } else {
    if (!config.seo.title) {
      errors.push('seo.title — обязательное поле');
    }
    if (!config.seo.description) {
      errors.push('seo.description — обязательное поле');
    }
  }

  // Analytics
  if (config.analytics?.yandexMetrika) {
    if (config.analytics.yandexMetrika.enabled && !config.analytics.yandexMetrika.counterId) {
      errors.push('analytics.yandexMetrika: включена, но не указан counterId');
    }
  }

  // CRM
  if (config.crm?.enabled && !config.crm.endpoint) {
    errors.push('crm: включена, но не указан endpoint');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Полная проверка всего проекта
 */
export function validateAll(configDir, imagesRoot) {
  const propertyPath = join(configDir, 'property.json');
  const landingPath = join(configDir, 'landing.json');
  const allErrors = [];
  const allWarnings = [];

  console.log('='.repeat(60));
  console.log('🔍  Валидация конфигурации');
  console.log('='.repeat(60));

  // Валидация property.json
  const propConfig = validatePropertyConfig(propertyPath);
  if (propConfig.errors.length > 0) {
    console.log('\n❌  property.json — ошибки:');
    propConfig.errors.forEach(e => console.log(`   • ${e}`));
  }
  if (propConfig.warnings.length > 0) {
    console.log('\n⚠️   property.json — предупреждения:');
    propConfig.warnings.forEach(w => console.log(`   • ${w}`));
  }
  allErrors.push(...propConfig.errors);
  allWarnings.push(...propConfig.warnings);

  // Валидация landing.json
  const landConfig = validateLandingConfig(landingPath);
  if (landConfig.errors.length > 0) {
    console.log('\n❌  landing.json — ошибки:');
    landConfig.errors.forEach(e => console.log(`   • ${e}`));
  }
  if (landConfig.warnings.length > 0) {
    console.log('\n⚠️   landing.json — предупреждения:');
    landConfig.warnings.forEach(w => console.log(`   • ${w}`));
  }
  allErrors.push(...landConfig.errors);
  allWarnings.push(...landConfig.warnings);

  // Валидация изображений
  console.log('\n📷  Проверка фотографий');
  const imgResult = validatePropertyImages(propertyPath, imagesRoot);
  if (imgResult.errors.length > 0) {
    console.log('\n❌  Ошибки изображений:');
    imgResult.errors.forEach(e => console.log(`   • ${e}`));
  } else {
    console.log('   ✅  Все изображения прошли валидацию');
  }
  allErrors.push(...imgResult.errors);
  allWarnings.push(...imgResult.warnings);

  // Подсчёт изображений
  const propCount = imgResult.foundImages.property.length;
  const compCount = imgResult.foundImages.complex.length;
  const agentCount = imgResult.foundImages.agent.length;
  console.log(`   📸  Найдено: property=${propCount}, complex=${compCount}, agent=${agentCount}`);

  // Проверка лимитов
  try {
    const countResult = validateImageCounts(propertyPath, landingPath, imagesRoot);
    if (countResult.errors.length > 0) {
      console.log('\n❌  Ошибки лимитов изображений:');
      countResult.errors.forEach(e => console.log(`   • ${e}`));
    }
    allErrors.push(...countResult.errors);
  } catch {
    // landing.json не валидирован — лимиты пропускаем
  }

  // Итог
  console.log('\n' + '='.repeat(60));
  if (allErrors.length === 0) {
    console.log('✅  Все проверки пройдены успешно!');
  } else {
    console.log(`❌  Найдено ошибок: ${allErrors.length}`);
    if (allWarnings.length > 0) {
      console.log(`⚠️   Предупреждений: ${allWarnings.length}`);
    }
  }
  console.log('='.repeat(60));

  return { valid: allErrors.length === 0, errors: allErrors, warnings: allWarnings };
}
