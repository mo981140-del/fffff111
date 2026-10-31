/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { LocalApp, StoredFile } from '../types/app';
import { getMimeType, isTextFile } from './mime';
import { normalizePath } from './renderEngine';

export interface ImportOptions {
  name: string;
  description?: string;
  iconDataUrl?: string;
  entryPoint?: string;
}

/**
 * Strips the top-level common folder (e.g., "dist/" or "build/")
 * so files resolve naturally from the root.
 */
export function stripCommonRoot(files: StoredFile[]): StoredFile[] {
  if (files.length <= 1) return files;

  // Check if all files share a common first segment
  const firstPath = normalizePath(files[0].path);
  const slashIndex = firstPath.indexOf('/');
  if (slashIndex === -1) {
    return files; // Already root files
  }

  const potentialPrefix = firstPath.substring(0, slashIndex + 1);
  const allSharePrefix = files.every((f) => normalizePath(f.path).startsWith(potentialPrefix));

  if (allSharePrefix) {
    return files.map((f) => {
      const p = normalizePath(f.path);
      return {
        ...f,
        path: p.substring(potentialPrefix.length),
      };
    });
  }

  return files;
}

/**
 * Reads a FileList or array of File objects selected from directory input.
 */
export async function readFilesFromInput(fileList: FileList | File[]): Promise<StoredFile[]> {
  const files: StoredFile[] = [];
  const list = Array.from(fileList);

  for (const file of list) {
    // webkitRelativePath gives relative folder path like "dist/assets/index.js"
    const rawPath = file.webkitRelativePath || file.name;
    const cleanPath = normalizePath(rawPath);
    const mime = getMimeType(cleanPath);
    const binary = !isTextFile(cleanPath);

    if (binary) {
      const buffer = await file.arrayBuffer();
      files.push({
        path: cleanPath,
        content: buffer,
        isBinary: true,
        mimeType: mime,
        size: file.size,
      });
    } else {
      const text = await file.text();
      files.push({
        path: cleanPath,
        content: text,
        isBinary: false,
        mimeType: mime,
        size: file.size,
      });
    }
  }

  return stripCommonRoot(files);
}

/**
 * Reads files from a ZIP archive (e.g. dist.zip)
 */
export async function readFilesFromZip(zipFile: File): Promise<StoredFile[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipFile);
  const files: StoredFile[] = [];

  for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
    if (zipEntry.dir) continue;

    const cleanPath = normalizePath(relativePath);
    const mime = getMimeType(cleanPath);
    const binary = !isTextFile(cleanPath);

    if (binary) {
      const buffer = await zipEntry.async('arraybuffer');
      files.push({
        path: cleanPath,
        content: buffer,
        isBinary: true,
        mimeType: mime,
        size: buffer.byteLength,
      });
    } else {
      const text = await zipEntry.async('text');
      files.push({
        path: cleanPath,
        content: text,
        isBinary: false,
        mimeType: mime,
        size: text.length,
      });
    }
  }

  return stripCommonRoot(files);
}

/**
 * Constructs a complete LocalApp object ready to be persisted into IndexedDB
 */
export function createLocalAppObject(
  files: StoredFile[],
  options: ImportOptions
): LocalApp {
  // Determine entry point
  let entryPoint = options.entryPoint;
  if (!entryPoint) {
    const hasIndex = files.some((f) => normalizePath(f.path) === 'index.html');
    if (hasIndex) {
      entryPoint = 'index.html';
    } else {
      const firstHtml = files.find((f) => f.path.endsWith('.html') || f.path.endsWith('.htm'));
      entryPoint = firstHtml ? firstHtml.path : 'index.html';
    }
  }

  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const now = Date.now();

  return {
    id: String(now) + '-' + Math.random().toString(36).substring(2, 7),
    name: options.name.trim() || 'تطبيق جديد',
    description: options.description?.trim() || `مشروع محلي يحتوي على ${files.length} ملف`,
    icon: options.iconDataUrl,
    createdAt: now,
    updatedAt: now,
    entryPoint: entryPoint,
    files: files,
    size: totalSize,
  };
}

/**
 * Helper to convert an image file to Base64 data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
