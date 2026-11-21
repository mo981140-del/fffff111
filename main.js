const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// 🚨 استدعاء محرك التحليل والدرع
const analyzer = require('./engine/analyzer.js');
const shield = require('./engine/shield.js');

let mainWindow;
let simulationInterval;
let isShieldActive = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: "Aegis-Core | DevVortex",
    backgroundColor: '#09040c',
    icon: path.join(__dirname, 'assets', 'icon.png'), // 🚨 إضافة اللوجو
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ==========================================
// 🛡️ تشغيل وإيقاف محرك الحماية
// ==========================================

ipcMain.handle('start-shield', () => {
    if (isShieldActive) return { status: 'already_running' };
    isShieldActive = true;

    // تشغيل المحرك: كل 1.5 ثانية يقوم بفحص الذاكرة
    simulationInterval = setInterval(() => {
        // 1. الفحص
        const detectedThreat = analyzer.scanMemory();
        
        if (detectedThreat) {
            // 2. التصدي (الدرع)
            const neutralizedThreat = shield.neutralizeThreat(detectedThreat);
            
            // 3. إرسال النتيجة للواجهة
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('shield-event', neutralizedThreat);
            }
        }
    }, 1500); // كل 1.5 ثانية

    return { status: 'started' };
});

ipcMain.handle('stop-shield', () => {
    if (!isShieldActive) return { status: 'already_stopped' };
    
    isShieldActive = false;
    clearInterval(simulationInterval);
    
    return { status: 'stopped' };
});
