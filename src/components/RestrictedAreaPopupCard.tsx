import React from 'react';
import { RestrictedArea } from '../types/maritime';
import { Vessel } from '../data/vessels';
import { X, ShieldAlert, Trash2, Power } from 'lucide-react';

interface RestrictedAreaPopupCardProps {
  area: RestrictedArea | null;
  vessels: Vessel[];
  onClose: () => void;
  onToggleStatus: (areaId: string) => void;
  onDeleteArea: (areaId: string) => void;
}

export const RestrictedAreaPopupCard: React.FC<RestrictedAreaPopupCardProps> = ({
  area,
  vessels,
  onClose,
  onToggleStatus,
  onDeleteArea,
}) => {
  if (!area) return null;

  const isActive = area.status === 'ACTIVE';

  // Count vessels inside this specific area
  const vesselsInside = vessels.filter((v) =>
    v.restrictedAreaIds?.includes(area.id)
  );

  return (
    <aside
      aria-label="Restricted Area Details"
      className="absolute top-4 left-16 z-20 w-72 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-2xl text-slate-800 overflow-hidden font-sans select-none animate-in fade-in duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-orange-50/80 border-b border-orange-200 text-slate-900">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-orange-600" />
          <div>
            <span className="text-[9px] font-mono text-orange-700 font-bold uppercase tracking-wider block leading-none">
              RESTRICTED AREA
            </span>
            <span className="text-[12px] font-bold text-slate-900 leading-tight">
              {area.id} • {area.name}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-orange-100/60 transition-colors"
          title="Close details"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2 text-[11px]">
        {/* Status & Created */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-200">
          <div>
            <span className="text-[8.5px] text-slate-500 uppercase block font-semibold">Geofence Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-orange-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className={`font-bold font-mono text-[10.5px] ${isActive ? 'text-orange-700' : 'text-slate-500'}`}>
                {area.status}
              </span>
            </div>
          </div>
          <div>
            <span className="text-[8.5px] text-slate-500 uppercase block font-semibold">Created</span>
            <span className="font-mono text-slate-800 block mt-0.5 font-medium">{area.createdAt}</span>
          </div>
        </div>

        {/* Vessels Inside Area */}
        <div className="bg-orange-50/70 border border-orange-200 p-2 rounded text-[10.5px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-orange-900 uppercase tracking-wider">
              Vessels Inside
            </span>
            <span className="text-[9px] font-mono font-bold text-orange-700">
              {vesselsInside.length > 0 ? 'Detected' : 'None'}
            </span>
          </div>

          {vesselsInside.length === 0 ? (
            <span className="text-[9px] text-slate-500 italic block">No vessels currently inside polygon.</span>
          ) : (
            <div className="space-y-0.5 pt-0.5">
              {vesselsInside.slice(0, 4).map((v) => (
                <div key={v.id} className="flex items-center justify-between text-slate-800 text-[10px]">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    {v.name}
                  </span>
                  <span className="font-mono text-[8.5px] text-orange-800 font-semibold">
                    {v.speed} kn
                  </span>
                </div>
              ))}
              {vesselsInside.length > 4 && (
                <div className="text-[8.5px] text-slate-500 text-right">
                  +{vesselsInside.length - 4} more vessels
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions: Toggle Active / Delete */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
          <button
            onClick={() => onToggleStatus(area.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[10.5px] font-semibold transition-all ${
              isActive
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-xs'
            }`}
          >
            <Power className="w-3 h-3" />
            <span>{isActive ? 'DEACTIVATE' : 'ACTIVATE'}</span>
          </button>

          <button
            onClick={() => onDeleteArea(area.id)}
            className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10.5px] font-semibold transition-all"
            title="Delete this restricted area"
          >
            <Trash2 className="w-3 h-3" />
            <span>DELETE</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
