import React, { useState, useEffect, useRef } from 'react';
import { SidebarPanel } from './SidebarPanel';
import { RestrictedArea, ZoneType } from '../types/maritime';
import {
  X,
  ShieldAlert,
  Trash2,
  Power,
  Plus,
  Clock,
  Compass,
  Edit2,
  Check,
  FileUp,
  Download,
  Layers,
} from 'lucide-react';
import {
  exportZonesToGeoJSON,
  parseGeoJSONToZones,
  INITIAL_RESTRICTED_AREAS,
} from '../data/mockRestrictedAreas';

interface ZoneManagerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  areas: RestrictedArea[];
  onToggleStatus: (areaId: string) => void;
  onDeleteArea: (areaId: string) => void;
  onEditArea: (areaId: string, newName: string, newType: ZoneType, expiresInMin?: number) => void;
  onStartDrawing: () => void;
  onFlyToArea: (area: RestrictedArea) => void;
  onLoadGeoJSONZones?: (zones: RestrictedArea[]) => void;
}

export const ZoneManagerPanel: React.FC<ZoneManagerPanelProps> = ({
  isOpen,
  onClose,
  areas,
  onToggleStatus,
  onDeleteArea,
  onEditArea,
  onStartDrawing,
  onFlyToArea,
  onLoadGeoJSONZones,
}) => {
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<ZoneType>('RED');
  const [editExpiresIn, setEditExpiresIn] = useState<string>('10');
  const [now, setNow] = useState(Date.now());
  const [isGeoJsonMenuOpen, setIsGeoJsonMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update timer tick every second for accurate countdown displays
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartEdit = (area: RestrictedArea) => {
    setEditingAreaId(area.id);
    setEditName(area.name);
    setEditType(area.zoneType || 'RED');
    setEditExpiresIn('10');
  };

  const handleSaveEdit = (areaId: string) => {
    const mins = parseInt(editExpiresIn, 10);
    onEditArea(areaId, editName, editType, isNaN(mins) ? undefined : mins);
    setEditingAreaId(null);
  };

  const handleLoadStandardGeoJson = () => {
    if (onLoadGeoJSONZones) {
      onLoadGeoJSONZones(INITIAL_RESTRICTED_AREAS);
    }
    setIsGeoJsonMenuOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && onLoadGeoJSONZones) {
        const parsed = parseGeoJSONToZones(content);
        if (parsed.length > 0) {
          onLoadGeoJSONZones(parsed);
        }
      }
    };
    reader.readAsText(file);
    setIsGeoJsonMenuOpen(false);
  };

  const handleExportGeoJson = () => {
    const jsonStr = exportZonesToGeoJSON(areas);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maritime-geofence-zones-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    setIsGeoJsonMenuOpen(false);
  };

  const formatRemainingTime = (expiresAt?: string) => {
    if (!expiresAt) return 'Permanent';
    const diffMs = new Date(expiresAt).getTime() - now;
    if (diffMs <= 0) return 'EXPIRED';
    const totalSec = Math.floor(diffMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <SidebarPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Maritime Geofence Zones"
      badge={`${areas.filter((a) => a.status !== 'EXPIRED').length} ZONES`}
      icon={<ShieldAlert className="w-4 h-4 text-orange-600" />}
    >

      {/* Subheader Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 text-[10px]">
        <span className="text-slate-500 font-mono text-[9.5px]">Red, Yellow & Green</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsGeoJsonMenuOpen(!isGeoJsonMenuOpen)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold transition-all border border-sky-200"
            title="Load or Export GeoJSON Zones"
          >
            <Layers className="w-3 h-3 text-sky-600" />
            <span>GEOJSON</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onStartDrawing();
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold transition-all shadow-xs"
            title="Draw temporary red zone that expires automatically"
          >
            <Plus className="w-3 h-3" />
            <span>DRAW NEW</span>
          </button>
        </div>
      </div>

      {/* GeoJSON Operations Dropdown / Panel */}
      {isGeoJsonMenuOpen && (
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 space-y-1.5 text-[10.5px] animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[9px] font-bold text-sky-700 uppercase tracking-wider">
            <span>GeoJSON Zone Service</span>
            <button onClick={() => setIsGeoJsonMenuOpen(false)} className="text-slate-400 hover:text-slate-700">
              <X className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={handleLoadStandardGeoJson}
            className="w-full text-left px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-800 flex items-center justify-between transition-colors border border-slate-200 shadow-xs"
          >
            <span className="font-mono text-[9.5px]">Load Standard GeoJSON (Green, Yellow, Red)</span>
            <Layers className="w-3 h-3 text-emerald-600" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-left px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-800 flex items-center justify-between transition-colors border border-slate-200 shadow-xs"
          >
            <span className="font-mono text-[9.5px]">Import GeoJSON File (.geojson / .json)</span>
            <FileUp className="w-3 h-3 text-sky-600" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.geojson"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={handleExportGeoJson}
            className="w-full text-left px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-800 flex items-center justify-between transition-colors border border-slate-200 shadow-xs"
          >
            <span className="font-mono text-[9.5px]">Export Active Zones as GeoJSON</span>
            <Download className="w-3 h-3 text-amber-600" />
          </button>
        </div>
      )}

      {/* Zone List */}
      <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
        {areas.length === 0 ? (
          <div className="p-4 text-center text-[11px] text-slate-500 italic">
            No active zones. Click &quot;DRAW NEW&quot; to place a restricted area.
          </div>
        ) : (
          areas.map((area) => {
            const isEditing = editingAreaId === area.id;
            const isExpired = area.status === 'EXPIRED' || (area.expiresAt && new Date(area.expiresAt).getTime() <= now);
            const remaining = formatRemainingTime(area.expiresAt);

            const badgeColor =
              area.zoneType === 'GREEN'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : area.zoneType === 'YELLOW'
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-rose-100 text-rose-800 border-rose-300';

            return (
              <div
                key={area.id}
                className={`p-2.5 rounded border transition-all ${
                  isExpired
                    ? 'bg-slate-50 border-slate-200/80 opacity-60'
                    : area.status === 'ACTIVE'
                    ? 'bg-white border-slate-200 shadow-xs'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-2 text-[10.5px]">
                    <div>
                      <label className="text-[9px] text-slate-500 uppercase font-semibold block mb-0.5">Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 font-mono text-[11px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase font-semibold block mb-0.5">Zone Type</label>
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as ZoneType)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 font-mono text-[10px]"
                        >
                          <option value="RED">RED (Restricted)</option>
                          <option value="YELLOW">YELLOW (Cautionary)</option>
                          <option value="GREEN">GREEN (Safe Transit)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase font-semibold block mb-0.5">Expires (Min)</label>
                        <input
                          type="number"
                          value={editExpiresIn}
                          onChange={(e) => setEditExpiresIn(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 font-mono text-[10px]"
                          placeholder="Minutes"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => setEditingAreaId(null)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(area.id)}
                        className="px-2.5 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                          {area.zoneType || 'RED'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-900">{area.name}</span>
                      </div>
                      <span className="text-[8.5px] font-mono text-slate-500">{area.id}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                      <div className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{isExpired ? 'EXPIRED' : remaining}</span>
                      </div>
                      <span className="text-slate-500">By: {area.createdBy || 'OP-01'}</span>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-[10px]">
                      <button
                        onClick={() => onFlyToArea(area)}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-slate-600 hover:text-sky-600 hover:bg-slate-100 transition-colors"
                        title="Center map on this zone"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Locate</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(area)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Edit zone"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => onToggleStatus(area.id)}
                          className={`px-2 py-0.5 rounded font-semibold text-[9.5px] transition-colors ${
                            area.status === 'ACTIVE'
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}
                          title={area.status === 'ACTIVE' ? 'Deactivate zone' : 'Activate zone'}
                        >
                          <Power className="w-2.5 h-2.5 inline mr-1" />
                          {area.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </button>

                        {/* DELETE BUTTON: Instantly removes from state & map without reload */}
                        <button
                          onClick={() => onDeleteArea(area.id)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 font-bold transition-all shadow-xs"
                          title="Delete this zone immediately"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </SidebarPanel>
  );
};
