/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoredFile } from '../types/app';
import { fileToDataUrl } from '../services/appImporter';
import { X, Upload, Sparkles, FileCode, CheckCircle, Image as ImageIcon } from 'lucide-react';

interface NewAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: StoredFile[];
  suggestedName?: string;
  onConfirm: (data: { name: string; description: string; icon?: string; entryPoint: string }) => void;
}

const PRESET_ICONS = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFD700"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFD700"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2zm0-10h2v8h-2z"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFD700"><path d="M4 6h16v12H4z"/><path d="M9 11l3 3 5-5" stroke="%230B0C10" stroke-width="2" fill="none"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFD700"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFD700"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.93V18h-2v-1.07c-1.7-.35-3-1.63-3-3.43h2c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2c-2.2 0-4-1.8-4-4 0-1.8 1.3-3.08 3-3.43V3h2v1.07c1.7.35 3 1.63 3 3.43h-2c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2c2.2 0 4 1.8 4 4 0 1.8-1.3 3.08-3 3.43z"/></svg>',
];

export const NewAppModal: React.FC<NewAppModalProps> = ({
  isOpen,
  onClose,
  files,
  suggestedName = '',
  onConfirm,
}) => {
  const [name, setName] = useState(suggestedName || 'تطبيقي المحلي');
  const [description, setDescription] = useState('');
  const [customIcon, setCustomIcon] = useState<string | undefined>(PRESET_ICONS[0]);
  const [entryPoint, setEntryPoint] = useState('index.html');
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);

  if (!isOpen) return null;

  // Filter HTML files for entry points
  const htmlFiles = files.filter((f) => f.path.endsWith('.html') || f.path.endsWith('.htm'));
  const currentEntry = htmlFiles.some((f) => f.path === entryPoint)
    ? entryPoint
    : htmlFiles.length > 0
    ? htmlFiles[0].path
    : 'index.html';

  const totalSizeFormatted = (files.reduce((a, b) => a + b.size, 0) / (1024 * 1024)).toFixed(2);

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingIcon(true);
      const dataUrl = await fileToDataUrl(file);
      setCustomIcon(dataUrl);
    } catch (err) {
      alert('تعذر تحميل صورة الأيقونة');
    } finally {
      setIsUploadingIcon(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onConfirm({
      name: name.trim(),
      description: description.trim(),
      icon: customIcon,
      entryPoint: currentEntry,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#14171E] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden gold-glow animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-[#0B0C10]/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[#FFD700]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#FFD700]">تثبيت تطبيق جديد في الحاوية</h2>
              <p className="text-xs text-gray-400">سيتم حفظ الملفات بشكل دائم في IndexedDB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* App Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              اسم التطبيق <span className="text-[#FFD700]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: لوحة التحكم الإدارية"
              className="w-full px-3.5 py-2.5 bg-[#0B0C10] border border-gray-700 focus:border-[#FFD700] rounded-xl text-white text-sm outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              وصف مختصر (اختياري)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: تطبيق تم بناؤه بواسطة Vite & React"
              className="w-full px-3.5 py-2.5 bg-[#0B0C10] border border-gray-700 focus:border-[#FFD700] rounded-xl text-white text-sm outline-none transition-colors"
            />
          </div>

          {/* Custom App Icon */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              أيقونة التطبيق (مخصصة أو من النماذج)
            </label>
            <div className="flex items-center gap-4">
              {/* Preview Box */}
              <div className="w-14 h-14 rounded-xl bg-[#0B0C10] border-2 border-amber-500/50 flex items-center justify-center p-2 overflow-hidden shadow-inner flex-shrink-0">
                {customIcon ? (
                  <img src={customIcon} alt="Icon" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-amber-500/50" />
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1A1E27] hover:bg-[#252B38] border border-amber-500/30 hover:border-amber-400 rounded-xl text-xs font-medium text-amber-200 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-[#FFD700]" />
                  <span>رفع صورة مخصصة (PNG/JPG)</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml, image/webp"
                    onChange={handleIconUpload}
                    className="hidden"
                  />
                </label>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-gray-400">أو اختر:</span>
                  <div className="flex gap-1.5">
                    {PRESET_ICONS.map((iconStr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCustomIcon(iconStr)}
                        className={`w-7 h-7 rounded-lg bg-[#0B0C10] border flex items-center justify-center p-1 transition-all ${
                          customIcon === iconStr
                            ? 'border-[#FFD700] bg-amber-500/20 scale-105'
                            : 'border-gray-700 hover:border-amber-500/50'
                        }`}
                      >
                        <img src={iconStr} alt="" className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Files Summary & Entry Point */}
          <div className="bg-[#0B0C10] border border-gray-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>إجمالي الملفات المقروءة:</span>
              </span>
              <span className="font-mono text-white font-semibold">
                {files.length} ملف ({totalSizeFormatted} MB)
              </span>
            </div>

            {htmlFiles.length > 1 && (
              <div className="pt-2 border-t border-gray-800/80">
                <label className="block text-[11px] text-gray-400 mb-1">
                  ملف نقطة البداية (Entry Point):
                </label>
                <select
                  value={currentEntry}
                  onChange={(e) => setEntryPoint(e.target.value)}
                  className="w-full bg-[#14171E] border border-gray-700 text-xs text-white rounded-lg px-2.5 py-1.5 outline-none"
                >
                  {htmlFiles.map((hf) => (
                    <option key={hf.path} value={hf.path}>
                      {hf.path}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-gray-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#0B0C10] bg-gradient-to-r from-[#FFD700] via-[#F5C242] to-[#D4AF37] hover:brightness-110 rounded-xl shadow-lg shadow-amber-500/25 transition-all transform active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>تثبيت وتشغيل التطبيق الآن</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
