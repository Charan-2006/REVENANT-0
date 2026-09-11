import React from 'react';
import { DetailDrawer } from './DetailDrawer';
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
    <DetailDrawer
      isOpen={!!area}
      onClose={onClose}
      title={`${area.id} • ${area.name}`}
      badge={area.zoneType || 'RED'}
      icon={<ShieldAlert className="w-4 h-4 text-amber-500" />}
      headerBg="bg-slate-900/90"
      headerBorder="border-slate-800"
    >
      {/* Body */}
      <div className="p-3 space-y-2.5 text-[11px]">
        {/* Status & Created */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2 rounded border border-slate-800">
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-semibold tracking-wider">Geofence Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              />
              <span className={`font-bold font-mono text-[10.5px] ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                {area.status}
              </span>
            </div>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-semibold tracking-wider">Established</span>
            <span className="font-mono text-slate-300 block mt-1 font-medium">{area.createdAt}</span>
          </div>
        </div>

        {/* Vessels Inside Area */}
        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded text-[10.5px] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Targets Within Boundary
            </span>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
              vesselsInside.length > 0 ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60' : 'bg-slate-800/60 text-slate-400'
            }`}>
              {vesselsInside.length} ACTIVE
            </span>
          </div>

          {vesselsInside.length === 0 ? (
            <span className="text-[9px] text-slate-500 italic block py-1">No tracked targets currently inside polygon.</span>
          ) : (
            <div className="space-y-1 pt-1 divide-y divide-slate-800/60">
              {vesselsInside.slice(0, 4).map((v) => (
                <div key={v.id} className="flex items-center justify-between text-slate-300 text-[10px] pt-1 first:pt-0">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="font-mono text-slate-200">{v.name}</span>
                  </span>
                  <span className="font-mono text-[9px] text-slate-400">
                    {v.speed} kn
                  </span>
                </div>
              ))}
              {vesselsInside.length > 4 && (
                <div className="text-[8.5px] text-slate-500 text-right pt-1 font-mono">
                  +{vesselsInside.length - 4} additional targets
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions: Toggle Active / Delete */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => onToggleStatus(area.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[10.5px] font-semibold transition-colors ${
              isActive
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Power className="w-3 h-3" />
            <span>{isActive ? 'DEACTIVATE' : 'ACTIVATE'}</span>
          </button>

          <button
            onClick={() => onDeleteArea(area.id)}
            className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-[10.5px] font-semibold transition-colors"
            title="Delete this restricted area"
          >
            <Trash2 className="w-3 h-3" />
            <span>DELETE</span>
          </button>
        </div>
      </div>
    </DetailDrawer>
  );
};
