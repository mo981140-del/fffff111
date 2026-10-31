/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { LocalApp } from '../types/app';
import {
  Plus,
  Trash2,
  FolderUp,
  FileArchive,
  Layers,
  Sparkles,
  ExternalLink,
  Laptop,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface SidebarProps {
  apps: LocalApp[];
  selectedAppId: string | null;
  onSelectApp: (app: LocalApp) => void;
  onDeleteApp: (appId: string) => void;
  onTriggerFolderPicker: () => void;
  onTriggerZipPicker: (file: File) => void;
  onRestoreDemos: () => void;
  onOpenElectronModal: () => void;
  isElectron: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  apps,
  selectedAppId,
  onSelectApp,
  onDeleteApp,
  onTriggerFolderPicker,
  onTriggerZipPicker,
  onRestoreDemos,
  onOpenElectronModal,
  isElectron,
}) => {
  const [showImportMenu, setShowImportMenu] = useState(false);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onTriggerZipPicker(file);
      e.target.value = '';
      setShowImportMenu(false);
    }
  };

  return (
    <aside className="w-[280px] h-screen bg-[#0E1117] border-l border-amber-500/20 flex flex-col flex-shrink-0 select-none z-20">
      {/* Brand & Logo Header */}
      <div className="p-4 border-b border-amber-500/15 bg-gradient-to-b from-[#14171E] to-[#0E1117]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700] via-[#D4AF37] to-[#8C7318] p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0B0C10] rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#FFD700]" />
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-[#FFD700] tracking-wide flex items-center gap-1.5">
              <span>حاوية التطبيقات</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">PRO</span>
            </h1>
            <p className="text-[11px] text-gray-400">تشغيل بدون سيرفرات (Client-Only)</p>
          </div>
        </div>

        {/* Primary Action Button: "➕ إضافة تطبيق جديد" */}
        <div className="mt-4 relative">
          <button
            onClick={() => setShowImportMenu(!showImportMenu)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#F3C43B] to-[#D4AF37] text-[#0B0C10] font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>➕ إضافة تطبيق جديد</span>
          </button>

          {/* Import Dropdown Menu */}
          {showImportMenu && (
            <div className="absolute top-full right-0 left-0 mt-2 bg-[#14171E] border border-amber-500/40 rounded-xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  setShowImportMenu(false);
                  onTriggerFolderPicker();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:text-[#FFD700] hover:bg-amber-500/10 rounded-lg transition-colors text-right"
              >
                <FolderUp className="w-4 h-4 text-[#FFD700]" />
                <div>
                  <div className="font-semibold">اختيار مجلد مخرجات (dist)</div>
                  <div className="text-[10px] text-gray-400">استيراد مجلد كامل مباشرة</div>
                </div>
              </button>

              <button
                onClick={() => {
                  zipInputRef.current?.click();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:text-[#FFD700] hover:bg-amber-500/10 rounded-lg transition-colors text-right"
              >
                <FileArchive className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold">استيراد أرشيف مضغوط (.zip)</div>
                  <div className="text-[10px] text-gray-400">فك وضغط الملفات تلقائياً</div>
                </div>
              </button>

              <div className="border-t border-gray-800 my-1"></div>

              <button
                onClick={() => {
                  setShowImportMenu(false);
                  onRestoreDemos();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors text-right"
              >
                <Sparkles className="w-4 h-4 text-[#FFD700]" />
                <span>استعادة التطبيقات النموذجية (3)</span>
              </button>
            </div>
          )}

          <input
            type="file"
            ref={zipInputRef}
            accept=".zip"
            onChange={handleZipChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Apps Section Header */}
      <div className="px-4 py-2.5 flex items-center justify-between text-[11px] font-semibold text-gray-400 border-b border-gray-800/60 bg-[#0B0C10]/40">
        <span className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-amber-500/70" />
          <span>التطبيقات المثبتة ({apps.length})</span>
        </span>
        <span className="text-[10px] text-amber-400/80 font-mono">IndexedDB</span>
      </div>

      {/* Apps List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {apps.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-gray-500">
            <Layers className="w-8 h-8 text-gray-600 mb-2 stroke-[1.5]" />
            <p className="text-xs font-semibold text-gray-400">لا توجد تطبيقات محفوظة</p>
            <p className="text-[11px] text-gray-500 mt-1">
              اضغط على "إضافة تطبيق جديد" أو استعد النماذج التجريبية
            </p>
          </div>
        ) : (
          apps.map((app) => {
            const isSelected = selectedAppId === app.id;
            return (
              <div
                key={app.id}
                onClick={() => onSelectApp(app)}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/50 shadow-md shadow-amber-500/10 text-white'
                    : 'bg-[#14171E]/60 hover:bg-[#1A1E27] border border-transparent hover:border-amber-500/20 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  {/* Custom Icon or default */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center p-1.5 flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-[#FFD700]/20 border border-[#FFD700]' : 'bg-[#0B0C10] border border-gray-800'
                  }`}>
                    {app.icon ? (
                      <img src={app.icon} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-base">💎</span>
                    )}
                  </div>

                  {/* Name and Meta */}
                  <div className="truncate">
                    <h3 className={`text-xs font-bold truncate ${isSelected ? 'text-[#FFD700]' : 'text-gray-200'}`}>
                      {app.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                      <span>{app.files.length} ملف</span>
                      <span>•</span>
                      <span>{app.entryPoint}</span>
                    </div>
                  </div>
                </div>

                {/* Delete button (🗑️) */}
                <button
                  title="حذف التطبيق من IndexedDB"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`هل أنت متأكد من حذف تطبيق "${app.name}" نهائياً من الذاكرة المحلية؟`)) {
                      onDeleteApp(app.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: Electron / Standalone Status */}
      <div className="p-3 border-t border-amber-500/15 bg-[#14171E]/80">
        <button
          onClick={onOpenElectronModal}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-[#0B0C10] border border-gray-800 hover:border-amber-500/40 text-gray-300 text-xs transition-colors"
        >
          <span className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-[#FFD700]" />
            <span className="text-[11px] font-semibold">
              {isElectron ? 'بيئة إلكترون نشطة (Native)' : 'حزمة إلكترون وسطح المكتب'}
            </span>
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-amber-500/70" />
        </button>
      </div>
    </aside>
  );
};
