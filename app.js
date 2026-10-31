/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Local App Container - Core Logic, IndexedDB, and Blob Rendering Engine
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. IndexedDB Database Operations
  // ---------------------------------------------------------------------------
  const DB_NAME = 'LocalAppContainerDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'apps';

  let dbPromise = null;

  function getDB() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('name', 'name', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }

  async function dbGetAllApps() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbGetApp(id) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbSaveApp(app) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(app);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbDeleteApp(id) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // ---------------------------------------------------------------------------
  // 2. MIME Types and Path Utilities
  // ---------------------------------------------------------------------------
  const TEXT_EXTENSIONS = new Set([
    'html', 'htm', 'css', 'js', 'mjs', 'json', 'svg', 'txt', 'md', 'xml', 'csv'
  ]);

  function getFileExtension(filename) {
    const parts = (filename || '').split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  function isTextFile(filename) {
    return TEXT_EXTENSIONS.has(getFileExtension(filename));
  }

  function getMimeType(filename) {
    const ext = getFileExtension(filename);
    const map = {
      html: 'text/html; charset=utf-8',
      htm: 'text/html; charset=utf-8',
      css: 'text/css; charset=utf-8',
      js: 'application/javascript; charset=utf-8',
      mjs: 'application/javascript; charset=utf-8',
      json: 'application/json; charset=utf-8',
      svg: 'image/svg+xml',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      ico: 'image/x-icon',
      woff: 'font/woff',
      woff2: 'font/woff2',
      ttf: 'font/ttf',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      mp4: 'video/mp4',
      txt: 'text/plain; charset=utf-8'
    };
    return map[ext] || 'application/octet-stream';
  }

  function normalizePath(p) {
    if (!p) return '';
    // Replace backslashes
    let clean = p.replace(/\\/g, '/');
    // Remove leading ./ or /
    clean = clean.replace(/^\.?\//, '');
    // Remove internal redundant ./
    const parts = clean.split('/');
    const stack = [];
    for (const part of parts) {
      if (part === '' || part === '.') continue;
      if (part === '..') {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(part);
      }
    }
    return stack.join('/');
  }

  function resolvePath(basePath, relativePath) {
    if (!relativePath) return '';
    // If absolute or protocol URL, return as-is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('data:') || relativePath.startsWith('blob:')) {
      return relativePath;
    }
    const baseDir = basePath ? basePath.substring(0, basePath.lastIndexOf('/')) : '';
    const combined = baseDir ? `${baseDir}/${relativePath}` : relativePath;
    return normalizePath(combined);
  }

  // ---------------------------------------------------------------------------
  // 3. Application State
  // ---------------------------------------------------------------------------
  let currentApp = null;
  let currentHtml = '';
  let currentHtmlPath = 'index.html';
  let activeBlobUrls = new Map(); // path -> blobUrl
  let activeFilesMap = new Map(); // path -> text string
  let isPinned = false;
  let pendingImport = null;
  let deleteTargetId = null;

  // DOM Elements
  const elAppContainer = document.getElementById('appContainer');
  const elAppList = document.getElementById('appList');
  const elAppsCountBadge = document.getElementById('appsCountBadge');
  const elSearchInput = document.getElementById('searchInput');
  const elFolderInput = document.getElementById('folderInput');
  const elIconFileInput = document.getElementById('iconFileInput');
  const elAppRunner = document.getElementById('appRunner');
  const elWelcomeScreen = document.getElementById('welcomeScreen');
  const elEnvBadge = document.getElementById('envBadge');

  // Top Bar elements
  const elTopAppName = document.getElementById('topAppName');
  const elTopAppIcon = document.getElementById('topAppIcon');
  const elTopAppStatusText = document.getElementById('topAppStatusText');
  const elTopAppFileStats = document.getElementById('topAppFileStats');

  // Control Buttons
  const elBtnAddApp = document.getElementById('btnAddApp');
  const elBtnLoadDemo = document.getElementById('btnLoadDemo');
  const elBtnReloadApp = document.getElementById('btnReloadApp');
  const elBtnOpenSeparate = document.getElementById('btnOpenSeparate');
  const elBtnAlwaysOnTop = document.getElementById('btnAlwaysOnTop');
  const elBtnCreateShortcut = document.getElementById('btnCreateShortcut');
  const elBtnFullscreen = document.getElementById('btnFullscreen');
  const elBtnExitFullscreen = document.getElementById('btnExitFullscreen');
  const elBtnToggleConsole = document.getElementById('btnToggleConsole');
  const elWelcomeAddBtn = document.getElementById('welcomeAddBtn');
  const elWelcomeDemoBtn = document.getElementById('welcomeDemoBtn');

  // Console Drawer
  const elConsoleDrawer = document.getElementById('consoleDrawer');
  const elConsoleLogsList = document.getElementById('consoleLogsList');
  const elConsoleCountBadge = document.getElementById('consoleCountBadge');
  const elBtnClearConsole = document.getElementById('btnClearConsole');
  const elBtnCloseConsole = document.getElementById('btnCloseConsole');
  let consoleLogCounter = 0;

  // Modals
  const elImportModal = document.getElementById('importModal');
  const elBtnCloseImportModal = document.getElementById('btnCloseImportModal');
  const elBtnCancelImport = document.getElementById('btnCancelImport');
  const elBtnConfirmImport = document.getElementById('btnConfirmImport');
  const elScanFolderName = document.getElementById('scanFolderName');
  const elScanStatsText = document.getElementById('scanStatsText');
  const elScanEntryStatus = document.getElementById('scanEntryStatus');
  const elAppNameInput = document.getElementById('appNameInput');
  const elIconPreview = document.getElementById('iconPreview');
  const elIconEmoji = document.getElementById('iconEmoji');
  const elBtnUploadCustomIcon = document.getElementById('btnUploadCustomIcon');

  const elDeleteModal = document.getElementById('deleteModal');
  const elDeleteTargetName = document.getElementById('deleteTargetName');
  const elBtnCloseDeleteModal = document.getElementById('btnCloseDeleteModal');
  const elBtnCancelDelete = document.getElementById('btnCancelDelete');
  const elBtnConfirmDelete = document.getElementById('btnConfirmDelete');

  const elToast = document.getElementById('toast');
  const elToastMessage = document.getElementById('toastMessage');
  const elToastIcon = document.getElementById('toastIcon');

  // ---------------------------------------------------------------------------
  // 4. Toast & UI Helpers
  // ---------------------------------------------------------------------------
  let toastTimer = null;
  function showToast(msg, icon = '✨') {
    elToastMessage.textContent = msg;
    elToastIcon.textContent = icon;
    elToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elToast.classList.remove('show');
    }, 3200);
  }

  function appendConsoleLog(level, message) {
    consoleLogCounter++;
    elConsoleCountBadge.textContent = consoleLogCounter;

    const emptyMsg = elConsoleLogsList.querySelector('.console-empty');
    if (emptyMsg) emptyMsg.remove();

    const row = document.createElement('div');
    row.className = `console-entry console-${level}`;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'console-time';
    const now = new Date();
    timeSpan.textContent = `[${now.toLocaleTimeString()}]`;

    const msgSpan = document.createElement('span');
    msgSpan.className = 'console-msg';
    msgSpan.textContent = typeof message === 'object' ? JSON.stringify(message) : String(message);

    row.appendChild(timeSpan);
    row.appendChild(msgSpan);
    elConsoleLogsList.appendChild(row);
    elConsoleLogsList.scrollTop = elConsoleLogsList.scrollHeight;
  }

  function clearConsoleLogs() {
    consoleLogCounter = 0;
    elConsoleCountBadge.textContent = '0';
    elConsoleLogsList.innerHTML = '<div class="console-empty">تم مسح سجل الكونسول.</div>';
  }

  // ---------------------------------------------------------------------------
  // 5. App List & Sidebar Rendering
  // ---------------------------------------------------------------------------
  async function refreshAppList() {
    try {
      const apps = await dbGetAllApps();
      const query = (elSearchInput.value || '').trim().toLowerCase();
      const filtered = apps.filter(a => a.name.toLowerCase().includes(query));

      elAppsCountBadge.textContent = apps.length;
      elAppList.innerHTML = '';

      if (filtered.length === 0) {
        elAppList.innerHTML = `
          <div class="empty-list-placeholder">
            <div class="icon">📂</div>
            <p>${apps.length === 0 ? 'لا توجد تطبيقات محفوظة بعد. أضف تطبيقك الأول الآن!' : 'لم يتم العثور على نتائج للبحث.'}</p>
          </div>
        `;
        return;
      }

      // Sort newest first
      filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      filtered.forEach(app => {
        const item = document.createElement('div');
        item.className = 'app-item' + (currentApp && currentApp.id === app.id ? ' active' : '');
        item.dataset.appId = app.id;

        // Icon
        const iconContainer = document.createElement('div');
        iconContainer.className = 'app-item-icon';
        if (app.icon && app.icon.startsWith('data:image')) {
          const img = document.createElement('img');
          img.src = app.icon;
          img.alt = app.name;
          iconContainer.appendChild(img);
        } else {
          iconContainer.textContent = app.icon || '🌐';
        }

        // Details
        const details = document.createElement('div');
        details.className = 'app-item-details';

        const title = document.createElement('div');
        title.className = 'app-item-title';
        title.textContent = app.name;

        const sub = document.createElement('div');
        sub.className = 'app-item-sub';
        const fileCount = app.files ? app.files.length : 0;
        sub.innerHTML = `<span>${fileCount} ملف</span>`;

        details.appendChild(title);
        details.appendChild(sub);

        // Delete Button
        const delBtn = document.createElement('button');
        delBtn.className = 'app-delete-btn';
        delBtn.title = 'حذف التطبيق';
        delBtn.innerHTML = '🗑️';
        delBtn.onclick = (e) => {
          e.stopPropagation();
          openDeleteModal(app.id, app.name);
        };

        item.appendChild(iconContainer);
        item.appendChild(details);
        item.appendChild(delBtn);

        // Click to launch
        item.onclick = () => {
          launchApp(app.id);
        };

        elAppList.appendChild(item);
      });
    } catch (err) {
      console.error('Failed to load apps:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // 6. The Rendering Engine (Blob URLs + Path Rewriting Magic)
  // ---------------------------------------------------------------------------
  async function launchApp(appId) {
    const app = await dbGetApp(appId);
    if (!app) {
      showToast('التطبيق غير موجود!', '⚠️');
      return;
    }

    currentApp = app;

    // Update active state in sidebar
    document.querySelectorAll('.app-item').forEach(el => {
      el.classList.toggle('active', el.dataset.appId === String(app.id));
    });

    // Update top bar info
    elTopAppName.textContent = app.name;
    if (app.icon && app.icon.startsWith('data:image')) {
      elTopAppIcon.innerHTML = `<img src="${app.icon}" alt="${app.name}">`;
    } else {
      elTopAppIcon.textContent = app.icon || '🌐';
    }
    elTopAppStatusText.textContent = 'قيد التشغيل';
    document.querySelector('.top-app-status').classList.add('status-active');
    elTopAppFileStats.textContent = `${(app.files || []).length} ملف`;

    // Revoke previous Blob URLs to free memory
    activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
    activeBlobUrls.clear();
    activeFilesMap.clear();
    clearConsoleLogs();

    // Map files
    for (const f of app.files) {
      const p = normalizePath(f.path);
      if (f.type === 'text') {
        activeFilesMap.set(p, f.content);
        // Also create a Blob URL for text assets (CSS, JS, SVG, etc.)
        const blob = new Blob([f.content], { type: f.mimeType });
        activeBlobUrls.set(p, URL.createObjectURL(blob));
      } else {
        // Binary (Images, Fonts, Media)
        const blob = new Blob([f.content], { type: f.mimeType });
        activeBlobUrls.set(p, URL.createObjectURL(blob));
      }
    }

    // Locate entry point (index.html or similar)
    let entryPath = findEntryPoint(activeFilesMap);
    if (!entryPath) {
      showToast('لم يتم العثور على ملف index.html في هذا التطبيق!', '❌');
      appendConsoleLog('error', 'Error: No entry point (index.html) found in project files.');
      return;
    }

    currentHtmlPath = entryPath;
    renderPage(entryPath);

    // Show runner, hide welcome screen
    elWelcomeScreen.classList.add('hidden');
    elAppRunner.classList.add('active');
    showToast(`تم تشغيل "${app.name}" بنجاح`, '🚀');
  }

  function findEntryPoint(filesMap) {
    // 1. Exact match index.html at root
    if (filesMap.has('index.html')) return 'index.html';
    if (filesMap.has('index.htm')) return 'index.htm';

    // 2. Case insensitive index.html
    for (const p of filesMap.keys()) {
      if (p.toLowerCase() === 'index.html' || p.toLowerCase() === 'index.htm') {
        return p;
      }
    }

    // 3. Subdirectory index.html (e.g., dist/index.html or build/index.html)
    for (const p of filesMap.keys()) {
      if (p.toLowerCase().endsWith('/index.html')) {
        return p;
      }
    }

    // 4. Any HTML file
    for (const p of filesMap.keys()) {
      if (p.toLowerCase().endsWith('.html') || p.toLowerCase().endsWith('.htm')) {
        return p;
      }
    }

    return null;
  }

  function renderPage(htmlPath) {
    const rawHtml = activeFilesMap.get(htmlPath);
    if (typeof rawHtml !== 'string') {
      appendConsoleLog('error', `Navigation failed: File not found "${htmlPath}"`);
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // Helper to find matching blob url
    function getResolvedBlobUrl(assetUrl) {
      if (!assetUrl || assetUrl.startsWith('data:') || assetUrl.startsWith('blob:') || assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) {
        return null;
      }
      const resolvedPath = resolvePath(htmlPath, assetUrl);

      // Try exact
      if (activeBlobUrls.has(resolvedPath)) {
        return activeBlobUrls.get(resolvedPath);
      }
      // Try without leading folders
      for (const [key, val] of activeBlobUrls.entries()) {
        if (key.endsWith('/' + resolvedPath) || resolvedPath.endsWith('/' + key) || key === resolvedPath) {
          return val;
        }
      }
      return null;
    }

    // 1. Rewrite <link> stylesheet and icon tags
    doc.querySelectorAll('link').forEach(link => {
      const href = link.getAttribute('href');
      const blobUrl = getResolvedBlobUrl(href);
      if (blobUrl) {
        link.setAttribute('href', blobUrl);
      }
    });

    // 2. Rewrite <script src="...">
    doc.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src');
      const blobUrl = getResolvedBlobUrl(src);
      if (blobUrl) {
        script.setAttribute('src', blobUrl);
      }
    });

    // 3. Rewrite <img src="...">
    doc.querySelectorAll('img[src]').forEach(img => {
      const src = img.getAttribute('src');
      const blobUrl = getResolvedBlobUrl(src);
      if (blobUrl) {
        img.setAttribute('src', blobUrl);
      }
    });

    // 4. Rewrite <source src="...">, <audio src="...">, <video src="...">
    doc.querySelectorAll('source[src], audio[src], video[src]').forEach(media => {
      const src = media.getAttribute('src');
      const blobUrl = getResolvedBlobUrl(src);
      if (blobUrl) {
        media.setAttribute('src', blobUrl);
      }
    });

    // 5. Rewrite inline <style> url(...) references
    doc.querySelectorAll('style').forEach(styleTag => {
      let css = styleTag.textContent;
      css = css.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (match, url) => {
        const blobUrl = getResolvedBlobUrl(url);
        return blobUrl ? `url("${blobUrl}")` : match;
      });
      styleTag.textContent = css;
    });

    // 6. Rewrite inline style attributes
    doc.querySelectorAll('[style]').forEach(el => {
      let inlineStyle = el.getAttribute('style');
      if (inlineStyle && inlineStyle.includes('url(')) {
        inlineStyle = inlineStyle.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (match, url) => {
          const blobUrl = getResolvedBlobUrl(url);
          return blobUrl ? `url("${blobUrl}")` : match;
        });
        el.setAttribute('style', inlineStyle);
      }
    });

    // 7. Inject bridge script for Console logs, Extension fetch compatibility, and Internal Navigation
    const bridgeScript = doc.createElement('script');
    bridgeScript.textContent = `
      (function() {
        try {
          var _f = window.fetch ? window.fetch.bind(window) : undefined;
          Object.defineProperty(window, 'fetch', {
            get: function() { return _f; },
            set: function(val) { _f = val; },
            configurable: true,
            enumerable: true
          });
        } catch(e) {}

        window.addEventListener('error', function(e) {
          if (e.filename && e.filename.indexOf('chrome-extension://') !== -1) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return true;
          }
        }, true);

        // Intercept internal link navigation
        document.addEventListener('click', function(e) {
          var a = e.target.closest('a');
          if (!a) return;
          var href = a.getAttribute('href');
          if (!href) return;
          if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http://') || href.startsWith('https://')) {
            return;
          }
          // Internal link! Intercept
          e.preventDefault();
          window.parent.postMessage({ type: 'LOCAL_CONTAINER_NAVIGATE', href: href }, '*');
        }, true);

        // Forward console logs to host
        var origLog = console.log;
        var origWarn = console.warn;
        var origError = console.error;

        console.log = function() {
          origLog.apply(console, arguments);
          window.parent.postMessage({ type: 'LOCAL_CONTAINER_CONSOLE', level: 'info', args: Array.from(arguments) }, '*');
        };
        console.warn = function() {
          origWarn.apply(console, arguments);
          window.parent.postMessage({ type: 'LOCAL_CONTAINER_CONSOLE', level: 'warn', args: Array.from(arguments) }, '*');
        };
        console.error = function() {
          origError.apply(console, arguments);
          window.parent.postMessage({ type: 'LOCAL_CONTAINER_CONSOLE', level: 'error', args: Array.from(arguments) }, '*');
        };

        window.onerror = function(msg, url, line) {
          if (url && url.indexOf('chrome-extension://') !== -1) {
            return true;
          }
          window.parent.postMessage({ type: 'LOCAL_CONTAINER_CONSOLE', level: 'error', args: [msg + ' (' + url + ':' + line + ')'] }, '*');
        };

        window.addEventListener('unhandledrejection', function(e) {
          if (e.reason && (e.reason.stack || '').indexOf('chrome-extension://') !== -1) {
            e.preventDefault();
          }
        });
      })();
    `;
    if (doc.head) {
      doc.head.insertBefore(bridgeScript, doc.head.firstChild);
    } else {
      doc.documentElement.appendChild(bridgeScript);
    }

    const finalHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    currentHtml = finalHtml;
    elAppRunner.srcdoc = finalHtml;
  }

  // ---------------------------------------------------------------------------
  // 7. Listen for Messages from the Sandboxed IFrame
  // ---------------------------------------------------------------------------
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'LOCAL_CONTAINER_NAVIGATE') {
      const targetHref = data.href;
      const targetPath = resolvePath(currentHtmlPath, targetHref);

      if (activeFilesMap.has(targetPath)) {
        currentHtmlPath = targetPath;
        renderPage(targetPath);
        appendConsoleLog('info', `Navigation: Navigated to "${targetPath}"`);
      } else {
        appendConsoleLog('warn', `Navigation Target Not Found: "${targetHref}" (resolved: "${targetPath}")`);
        showToast(`الملف غير موجود: ${targetHref}`, '⚠️');
      }
    } else if (data.type === 'LOCAL_CONTAINER_CONSOLE') {
      const text = (data.args || []).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      appendConsoleLog(data.level || 'info', text);
    }
  });

  // ---------------------------------------------------------------------------
  // 8. Folder Selection & File Reading
  // ---------------------------------------------------------------------------
  elBtnAddApp.addEventListener('click', () => elFolderInput.click());
  elWelcomeAddBtn.addEventListener('click', () => elFolderInput.click());

  elFolderInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Reset input value so same folder can be re-selected
    e.target.value = '';

    showToast('جاري قراءة ملفات المجلد...', '⏳');

    // Determine root folder name
    const firstPath = files[0].webkitRelativePath || files[0].name;
    const folderName = firstPath.includes('/') ? firstPath.split('/')[0] : 'تطبيق جديد';

    const processedFiles = [];
    let hasIndexHtml = false;

    for (const file of files) {
      const fullPath = file.webkitRelativePath || file.name;
      // Strip top folder name to get relative app path
      const parts = fullPath.split('/');
      parts.shift(); // remove root folder
      const relPath = parts.join('/') || file.name;

      const ext = getFileExtension(file.name);
      const mime = getMimeType(file.name);

      if (relPath.toLowerCase() === 'index.html') {
        hasIndexHtml = true;
      }

      if (isTextFile(file.name)) {
        try {
          const text = await file.text();
          processedFiles.push({
            path: relPath,
            type: 'text',
            mimeType: mime,
            content: text
          });
        } catch (err) {
          console.warn('Could not read text file:', relPath, err);
        }
      } else {
        try {
          const buffer = await file.arrayBuffer();
          processedFiles.push({
            path: relPath,
            type: 'binary',
            mimeType: mime,
            content: buffer
          });
        } catch (err) {
          console.warn('Could not read binary file:', relPath, err);
        }
      }
    }

    pendingImport = {
      folderName,
      files: processedFiles,
      hasIndexHtml,
      icon: '🌐'
    };

    // Open import modal
    openImportModal(pendingImport);
  });

  function openImportModal(importData) {
    elScanFolderName.textContent = importData.folderName;
    elScanStatsText.textContent = `${importData.files.length} ملف تم فحصها بنجاح`;
    elAppNameInput.value = importData.folderName;

    if (importData.hasIndexHtml) {
      elScanEntryStatus.textContent = 'تم اكتشاف index.html بنجاح ✓';
      elScanEntryStatus.className = 'entry-status-badge entry-status-found';
    } else {
      elScanEntryStatus.textContent = 'تحذير: لم يتم العثور على index.html في الجذر!';
      elScanEntryStatus.className = 'entry-status-badge entry-status-missing';
    }

    // Reset Icon
    elIconPreview.innerHTML = '<span id="iconEmoji">🌐</span>';
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.icon === '🌐');
    });

    elImportModal.classList.add('open');
  }

  function closeImportModal() {
    elImportModal.classList.remove('open');
    pendingImport = null;
  }

  elBtnCloseImportModal.addEventListener('click', closeImportModal);
  elBtnCancelImport.addEventListener('click', closeImportModal);

  // Preset icon selection
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const icon = btn.dataset.icon;
      if (pendingImport) pendingImport.icon = icon;
      elIconPreview.innerHTML = `<span id="iconEmoji">${icon}</span>`;
    });
  });

  // Custom icon upload
  elBtnUploadCustomIcon.addEventListener('click', () => elIconFileInput.click());
  elIconFileInput.addEventListener('change', (e) => {
    const file = (e.target.files || [])[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (pendingImport) pendingImport.icon = dataUrl;
      elIconPreview.innerHTML = `<img src="${dataUrl}" alt="App Icon">`;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  // Confirm import and save to IndexedDB
  elBtnConfirmImport.addEventListener('click', async () => {
    if (!pendingImport) return;

    const name = (elAppNameInput.value || '').trim() || pendingImport.folderName || 'تطبيق بدون اسم';
    const newApp = {
      id: 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name: name,
      icon: pendingImport.icon || '🌐',
      createdAt: Date.now(),
      files: pendingImport.files
    };

    try {
      await dbSaveApp(newApp);
      closeImportModal();
      showToast(`تم حفظ وتثبيت "${name}" في الحاوية!`, '💾');
      await refreshAppList();
      await launchApp(newApp.id);
    } catch (err) {
      console.error('Failed to save app to IndexedDB:', err);
      showToast('خطأ أثناء حفظ التطبيق في قاعدة البيانات', '❌');
    }
  });

  // ---------------------------------------------------------------------------
  // 9. App Deletion
  // ---------------------------------------------------------------------------
  function openDeleteModal(appId, appName) {
    deleteTargetId = appId;
    elDeleteTargetName.textContent = appName;
    elDeleteModal.classList.add('open');
  }

  function closeDeleteModal() {
    elDeleteModal.classList.remove('open');
    deleteTargetId = null;
  }

  elBtnCloseDeleteModal.addEventListener('click', closeDeleteModal);
  elBtnCancelDelete.addEventListener('click', closeDeleteModal);

  elBtnConfirmDelete.addEventListener('click', async () => {
    if (!deleteTargetId) return;
    const targetId = deleteTargetId;
    closeDeleteModal();

    try {
      await dbDeleteApp(targetId);
      showToast('تم حذف التطبيق بنجاح', '🗑️');

      // If active app is the deleted one, clear runner
      if (currentApp && currentApp.id === targetId) {
        currentApp = null;
        currentHtml = '';
        elAppRunner.srcdoc = '';
        elAppRunner.classList.remove('active');
        elWelcomeScreen.classList.remove('hidden');

        elTopAppName.textContent = 'لا يوجد تطبيق نشط';
        elTopAppIcon.textContent = '🌐';
        elTopAppStatusText.textContent = 'في الانتظار';
        document.querySelector('.top-app-status').classList.remove('status-active');
        elTopAppFileStats.textContent = '0 ملفات';
        activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
        activeBlobUrls.clear();
      }

      await refreshAppList();
    } catch (err) {
      console.error('Failed to delete app:', err);
      showToast('فشل في حذف التطبيق', '❌');
    }
  });

  // ---------------------------------------------------------------------------
  // 10. Top Bar Actions: Separate Window, Fullscreen, Always-On-Top, Shortcut
  // ---------------------------------------------------------------------------
  // Reload
  elBtnReloadApp.addEventListener('click', () => {
    if (!currentApp) {
      showToast('لا يوجد تطبيق نشط لإعادة تحميله', '⚠️');
      return;
    }
    renderPage(currentHtmlPath);
    showToast('تمت إعادة تحميل التطبيق', '🔄');
  });

  // Open in Separate Window
  elBtnOpenSeparate.addEventListener('click', async () => {
    if (!currentApp || !currentHtml) {
      showToast('يرجى اختيار تطبيق أولاً لفتحه في نافذة منفصلة', '⚠️');
      return;
    }

    if (window.electronAPI && typeof window.electronAPI.openSeparateWindow === 'function') {
      try {
        const res = await window.electronAPI.openSeparateWindow({
          html: currentHtml,
          title: currentApp.name
        });
        if (res && res.success) {
          showToast('تم فتح التطبيق في نافذة مستقلة', '↗️');
        } else {
          showToast(`خطأ: ${res.error || 'فشل الفتح'}`, '❌');
        }
      } catch (err) {
        console.error('Electron open-separate-window error:', err);
      }
    } else {
      // Web fallback: Open Blob in a new tab/window
      try {
        const blob = new Blob([currentHtml], { type: 'text/html;charset=utf-8' });
        const popupUrl = URL.createObjectURL(blob);
        const win = window.open(popupUrl, '_blank', 'width=1000,height=700,resizable=yes,scrollbars=yes');
        if (win) {
          showToast('تم فتح التطبيق في نافذة ويب منفصلة', '↗️');
        } else {
          showToast('تم حظر النوافذ المنبثقة بواسطة المتصفح', '⚠️');
        }
      } catch (e) {
        showToast('تعذر فتح نافذة جديدة في المتصفح', '⚠️');
      }
    }
  });

  // Always On Top
  elBtnAlwaysOnTop.addEventListener('click', async () => {
    isPinned = !isPinned;
    elBtnAlwaysOnTop.classList.toggle('ctrl-btn-gold', isPinned);

    if (window.electronAPI && typeof window.electronAPI.setAlwaysOnTop === 'function') {
      const res = await window.electronAPI.setAlwaysOnTop(isPinned);
      showToast(isPinned ? 'تم تثبيت النافذة في أعلى الشاشة 📌' : 'تم إلغاء التثبيت', '📌');
    } else {
      showToast(
        isPinned ? 'وضع التثبيت في الأعلى مفعّل (في بيئة Electron Desktop)' : 'تم إلغاء التثبيت',
        '📌'
      );
    }
  });

  // Desktop Shortcut
  elBtnCreateShortcut.addEventListener('click', async () => {
    if (!currentApp) {
      showToast('اختر تطبيقاً لإنشاء اختصار له', '⚠️');
      return;
    }

    if (window.electronAPI && typeof window.electronAPI.createShortcut === 'function') {
      const res = await window.electronAPI.createShortcut({
        id: currentApp.id,
        name: currentApp.name
      });
      if (res && res.success) {
        showToast(res.message, '🖥️');
      } else {
        showToast('فشل في إنشاء الاختصار', '❌');
      }
    } else {
      // Web download of desktop launcher shortcut (.url)
      const shortcutContent = `[InternetShortcut]\nURL=${window.location.origin}/?appId=${currentApp.id}\nIconIndex=0\n`;
      const blob = new Blob([shortcutContent], { type: 'application/octet-stream' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${currentApp.name}.url`;
      a.click();
      showToast(`تم تنزيل ملف اختصار سطح المكتب لـ "${currentApp.name}"`, '🖥️');
    }
  });

  // Fullscreen
  function toggleFullscreen() {
    elAppContainer.classList.toggle('fullscreen-mode');
    if (elAppContainer.classList.contains('fullscreen-mode')) {
      showToast('اضغط Esc أو زر الخروج للعودة', '⛶');
    }
  }

  elBtnFullscreen.addEventListener('click', toggleFullscreen);
  elBtnExitFullscreen.addEventListener('click', toggleFullscreen);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elAppContainer.classList.contains('fullscreen-mode')) {
      elAppContainer.classList.remove('fullscreen-mode');
    }
  });

  // Console Drawer Toggle
  elBtnToggleConsole.addEventListener('click', () => {
    elConsoleDrawer.classList.toggle('open');
  });
  elBtnCloseConsole.addEventListener('click', () => {
    elConsoleDrawer.classList.remove('open');
  });
  elBtnClearConsole.addEventListener('click', clearConsoleLogs);

  // Search input filter
  elSearchInput.addEventListener('input', refreshAppList);

  // ---------------------------------------------------------------------------
  // 11. Built-in Multi-File Demo Web Application ("Golden Retro Suite")
  // ---------------------------------------------------------------------------
  async function installDemoApp() {
    showToast('جاري تثبيت وتجهيز التطبيق التجريبي...', '⏳');

    const demoIndexHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Golden Arcade & Tools</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="demo-wrapper">
    <header class="demo-header">
      <div class="logo-box">
        <img src="logo.svg" alt="Star Logo" width="36" height="36">
        <div>
          <h1>مملكة الألعاب والأدوات الذهبية</h1>
          <p>تطبيق ويب متعدد الصفحات يعمل 100% بدون خادم محلي</p>
        </div>
      </div>
      <nav class="demo-nav">
        <a href="index.html" class="nav-link active">🎮 لعبة البينغ بونغ</a>
        <a href="calculator.html" class="nav-link">🧮 الآلة الحاسبة الذكية</a>
        <a href="notes.html" class="nav-link">📝 المفكرة السريعة</a>
      </nav>
    </header>

    <main class="demo-content">
      <div class="arcade-card">
        <div class="game-info">
          <h2>لعبة البينغ بونغ الكلاسيكية (Arcade Pong)</h2>
          <p>حرك الماوس أو اللمس للتحكم في المضرب وصد الكرة الذهبية!</p>
          <div class="score-board">
            <span>النقاط: <strong id="scoreVal">0</strong></span>
            <span>أعلى نتيجة: <strong id="highScoreVal">0</strong></span>
          </div>
        </div>
        <canvas id="gameCanvas" width="600" height="340"></canvas>
        <div class="controls-bar">
          <button id="btnStartGame" class="arcade-btn">بدء اللعبة / إعادة التشغيل</button>
          <span class="hint">⚡ تحريك المضرب: بالماوس أو الأسهم (يمين/يسار)</span>
        </div>
      </div>
    </main>
  </div>
  <script src="game.js"></script>
</body>
</html>`;

    const demoStyleCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0b0d11;
  color: #f1f5f9;
  direction: rtl;
  padding: 20px;
  min-height: 100vh;
}
.demo-wrapper { max-width: 820px; margin: 0 auto; }
.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #d4af37;
  padding-bottom: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 14px;
}
.logo-box { display: flex; align-items: center; gap: 12px; }
.logo-box h1 { font-size: 1.25rem; color: #ffd700; }
.logo-box p { font-size: 0.8rem; color: #94a3b8; }
.demo-nav { display: flex; gap: 10px; }
.nav-link {
  color: #cbd5e1;
  text-decoration: none;
  background: #171c24;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 0.86rem;
  border: 1px solid #334155;
  transition: all 0.2s;
}
.nav-link:hover, .nav-link.active {
  background: #d4af37;
  color: #0c0e12;
  font-weight: bold;
}
.arcade-card {
  background: #141821;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}
.game-info h2 { color: #ffd700; margin-bottom: 6px; font-size: 1.2rem; }
.game-info p { color: #94a3b8; font-size: 0.85rem; margin-bottom: 12px; }
.score-board {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 14px;
  font-size: 1.05rem;
  color: #f8fafc;
}
.score-board strong { color: #f59e0b; }
#gameCanvas {
  background: #060709;
  border: 2px solid #d4af37;
  border-radius: 8px;
  display: block;
  margin: 0 auto;
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
}
.controls-bar {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}
.arcade-btn {
  background: linear-gradient(135deg, #ffd700, #d4af37);
  color: #0b0d11;
  border: none;
  padding: 10px 22px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.95rem;
  transition: transform 0.15s;
}
.arcade-btn:hover { transform: scale(1.05); }
.hint { font-size: 0.82rem; color: #94a3b8; }
.calc-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  max-width: 320px;
  margin: 20px auto 0;
}
.calc-screen {
  background: #080a0f;
  border: 1px solid #d4af37;
  color: #ffd700;
  font-size: 1.8rem;
  padding: 14px;
  border-radius: 8px;
  text-align: left;
  font-family: monospace;
  margin-bottom: 14px;
  overflow: hidden;
}
.calc-btn {
  background: #1e2430;
  border: 1px solid #334155;
  color: #f8fafc;
  padding: 14px;
  font-size: 1.2rem;
  border-radius: 8px;
  cursor: pointer;
}
.calc-btn:hover { background: #334155; }
.calc-btn-op { background: #d4af37; color: #0b0d11; font-weight: bold; }
.calc-btn-op:hover { background: #ffd700; }
.notes-area {
  width: 100%;
  height: 280px;
  background: #080a0f;
  border: 1px solid #d4af37;
  border-radius: 8px;
  color: #f8fafc;
  padding: 16px;
  font-size: 1rem;
  line-height: 1.6;
  resize: none;
  direction: rtl;
}`;

    const demoGameJs = `(function() {
  console.log("Golden Pong initialized inside isolated iframe!");
  var canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var scoreEl = document.getElementById('scoreVal');
  var highScoreEl = document.getElementById('highScoreVal');
  var btnStart = document.getElementById('btnStartGame');

  var paddleWidth = 100;
  var paddleHeight = 12;
  var paddleX = (canvas.width - paddleWidth) / 2;

  var x = canvas.width / 2;
  var y = canvas.height - 30;
  var dx = 3;
  var dy = -3;
  var ballRadius = 8;
  var score = 0;
  var highScore = 0;
  var isPlaying = false;
  var animId = null;

  function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffd700';
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
  }

  function drawPaddle() {
    ctx.beginPath();
    ctx.roundRect(paddleX, canvas.height - paddleHeight - 6, paddleWidth, paddleHeight, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.closePath();
  }

  function playTone(freq, duration) {
    try {
      var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
  }

  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
    drawPaddle();

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
      dx = -dx;
      playTone(320, 0.08);
    }
    if (y + dy < ballRadius) {
      dy = -dy;
      playTone(400, 0.08);
    } else if (y + dy > canvas.height - paddleHeight - 10) {
      if (x > paddleX && x < paddleX + paddleWidth) {
        dy = -dy * 1.04;
        dx = dx * 1.02;
        score += 10;
        scoreEl.textContent = score;
        if (score > highScore) {
          highScore = score;
          highScoreEl.textContent = highScore;
        }
        playTone(600, 0.12);
      } else if (y + dy > canvas.height - ballRadius) {
        // Game Over
        isPlaying = false;
        playTone(180, 0.3);
        console.warn("Game Over! Final Score: " + score);
        alert("انتهت اللعبة! نقاطك: " + score);
        return;
      }
    }

    x += dx;
    y += dy;

    if (isPlaying) {
      animId = requestAnimationFrame(update);
    }
  }

  function startGame() {
    score = 0;
    scoreEl.textContent = '0';
    x = canvas.width / 2;
    y = canvas.height - 40;
    dx = (Math.random() > 0.5 ? 3 : -3);
    dy = -3.2;
    paddleX = (canvas.width - paddleWidth) / 2;
    isPlaying = true;
    if (animId) cancelAnimationFrame(animId);
    update();
    console.log("Game started! High Score is: " + highScore);
  }

  if (btnStart) btnStart.onclick = startGame;

  canvas.addEventListener('mousemove', function(e) {
    var rect = canvas.getBoundingClientRect();
    var mouseX = e.clientX - rect.left;
    paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, mouseX - paddleWidth / 2));
  });

  window.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') {
      paddleX = Math.max(0, paddleX - 25);
    } else if (e.key === 'ArrowRight') {
      paddleX = Math.min(canvas.width - paddleWidth, paddleX + 25);
    }
  });

  // initial frame
  drawBall();
  drawPaddle();
})();`;

    const demoCalcHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>الآلة الحاسبة - Golden Arcade</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="demo-wrapper">
    <header class="demo-header">
      <div class="logo-box">
        <img src="logo.svg" alt="Star Logo" width="36" height="36">
        <div>
          <h1>الآلة الحاسبة السريعة</h1>
          <p>صفحة ثانوية متصلة بروابط داخلية دون إعادة تحميل الصفحة الأم</p>
        </div>
      </div>
      <nav class="demo-nav">
        <a href="index.html" class="nav-link">🎮 لعبة البينغ بونغ</a>
        <a href="calculator.html" class="nav-link active">🧮 الآلة الحاسبة الذكية</a>
        <a href="notes.html" class="nav-link">📝 المفكرة السريعة</a>
      </nav>
    </header>

    <div class="arcade-card">
      <div id="calcScreen" class="calc-screen">0</div>
      <div class="calc-grid">
        <button class="calc-btn" onclick="clearCalc()">C</button>
        <button class="calc-btn" onclick="press('/')">/</button>
        <button class="calc-btn" onclick="press('*')">×</button>
        <button class="calc-btn calc-btn-op" onclick="press('-')">-</button>
        
        <button class="calc-btn" onclick="press('7')">7</button>
        <button class="calc-btn" onclick="press('8')">8</button>
        <button class="calc-btn" onclick="press('9')">9</button>
        <button class="calc-btn calc-btn-op" onclick="press('+')">+</button>

        <button class="calc-btn" onclick="press('4')">4</button>
        <button class="calc-btn" onclick="press('5')">5</button>
        <button class="calc-btn" onclick="press('6')">6</button>
        <button class="calc-btn calc-btn-op" onclick="calcResult()">=</button>

        <button class="calc-btn" onclick="press('1')">1</button>
        <button class="calc-btn" onclick="press('2')">2</button>
        <button class="calc-btn" onclick="press('3')">3</button>
        <button class="calc-btn" onclick="press('0')">0</button>
      </div>
    </div>
  </div>

  <script>
    var expr = '';
    var screen = document.getElementById('calcScreen');
    function press(val) {
      expr += val;
      screen.textContent = expr;
      console.log('Calc input: ' + val);
    }
    function clearCalc() {
      expr = '';
      screen.textContent = '0';
    }
    function calcResult() {
      try {
        var res = eval(expr);
        screen.textContent = res;
        console.log('Calc result: ' + expr + ' = ' + res);
        expr = String(res);
      } catch(e) {
        screen.textContent = 'Error';
        console.error('Calculation error: ' + e.message);
      }
    }
  </script>
</body>
</html>`;

    const demoNotesHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>المفكرة - Golden Arcade</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="demo-wrapper">
    <header class="demo-header">
      <div class="logo-box">
        <img src="logo.svg" alt="Star Logo" width="36" height="36">
        <div>
          <h1>المفكرة السريعة (Local Notepad)</h1>
          <p>تدوين ملاحظات فورية داخل الحاوية المعزولة</p>
        </div>
      </div>
      <nav class="demo-nav">
        <a href="index.html" class="nav-link">🎮 لعبة البينغ بونغ</a>
        <a href="calculator.html" class="nav-link">🧮 الآلة الحاسبة الذكية</a>
        <a href="notes.html" class="nav-link active">📝 المفكرة السريعة</a>
      </nav>
    </header>

    <div class="arcade-card">
      <textarea id="notesArea" class="notes-area" placeholder="اكتب ملاحظاتك وأفكارك هنا... يتم الحفظ تلقائياً في ذاكرة المتصفح."></textarea>
      <div style="margin-top: 14px; display: flex; justify-content: flex-end; gap: 10px;">
        <button class="arcade-btn" onclick="saveNote()">حفظ الملاحظة</button>
        <button class="nav-link" onclick="clearNote()">مسح</button>
      </div>
    </div>
  </div>

  <script>
    var area = document.getElementById('notesArea');
    var saved = localStorage.getItem('demo_notepad');
    if (saved) area.value = saved;

    function saveNote() {
      localStorage.setItem('demo_notepad', area.value);
      console.log('Note saved successfully! Length: ' + area.value.length);
      alert('تم حفظ الملاحظة بنجاح!');
    }
    function clearNote() {
      area.value = '';
      localStorage.removeItem('demo_notepad');
    }
  </script>
</body>
</html>`;

    const demoLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffd700" width="36" height="36">
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
</svg>`;

    const demoApp = {
      id: 'app_demo_arcade',
      name: 'مملكة الألعاب والأدوات (Demo)',
      icon: '🎮',
      createdAt: Date.now(),
      files: [
        { path: 'index.html', type: 'text', mimeType: 'text/html; charset=utf-8', content: demoIndexHtml },
        { path: 'style.css', type: 'text', mimeType: 'text/css; charset=utf-8', content: demoStyleCss },
        { path: 'game.js', type: 'text', mimeType: 'application/javascript; charset=utf-8', content: demoGameJs },
        { path: 'calculator.html', type: 'text', mimeType: 'text/html; charset=utf-8', content: demoCalcHtml },
        { path: 'notes.html', type: 'text', mimeType: 'text/html; charset=utf-8', content: demoNotesHtml },
        { path: 'logo.svg', type: 'text', mimeType: 'image/svg+xml', content: demoLogoSvg }
      ]
    };

    await dbSaveApp(demoApp);
    await refreshAppList();
    await launchApp(demoApp.id);
  }

  elBtnLoadDemo.addEventListener('click', installDemoApp);
  elWelcomeDemoBtn.addEventListener('click', installDemoApp);

  // ---------------------------------------------------------------------------
  // 12. App Initialization
  // ---------------------------------------------------------------------------
  async function init() {
    // Detect environment
    if (window.electronAPI && window.electronAPI.isElectron) {
      elEnvBadge.textContent = 'Electron Desktop';
      elEnvBadge.style.color = '#10b981';
      elEnvBadge.style.borderColor = '#10b981';
    } else {
      elEnvBadge.textContent = 'Web Isolated Mode';
    }

    await refreshAppList();

    // Check if query param specified appId to auto-launch
    const params = new URLSearchParams(window.location.search);
    const targetAppId = params.get('appId');
    if (targetAppId) {
      await launchApp(targetAppId);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
