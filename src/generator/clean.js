// src/generator/clean.js
// Очистка папки dist

import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = resolve('dist');

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
  console.log('✅  dist/ удалена');
} else {
  console.log('ℹ️  dist/ не существует');
}
