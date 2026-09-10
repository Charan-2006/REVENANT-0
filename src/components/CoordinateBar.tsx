import React from 'react';
import { Layers } from 'lucide-react';
import { formatCoordinatesDMS } from '../utils/geoUtils';

interface CoordinateBarProps {
  cursorPos: { lat: number; lon: number };
  zoom: number;
  onToggleLegend: () => void;
  isLegendOpen: boolean;
}

export const CoordinateBar: React.FC<CoordinateBarProps> = ({
  cursorPos,
  zoom,
  onToggleLegend,
  isLegendOpen,
}) => {
  // Approximate nautical scale length display based on zoom
  const scaleText = zoom > 11 ? '1 nm' : zoom > 8 ? '5 nm' : zoom > 5 ? '10 nm' : '50 nm';

  return (
    <>
      {/* 1. Floating Minimal Maritime Legend Card */}

      {/* 2. Floating Minimal Maritime Legend Card */}
      {isLegendOpen && (
        <aside aria-label="Maritime Boundaries Legend" className="absolute bottom-11 right-3 z-20 w-72 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-2xl p-3 text-slate-800 font-sans select-none animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200">
            <span className="text-[10px] font-bold tracking-wider text-slate-900 uppercase">
              Maritime Legend
            </span>
            <span className="text-[9px] text-sky-700 font-mono font-semibold">REVENANT</span>
          </div>

          <div className="space-y-1.5 text-[10.5px]">
            {/* AIS Correlated Vessel */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-900 text-[11px] leading-none">▲</span>
                <span className="text-slate-700 font-medium">AIS Correlated Vessel</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">Navy / Black</span>
            </div>

            {/* Dark Vessel Detection */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-rose-600 text-[11px] leading-none">▲</span>
                <span className="text-slate-700 font-medium">Dark Vessel Detection</span>
              </div>
              <span className="text-[9px] text-rose-700 font-mono font-semibold">Red (No AIS)</span>
            </div>

            {/* Restricted Area Violation Vessel */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-orange-600 text-[11px] leading-none font-bold">▲</span>
                <span className="text-orange-900 font-semibold">Inside Restricted Area</span>
              </div>
              <span className="text-[9px] text-orange-700 font-mono font-bold">Orange</span>
            </div>

            {/* Red Zone (Restricted / Exclusion) */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-rose-600 font-bold tracking-wider text-[11px] leading-none">
                  - - -
                </span>
                <span className="text-slate-700 font-medium">Red Zone (Restricted)</span>
              </div>
              <span className="text-[9px] text-rose-700 font-mono font-semibold">Exclusion</span>
            </div>

            {/* Yellow Zone (Cautionary Anchorage) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-amber-600 font-bold tracking-wider text-[11px] leading-none">
                  - - -
                </span>
                <span className="text-slate-700 font-medium">Yellow Zone (Cautionary)</span>
              </div>
              <span className="text-[9px] text-amber-700 font-mono font-semibold">Anchorage</span>
            </div>

            {/* Green Zone (Safe Transit Corridor) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-600 font-bold tracking-wider text-[11px] leading-none">
                  - - -
                </span>
                <span className="text-slate-700 font-medium">Green Zone (Authorized)</span>
              </div>
              <span className="text-[9px] text-emerald-700 font-mono font-semibold">Safe Transit</span>
            </div>

            {/* EEZ Boundary */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-600 font-bold tracking-widest text-[12px] leading-none">
                  — — —
                </span>
                <span className="text-slate-700 font-medium">EEZ Boundary (200 NM)</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">Outer Limit</span>
            </div>

            {/* 12 NM Territorial Sea */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sky-600 font-bold tracking-wider text-[12px] leading-none">
                  - - -
                </span>
                <span className="text-slate-700 font-medium">12 NM Territorial Sea</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">Sovereign</span>
            </div>

            {/* EO Coastal Camera / Sensor Station */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sky-600 text-[10px] leading-none">◉</span>
                <span className="text-slate-700 font-medium">EO Coastal Sensor Site</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">DGLL PSS</span>
            </div>
          </div>
        </aside>
      )}

      {/* 3. Bottom-Right Navigation & Coordinate HUD */}
      <div className="absolute bottom-2 right-3 z-20 flex items-center gap-3 bg-white/90 backdrop-blur-xs border border-slate-200 px-3 py-1 rounded shadow-md text-[11px] font-mono text-slate-700 select-none">
        {/* Dynamic Cursor Coordinates in Nautical DMS format */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-sans text-[10px] uppercase font-bold tracking-wider">POS:</span>
          <span className="font-semibold text-slate-900">
            {formatCoordinatesDMS(cursorPos.lat, cursorPos.lon)}
          </span>
        </div>

        <div className="h-3 w-px bg-slate-300" />

        {/* Nautical Scale Indicator */}
        <div className="flex items-center gap-1.5 text-slate-600">
          <div className="w-8 h-1.5 border-b-2 border-l-2 border-r-2 border-slate-700" />
          <span className="text-[10px] font-semibold">{scaleText}</span>
        </div>

        <div className="h-3 w-px bg-slate-300" />

        {/* SHOW LEGEND toggle button */}
        <button
          onClick={onToggleLegend}
          className={`flex items-center gap-1 text-[11px] font-sans font-semibold transition-colors ${
            isLegendOpen ? 'text-sky-600 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>{isLegendOpen ? 'HIDE LEGEND' : 'SHOW LEGEND'}</span>
        </button>
      </div>
    </>
  );
};
