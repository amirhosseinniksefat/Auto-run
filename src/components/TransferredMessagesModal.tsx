import React, { useEffect, useState } from 'react';
import { X, RefreshCw, MessageSquare, CheckCircle2, Image as ImageIcon, Video, FileText, Mic, Music, Film, Layers } from 'lucide-react';
import { TelegramConnection, ForwardedMessageRecord } from '../types';
import { fetchConnectionMessages } from '../services/api';

interface TransferredMessagesModalProps {
  connection: TelegramConnection | null;
  onClose: () => void;
}

export const TransferredMessagesModal: React.FC<TransferredMessagesModalProps> = ({ connection, onClose }) => {
  const [messages, setMessages] = useState<ForwardedMessageRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadMessages = async () => {
    if (!connection) return;
    setLoading(true);
    try {
      const data = await fetchConnectionMessages(connection.id);
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connection) {
      loadMessages();
    }
  }, [connection]);

  if (!connection) return null;

  const getTypeBadge = (type: ForwardedMessageRecord['type']) => {
    switch (type) {
      case 'photo':
        return { label: 'عکس', icon: ImageIcon, color: 'text-blue-400 bg-blue-500/10' };
      case 'video':
        return { label: 'ویدئو', icon: Video, color: 'text-purple-400 bg-purple-500/10' };
      case 'document':
        return { label: 'فایل', icon: FileText, color: 'text-emerald-400 bg-emerald-500/10' };
      case 'voice':
        return { label: 'Voice', icon: Mic, color: 'text-pink-400 bg-pink-500/10' };
      case 'audio':
        return { label: 'Audio', icon: Music, color: 'text-indigo-400 bg-indigo-500/10' };
      case 'animation':
        return { label: 'GIF', icon: Film, color: 'text-amber-400 bg-amber-500/10' };
      case 'media_group':
        return { label: 'آلبوم', icon: Layers, color: 'text-cyan-400 bg-cyan-500/10' };
      default:
        return { label: 'متن', icon: MessageSquare, color: 'text-yellow-400 bg-yellow-500/10' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="neu-flat w-full max-w-3xl max-h-[85vh] flex flex-col border border-white/10 overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 neu-inset rounded-xl text-blue-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تاریخچه پیام‌های منتقل‌شده</h3>
              <p className="text-xs text-slate-400 mt-0.5 dir-ltr text-right">
                {connection.sourceChannel} ➔ {connection.targetChannel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadMessages}
              disabled={loading}
              className="neu-btn-secondary p-2 text-slate-300 hover:text-white"
              title="به‌روزرسانی لیست"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="neu-btn-secondary p-2 text-slate-300 hover:text-red-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Messages List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              هنوز پیامی توسط ربات برای این اتصال منتقل نشده است.
            </div>
          ) : (
            messages.map((msg) => {
              const badge = getTypeBadge(msg.type);
              const BadgeIcon = badge.icon;
              const dateStr = new Date(msg.transferredAt).toLocaleTimeString('fa-IR') + ' - ' + new Date(msg.transferredAt).toLocaleDateString('fa-IR');

              return (
                <div
                  key={msg.id}
                  className="neu-inset p-4 flex flex-col md:flex-row gap-4 justify-between items-start border border-white/5"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 ${badge.color}`}>
                        <BadgeIcon className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                        پست مبدأ #{msg.sourceMsgId}
                      </span>
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 mr-auto">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        منتقل شد
                      </span>
                    </div>

                    <div className="text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                      {msg.caption || 'بدون متن / کپشن'}
                    </div>

                    {msg.mediaUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-white/10 max-w-xs neu-inset">
                        <img
                          src={msg.mediaUrl}
                          alt="محتوای رسانه"
                          className="w-full h-auto max-h-48 object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 whitespace-nowrap self-end md:self-start">
                    {dateStr}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center text-xs text-slate-400">
          <span>تعداد پیام‌های ثبت شده: {messages.length.toLocaleString('fa-IR')}</span>
          <button
            onClick={onClose}
            className="neu-btn-primary px-5 py-2 text-xs font-bold text-black"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
