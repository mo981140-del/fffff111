/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StoredFile {
  path: string;
  content: string | ArrayBuffer;
  isBinary: boolean;
  mimeType: string;
  size: number;
}

export interface LocalApp {
  id: string;
  name: string;
  description?: string;
  icon?: string; // Base64 data URL, image URL, or SVG
  createdAt: number;
  updatedAt: number;
  entryPoint: string; // Defaults to "index.html"
  files: StoredFile[];
  size?: number;
  category?: string;
}

export interface EngineResult {
  finalHtml: string;
  blobUrls: Map<string, string>;
  filesMap: Map<string, string | ArrayBuffer>;
  entryPath: string;
}

export interface AppConsoleLog {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
}

export interface ElectronAPI {
  isElectron: boolean;
  openSeparateWindow: (data: { id: string; name: string; html: string; icon?: string }) => Promise<void>;
  setAlwaysOnTop: (flag: boolean) => Promise<boolean>;
  getAlwaysOnTop?: () => Promise<boolean>;
  createDesktopShortcut: (data: { name: string; iconData?: string; url?: string }) => Promise<{ success: boolean; message: string }>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}
