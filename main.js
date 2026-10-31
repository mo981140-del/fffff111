/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Local App Container - Electron Main Process & Static Server
 */

const path = require('path');
const fs = require('fs');
const http = require('http');

// Determine if running inside Electron runtime
const isElectron = Boolean(process.versions && process.versions.electron);

let electronApp = null;
let BrowserWindow = null;
let ipcMain = null;
let nativeImage = null;

if (isElectron) {
  try {
    const electron = require('electron');
    electronApp = electron.app;
    BrowserWindow = electron.BrowserWindow;
    ipcMain = electron.ipcMain;
    nativeImage = electron.nativeImage;
  } catch (err) {
    console.warn('[LocalAppContainer] Electron not loaded, running in pure server mode:', err.message);
  }
}

// ---------------------------------------------------------------------------
// 1. HTTP Server (Serves the UI on port 3000 for web & Electron dev mode)
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // Normalize request url
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  // Prevent directory traversal
  const safePath = path.normalize(path.join(__dirname, pathname));
  if (!safePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA if not found
      const indexPath = path.join(__dirname, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('الملف غير موجود (File Not Found)');
        } else {
          res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(safePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('خطأ في قراءة الملف');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[LocalAppContainer] الخادم يعمل الآن على: http://localhost:${PORT}`);
});

// ---------------------------------------------------------------------------
// 2. Electron Lifecycle & Windows Management
// ---------------------------------------------------------------------------
let mainWindow = null;
const separateWindows = new Set();

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'حاوية التطبيقات المحلية - Local App Container',
    backgroundColor: '#0d0f12',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Load from local server
  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

if (electronApp && isElectron) {
  electronApp.whenReady().then(() => {
    createMainWindow();

    electronApp.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });

    // Setup IPC Handlers
    setupIpcHandlers();
  });

  electronApp.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      electronApp.quit();
    }
  });
}

// ---------------------------------------------------------------------------
// 3. IPC Handlers for Electron
// ---------------------------------------------------------------------------
function setupIpcHandlers() {
  if (!ipcMain) return;

  // Handler: Open in Separate Window
  ipcMain.handle('open-separate-window', async (_event, payload) => {
    try {
      const { html, title = 'نافذة التطبيق المستقلة', width = 1000, height = 700 } = payload || {};

      const childWin = new BrowserWindow({
        width,
        height,
        title: title,
        backgroundColor: '#0d0f12',
        autoHideMenuBar: true,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false
        }
      });

      // Encode HTML into a data URL for reliable standalone rendering
      const encodedHtml = `data:text/html;charset=utf-8,${encodeURIComponent(html || '<h1>Empty App</h1>')}`;
      await childWin.loadURL(encodedHtml);

      separateWindows.add(childWin);
      childWin.on('closed', () => {
        separateWindows.delete(childWin);
      });

      return { success: true, message: 'تم فتح النافذة بنجاح' };
    } catch (err) {
      console.error('[IPC open-separate-window error]:', err);
      return { success: false, error: err.message };
    }
  });

  // Handler: Set Always On Top
  ipcMain.handle('set-always-on-top', (_event, { flag }) => {
    try {
      const targetWindow = BrowserWindow.getFocusedWindow() || mainWindow;
      if (targetWindow) {
        targetWindow.setAlwaysOnTop(Boolean(flag));
        return { success: true, isAlwaysOnTop: targetWindow.isAlwaysOnTop() };
      }
      return { success: false, error: 'No active window found' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Handler: Create Desktop Shortcut
  ipcMain.handle('create-shortcut', async (_event, appData) => {
    try {
      const appName = (appData && appData.name) || 'Local App';
      const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
      const desktopDir = path.join(homeDir, 'Desktop');

      if (process.platform === 'win32') {
        // Windows shortcut creation (.url / .lnk)
        const shortcutPath = path.join(desktopDir, `${appName}.url`);
        const shortcutContent = `[InternetShortcut]\nURL=http://localhost:${PORT}/?appId=${appData.id || ''}\nIconIndex=0\n`;
        fs.writeFileSync(shortcutPath, shortcutContent, 'utf-8');
      } else if (process.platform === 'linux') {
        // Linux .desktop file
        const desktopFile = path.join(desktopDir, `${appName}.desktop`);
        const content = `[Desktop Entry]\nType=Application\nName=${appName}\nExec=google-chrome http://localhost:${PORT}/?appId=${appData.id || ''}\nIcon=applications-other\nTerminal=false\n`;
        fs.writeFileSync(desktopFile, content, 'utf-8');
        try { fs.chmodSync(desktopFile, 0o755); } catch (e) {}
      }

      return {
        success: true,
        message: `تم إنشاء اختصار لـ "${appName}" بنجاح على سطح المكتب`
      };
    } catch (err) {
      console.error('[IPC create-shortcut error]:', err);
      return { success: false, error: err.message };
    }
  });

  // Handler: System Info
  ipcMain.handle('get-system-info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      isElectron: true
    };
  });
}
