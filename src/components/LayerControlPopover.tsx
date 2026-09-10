import React from 'react';
import { SidebarPanel } from './SidebarPanel';
import { Check, Layers, Sliders } from 'lucide-react';

export interface MapLayersState {
  eez: boolean;
  territorialSea: boolean;
  vessels: boolean;
  cameras: boolean;
  contiguousZone: boolean;
}

interface LayerControlPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  layers: MapLayersState;
  onToggleLayer: (layerKey: keyof MapLayersState) => void;
}

export const LayerControlPopover: React.FC<LayerControlPopoverProps> = ({
  isOpen,
  onClose,
  layers,
  onToggleLayer,
}) => {
  const layerItems: { key: keyof MapLayersState; label: string; sub?: string }[] = [
    { key: 'vessels', label: 'VESSELS', sub: 'Commercial, AIS Correlated & Dark Vessels' },
    { key: 'cameras', label: 'EO / COASTAL SENSOR SITES', sub: '87 Physical Shore Stations • DGLL NAIS' },
    { key: 'eez', label: 'EEZ BOUNDARIES (200 NM)', sub: 'World EEZ v12 (Marine Regions outer limit)' },
    { key: 'territorialSea', label: '12 NM TERRITORIAL SEA', sub: 'World 12 NM Sovereign Maritime Zone' },
    { key: 'contiguousZone', label: '24 NM CONTIGUOUS ZONE', sub: 'Extended Enforcement Maritime Corridor' },
  ];

  return (
    <SidebarPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Maritime Layers & Filters"
      badge="GIS"
      icon={<Layers className="w-4 h-4 text-sky-600" />}
    >
      <div className="p-3 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
        Toggle vector boundary overlays, vessel observation feeds, and sensor sites across the Indian Maritime Domain.
      </div>

      <div className="p-3 space-y-2">
        {layerItems.map((item) => {
          const isActive = layers[item.key];
          return (
            <button
              key={item.key}
              onClick={() => onToggleLayer(item.key)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                isActive
                  ? 'bg-sky-50/80 border-sky-300 text-slate-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div>
                <span className="text-[11px] font-bold block leading-tight">{item.label}</span>
                {item.sub && (
                  <span className="text-[9.5px] text-slate-500 block leading-tight mt-0.5">
                    {item.sub}
                  </span>
                )}
              </div>
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ml-2 ${
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
      </div>
    </SidebarPanel>
  );
};
