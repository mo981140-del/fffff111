/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocalApp } from '../types/app';

export interface SeparateWindowOptions {
  app: LocalApp;
  finalHtml: string;
}

export class ElectronBridgeService {
  /**
   * Checks whether the application is running inside Electron.
   */
  static isElectronEnvironment(): boolean {
    return typeof window !== 'undefined' && Boolean(window.electron?.isElectron);
  }

  /**
   * Opens the app in a separate window (via Electron IPC if available, or browser popup with floating toolbar).
   */
  static async openInSeparateWindow(options: SeparateWindowOptions): Promise<void> {
    const { app, finalHtml } = options;

    if (this.isElectronEnvironment() && window.electron) {
      await window.electron.openSeparateWindow({
        id: app.id,
        name: app.name,
        html: finalHtml,
        icon: app.icon,
      });
      return;
    }

    // Web Browser Fallback: Open popup window with luxury standalone runner & floating toolbar
    const windowFeatures = 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes';
    const popup = window.open('', `_blank_app_${app.id}`, windowFeatures);

    if (!popup) {
      throw new Error('تم حظر فتح النافذة المنبثقة من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.');
    }

    const standaloneDocument = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${app.name} | نافذة مستقلة</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body, html { width: 100%; height: 100%; overflow: hidden; background: #0B0C10; font-family: 'Cairo', sans-serif; }
            
            /* Floating Toolbar */
            #floatingBar {
              position: fixed;
              top: 14px;
              left: 50%;
              transform: translateX(-50%);
              z-index: 99999;
              display: flex;
              align-items: center;
              gap: 10px;
              background: rgba(19, 22, 28, 0.92);
              border: 1px solid rgba(255, 215, 0, 0.35);
              border-radius: 9999px;
              padding: 6px 14px;
              backdrop-filter: blur(12px);
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.15);
              transition: all 0.25s ease;
            }
            #floatingBar:hover {
              border-color: #FFD700;
              box-shadow: 0 10px 35px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 215, 0, 0.25);
            }
            .app-title-badge {
              display: flex;
              align-items: center;
              gap: 8px;
              padding-left: 10px;
              border-left: 1px solid rgba(255, 215, 0, 0.2);
              color: #FFD700;
              font-weight: 700;
              font-size: 13px;
            }
            .app-icon {
              width: 20px;
              height: 20px;
              border-radius: 4px;
              object-fit: cover;
            }
            .bar-btn {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(255, 255, 255, 0.06);
              border: 1px solid rgba(255, 215, 0, 0.2);
              color: #E2E8F0;
              font-size: 12px;
              font-weight: 600;
              padding: 5px 12px;
              border-radius: 9999px;
              cursor: pointer;
              transition: all 0.2s;
              font-family: inherit;
            }
            .bar-btn:hover {
              background: rgba(255, 215, 0, 0.15);
              border-color: #FFD700;
              color: #FFD700;
            }
            .bar-btn.active {
              background: linear-gradient(135deg, #FFD700, #B8860B);
              color: #0B0C10;
              border-color: #FFD700;
              font-weight: 700;
            }
            .bar-btn-close {
              background: rgba(239, 68, 68, 0.1);
              border-color: rgba(239, 68, 68, 0.3);
              color: #F87171;
            }
            .bar-btn-close:hover {
              background: rgba(239, 68, 68, 0.25);
              border-color: #EF4444;
              color: #FFF;
            }
            #appRunnerFrame {
              width: 100vw;
              height: 100vh;
              border: none;
              background: #FFFFFF;
            }
            #toastMsg {
              position: fixed;
              bottom: 20px;
              left: 50%;
              transform: translateX(-50%);
              background: #14171E;
              color: #FFD700;
              border: 1px solid #FFD700;
              padding: 8px 18px;
              border-radius: 8px;
              font-size: 13px;
              z-index: 100000;
              opacity: 0;
              pointer-events: none;
              transition: opacity 0.3s;
            }
            #toastMsg.show {
              opacity: 1;
            }
          </style>
        </head>
        <body>
          <div id="floatingBar">
            <div class="app-title-badge">
              ${app.icon ? `<img src="${app.icon}" class="app-icon" alt="" />` : '💎'}
              <span>${app.name}</span>
            </div>
            <button id="pinBtn" class="bar-btn" title="تثبيت النافذة في المقدمة">
              <span>📌</span>
              <span id="pinText">تثبيت في الأعلى</span>
            </button>
            <button id="shortcutBtn" class="bar-btn" title="إنشاء أيقونة تشغيل مباشرة">
              <span>🖥️</span>
              <span>إنشاء أيقونة سطح المكتب</span>
            </button>
            <button id="closeBtn" class="bar-btn bar-btn-close" title="إغلاق النافذة">
              <span>✖</span>
              <span>إغلاق</span>
            </button>
          </div>

          <div id="toastMsg"></div>
          <iframe id="appRunnerFrame"></iframe>

          <script>
            (function() {
              try {
                var origFetch = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : null;
                var _currentFetch = origFetch;
                if (typeof Window !== 'undefined' && Window.prototype) {
                  try {
                    Object.defineProperty(Window.prototype, 'fetch', {
                      get: function() { return _currentFetch; },
                      set: function(fn) { _currentFetch = fn; },
                      configurable: true,
                      enumerable: true
                    });
                  } catch(e1) {}
                }
                try {
                  Object.defineProperty(window, 'fetch', {
                    get: function() { return _currentFetch; },
                    set: function(fn) { _currentFetch = fn; },
                    configurable: true,
                    enumerable: true
                  });
                } catch(e2) {}
              } catch(err) {}
            })();
            const iframe = document.getElementById('appRunnerFrame');
            const pinBtn = document.getElementById('pinBtn');
            const pinText = document.getElementById('pinText');
            const shortcutBtn = document.getElementById('shortcutBtn');
            const closeBtn = document.getElementById('closeBtn');
            const toast = document.getElementById('toastMsg');

            function showToast(text) {
              toast.textContent = text;
              toast.classList.add('show');
              setTimeout(() => toast.classList.remove('show'), 2500);
            }

            // Load app
            iframe.srcdoc = ${JSON.stringify(finalHtml)};

            // Pin State
            let isPinned = false;
            let pinInterval = null;

            pinBtn.addEventListener('click', () => {
              if (window.opener && window.opener.electron) {
                window.opener.electron.setAlwaysOnTop(!isPinned).then(newState => {
                  isPinned = newState;
                  updatePinUI();
                });
                return;
              }

              isPinned = !isPinned;
              updatePinUI();

              if (isPinned) {
                // Keep-focused technique for browser standalone window
                pinInterval = setInterval(() => {
                  try { window.focus(); } catch(e) {}
                }, 1000);
                showToast('📌 تم تفعيل وضع التثبيت في المقدمة');
              } else {
                if (pinInterval) clearInterval(pinInterval);
                showToast('تم إلغاء التثبيت في المقدمة');
              }
            });

            function updatePinUI() {
              if (isPinned) {
                pinBtn.classList.add('active');
                pinText.textContent = 'مثبت في الأعلى';
              } else {
                pinBtn.classList.remove('active');
                pinText.textContent = 'تثبيت في الأعلى';
              }
            }

            // Desktop Shortcut Trigger
            shortcutBtn.addEventListener('click', () => {
              if (window.opener && window.opener.electron) {
                window.opener.electron.createDesktopShortcut({
                  name: ${JSON.stringify(app.name)},
                  iconData: ${JSON.stringify(app.icon || '')}
                }).then(res => {
                  showToast(res.message);
                });
                return;
              }

              // Web Browser Shortcut Generator (.url / .desktop)
              const appName = ${JSON.stringify(app.name)};
              const desktopContent = \`[Desktop Entry]
Version=1.0
Type=Application
Name=\${appName}
Comment=Local App Container standalone launch
Exec=google-chrome --app="\${window.location.href}"
Icon=\${${JSON.stringify(app.icon || 'web-browser')}}
Terminal=false
Categories=Utility;Application;\`;

              const blob = new Blob([desktopContent], { type: 'application/x-desktop' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = \`\${appName}.desktop\`;
              a.click();
              URL.revokeObjectURL(url);

              // Also generate Windows .url shortcut
              const urlFileContent = \`[InternetShortcut]
URL=\${window.location.href}
IconFile=\${window.location.origin}/favicon.ico
IconIndex=0\`;
              const blobUrl = new Blob([urlFileContent], { type: 'application/octet-stream' });
              const a2 = document.createElement('a');
              a2.href = URL.createObjectURL(blobUrl);
              a2.download = \`\${appName}.url\`;
              a2.click();

              showToast('🖥️ تم تحميل ملف الاختصار لسطح المكتب!');
            });

            closeBtn.addEventListener('click', () => {
              window.close();
            });
          </script>
        </body>
      </html>
    `;

    popup.document.open();
    popup.document.write(standaloneDocument);
    popup.document.close();
  }

  /**
   * Toggles Always on Top via Electron IPC or window control.
   */
  static async toggleAlwaysOnTop(currentPinned: boolean): Promise<boolean> {
    if (this.isElectronEnvironment() && window.electron) {
      return await window.electron.setAlwaysOnTop(!currentPinned);
    }
    return !currentPinned;
  }

  /**
   * Generates a desktop shortcut.
   */
  static async createDesktopShortcut(app: LocalApp): Promise<{ success: boolean; message: string }> {
    if (this.isElectronEnvironment() && window.electron) {
      return await window.electron.createDesktopShortcut({
        name: app.name,
        iconData: app.icon,
      });
    }

    // In web environment: generate and trigger download of both Linux (.desktop) and Windows (.url) shortcuts
    try {
      const currentUrl = window.location.href;
      const appName = app.name.replace(/[/\\?%*:|"<>]/g, '-');

      // 1. Linux .desktop
      const desktopFile = `[Desktop Entry]
Version=1.0
Type=Application
Name=${appName}
Comment=مشغل التطبيقات المحلي | ${appName}
Exec=google-chrome --app="${currentUrl}?runApp=${app.id}"
Terminal=false
Categories=Development;Utility;
`;
      const blobDesktop = new Blob([desktopFile], { type: 'application/x-desktop;charset=utf-8' });
      const dlLink = document.createElement('a');
      dlLink.href = URL.createObjectURL(blobDesktop);
      dlLink.download = `${appName}.desktop`;
      dlLink.click();
      URL.revokeObjectURL(dlLink.href);

      // 2. Windows .url
      const urlFile = `[InternetShortcut]\nURL=${currentUrl}?runApp=${app.id}\n`;
      const blobUrl = new Blob([urlFile], { type: 'application/octet-stream' });
      const dlLink2 = document.createElement('a');
      dlLink2.href = URL.createObjectURL(blobUrl);
      dlLink2.download = `${appName}.url`;
      dlLink2.click();
      URL.revokeObjectURL(dlLink2.href);

      return {
        success: true,
        message: `تم توليد وتحميل ملفات الاختصار لسطح المكتب (${appName}.desktop و ${appName}.url) بنجاح!`,
      };
    } catch (err) {
      return {
        success: false,
        message: `تعذر إنشاء الاختصار: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
