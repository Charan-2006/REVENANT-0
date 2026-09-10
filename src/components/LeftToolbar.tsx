import React, { useState } from 'react';
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
} from 'lucide-react';
import { LayerControlPopover, MapLayersState } from './LayerControlPopover';

interface LeftToolbarProps {
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
  onToggleAlerts?: () => void;
  isAlertsOpen?: boolean;
  onToggleZones?: () => void;
  isZonesOpen?: boolean;
  onToggleAudit?: () => void;
  isAuditOpen?: boolean;
  onToggleScenarios?: () => void;
  isScenariosOpen?: boolean;
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
  onToggleAlerts,
  isAlertsOpen = false,
  onToggleZones,
  isZonesOpen = false,
  onToggleAudit,
  isAuditOpen = false,
  onToggleScenarios,
  isScenariosOpen = false,
}) => {
  const [isLayersOpen, setIsLayersOpen] = useState(false);

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

        {/* Vessel Toggle Button: Vessel shape with AIS Correlated (navy) & Dark Vessel (red) */}
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
            {/* AIS Correlated ship silhouette */}
            <path
              d="M6 1.5 L9.5 5 L9.5 13 L2.5 13 L2.5 5 Z"
              fill={layers.vessels ? '#0f172a' : '#94a3b8'}
              stroke={layers.vessels ? '#020617' : '#64748b'}
              strokeWidth="0.6"
              strokeLinejoin="round"
            />
            {/* Dark vessel detection ship silhouette */}
            <path
              d="M11.5 4.5 L14.5 7.5 L14.5 14.5 L8.5 14.5 L8.5 7.5 Z"
              fill={layers.vessels ? '#dc2626' : '#cbd5e1'}
              stroke={layers.vessels ? '#991b1b' : '#94a3b8'}
              strokeWidth="0.6"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Camera Toggle Button: Shows all 87 DGLL coastal cameras across India */}
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

        {/* Draw Restricted Area (Requirement 1) */}
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

        {/* Zone Manager Button */}
        {onToggleZones && (
          <button
            onClick={onToggleZones}
            className={`w-[34px] h-[34px] flex items-center justify-center transition-all ${
              isZonesOpen
                ? 'bg-orange-50 text-orange-600 shadow-inner'
                : 'text-slate-700 hover:bg-slate-100 hover:text-orange-600'
            }`}
            title="Manage Maritime Geofence Zones (Red, Yellow, Green)"
            aria-label="Manage Geofence Zones"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        )}

        {/* Operational Alert Center Button */}
        {onToggleAlerts && (
          <button
            onClick={onToggleAlerts}
            className={`relative w-[34px] h-[34px] flex items-center justify-center transition-all ${
              isAlertsOpen
                ? 'bg-rose-50 text-rose-600 shadow-inner'
                : 'text-slate-700 hover:bg-slate-100 hover:text-rose-600'
            }`}
            title="Operational Alert Center (Disposition Engine)"
            aria-label="Alert Operations Center"
          >
            <AlertTriangle className="w-4 h-4" />
            {activeAlertCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            )}
          </button>
        )}

        {/* Append-Only Audit Trail Button */}
        {onToggleAudit && (
          <button
            onClick={onToggleAudit}
            className={`w-[34px] h-[34px] flex items-center justify-center transition-all ${
              isAuditOpen
                ? 'bg-emerald-50 text-emerald-600 shadow-inner'
                : 'text-slate-700 hover:bg-slate-100 hover:text-emerald-600'
            }`}
            title="Append-Only Audit Log (Immutable Event Trail)"
            aria-label="Audit Log"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        )}

        {/* Demo Scenarios Runner Button */}
        {onToggleScenarios && (
          <button
            onClick={onToggleScenarios}
            className={`w-[34px] h-[34px] flex items-center justify-center transition-all ${
              isScenariosOpen
                ? 'bg-sky-50 text-sky-600 shadow-inner'
                : 'text-slate-700 hover:bg-slate-100 hover:text-sky-600'
            }`}
            title="Demo Scenarios (Scenarios 1–7 Evaluation Runner)"
            aria-label="Demonstration Scenarios"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}

        {/* Maritime Layers Toggle */}
        <button
          onClick={() => setIsLayersOpen(!isLayersOpen)}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-colors ${
            isLayersOpen ? 'bg-sky-50 text-sky-600' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Toggle Maritime Boundaries & Layers"
          aria-label="Toggle Layers"
        >
          <LayersIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Demo Scenario Simulation Play/Pause (Requirement 26) */}
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

      {/* Layer Control Popover */}
      {isLayersOpen && (
        <LayerControlPopover
          layers={layers}
          onToggleLayer={onToggleLayer}
          onClose={() => setIsLayersOpen(false)}
        />
      )}
    </div>
  );
};
