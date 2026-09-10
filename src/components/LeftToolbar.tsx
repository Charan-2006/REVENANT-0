import React from 'react';
import {
  Plus,
  Minus,
  Compass,
  Crosshair,
  Camera,
  Layers as LayersIcon,
  Pentagon,
  Play,
  Pause,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Sliders,
  Radio,
} from 'lucide-react';
import { MapLayersState } from './LayerControlPopover';

export type ActiveSidebarPanel = 'areas' | 'events' | 'sensors' | 'filters' | 'audit' | 'scenarios' | null;

export interface LeftToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocateIndia: () => void;
  onResetNorth: () => void;
  layers: MapLayersState;
  onToggleLayer: (layerKey: keyof MapLayersState) => void;
  isDrawingRestricted: boolean;
  onToggleDrawRestricted: () => void;
  isSimulating?: boolean;
  onToggleSimulation?: () => void;
  activeAlertCount?: number;
  activePanel: ActiveSidebarPanel;
  onTogglePanel: (panel: ActiveSidebarPanel) => void;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onLocateIndia,
  onResetNorth,
  layers,
  onToggleLayer,
  isDrawingRestricted,
  onToggleDrawRestricted,
  isSimulating = false,
  onToggleSimulation,
  activeAlertCount = 0,
  activePanel,
  onTogglePanel,
}) => {
  return (
    <div className="absolute left-3.5 top-3.5 z-20 flex flex-col items-start gap-2 select-none">
      {/* Zoom, Navigation & GIS Controls */}
      <div className="flex flex-col bg-white/95 backdrop-blur-xs rounded-md shadow-md border border-slate-200 overflow-hidden divide-y divide-slate-200">
        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          className="w-[34px] h-[34px] flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          className="w-[34px] h-[34px] flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Reset North */}
        <button
          onClick={onResetNorth}
          className="w-[34px] h-[34px] flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Reset Bearing (North Up)"
          aria-label="Reset Bearing"
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Locate India */}
        <button
          onClick={onLocateIndia}
          className="w-[34px] h-[34px] flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Center on Indian Maritime Domain"
          aria-label="Center on India"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* Vessel Toggle Button */}
        <button
          onClick={() => onToggleLayer('vessels')}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-all ${
            layers.vessels
              ? 'bg-sky-50 text-slate-900 shadow-inner'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 opacity-60'
          }`}
          title={layers.vessels ? 'Hide Vessels' : 'Show All Vessels (AIS Correlated & Dark Vessels)'}
          aria-label="Toggle All Vessels"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6 1.5 L9.5 5 L9.5 13 L2.5 13 L2.5 5 Z"
              fill={layers.vessels ? '#0f172a' : '#94a3b8'}
              stroke={layers.vessels ? '#020617' : '#64748b'}
              strokeWidth="0.6"
              strokeLinejoin="round"
            />
            <path
              d="M11.5 4.5 L14.5 7.5 L14.5 14.5 L8.5 14.5 L8.5 7.5 Z"
              fill={layers.vessels ? '#dc2626' : '#cbd5e1'}
              stroke={layers.vessels ? '#991b1b' : '#94a3b8'}
              strokeWidth="0.6"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Camera Toggle Button */}
        <button
          onClick={() => onToggleLayer('cameras')}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-all ${
            layers.cameras
              ? 'bg-sky-50 text-sky-600 shadow-inner'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 opacity-60'
          }`}
          title={layers.cameras ? 'Hide Coastal Cameras' : 'Show All Coastal Cameras in India (87 DGLL Stations)'}
          aria-label="Toggle All Coastal Cameras"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Draw Restricted Area */}
        <button
          onClick={onToggleDrawRestricted}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-all ${
            isDrawingRestricted
              ? 'bg-orange-500 text-white shadow-inner'
              : 'text-slate-700 hover:bg-slate-100 hover:text-orange-600'
          }`}
          title="Draw Restricted Area"
          aria-label="Draw Restricted Area"
        >
          <Pentagon className="w-4 h-4" />
        </button>

        {/* 1. AREAS PANEL (Maritime Geofence Zones) */}
        <button
          onClick={() => onTogglePanel(activePanel === 'areas' ? null : 'areas')}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-all ${
            activePanel === 'areas'
              ? 'bg-orange-50 text-orange-600 shadow-inner ring-1 ring-orange-400'
              : 'text-slate-700 hover:bg-slate-100 hover:text-orange-600'
          }`}
          title="Areas: Manage Maritime Geofence Zones"
          aria-label="Areas Panel"
        >
          <ShieldAlert className="w-4 h-4" />
        </button>

        {/* 2. EVENTS PANEL (Alert Center) */}
        <button
          onClick={() => onTogglePanel(activePanel === 'events' ? null : 'events')}
          className={`relative w-[34px] h-[34px] flex items-center justify-center transition-all ${
            activePanel === 'events'
              ? 'bg-rose-50 text-rose-600 shadow-inner ring-1 ring-rose-400'
              : 'text-slate-700 hover:bg-slate-100 hover:text-rose-600'
          }`}
          title="Events: Operational Alert Center"
          aria-label="Events Panel"
        >
          <AlertTriangle className="w-4 h-4" />
          {activeAlertCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-600 animate-ping" />
          )}
        </button>

        {/* 3. SENSORS PANEL (Sensor Network & 87 EO Sites) */}
        <button
          onClick={() => onTogglePanel(activePanel === 'sensors' ? null : 'sensors')}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-all ${
            activePanel === 'sensors'
              ? 'bg-sky-50 text-sky-600 shadow-inner ring-1 ring-sky-400'
              : 'text-slate-700 hover:bg-slate-100 hover:text-sky-600'
          }`}
          title="Sensors: Network Status & Coastal EO Sensor Stations"
          aria-label="Sensors Panel"
        >
          <Radio className="w-4 h-4" />
        </button>

        {/* 4. FILTERS & LAYERS PANEL */}
        <button
          onClick={() => onTogglePanel(activePanel === 'filters' ? null : 'filters')}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-all ${
            activePanel === 'filters'
              ? 'bg-sky-50 text-sky-600 shadow-inner ring-1 ring-sky-400'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Filters: Maritime GIS Boundaries & Overlays"
          aria-label="Filters Panel"
        >
          <LayersIcon className="w-4 h-4" />
        </button>

        {/* 5. SCENARIOS PANEL (Demo Scenarios 1–7) */}
        <button
          onClick={() => onTogglePanel(activePanel === 'scenarios' ? null : 'scenarios')}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-all ${
            activePanel === 'scenarios'
              ? 'bg-sky-50 text-sky-600 shadow-inner ring-1 ring-sky-400'
              : 'text-slate-700 hover:bg-slate-100 hover:text-sky-600'
          }`}
          title="Scenarios: Surveillance Track Evaluation Runner (1–7)"
          aria-label="Scenarios Panel"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* 6. AUDIT PANEL (Append-Only Audit Trail) */}
        <button
          onClick={() => onTogglePanel(activePanel === 'audit' ? null : 'audit')}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-all ${
            activePanel === 'audit'
              ? 'bg-emerald-50 text-emerald-600 shadow-inner ring-1 ring-emerald-400'
              : 'text-slate-700 hover:bg-slate-100 hover:text-emerald-600'
          }`}
          title="Audit: Append-Only Immutable Event Trail"
          aria-label="Audit Panel"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>
      </div>

      {/* Demo Scenario Simulation Play/Pause */}
      {onToggleSimulation && (
        <button
          onClick={onToggleSimulation}
          className={`w-[34px] h-[34px] flex items-center justify-center rounded-md shadow-md border transition-all ${
            isSimulating
              ? 'bg-orange-500 text-white border-orange-600'
              : 'bg-white/95 backdrop-blur-xs text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-orange-600'
          }`}
          title={isSimulating ? 'Pause Traffic Geofence Simulation' : 'Run Demo Traffic Geofence Simulation'}
          aria-label="Toggle Traffic Simulation"
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>
      )}
    </div>
  );
};
