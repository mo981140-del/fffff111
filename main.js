const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const analyzer = require('./engine/analyzer.js');
const shield = require('./engine/shield.js');

let mainWindow;
let scanInterval;
let isShieldActive = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: "Aegis-Core | DevVortex",
    backgroundColor: '#09040c',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => createWindow());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('start-shield', () => {
    if (isShieldActive) return { status: 'already_running' };
    isShieldActive = true;

    // فحص حقيقي كل 3 ثواني
    scanInterval = setInterval(async () => {
        const result = await analyzer.scanSystem();
        
        if (mainWindow && !mainWindow.isDestroyed()) {
            // إرسال حالة النظام (CPU/RAM) دايماً
            mainWindow.webContents.send('system-stats', result.system);

            // إرسال التهديد لو موجود
            if (result.threat) {
                const evaluatedThreat = shield.evaluateThreat(result.threat);
                mainWindow.webContents.send('shield-event', evaluatedThreat);
            }
        }
    }, 3000);

    return { status: 'started' };
});

ipcMain.handle('stop-shield', () => {
    if (!isShieldActive) return { status: 'already_stopped' };
    isShieldActive = false;
    clearInterval(scanInterval);
    return { status: 'stopped' };
});
