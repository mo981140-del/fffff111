/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const MIME_MAP: Record<string, string> = {
  // Web Core
  html: 'text/html;charset=utf-8',
  htm: 'text/html;charset=utf-8',
  js: 'text/javascript;charset=utf-8',
  mjs: 'text/javascript;charset=utf-8',
  cjs: 'text/javascript;charset=utf-8',
  css: 'text/css;charset=utf-8',
  json: 'application/json;charset=utf-8',
  txt: 'text/plain;charset=utf-8',
  xml: 'application/xml;charset=utf-8',
  map: 'application/json;charset=utf-8',
  
  // Images
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
  avif: 'image/avif',

  // Fonts
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',

  // Media
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  webm: 'video/webm',

  // Other Web Assets
  wasm: 'application/wasm',
  pdf: 'application/pdf',
};

const TEXT_EXTENSIONS = new Set([
  'html', 'htm', 'js', 'mjs', 'cjs', 'css', 'json', 'txt', 'xml', 'svg', 'map', 'md', 'ts', 'jsx', 'tsx'
]);

export function getMimeType(filePath: string): string {
  const parts = filePath.toLowerCase().split('.');
  const ext = parts.length > 1 ? parts.pop() || '' : '';
  return MIME_MAP[ext] || 'application/octet-stream';
}

export function isTextFile(filePath: string): boolean {
  const parts = filePath.toLowerCase().split('.');
  const ext = parts.length > 1 ? parts.pop() || '' : '';
  return TEXT_EXTENSIONS.has(ext);
}
