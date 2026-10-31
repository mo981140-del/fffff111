/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Copy, Check, Laptop, Download, Terminal, Shield } from 'lucide-react';

interface ElectronExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ElectronExportModal: React.FC<ElectronExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const commandSnippet = `npm install -D electron\nnpx electron electron/main.cjs`;

  const mainCjsCode = `const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    backgroundColor: '#0B0C10',
    title: 'Local App Container',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL('http://localhost:3000'); // or mainWindow.loadFile('dist/index.html');
}

ipcMain.handle('open-separate-window', async (event, data) => {
  const win = new BrowserWindow({
    width: 1200, height: 800, backgroundColor: '#0B0C10',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs') }
  });
  win.setMenuBarVisibility(false);
  const encodedHtml = 'data:text/html;charset=utf-8,' + encodeURIComponent(data.html);
  win.loadURL(encodedHtml);
});

ipcMain.handle('set-always-on-top', (event, flag) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) { win.setAlwaysOnTop(Boolean(flag)); return win.isAlwaysOnTop(); }
  return false;
});

app.whenReady().then(createMainWindow);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#14171E] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden gold-glow animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-[#0B0C10]/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[#FFD700]">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFD700]">بيئة إلكترون الأصلية (Electron Native Ready)</h2>
              <p className="text-xs text-gray-400">التطبيق جاهز بنسبة 100% للتحزيم كبرنامج سطح مكتب مستقل</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-right text-xs text-gray-300">
          <div className="bg-[#0B0C10] p-4 rounded-xl border border-gray-800">
            <h3 className="font-bold text-white text-sm mb-1.5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#FFD700]" />
              <span>جاهزية التشغيل الأصلي</span>
            </h3>
            <p className="text-gray-400 leading-relaxed">
              تم تضمين ملفات <code className="text-amber-300">electron/main.cjs</code> و <code className="text-amber-300">electron/preload.cjs</code> داخل المشروع مسبقاً مع كامل معالجات IPC لفتح النوافذ المنفصلة وتثبيت النوافذ في المقدمة (Always on Top) وإنشاء أيقونات سطح المكتب (Desktop Shortcuts).
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>أمر التشغيل المباشر عبر الطرفية:</span>
              </span>
              <button
                onClick={() => copyText('cmd', commandSnippet)}
                className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-[#FFD700]"
              >
                {copiedKey === 'cmd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'cmd' ? 'تم النسخ!' : 'نسخ الأمر'}</span>
              </button>
            </div>
            <pre className="bg-[#0B0C10] p-3 rounded-xl border border-gray-800 font-mono text-[12px] text-emerald-400 direction-ltr text-left overflow-x-auto">
              {commandSnippet}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white">كود معالج Electron Main (main.cjs):</span>
              <button
                onClick={() => copyText('code', mainCjsCode)}
                className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-[#FFD700]"
              >
                {copiedKey === 'code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'code' ? 'تم النسخ!' : 'نسخ الكود'}</span>
              </button>
            </div>
            <pre className="bg-[#0B0C10] p-3 rounded-xl border border-gray-800 font-mono text-[11px] text-amber-200/90 direction-ltr text-left overflow-x-auto max-h-48">
              {mainCjsCode}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-500/20 bg-[#0B0C10]/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-[#0B0C10] font-bold text-xs rounded-xl shadow-md hover:brightness-110"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
