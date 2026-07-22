import React, { useState } from 'react';
import { Send, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { CreateConnectionDTO } from '../types';

interface CreateConnectionFormProps {
  onSubmit: (dto: CreateConnectionDTO) => Promise<void>;
  isLoading: boolean;
}

export const CreateConnectionForm: React.FC<CreateConnectionFormProps> = ({ onSubmit, isLoading }) => {
  const [sourceChannel, setSourceChannel] = useState('');
  const [targetChannel, setTargetChannel] = useState('');
  const [botToken, setBotToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sourceChannel.trim()) {
      setError('لطفاً فیلد کانال مبدأ را وارد کنید.');
      return;
    }
    if (!targetChannel.trim()) {
      setError('لطفاً فیلد کانال مقصد را وارد کنید.');
      return;
    }
    if (!botToken.trim()) {
      setError('لطفاً توکن ربات را وارد کنید.');
      return;
    }

    try {
      await onSubmit({
        sourceChannel: sourceChannel.trim(),
        targetChannel: targetChannel.trim(),
        botToken: botToken.trim(),
      });
      // Clear fields upon success
      setSourceChannel('');
      setTargetChannel('');
      setBotToken('');
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت و برقراری اتصال');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-8">
      <div className="neu-flat p-6 md:p-8 border border-white/5 relative overflow-hidden">
        
        {/* Subtle Neumorphic Background Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Error Banner if any */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 3 Required Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Field 1: Source Channel */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-white pr-1">
                کانال مبدأ
              </label>
              <div className="neu-inset p-1 flex items-center">
                <input
                  type="text"
                  value={sourceChannel}
                  onChange={(e) => setSourceChannel(e.target.value)}
                  placeholder="مثال: channel_source@"
                  className="w-full bg-transparent px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none text-sm dir-ltr text-right"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Field 2: Target Channel */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-white pr-1">
                کانال مقصد
              </label>
              <div className="neu-inset p-1 flex items-center">
                <input
                  type="text"
                  value={targetChannel}
                  onChange={(e) => setTargetChannel(e.target.value)}
                  placeholder="مثال: channel_target@"
                  className="w-full bg-transparent px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none text-sm dir-ltr text-right"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Field 3: Bot Token */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-white pr-1">
                توکن ربات
              </label>
              <div className="neu-inset p-1 flex items-center">
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456789:ABCdefGHIjklMNO..."
                  className="w-full bg-transparent px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none text-sm dir-ltr text-left font-mono"
                  disabled={isLoading}
                />
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="neu-btn-primary w-full md:w-auto px-10 py-3.5 text-base flex items-center justify-center gap-3 font-black cursor-pointer hover:shadow-yellow-400/20 active:scale-95 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                  <span>در حال ایجاد اتصال...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 text-black" />
                  <span>شروع اتصال</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
