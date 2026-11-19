#!/usr/bin/env node
// CLI-обёртка для валидации.
//
// Использование:
//   node src/validator/validate-cli.js
//   node src/validator/validate-cli.js --config=config/<dir>
//   node src/validator/validate-cli.js [configDir] [imagesRoot]   (устаревший вариант)
//
// По умолчанию: config/ и public/images/

import { validateAll } from './validate.js';
import { resolve } from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  const options = {};
  const positional = [];
  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match) {
      options[match[1]] = match[2];
    } else if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }
  return { options, positional };
}

const { options, positional } = parseArgs(process.argv.slice(2));

const configDir = resolve(options.config || positional[0] || 'config');
const imagesRoot = resolve(options.images || positional[1] || 'public/images');

const result = validateAll(configDir, imagesRoot);

process.exit(result.valid ? 0 : 1);
