/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocalApp, EngineResult, StoredFile } from '../types/app';
import { getMimeType } from './mime';

/**
 * Tracks currently active Blob URLs so they can be cleaned up
 * to avoid memory leaks when switching or deleting apps.
 */
let activeBlobUrls: string[] = [];

export function revokeAllActiveBlobs(): void {
  for (const url of activeBlobUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore revocation errors
    }
  }
  activeBlobUrls = [];
}

/**
 * Normalizes file paths (removes leading slashes, handles backslashes)
 */
export function normalizePath(path: string): string {
  let p = path.replace(/\\/g, '/');
  // Strip leading slash or dot slash
  p = p.replace(/^(\.\/|\/)+/, '');
  // Remove query or hash if present
  p = p.split('?')[0].split('#')[0];
  return p;
}

/**
 * Resolves a target relative path from the current directory of an HTML file.
 */
export function resolveRelativePath(fromPath: string, relativePath: string): string {
  if (relativePath.startsWith('/') || relativePath.startsWith('\\')) {
    return normalizePath(relativePath);
  }

  const normalizedRel = relativePath.replace(/\\/g, '/').split('?')[0].split('#')[0];
  const fromDir = fromPath.includes('/') ? fromPath.substring(0, fromPath.lastIndexOf('/')) : '';

  if (!fromDir) {
    return normalizePath(normalizedRel);
  }

  const stack = fromDir.split('/').filter(Boolean);
  const parts = normalizedRel.split('/');

  for (const part of parts) {
    if (part === '.' || part === '') {
      continue;
    } else if (part === '..') {
      if (stack.length > 0) stack.pop();
    } else {
      stack.push(part);
    }
  }

  return stack.join('/');
}

/**
 * Finds the best match in the map for a given path
 */
function findInMap<T>(map: Map<string, T>, targetPath: string): T | undefined {
  const normalized = normalizePath(targetPath);
  if (map.has(normalized)) {
    return map.get(normalized);
  }

  // Try lowercased fallback
  const lowerTarget = normalized.toLowerCase();
  for (const [key, value] of map.entries()) {
    if (key.toLowerCase() === lowerTarget) {
      return value;
    }
  }

  // Try matching suffix (e.g., if target is "assets/index.js" and map has "dist/assets/index.js")
  for (const [key, value] of map.entries()) {
    if (key.endsWith('/' + normalized) || key.endsWith(normalized)) {
      return value;
    }
  }

  return undefined;
}

/**
 * Rewrites url(...) statements inside CSS content to point to Blob URLs
 */
function rewriteCssUrls(cssContent: string, currentCssPath: string, blobUrls: Map<string, string>): string {
  return cssContent.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, quote, url) => {
    if (!url || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
      return match;
    }
    const resolvedPath = resolveRelativePath(currentCssPath, url);
    const blobUrl = findInMap(blobUrls, resolvedPath);
    if (blobUrl) {
      return `url("${blobUrl}")`;
    }
    return match;
  });
}

/**
 * The Core Rendering Engine
 * Builds a Map of files, creates Blob URLs, resolves assets, rewrites HTML,
 * and sets up in-iframe event delegation and error reporting.
 */
