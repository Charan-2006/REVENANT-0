import React, { useState, useMemo } from 'react';
import { SidebarPanel } from './SidebarPanel';
import { EOCamera } from '../types/maritime';
import { Radio, Search, CheckCircle2, Compass, Eye, ShieldCheck, Activity } from 'lucide-react';

interface SensorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  cameras: EOCamera[];
  onSelectCamera: (cam: EOCamera) => void;
  onViewFeed?: (cam: EOCamera) => void;
  isAisOnline?: boolean;
}

export const SensorPanel: React.FC<SensorPanelProps> = ({
  isOpen,
  onClose,
  cameras,
  onSelectCamera,
  onViewFeed,
  isAisOnline = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'DGLL'>('ALL');

  const filteredCameras = useMemo(() => {
    return cameras.filter((cam) => {
      const name = (cam.siteName || cam.name || '').toLowerCase();
      const id = cam.id.toLowerCase();
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || name.includes(term) || id.includes(term);

      if (!matchesSearch) return false;
      if (filterType === 'ACTIVE') return cam.status === 'DEMO ACTIVE';
      return true;
    });
  }, [cameras, searchTerm, filterType]);

  return (
    <SidebarPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Sensor Network & EO Stations"
      badge={`${cameras.length} SITES`}
      icon={<Radio className="w-4 h-4 text-sky-600" />}
    >
      {/* Network Health Overview */}
      <div className="p-3 bg-slate-100/70 border-b border-slate-200 space-y-2 text-[11px]">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Telemetry Feeds Status
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-slate-800 text-[10.5px]">AIS Receiver</span>
            </div>
            <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {isAisOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-slate-800 text-[10.5px]">Sentinel-1 SAR</span>
            </div>
            <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coastal station or site code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800 text-[11px] placeholder:text-slate-400 focus:outline-none focus:border-sky-400"
          />
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Stations ({cameras.length})
          </button>
          <button
            onClick={() => setFilterType('ACTIVE')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
              filterType === 'ACTIVE'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Demo Active (CAM-04)
          </button>
        </div>
      </div>

      {/* Stations List */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
        {filteredCameras.map((cam) => {
          const isDemoActive = cam.status === 'DEMO ACTIVE';
          const title = (cam.siteName || cam.name || 'Coastal Site').toUpperCase();

          return (
            <div
              key={cam.id}
              className={`p-2.5 rounded border transition-all ${
                isDemoActive
                  ? 'bg-sky-50/70 border-sky-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isDemoActive ? 'bg-sky-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className="font-bold text-slate-900 text-[11px]">{title}</span>
                </div>
                <span className="font-mono text-[9px] text-slate-500 font-bold bg-slate-100 px-1 py-0.5 rounded">
                  {cam.id}
                </span>
              </div>

              <div className="text-[10px] text-slate-500 space-y-0.5 font-mono mb-2">
                <div>Coords: {cam.lat.toFixed(4)}°N, {cam.lon.toFixed(4)}°E</div>
                <div>Heading: {cam.heading}° • Range: {cam.rangeKm} km • FOV: {cam.fov}°</div>
                <div className="text-[9.5px] text-slate-400 font-sans truncate">{cam.model || 'Coastal EO Station'}</div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-100">
                <button
                  onClick={() => onSelectCamera(cam)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                  title="Center map and show coverage on this camera"
                >
                  <Compass className="w-3 h-3 text-slate-500" />
                  <span>Locate</span>
                </button>

                {onViewFeed && (
                  <button
                    onClick={() => onViewFeed(cam)}
                    className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-colors shadow-xs"
                    title="Open live demonstration EO sensor observation feed"
                  >
                    <Eye className="w-3 h-3" />
                    <span>EO Feed</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SidebarPanel>
  );
};
