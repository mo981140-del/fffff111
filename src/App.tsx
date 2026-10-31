/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LocalApp, StoredFile } from './types/app';
import { dbService } from './services/db';
import { buildAppExecution, revokeAllActiveBlobs } from './services/renderEngine';
import { readFilesFromInput, readFilesFromZip, createLocalAppObject } from './services/appImporter';
import { ElectronBridgeService } from './services/electronBridge';
import { DEMO_APPS } from './data/demoApps';

import { Sidebar } from './components/Sidebar';
import { AppRunner } from './components/AppRunner';
import { WelcomeScreen } from './components/WelcomeScreen';
import { NewAppModal } from './components/NewAppModal';
import { ElectronExportModal } from './components/ElectronExportModal';

export default function App() {
  const [apps, setApps] = useState<LocalApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<LocalApp | null>(null);
  const [finalHtml, setFinalHtml] = useState<string>('');
  const [activePath, setActivePath] = useState<string>('index.html');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals and Import State
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState<boolean>(false);
  const [isElectronModalOpen, setIsElectronModalOpen] = useState<boolean>(false);
  const [pendingFiles, setPendingFiles] = useState<StoredFile[]>([]);
  const [suggestedAppName, setSuggestedAppName] = useState<string>('');

  const folderInputRef = useRef<HTMLInputElement>(null);
  const isElectron = ElectronBridgeService.isElectronEnvironment();

  // Load apps from IndexedDB on startup
  const refreshApps = useCallback(async () => {
    try {
      const storedApps = await dbService.getAllApps();
      if (storedApps.length === 0) {
        // Seed default luxury demo apps into IndexedDB
        for (const demo of DEMO_APPS) {
          await dbService.saveApp(demo);
        }
        const seeded = await dbService.getAllApps();
        setApps(seeded);
      } else {
        setApps(storedApps);
      }
    } catch (err) {
      console.error('Error loading apps from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshApps();
  }, [refreshApps]);

  // Execute an app through the Blob URL & srcdoc Rendering Engine
  const runLocalApp = useCallback((app: LocalApp, entryHtmlPath?: string) => {
    try {
      const result = buildAppExecution(app, entryHtmlPath);
      setSelectedApp(app);
      setFinalHtml(result.finalHtml);
      setActivePath(result.entryPath);
    } catch (err) {
      alert(`خطأ أثناء تشغيل التطبيق: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  // Check URL parameters for direct app launch
  useEffect(() => {
    if (apps.length > 0 && !selectedApp) {
      const params = new URLSearchParams(window.location.search);
      const runAppId = params.get('runApp');
      if (runAppId) {
        const found = apps.find((a) => a.id === runAppId);
        if (found) {
          runLocalApp(found);
        }
      }
    }
  }, [apps, selectedApp, runLocalApp]);

  // Handle Internal Navigation inside Iframe (event delegation callback)
  const handleNavigateInternal = useCallback(
    (relativePath: string) => {
      if (!selectedApp) return;

      try {
        const result = buildAppExecution(selectedApp, relativePath);
        setFinalHtml(result.finalHtml);
        setActivePath(result.entryPath);
      } catch (err) {
        console.warn(`Internal navigation failed for ${relativePath}:`, err);
      }
    },
    [selectedApp]
  );

  // Reload current app
  const handleReload = () => {
    if (selectedApp) {
      runLocalApp(selectedApp, activePath);
    }
  };

  // Delete App from IndexedDB
  const handleDeleteApp = async (appId: string) => {
    try {
      await dbService.deleteApp(appId);
      if (selectedApp?.id === appId) {
        revokeAllActiveBlobs();
        setSelectedApp(null);
        setFinalHtml('');
        setActivePath('index.html');
      }
      await refreshApps();
    } catch (err) {
      alert(`تعذر حذف التطبيق: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Trigger hidden directory input
  const handleTriggerFolderPicker = () => {
    folderInputRef.current?.click();
  };

  // Folder selected callback
  const handleFolderSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      // Determine folder name from the first file's webkitRelativePath
      const firstPath = files[0].webkitRelativePath || files[0].name;
      const folderName = firstPath.includes('/') ? firstPath.split('/')[0] : 'تطبيق محلي';

      const storedFiles = await readFilesFromInput(files);
      if (storedFiles.length === 0) {
        alert('لم يتم العثور على ملفات صالحة في هذا المجلد.');
        return;
      }

      setPendingFiles(storedFiles);
      setSuggestedAppName(folderName);
      setIsNewAppModalOpen(true);
    } catch (err) {
      alert(`فشل قراءة ملفات المجلد: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      e.target.value = '';
    }
  };

  // Zip selected callback
  const handleZipSelected = async (file: File) => {
    try {
      const storedFiles = await readFilesFromZip(file);
      if (storedFiles.length === 0) {
        alert('الأرشيف المضغوط فارغ أو لا يحتوي على ملفات صالحة.');
        return;
      }

      const zipBaseName = file.name.replace(/\.[^/.]+$/, '');
      setPendingFiles(storedFiles);
      setSuggestedAppName(zipBaseName);
      setIsNewAppModalOpen(true);
    } catch (err) {
      alert(`فشل فك الأرشيف المضغوط: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Drag and drop handler
  const handleDropFiles = async (fileList: FileList) => {
    if (fileList.length === 0) return;

    // If single zip file
    if (fileList.length === 1 && fileList[0].name.endsWith('.zip')) {
      await handleZipSelected(fileList[0]);
      return;
    }

    try {
      const storedFiles = await readFilesFromInput(fileList);
      if (storedFiles.length > 0) {
        setPendingFiles(storedFiles);
        setSuggestedAppName('مشروع مستورد');
        setIsNewAppModalOpen(true);
      }
    } catch (err) {
      alert(`خطأ أثناء معالجة الملفات المسحوبة: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Modal confirm: Save to IndexedDB and run immediately
  const handleConfirmNewApp = async (data: {
    name: string;
    description: string;
    icon?: string;
    entryPoint: string;
  }) => {
    try {
      const newApp = createLocalAppObject(pendingFiles, {
        name: data.name,
        description: data.description,
        iconDataUrl: data.icon,
        entryPoint: data.entryPoint,
      });

      await dbService.saveApp(newApp);
      await refreshApps();
      setIsNewAppModalOpen(false);
      setPendingFiles([]);

      // Immediately run the newly imported app
      runLocalApp(newApp, newApp.entryPoint);
    } catch (err) {
      alert(`فشل حفظ التطبيق في IndexedDB: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Restore all demo apps
  const handleRestoreDemos = async () => {
    for (const demo of DEMO_APPS) {
      await dbService.saveApp(demo);
    }
    await refreshApps();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0C10] text-gray-100 font-sans" dir="rtl">
      {/* Hidden Folder Input (<input type="file" webkitdirectory multiple>) */}
      <input
        type="file"
        ref={folderInputRef}
        {...({ webkitdirectory: '', directory: '', multiple: true } as any)}
        onChange={handleFolderSelected}
        className="hidden"
      />

      {/* Sidebar: App List, Add Button, IndexedDB Storage */}
      <Sidebar
        apps={apps}
        selectedAppId={selectedApp?.id || null}
        onSelectApp={(app) => runLocalApp(app)}
        onDeleteApp={handleDeleteApp}
        onTriggerFolderPicker={handleTriggerFolderPicker}
        onTriggerZipPicker={handleZipSelected}
        onRestoreDemos={handleRestoreDemos}
        onOpenElectronModal={() => setIsElectronModalOpen(true)}
        isElectron={isElectron}
      />

      {/* Main Area: App Runner or Welcome Screen */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {selectedApp ? (
          <AppRunner
            app={selectedApp}
            finalHtml={finalHtml}
            activePath={activePath}
            onReload={handleReload}
            onNavigateInternal={handleNavigateInternal}
            onDeleteApp={handleDeleteApp}
          />
        ) : (
          <WelcomeScreen
            onTriggerFolderPicker={handleTriggerFolderPicker}
            demoApps={apps.filter((a) => a.id.startsWith('demo-'))}
            onSelectApp={(app) => runLocalApp(app)}
            onDropFiles={handleDropFiles}
          />
        )}
      </div>

      {/* Modal: New App Import & Details */}
      <NewAppModal
        isOpen={isNewAppModalOpen}
        onClose={() => {
          setIsNewAppModalOpen(false);
          setPendingFiles([]);
        }}
        files={pendingFiles}
        suggestedName={suggestedAppName}
        onConfirm={handleConfirmNewApp}
      />

      {/* Modal: Electron Native Package & Scripts */}
      <ElectronExportModal
        isOpen={isElectronModalOpen}
        onClose={() => setIsElectronModalOpen(false)}
      />
    </div>
  );
}
