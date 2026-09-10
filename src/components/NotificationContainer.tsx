import React, { useEffect } from 'react';
import { AppNotification } from '../types/maritime';
import { ShieldAlert, Eye, X } from 'lucide-react';

export interface NotificationContainerProps {
  notifications: AppNotification[];
  onSelectNotification: (notification: AppNotification) => void;
  onDismissNotification: (notificationId: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onSelectNotification,
  onDismissNotification,
}) => {
  // Individual auto-dismiss per notification (6.5 seconds lifetime)
  useEffect(() => {
    if (notifications.length === 0) return;

    const now = Date.now();
    const timers = notifications.map((n) => {
      const elapsed = now - n.createdAt;
      const remaining = Math.max(800, 6500 - elapsed);
      return setTimeout(() => {
        onDismissNotification(n.id);
      }, remaining);
    });

    return () => timers.forEach((t) => clearTimeout(t));
  }, [notifications, onDismissNotification]);

  if (notifications.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Surveillance Notifications"
      className="absolute top-3.5 right-3.5 z-45 w-84 max-w-[calc(100vw-72px)] pointer-events-auto flex flex-col gap-2 select-none"
    >
      {notifications.map((item) => {
        const isEntry = item.type === 'RESTRICTED_ENTRY';
        const isCritical = item.severity === 'CRITICAL' || item.type === 'DARK_VESSEL';

        return (
          <div
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectNotification(item);
            }}
            className={`w-full bg-white border border-slate-200 border-l-4 ${
              isCritical
                ? 'border-l-rose-500'
                : isEntry
                ? 'border-l-orange-500'
                : 'border-l-sky-500'
            } rounded-lg shadow-xl p-3 text-slate-800 font-sans cursor-pointer transition-all hover:shadow-2xl hover:border-slate-300 animate-in fade-in slide-in-from-right-2 duration-150`}
          >
            {/* Header: Status, Pulse, [ VIEW ], and Dismiss */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isCritical
                      ? 'bg-rose-500 animate-ping'
                      : isEntry
                      ? 'bg-orange-500 animate-ping'
                      : 'bg-sky-500'
                  }`}
                />
                <ShieldAlert
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isCritical ? 'text-rose-600' : isEntry ? 'text-orange-600' : 'text-sky-600'
                  }`}
                />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 truncate leading-none">
                  {item.title}
                </span>
              </div>

              {/* Action Buttons: Crisp White-Theme VIEW button + Dismiss X */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNotification(item);
                  }}
                  className="px-2.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-[9.5px] font-bold tracking-wider transition-colors uppercase flex items-center gap-1 shadow-xs"
                  title="View alert and target details"
                >
                  <Eye className="w-2.5 h-2.5 text-slate-300" />
                  <span>VIEW</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismissNotification(item.id);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                  title="Dismiss temporary notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Target Identity */}
            <div className="text-[12.5px] font-bold text-slate-900 leading-tight truncate mb-2">
              {item.targetName} <span className="font-mono text-slate-500 text-[11px] font-semibold">({item.targetId})</span>
            </div>

            {/* Footer: Zone and Timestamp */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9.5px] text-slate-500">
              {item.zoneName ? (
                <div className="truncate pr-1">
                  <span>Zone: </span>
                  <strong className="text-slate-800 font-semibold">{item.zoneName}</strong>
                </div>
              ) : (
                <span>Optical Fix</span>
              )}
              <span className="font-mono text-slate-400 shrink-0">{item.timestamp}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
