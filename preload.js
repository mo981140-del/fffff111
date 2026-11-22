const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aegisAPI', {
    startShield: () => ipcRenderer.invoke('start-shield'),
    stopShield: () => ipcRenderer.invoke('stop-shield'),
    onShieldEvent: (callback) => ipcRenderer.on('shield-event', (event, data) => callback(data)),
    onSystemStats: (callback) => ipcRenderer.on('system-stats', (event, data) => callback(data))
});
