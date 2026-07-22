import React, { useEffect, useState } from 'react';
import { X, RefreshCw, FileText, CheckCircle2, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { TelegramConnection, ConnectionLog } from '../types';
import { fetchConnectionLogs } from '../services/api';

interface ConnectionLogsModalProps {
  connection: TelegramConnection | null;
  onClose: () => void;
}

export const ConnectionLogsModal: React.FC<ConnectionLogsModalProps> = ({ connection, onClose }) => {
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadLogs = async () => {
    if (!connection) return;
    setLoading(true);
    try {
      const data = await fetchConnectionLogs(connection.id);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connection) {
      loadLogs();
      const interval = setInterval(loadLogs, 4000);
      return () => clearInterval(interval);
    }
  }, [connection]);

  if (!connection) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="neu-flat w-full max-w-3xl max-h-[85vh] flex flex-col border border-white/10 overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 neu-inset rounded-xl text-yellow-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">لاگ‌های مانیتورینگ سیستم</h3>
              <p className="text-xs text-slate-400 mt-0.5 dir-ltr text-right">
                {connection.sourceChannel} ➔ {connection.targetChannel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="neu-btn-secondary p-2 text-slate-300 hover:text-white"
              title="به‌روزرسانی لاگ‌ها"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-yellow-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="neu-btn-secondary p-2 text-slate-300 hover:text-red-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Log Stream */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-sans">
              هیچ لاگی برای این اتصال هنوز ثبت نشده است.
            </div>
          ) : (
            logs.map((log) => {
              let Icon = Info;
              let iconColor = 'text-blue-400';
              let bgColor = 'bg-blue-500/5 border-blue-500/10';

              if (log.level === 'success') {
                Icon = CheckCircle2;
                iconColor = 'text-emerald-400';
                bgColor = 'bg-emerald-500/5 border-emerald-500/10';
              } else if (log.level === 'warning') {
                Icon = AlertTriangle;
                iconColor = 'text-amber-400';
                bgColor = 'bg-amber-500/5 border-amber-500/10';
              } else if (log.level === 'error') {
                Icon = AlertOctagon;
                iconColor = 'text-red-400';
                bgColor = 'bg-red-500/5 border-red-500/10';
              }

              const timeStr = new Date(log.timestamp).toLocaleTimeString('fa-IR');

              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border ${bgColor} flex items-start gap-3 transition-colors`}
                >
                  <Icon className={`w-4 h-4 ${iconColor} shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-sans font-bold text-slate-300">
                        {log.messageType ? `[نوع: ${log.messageType}]` : ''}
                        {log.sourceMsgId ? ` (پست #${log.sourceMsgId})` : ''}
                      </span>
                      <span>{timeStr}</span>
                    </div>
                    <div className="text-white font-sans leading-relaxed text-xs">
                      {log.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center text-xs text-slate-400 font-sans">
          <span>ثبت خودکار تمامی لایه‌های ارتباطی و خطاهای تلگرام</span>
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
