#!/usr/bin/env node
// CLI-обёртка для валидации: node src/validator/validate-cli.js [путь_к_конфигам] [путь_к_images]

import { validateAll } from './validate.js';
import { resolve, join } from 'node:path';
import process from 'node:process';

const configDir = process.argv[2] ? resolve(process.argv[2]) : resolve('config');
const imagesRoot = process.argv[3] ? resolve(process.argv[3]) : resolve('public/images');

const result = validateAll(configDir, imagesRoot);

process.exit(result.valid ? 0 : 1);
