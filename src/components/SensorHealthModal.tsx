import React from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Radio } from 'lucide-react';
import { EOCamera } from '../types/maritime';

interface SensorHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameras: EOCamera[];
  isAisOnline: boolean;
  onToggleAisStatus?: () => void;
  onSelectCamera: (cam: EOCamera) => void;
}

export const SensorHealthModal: React.FC<SensorHealthModalProps> = ({
  isOpen,
  onClose,
  cameras,
  isAisOnline,
  onToggleAisStatus,
  onSelectCamera,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-3.5 top-[86px] z-30 w-76 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 p-3 text-slate-800 select-none animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700">
          <Radio className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sensor Network Status</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="py-2 space-y-2 text-xs divide-y divide-slate-100">
        {/* Coastal AIS Receiver Network */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="font-semibold text-slate-800">Coastal AIS Transponder Network</div>
            <div className="text-[10px] text-slate-400">National DGLL AIS stations</div>
          </div>
          <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
            isAisOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {isAisOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* Spaceborne SAR / Optical Constellation */}
        <div className="flex items-center justify-between pt-1.5">
          <div>
            <div className="font-semibold text-slate-800">Spaceborne SAR (Sentinel-1)</div>
            <div className="text-[10px] text-slate-400">C-Band Synthetic Aperture Radar</div>
          </div>
          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800">
            ONLINE
          </span>
        </div>

        {/* Coastal EO Cameras list */}
        <div className="pt-2">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
            Coastal EO Surveillance Posts
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {cameras.slice(0, 6).map(cam => (
              <button
                key={cam.id}
                onClick={() => {
                  onSelectCamera(cam);
                  onClose();
                }}
                className="w-full flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 transition-colors text-left"
              >
                <span className="font-medium text-slate-700 truncate text-[11px]">
                  {cam.id} • {cam.name.split(' ')[0]}
                </span>
                <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold ${
                  cam.status === 'ONLINE' 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : cam.status === 'STALE'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {cam.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
