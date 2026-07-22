import React from 'react';
import { Type, Image, Video, FileText, Mic, Music, Film, Smile, Layers, Link, Hash } from 'lucide-react';

export const SupportedMediaBar: React.FC = () => {
  const mediaItems = [
    { label: 'متن', icon: Type, color: 'text-yellow-400' },
    { label: 'عکس', icon: Image, color: 'text-blue-400' },
    { label: 'ویدئو', icon: Video, color: 'text-purple-400' },
    { label: 'فایل', icon: FileText, color: 'text-emerald-400' },
    { label: 'Voice', icon: Mic, color: 'text-pink-400' },
    { label: 'Audio', icon: Music, color: 'text-indigo-400' },
    { label: 'GIF', icon: Film, color: 'text-amber-400' },
    { label: 'Media Group (آلبوم)', icon: Layers, color: 'text-cyan-400' },
    { label: 'Caption و لینک‌ها', icon: Link, color: 'text-sky-400' },
    { label: 'ایموجی‌ها و فرمت', icon: Smile, color: 'text-rose-400' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-8">
      <div className="neu-flat p-4 border border-white/5">
        <div className="text-xs text-slate-400 font-bold mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-white">
            <Hash className="w-4 h-4 text-yellow-400" />
            پشتیبانی کامل از انواع محتوا و فرمت‌های تلگرام:
          </span>
          <span className="text-slate-500 font-normal">حفظ کامل کیفیت و کپشن</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {mediaItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="neu-inset px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap text-slate-300 font-medium hover:text-white transition-colors"
              >
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
