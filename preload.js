const { contextBridge, ipcRenderer } = require('electron');

const invokeWithTimeout = (channel, data, timeout = 35000) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('انتهت مهلة الاتصال بالبرنامج.'));
        }, timeout);

        ipcRenderer.invoke(channel, data).then((response) => {
            clearTimeout(timer);
            resolve(response);
        }).catch((err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
};

contextBridge.exposeInMainWorld('electronAPI', {
    sendRequest: (data) => invokeWithTimeout('send-api-request', data)
});
