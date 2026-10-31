/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { LocalApp, AppConsoleLog } from '../types/app';
import { ElectronBridgeService } from '../services/electronBridge';
import {
  RotateCw,
  ExternalLink,
  Maximize2,
  X,
  Pin,
  Monitor,
  Terminal,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';

interface AppRunnerProps {
  app: LocalApp;
  finalHtml: string;
  activePath: string;
  onReload: () => void;
  onNavigateInternal: (newPath: string) => void;
  onDeleteApp: (id: string) => void;
}

export const AppRunner: React.FC<AppRunnerProps> = ({
  app,
  finalHtml,
  activePath,
  onReload,
  onNavigateInternal,
  onDeleteApp,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [logs, setLogs] = useState<AppConsoleLog[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Set srcdoc on the iframe when finalHtml changes
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = finalHtml;
    }
    setLogs([]); // Reset logs when new app or page loads
  }, [finalHtml]);

  // Listen for iframe messages (navigation, console logs, errors)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'APP_CONTAINER_NAVIGATE') {
        const { href, from } = event.data;
        onNavigateInternal(href);
      } else if (event.data.type === 'APP_CONTAINER_LOG') {
        const newLog: AppConsoleLog = {
          id: Math.random().toString(),
          type: event.data.level || 'log',
          message: event.data.message || '',
          timestamp: event.data.timestamp || Date.now(),
        };
        setLogs((prev) => [...prev.slice(-100), newLog]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onNavigateInternal]);

  // Keyboard shortcut: Escape to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3000);
  };

  // Feature 1: Open in Separate Window
  const handleOpenSeparateWindow = async () => {
    try {
      await ElectronBridgeService.openInSeparateWindow({
        app,
        finalHtml,
      });
      showToast('🚀 تم فتح التطبيق في نافذة مستقلة');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذر فتح النافذة');
    }
  };

  // Feature 2: Always on Top Toggle
  const handleTogglePin = async () => {
    try {
      const nextPinned = await ElectronBridgeService.toggleAlwaysOnTop(isPinned);
      setIsPinned(nextPinned);
      showToast(nextPinned ? '📌 تم تفعيل التثبيت في الأعلى' : 'تم إلغاء التثبيت في الأعلى');
    } catch {
      showToast('خاصية التثبيت متاحة في إلكترون والنوافذ المنفصلة');
    }
  };

  // Feature 2: Create Desktop Shortcut
  const handleCreateDesktopShortcut = async () => {
    try {
      const res = await ElectronBridgeService.createDesktopShortcut(app);
      showToast(res.message);
    } catch (err) {
      showToast('تعذر إنشاء الاختصار لسطح المكتب');
    }
  };

  // Feature 3: Fullscreen Mode
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative flex flex-col flex-1 h-screen bg-[#0B0C10] overflow-hidden ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Top Application Control Bar (Hidden when in Fullscreen Mode) */}
      {!isFullscreen && (
        <header className="h-14 bg-[#14171E] border-b border-amber-500/20 px-4 flex items-center justify-between flex-shrink-0 z-30">
          {/* App Info & Current Document */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0B0C10] border border-amber-500/40 p-1 flex items-center justify-center">
              {app.icon ? (
                <img src={app.icon} alt="" className="w-full h-full object-contain" />
              ) : (
                <span className="text-sm">💎</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">{app.name}</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#FFD700]">
                {activePath}
              </span>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* Reload Button */}
            <button
              onClick={onReload}
              title="إعادة تحميل الصفحة"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0C10] hover:bg-[#1A1E27] border border-gray-800 hover:border-amber-500/40 text-xs text-gray-300 hover:text-white transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>إعادة تحميل</span>
            </button>

            {/* Feature 1: Open in Separate Window */}
            <button
              onClick={handleOpenSeparateWindow}
              title="↗️ فتح في نافذة مستقلة منفصلة"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0C10] hover:bg-[#1A1E27] border border-amber-500/30 hover:border-amber-400 text-xs font-semibold text-amber-200 hover:text-[#FFD700] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>↗️ نافذة منفصلة</span>
            </button>

            {/* Feature 2: Always on Top */}
            <button
              onClick={handleTogglePin}
              title="تثبيت النافذة في المقدمة"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                isPinned
                  ? 'bg-amber-500 text-[#0B0C10] border-amber-400'
                  : 'bg-[#0B0C10] hover:bg-[#1A1E27] border-gray-800 hover:border-amber-500/40 text-gray-300'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-[#0B0C10]' : 'text-amber-400'}`} />
              <span>{isPinned ? 'مثبت' : 'تثبيت في الأعلى'}</span>
            </button>

            {/* Feature 2: Desktop Shortcut */}
            <button
              onClick={handleCreateDesktopShortcut}
              title="إنشاء أيقونة تشغيل مباشرة على سطح المكتب"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0C10] hover:bg-[#1A1E27] border border-gray-800 hover:border-amber-500/40 text-xs text-gray-300 hover:text-[#FFD700] transition-colors"
            >
              <Monitor className="w-3.5 h-3.5 text-amber-400" />
              <span>أيقونة سطح المكتب</span>
            </button>

            {/* Feature 3: Fullscreen Button */}
            <button
              onClick={handleToggleFullscreen}
              title="⛶ تشغيل بملء الشاشة"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-xs font-bold text-[#FFD700] transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>⛶ ملء الشاشة</span>
            </button>

            {/* Console / Logs Toggle */}
            <button
              onClick={() => setShowConsole(!showConsole)}
              title="سجل المخرجات والأخطاء"
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                showConsole
                  ? 'bg-amber-500/20 border-amber-400 text-[#FFD700]'
                  : 'bg-[#0B0C10] hover:bg-[#1A1E27] border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              {logs.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>
          </div>
        </header>
      )}

      {/* Floating Exit Fullscreen Button (Shown ONLY in Fullscreen Mode) */}
      {isFullscreen && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <button
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#14171E]/95 border-2 border-[#FFD700] text-[#FFD700] font-bold text-xs shadow-2xl backdrop-blur-md hover:bg-[#FFD700] hover:text-[#0B0C10] transition-all transform hover:scale-105"
          >
            <X className="w-4 h-4 stroke-[3]" />
            <span>✖ خروج من ملء الشاشة (Esc)</span>
          </button>
        </div>
      )}

      {/* Main Iframe Runner */}
      <main className="relative flex-1 w-full h-full bg-white overflow-hidden">
        <iframe
          id="appRunner"
          ref={iframeRef}
          title={app.name}
          className="w-full h-full border-none bg-white"
        />
      </main>

      {/* Dev Console Drawer */}
      {showConsole && !isFullscreen && (
        <div className="h-56 bg-[#0B0C10] border-t border-amber-500/25 flex flex-col z-20 font-mono text-xs">
          <div className="flex items-center justify-between px-4 py-2 bg-[#14171E] border-b border-gray-800 text-gray-300">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#FFD700]" />
              <span className="font-semibold text-[#FFD700]">سجل مخرجات التطبيق (Live DevLogs)</span>
              <span className="text-[10px] text-gray-500">({logs.length} سجل)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLogs([])}
                className="text-[11px] text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-gray-800"
              >
                مسح السجل
              </button>
              <button
                onClick={() => setShowConsole(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-600 text-center py-8">لا توجد رسائل أو أخطاء من التطبيق حتى الآن.</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 py-1 px-2 rounded ${
                    log.type === 'error'
                      ? 'bg-red-950/40 text-red-300 border border-red-900/50'
                      : log.type === 'warn'
                      ? 'bg-amber-950/40 text-amber-300 border border-amber-900/50'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <span className="text-gray-500 text-[10px] select-none">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="font-bold uppercase text-[10px] w-12 text-left">
                    [{log.type}]
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2.5 rounded-xl bg-[#14171E] border border-[#FFD700] text-[#FFD700] text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
