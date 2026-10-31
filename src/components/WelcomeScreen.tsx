/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LocalApp } from '../types/app';
import {
  FolderUp,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  Monitor,
  ExternalLink,
  Play,
  FileArchive
} from 'lucide-react';

interface WelcomeScreenProps {
  onTriggerFolderPicker: () => void;
  demoApps: LocalApp[];
  onSelectApp: (app: LocalApp) => void;
  onDropFiles: (files: FileList) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onTriggerFolderPicker,
  demoApps,
  onSelectApp,
  onDropFiles,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 h-screen overflow-y-auto bg-gradient-to-b from-[#0B0C10] via-[#0E1117] to-[#14171E] flex flex-col items-center justify-start p-8 relative selection:bg-amber-500/20"
    >
      {/* Background Decorative Gold Ambient Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-amber-500/10 via-yellow-600/5 to-transparent blur-3xl pointer-events-none rounded-full"></div>

      {/* Hero Container */}
      <div className="max-w-4xl w-full z-10 flex flex-col items-center text-center mt-6">
        {/* Emblem */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FFD700] via-[#D4AF37] to-[#8C7318] p-1 shadow-2xl shadow-amber-500/30 mb-6 gold-glow transform hover:scale-105 transition-transform duration-300">
          <div className="w-full h-full bg-[#0B0C10] rounded-[14px] flex items-center justify-center">
            <Layers className="w-10 h-10 text-[#FFD700]" />
          </div>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FFF3B0] to-[#D4AF37] tracking-tight mb-3">
          حاوية التطبيقات المحلية الاحترافية
        </h1>
        <p className="text-sm md:text-base text-gray-400 max-w-2xl leading-relaxed mb-8">
          منصة تشغيل تطبيقات الويب والمشاريع المبنية (dist) بالكامل داخل المتصفح وبدون أي خوادم Node.js أو منافذ شبكية، مع حفظ دائم في IndexedDB ومحرك ذكي يعتمد على Blob URLs و srcdoc.
        </p>

        {/* Drag & Drop Action Box */}
        <div
          onClick={onTriggerFolderPicker}
          className={`w-full max-w-xl p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 group mb-10 ${
            isDragOver
              ? 'border-[#FFD700] bg-amber-500/15 scale-102 shadow-2xl shadow-amber-500/25'
              : 'border-amber-500/30 hover:border-amber-400 bg-[#14171E]/60 hover:bg-[#1A1E27]/80'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#0B0C10] border border-amber-500/40 flex items-center justify-center text-[#FFD700] group-hover:scale-110 transition-transform">
              <FolderUp className="w-7 h-7" />
            </div>
            <div>
              <div className="text-base font-bold text-white group-hover:text-[#FFD700] transition-colors">
                اسحب وأفلت مجلد مخرجات المشروع (dist) هنا
              </div>
              <div className="text-xs text-gray-400 mt-1">
                أو انقر هنا لاستعراض المجلد أو ملف .zip من جهازك
              </div>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-[#0B0C10] font-bold text-xs shadow-lg shadow-amber-500/20 group-hover:brightness-110">
              <Sparkles className="w-4 h-4" />
              <span>استيراد وتثبيت تطبيق جديد</span>
            </div>
          </div>
        </div>

        {/* Instant Demo Apps Section */}
        <div className="w-full text-right mb-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFD700]" />
              <h2 className="text-sm font-bold text-white">نماذج تجريبية جاهزة للتشغيل الفوري</h2>
            </div>
            <span className="text-xs text-amber-400/80">اختر تطبيقاً لتجربة المحرك فورياً</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoApps.map((demo) => (
              <div
                key={demo.id}
                onClick={() => onSelectApp(demo)}
                className="group relative bg-[#14171E] hover:bg-[#1A1E27] border border-amber-500/20 hover:border-amber-400 rounded-2xl p-5 cursor-pointer transition-all duration-200 text-right flex flex-col justify-between shadow-lg hover:shadow-amber-500/10"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0B0C10] border border-amber-500/30 p-2 flex items-center justify-center">
                      {demo.icon ? (
                        <img src={demo.icon} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <span>💎</span>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {demo.category || 'تطبيق مدمج'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-[#FFD700] transition-colors mb-1.5">
                    {demo.name}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {demo.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs font-semibold text-[#FFD700]">
                  <span className="flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-[#FFD700]" />
                    <span>تشغيل التطبيق</span>
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {demo.files.length} ملفات
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Architecture Highlights */}
        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-3 text-right">
          <div className="bg-[#14171E]/60 border border-gray-800/80 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-[#FFD700] font-bold text-xs mb-1">
              <Zap className="w-4 h-4" />
              <span>محرك Blob & srcdoc</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-normal">
              إعادة كتابة الروابط وربط الأصول محلياً دون أي خادم خلفي.
            </p>
          </div>

          <div className="bg-[#14171E]/60 border border-gray-800/80 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>تخزين IndexedDB</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-normal">
              حفظ دائم للتطبيقات والملفات الثنائية والخطوط والصور.
            </p>
          </div>

          <div className="bg-[#14171E]/60 border border-gray-800/80 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-1">
              <ExternalLink className="w-4 h-4" />
              <span>نوافذ مستقلة</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-normal">
              فتح في نافذة منفصلة مع تثبيت في الأعلى (Pin on Top).
            </p>
          </div>

          <div className="bg-[#14171E]/60 border border-gray-800/80 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-1">
              <Monitor className="w-4 h-4" />
              <span>جاهز لـ Electron</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-normal">
              أيقونات سطح المكتب ودعم كامل لـ IPC ووضع ملء الشاشة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
