import React, { useEffect, useState } from 'react';
import { RestrictedAreaEvent } from '../types/maritime';
import { ShieldAlert, ArrowRight, X } from 'lucide-react';

interface RestrictedAreaNotificationProps {
  latestEvent: RestrictedAreaEvent | null;
  onDismiss: () => void;
  onSelectVessel?: (vesselId: string) => void;
}

export const RestrictedAreaNotification: React.FC<RestrictedAreaNotificationProps> = ({
  latestEvent,
  onDismiss,
  onSelectVessel,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (latestEvent) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [latestEvent, onDismiss]);

  if (!visible || !latestEvent) return null;

  const isEntry = latestEvent.type === 'ENTRY';

  return (
    <div
      onClick={() => onSelectVessel && onSelectVessel(latestEvent.vesselId)}
      className={`absolute top-4 right-4 z-40 w-80 bg-white/95 backdrop-blur-md border rounded-lg shadow-2xl p-2.5 text-slate-800 font-sans select-none cursor-pointer transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
        isEntry ? 'border-orange-400' : 'border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isEntry ? 'bg-orange-500 animate-ping' : 'bg-slate-400'
            }`}
          />
          <ShieldAlert
            className={`w-4 h-4 ${isEntry ? 'text-orange-600' : 'text-slate-500'}`}
          />
          <div>
            <span
              className={`text-[9.5px] font-mono font-bold uppercase tracking-wider block leading-tight ${
                isEntry ? 'text-orange-700' : 'text-slate-500'
              }`}
            >
              {isEntry ? 'RESTRICTED AREA ENTRY' : 'RESTRICTED AREA EXIT'}
            </span>
            <span className="text-[12px] font-bold text-slate-900 leading-tight">
              {latestEvent.vesselName} ({latestEvent.vesselId})
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setVisible(false);
            onDismiss();
          }}
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Dismiss notification"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-600">
        <div className="flex items-center gap-1">
          <span className="text-slate-500">Zone:</span>
          <span className="font-semibold text-orange-800">{latestEvent.areaName}</span>
        </div>
        <div className="font-mono text-slate-500">{latestEvent.timestamp}</div>
      </div>
    </div>
  );
};
