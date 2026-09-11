import React, { useState } from 'react';
import { ShieldAlert, Check, Clock } from 'lucide-react';
import { Modal } from './Modal';
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
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Save Maritime Geofence Zone"
      icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-[11px] text-slate-200 font-sans">
        {/* Zone Name */}
        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Zone Designation
          </label>
          <input
            type="text"
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[#0b111e] border border-slate-700 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500 transition-colors"
            placeholder="RESTRICTED AREA 01"
            autoFocus
          />
        </div>

        {/* Zone Security Classification */}
        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Zone Classification
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'RED' as ZoneType, label: 'RED', sub: 'Exclusion', border: 'border-rose-500', bg: 'bg-rose-950 text-rose-200' },
              { id: 'YELLOW' as ZoneType, label: 'YELLOW', sub: 'Cautionary', border: 'border-amber-500', bg: 'bg-amber-950 text-amber-200' },
              { id: 'GREEN' as ZoneType, label: 'GREEN', sub: 'Safe Transit', border: 'border-emerald-500', bg: 'bg-emerald-950 text-emerald-200' },
            ].map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setZoneType(z.id)}
                className={`py-1.5 px-1.5 rounded border text-center transition-colors ${
                  zoneType === z.id
                    ? `${z.border} ${z.bg} font-bold`
                    : 'border-slate-800 bg-[#111827] text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="block text-[10px] font-mono leading-none">{z.label}</span>
                <span className="block text-[8px] text-slate-400 leading-tight mt-0.5">{z.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Automatic Expiry Handling */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>Zone Auto-Expiry</span>
            </label>
            <span className="text-[8px] text-slate-500 font-mono">Optional</span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-[10px] font-mono">
            {[
              { id: '1m', label: '1m' },
              { id: '5m', label: '5m' },
              { id: '15m', label: '15m' },
              { id: '60m', label: '1h' },
              { id: 'NONE', label: 'Perm' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setExpiryOption(opt.id)}
                className={`py-1 rounded border text-center transition-colors ${
                  expiryOption === opt.id
                    ? 'border-sky-500 bg-sky-950 text-sky-200 font-bold'
                    : 'border-slate-800 bg-[#111827] text-slate-400 hover:border-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10.5px] font-medium transition-colors"
          >
            CANCEL
          </button>
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[10.5px] font-bold transition-colors shadow-xs"
          >
            <Check className="w-3 h-3 stroke-[3]" />
            <span>SAVE GEOFENCE</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
