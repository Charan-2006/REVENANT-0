import React from 'react';
import { Check } from 'lucide-react';

export interface MapLayersState {
  eez: boolean;
  territorialSea: boolean;
  vessels: boolean;
  cameras: boolean;
  contiguousZone: boolean;
}

interface LayerControlPopoverProps {
  layers: MapLayersState;
  onToggleLayer: (layerKey: keyof MapLayersState) => void;
  onClose: () => void;
}

export const LayerControlPopover: React.FC<LayerControlPopoverProps> = ({
  layers,
  onToggleLayer,
}) => {
  const layerItems: { key: keyof MapLayersState; label: string; sub?: string }[] = [
    { key: 'eez', label: 'EEZ BOUNDARIES', sub: 'World EEZ v12 (Marine Regions)' },
    { key: 'territorialSea', label: '12 NM TERRITORIAL SEA', sub: 'World 12 NM Zone v4' },
    { key: 'vessels', label: 'VESSELS', sub: 'Commercial & Coastal Traffic' },
    { key: 'cameras', label: 'EO / COASTAL SENSOR SITES', sub: '87 Stations • DGLL NAIS (dgll.gov.in)' },
  ];

  return (
    <div className="absolute left-14 top-0 z-30 w-60 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-2xl p-2 text-slate-800 font-sans select-none animate-in fade-in duration-150">
      <div className="px-2 py-1 border-b border-slate-200 flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          Map Layers
        </span>
        <span className="text-[9px] text-sky-700 font-mono font-semibold">GIS</span>
      </div>

      <div className="space-y-1">
        {layerItems.map((item) => {
          const isActive = layers[item.key];
          return (
            <button
              key={item.key}
              onClick={() => onToggleLayer(item.key)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-all ${
                isActive
                  ? 'bg-sky-50 text-slate-900 border border-sky-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div>
                <span className="text-[11px] font-semibold block leading-tight">{item.label}</span>
                {item.sub && (
                  <span className="text-[8.5px] text-slate-500 block leading-tight mt-0.5">
                    {item.sub}
                  </span>
                )}
              </div>
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  isActive
                    ? 'bg-sky-600 border-sky-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isActive && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}

        {/* Prepared Architecture: 24 NM Contiguous Zone (Disabled by default) */}
        <div className="pt-1 mt-1 border-t border-slate-200">
          <button
            onClick={() => onToggleLayer('contiguousZone')}
            className={`w-full flex items-center justify-between px-2.5 py-1 rounded text-left transition-all ${
              layers.contiguousZone
                ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div>
              <span className="text-[10px] font-medium block leading-tight">24 NM Contiguous Zone</span>
              <span className="text-[8px] text-slate-400 block leading-tight">Optional Extended Layer</span>
            </div>
            <div
              className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                layers.contiguousZone
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {layers.contiguousZone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
