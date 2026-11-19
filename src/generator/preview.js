// src/generator/preview.js
// Локальный сервер для просмотра dist

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

const PORT = process.argv[2] ? parseInt(process.argv[2]) : 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const distDir = resolve('dist');

if (!existsSync(distDir)) {
  console.error('❌  Папка dist не найдена. Сначала выполните: npm run build');
  process.exit(1);
}

const server = createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = join(distDir, urlPath);
  const normalized = resolve(filePath);
  if (!normalized.startsWith(resolve(distDir))) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  if (existsSync(normalized) && !isDirectory(normalized)) {
    const ext = extname(normalized).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(readFileSync(normalized));
  } else if (existsSync(join(normalized, 'index.html'))) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(readFileSync(join(normalized, 'index.html')));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 — Файл не найден</h1>');
  }
});

function isDirectory(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

server.listen(PORT, () => {
  console.log(`\n🚀  Preview: http://localhost:${PORT}`);
  console.log(`   Dist: ${distDir}\n`);
});
