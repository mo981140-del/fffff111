const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    sendRequest: (data) => ipcRenderer.invoke('send-api-request', data)
});