export function buildAppExecution(app: LocalApp, entryHtmlPath?: string): EngineResult {
  // Clean up any previously created blobs
  revokeAllActiveBlobs();

  const filesMap = new Map<string, string | ArrayBuffer>();
  const blobUrls = new Map<string, string>();
  const cssFiles: StoredFile[] = [];

  // Step 1: Pre-populate maps & separate CSS files for secondary URL rewrite pass
  for (const file of app.files) {
    const cleanPath = normalizePath(file.path);
    filesMap.set(cleanPath, file.content);

    const mime = file.mimeType || getMimeType(cleanPath);

    if (file.isBinary) {
      const buffer = file.content instanceof ArrayBuffer ? file.content : new ArrayBuffer(0);
      const blob = new Blob([buffer], { type: mime });
      const url = URL.createObjectURL(blob);
      blobUrls.set(cleanPath, url);
      activeBlobUrls.push(url);
    } else {
      if (cleanPath.endsWith('.css')) {
        cssFiles.push(file);
      } else {
        // Text file (JS, SVG, JSON, etc.)
        const textContent = typeof file.content === 'string' ? file.content : '';
        const blob = new Blob([textContent], { type: mime });
        const url = URL.createObjectURL(blob);
        blobUrls.set(cleanPath, url);
        activeBlobUrls.push(url);
      }
    }
  }

  // Step 2: Rewrite and create Blobs for CSS files (so url(...) points to Blobs)
  for (const cssFile of cssFiles) {
    const cleanPath = normalizePath(cssFile.path);
    const rawCss = typeof cssFile.content === 'string' ? cssFile.content : '';
    const rewrittenCss = rewriteCssUrls(rawCss, cleanPath, blobUrls);
    const mime = cssFile.mimeType || 'text/css;charset=utf-8';
    
    // Update filesMap with rewritten CSS
    filesMap.set(cleanPath, rewrittenCss);

    const blob = new Blob([rewrittenCss], { type: mime });
    const url = URL.createObjectURL(blob);
    blobUrls.set(cleanPath, url);
    activeBlobUrls.push(url);
  }

  // Step 3: Find Entry Point
  let targetEntry = entryHtmlPath ? normalizePath(entryHtmlPath) : normalizePath(app.entryPoint || 'index.html');
  let entryFile = app.files.find((f) => normalizePath(f.path) === targetEntry);

  if (!entryFile) {
    // Try finding index.html anywhere in app files
    entryFile = app.files.find((f) => normalizePath(f.path).endsWith('index.html'));
    if (entryFile) {
      targetEntry = normalizePath(entryFile.path);
    }
  }

  if (!entryFile) {
    // Fallback: look for ANY html file
    entryFile = app.files.find((f) => normalizePath(f.path).endsWith('.html') || normalizePath(f.path).endsWith('.htm'));
    if (entryFile) {
      targetEntry = normalizePath(entryFile.path);
    }
  }

  if (!entryFile) {
    throw new Error('لم يتم العثور على ملف المدخل (index.html) داخل هذا التطبيق.');
  }

  const rawHtml = typeof entryFile.content === 'string' ? entryFile.content : '';

  // Step 4: Parse HTML with DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Handle <base> tags if present - remove them or adjust
  const baseTags = doc.querySelectorAll('base');
  baseTags.forEach((tag) => tag.remove());

  // Step 5: Rewrite all asset links (<link>, <script>, <img>, etc.)
  // A. Scripts
  const scriptTags = doc.querySelectorAll('script');
  scriptTags.forEach((script) => {
    const src = script.getAttribute('src');
    if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('blob:')) {
      const resolved = resolveRelativePath(targetEntry, src);
      const blobUrl = findInMap(blobUrls, resolved);
      if (blobUrl) {
        script.setAttribute('src', blobUrl);
      }
    }
  });

  // B. Links (stylesheets, icons, preload)
  const linkTags = doc.querySelectorAll('link');
  linkTags.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('data:') && !href.startsWith('blob:')) {
      const resolved = resolveRelativePath(targetEntry, href);
      const blobUrl = findInMap(blobUrls, resolved);
      if (blobUrl) {
        link.setAttribute('href', blobUrl);
      }
    }
  });

  // C. Images & SVG images
  const imgTags = doc.querySelectorAll('img, image');
  imgTags.forEach((img) => {
    const src = img.getAttribute('src') || img.getAttribute('href') || img.getAttribute('xlink:href');
    if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('blob:')) {
      const resolved = resolveRelativePath(targetEntry, src);
      const blobUrl = findInMap(blobUrls, resolved);
      if (blobUrl) {
        if (img.hasAttribute('src')) img.setAttribute('src', blobUrl);
        if (img.hasAttribute('href')) img.setAttribute('href', blobUrl);
        if (img.hasAttribute('xlink:href')) img.setAttribute('xlink:href', blobUrl);
      }
    }

    // srcset
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      const rewrittenSrcset = srcset.split(',').map((candidate) => {
        const parts = candidate.trim().split(/\s+/);
        const url = parts[0];
        if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:') && !url.startsWith('blob:')) {
          const resolved = resolveRelativePath(targetEntry, url);
          const bUrl = findInMap(blobUrls, resolved);
          if (bUrl) {
            parts[0] = bUrl;
          }
        }
        return parts.join(' ');
      }).join(', ');
      img.setAttribute('srcset', rewrittenSrcset);
    }
  });

  // D. Audio, Video, Sources, Embed, Object
  const mediaTags = doc.querySelectorAll('audio, video, source, embed, object');
  mediaTags.forEach((elem) => {
    const srcAttr = elem.tagName.toLowerCase() === 'object' ? 'data' : 'src';
    const src = elem.getAttribute(srcAttr);
    if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('blob:')) {
      const resolved = resolveRelativePath(targetEntry, src);
      const blobUrl = findInMap(blobUrls, resolved);
      if (blobUrl) {
        elem.setAttribute(srcAttr, blobUrl);
      }
    }
    const poster = elem.getAttribute('poster');
    if (poster && !poster.startsWith('http') && !poster.startsWith('data:') && !poster.startsWith('blob:')) {
      const resolvedPoster = resolveRelativePath(targetEntry, poster);
      const posterBlob = findInMap(blobUrls, resolvedPoster);
      if (posterBlob) elem.setAttribute('poster', posterBlob);
    }
  });

  // E. Inline <style> blocks
  const styleTags = doc.querySelectorAll('style');
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent) {
      styleTag.textContent = rewriteCssUrls(styleTag.textContent, targetEntry, blobUrls);
    }
  });

  // F. Inline style attributes
  const elementsWithStyle = doc.querySelectorAll('[style]');
  elementsWithStyle.forEach((el) => {
    const styleAttr = el.getAttribute('style');
    if (styleAttr && styleAttr.includes('url(')) {
      el.setAttribute('style', rewriteCssUrls(styleAttr, targetEntry, blobUrls));
    }
  });

  // Step 6: Inject the In-Iframe Interceptor & Bridge Script
  // This provides:
  // 1. Event delegation for <a> tag clicks to navigate seamlessly across HTML pages
  // 2. Intercepts fetch() and XMLHttpRequest for local files mapped in our container
  // 3. Captures console logs & errors and forwards them to parent container
  const clientBridgeScript = doc.createElement('script');
  clientBridgeScript.textContent = `
    (function() {
      // 0. Ensure window.fetch has a setter so extension executors do not throw
      try {
        var origFetch = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : null;
        var _currentFetch = origFetch;
        if (typeof Window !== 'undefined' && Window.prototype) {
          try {
            Object.defineProperty(Window.prototype, 'fetch', {
              get: function() { return _currentFetch; },
              set: function(fn) { _currentFetch = fn; },
              configurable: true,
              enumerable: true
            });
          } catch(e1) {}
        }
        try {
          Object.defineProperty(window, 'fetch', {
            get: function() { return _currentFetch; },
            set: function(fn) { _currentFetch = fn; },
            configurable: true,
            enumerable: true
          });
        } catch(e2) {}
      } catch(err) {}

      // 1. Console Bridge to Parent
      const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error
      };

      function forwardLog(type, args) {
        try {
          const message = args.map(arg => {
            if (arg instanceof Error) return arg.stack || arg.message;
            if (typeof arg === 'object') {
              try { return JSON.stringify(arg, null, 2); } catch { return String(arg); }
            }
            return String(arg);
          }).join(' ');
          window.parent.postMessage({ type: 'APP_CONTAINER_LOG', level: type, message, timestamp: Date.now() }, '*');
        } catch(e) {}
      }

      console.log = function(...args) { originalConsole.log.apply(console, args); forwardLog('log', args); };
      console.info = function(...args) { originalConsole.info.apply(console, args); forwardLog('info', args); };
      console.warn = function(...args) { originalConsole.warn.apply(console, args); forwardLog('warn', args); };
      console.error = function(...args) { originalConsole.error.apply(console, args); forwardLog('error', args); };

      window.addEventListener('error', function(event) {
        forwardLog('error', [event.message + ' at ' + (event.filename || '') + ':' + (event.lineno || '')]);
      });

      window.addEventListener('unhandledrejection', function(event) {
        forwardLog('error', ['Unhandled Promise Rejection: ' + (event.reason ? (event.reason.stack || event.reason) : 'Unknown')]);
      });

      // 2. Event Delegation for Link Clicks
      document.addEventListener('click', function(event) {
        const link = event.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href) return;

        // Skip anchors, external protocols, javascript
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || 
            href.startsWith('javascript:') || href.startsWith('blob:') || href.startsWith('http://') || 
            href.startsWith('https://')) {
          return;
        }

        // Relative internal navigation
        event.preventDefault();
        window.parent.postMessage({
          type: 'APP_CONTAINER_NAVIGATE',
          href: href,
          from: ${JSON.stringify(targetEntry)}
        }, '*');
      }, true);

      // Tell parent runner that page is loaded
      window.addEventListener('DOMContentLoaded', function() {
        window.parent.postMessage({ type: 'APP_CONTAINER_READY', title: document.title, path: ${JSON.stringify(targetEntry)} }, '*');
      });
    })();
  `;

  // Inject as the very first script in <head> or at top of <html>
  if (doc.head) {
    doc.head.insertBefore(clientBridgeScript, doc.head.firstChild);
  } else if (doc.documentElement) {
    doc.documentElement.insertBefore(clientBridgeScript, doc.documentElement.firstChild);
  }

  const finalHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;

  return {
    finalHtml,
    blobUrls,
    filesMap,
    entryPath: targetEntry,
  };
}
