/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Local App Container - Electron Preload Script
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// IPC channels securely without exposing the entire remote/electron object.
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // Open a running app inside an independent Electron BrowserWindow
  openSeparateWindow: (payload) => {
    return ipcRenderer.invoke('open-separate-window', payload);
  },

  // Toggle or set Always On Top state for the current or child window
  setAlwaysOnTop: (flag) => {
    return ipcRenderer.invoke('set-always-on-top', { flag });
  },

  // Create an operating system desktop shortcut for the specified app
  createShortcut: (appData) => {
    return ipcRenderer.invoke('create-shortcut', appData);
  },

  // Get current environment and system details
  getSystemInfo: () => {
    return ipcRenderer.invoke('get-system-info');
  },

  // Listen for window state notifications
  onWindowStateChange: (callback) => {
    ipcRenderer.on('window-state-changed', (_event, state) => callback(state));
  }
});
