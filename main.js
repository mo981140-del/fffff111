const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 900,
    webPreferences: { 
        nodeIntegration: true, 
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: false
    }
  });
  win.loadFile('index.html');
}

ipcMain.handle('send-api-request', async (event, { method, url, headers, body }) => {
    try {
        const startTime = Date.now();
        const response = await axios({
            method: method,
            url: url,
            headers: headers,
            data: body,
            timeout: 30000, // 🚨 مهلة 30 ثانية
            validateStatus: () => true
        });
        const timeTaken = Date.now() - startTime;
        
        return {
            success: true,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
            time: timeTaken
        };
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            return { success: false, error: 'انتهت المهلة (30 ثانية): السيرفر لم يستجب.' };
        }
        return { success: false, error: error.message };
    }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
