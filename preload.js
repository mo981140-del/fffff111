const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
    fetchHeaders: (url) => ipcRenderer.invoke('fetch-headers', url)
});