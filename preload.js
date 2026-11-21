const { contextBridge, ipcRenderer } = require('electron');

// فتح قنوات اتصال آمنة للواجهة الأمامية
contextBridge.exposeInMainWorld('aegisAPI', {
    // دالة تشغيل الحماية
    startShield: () => ipcRenderer.invoke('start-shield'),
    
    // دالة إيقاف الحماية
    stopShield: () => ipcRenderer.invoke('stop-shield'),
    
    // دالة الاستماع للهجمات الوهمية اللي بتبعت من المحرك
    onShieldEvent: (callback) => {
        ipcRenderer.on('shield-event', (event, data) => callback(data));
    }
});
