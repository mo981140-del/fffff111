const { app, BrowserWindow, ipcMain, net } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// 🚨 استخدام net.fetch الخاص بـ Electron (بيحترم شبكة النظام والبروكسي)
ipcMain.handle('fetch-headers', async (event, url) => {
  try {
    const response = await net.fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // تحويل الـ Headers من كائن Response لـ كائن عادي
    const headersObj = {};
    response.headers.forEach((value, key) => {
      headersObj[key.toLowerCase()] = value;
    });

    return { success: true, headers: headersObj, statusCode: response.status };

  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
