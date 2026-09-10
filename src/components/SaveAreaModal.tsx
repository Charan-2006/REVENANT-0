import React, { useState } from 'react';
import { ShieldAlert, Check, X, Clock } from 'lucide-react';
import { ZoneType } from '../types/maritime';

interface SaveAreaModalProps {
  isOpen: boolean;
  defaultName: string;
  onSave: (name: string, zoneType: ZoneType, expiresInMinutes?: number) => void;
  onCancel: () => void;
}

export const SaveAreaModal: React.FC<SaveAreaModalProps> = ({
  isOpen,
  defaultName,
  onSave,
  onCancel,
}) => {
  const [areaName, setAreaName] = useState(defaultName);
  const [zoneType, setZoneType] = useState<ZoneType>('RED');
  const [expiryOption, setExpiryOption] = useState<string>('NONE');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) return;

    let mins: number | undefined = undefined;
    if (expiryOption === '1m') mins = 1;
    else if (expiryOption === '5m') mins = 5;
    else if (expiryOption === '10m') mins = 10;
    else if (expiryOption === '15m') mins = 15;
    else if (expiryOption === '30m') mins = 30;
    else if (expiryOption === '60m') mins = 60;

    onSave(areaName.trim(), zoneType, mins);
  };

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-2xl p-3 text-slate-800 font-sans select-none animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-orange-600" />
          <span className="text-[11px] font-bold tracking-wider text-slate-900 uppercase">
            Save Maritime Geofence Zone
          </span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5 text-[11px]">
        {/* Zone Name */}
        <div>
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Zone Designation
          </label>
          <input
            type="text"
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 transition-colors"
            placeholder="RESTRICTED AREA 01"
            autoFocus
          />
        </div>

        {/* Zone Security Classification */}
        <div>
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Zone Classification
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'RED' as ZoneType, label: 'RED', sub: 'Restricted', border: 'border-rose-400', bg: 'bg-rose-50 text-rose-800' },
              { id: 'YELLOW' as ZoneType, label: 'YELLOW', sub: 'Cautionary', border: 'border-amber-400', bg: 'bg-amber-50 text-amber-800' },
              { id: 'GREEN' as ZoneType, label: 'GREEN', sub: 'Safe Transit', border: 'border-emerald-400', bg: 'bg-emerald-50 text-emerald-800' },
            ].map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setZoneType(z.id)}
                className={`py-1 px-1.5 rounded border text-center transition-all ${
                  zoneType === z.id
                    ? `${z.border} ${z.bg} font-bold ring-1 ring-orange-300`
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="block text-[10px] font-mono leading-none">{z.label}</span>
                <span className="block text-[8px] text-slate-500 leading-tight mt-0.5">{z.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Automatic Expiry Handling */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-600" />
              <span>Temporary Zone Auto-Expiry</span>
            </label>
            <span className="text-[8px] text-orange-700 font-mono font-semibold">Auto-Cleanup</span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-[10px] font-mono">
            {[
              { id: '1m', label: '1 min' },
              { id: '5m', label: '5 min' },
              { id: '15m', label: '15 min' },
              { id: '60m', label: '1 hr' },
              { id: 'NONE', label: 'Permanent' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setExpiryOption(opt.id)}
                className={`py-1 rounded border text-center transition-all ${
                  expiryOption === opt.id
                    ? 'border-orange-500 bg-orange-50 text-orange-800 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[10.5px] font-medium transition-colors"
          >
            CANCEL
          </button>
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-[10.5px] font-bold transition-all shadow-xs active:scale-95"
          >
            <Check className="w-3 h-3 stroke-[3]" />
            <span>ACTIVATE ZONE</span>
          </button>
        </div>
      </form>
    </div>
  );
};
