const { app, BrowserWindow } = require('electron');
const path = require('path');
function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 900,
    webPreferences: { 
        nodeIntegration: true, 
        contextIsolation: false,
        webSecurity: false // مهم جداً عشان البرنامج يقدر يبعت طلبات API من غير قيود CORS
    }
  });
  win.loadFile('index.html');
  // win.webContents.openDevTools();
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });