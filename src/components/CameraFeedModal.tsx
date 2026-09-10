import React from 'react';
import { EOCamera } from '../types/maritime';
import { X, Radio, Compass, Maximize2, ShieldAlert } from 'lucide-react';
import { SatelliteImage } from './SatelliteImage';

interface CameraFeedModalProps {
  camera: EOCamera | null;
  onClose: () => void;
}

export const CameraFeedModal: React.FC<CameraFeedModalProps> = ({ camera, onClose }) => {
  if (!camera) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-2xl overflow-hidden font-sans text-slate-800">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-slate-900 tracking-wide">
                  DEMONSTRATION EO OBSERVATION
                </span>
                <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[8.5px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase">
                  SIMULATED
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">
                Camera: {camera.id} ({camera.siteName || camera.name}) • Source: Public / simulated imagery
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Close Feed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Optical Sensor Image Observation View */}
        <div className="p-3">
          <SatelliteImage
            confidence={94}
            scaleMeters={180}
            source={`${camera.model}`}
            isDark={true}
            vesselLength={92}
            vesselHeading={camera.heading}
          />
        </div>

        {/* Observation Telemetry Summary */}
        <div className="px-3.5 pb-3 text-[11px] space-y-2">
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-700">
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-semibold block">Active Target</span>
              <span className="font-mono font-bold text-rose-700 text-[11px]">
                {camera.associatedDetectionId || 'DV-104'}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-semibold block">AIS Correlation</span>
              <span className="font-mono font-bold text-slate-800 text-[11px]">
                {camera.associatedAisId ? `MATCHED (${camera.associatedAisId})` : 'NO MATCH (DARK)'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
            <span>Range: {camera.rangeKm} km • Azimuth: {camera.heading}°</span>
            <span className="text-sky-700 font-mono font-semibold">12 NM Territorial Waters</span>
          </div>

          <div className="text-[8.5px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200 text-center">
            Demonstration EO observation. Not a live operational government feed.
          </div>
        </div>
      </div>
    </div>
  );
};
