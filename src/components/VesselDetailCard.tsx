import React from 'react';
import { Vessel } from '../data/vessels';
import { MOCK_CAMERAS } from '../data/mockCameras';
import { isPointInFov, getDistanceMeters } from '../utils/geoUtils';
import { maritimeZoneEngine } from '../utils/maritimeZones';
import { checkAuthorisedRegistry } from '../data/authorizedRegistry';
import { X, Navigation, Anchor, ShieldAlert, Radio, CheckCircle, AlertTriangle } from 'lucide-react';

interface VesselDetailCardProps {
  vessel: Vessel | null;
  onClose: () => void;
  onSimulateAisMatch?: (vesselId: string) => void;
}

export const VesselDetailCard: React.FC<VesselDetailCardProps> = ({
  vessel,
  onClose,
  onSimulateAisMatch,
}) => {
  if (!vessel) return null;

  const isDark = vessel.status === 'DARK';
  const zone = maritimeZoneEngine.determineZone(vessel.lon, vessel.lat);

  // Validate camera association if specified
  const assocCamera = vessel.detectedByCamera
    ? MOCK_CAMERAS.find((c) => c.id === vessel.detectedByCamera) || null
    : null;

  const isGeographicallyInCameraFov =
    assocCamera &&
    isPointInFov(
      assocCamera.lat,
      assocCamera.lon,
      vessel.lat,
      vessel.lon,
      assocCamera.heading,
      assocCamera.fov,
      assocCamera.rangeKm
    );

  const cameraDistKm = assocCamera
    ? (getDistanceMeters(assocCamera.lon, assocCamera.lat, vessel.lon, vessel.lat) / 1000).toFixed(1)
    : null;

  return (
    <aside aria-label="Selected Vessel Maritime Context" className="absolute top-4 right-4 z-20 w-72 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl text-slate-800 overflow-hidden font-sans select-none animate-in fade-in duration-200">
      {/* Header Bar */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b ${
          vessel.displayStatus === 'RESTRICTED'
            ? 'bg-orange-50 border-orange-200'
            : isDark
            ? 'bg-rose-50 border-rose-200'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {vessel.displayStatus === 'RESTRICTED' ? (
            <ShieldAlert className="w-4 h-4 text-orange-600" />
          ) : isDark ? (
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          ) : (
            <Anchor className="w-4 h-4 text-sky-600" />
          )}
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-900">
            {vessel.displayStatus === 'RESTRICTED'
              ? 'Restricted Area Geofence Alert'
              : isDark
              ? 'Dark Vessel Detection'
              : 'AIS Correlated Vessel'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Close card"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-3 space-y-2.5 text-[11px]">
        {/* Geofence Violation Banner */}
        {(vessel.displayStatus === 'RESTRICTED' || vessel.geofenceStatus === 'INSIDE_RESTRICTED') && (
          <div className="bg-orange-50 p-2.5 rounded border border-orange-200 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-orange-700 tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
                RESTRICTED AREA
              </span>
              <span className="text-[8.5px] font-mono bg-orange-100 text-orange-800 border border-orange-300 px-1.5 py-0.5 rounded font-bold">
                INSIDE
              </span>
            </div>
            <div className="text-[10px] text-slate-600 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Area:</span>
                <span className="text-orange-900 font-semibold">
                  {vessel.restrictedAreaNames?.join(', ') || 'RESTRICTED AREA 01'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-orange-800 font-mono font-bold">INSIDE GEOFENCE</span>
              </div>
              <div className="flex justify-between pt-0.5 border-t border-orange-200">
                <span className="text-slate-500">Original State:</span>
                <span className={`font-mono font-semibold ${isDark ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {isDark ? 'DARK VESSEL' : 'AIS CORRELATED'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Vessel Identity */}
        <div className="bg-slate-50 p-2 rounded border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[8.5px] text-slate-500 uppercase font-semibold block">Contact Name</span>
            <span className="text-slate-900 font-bold text-[12px]">{vessel.name}</span>
          </div>
          <div className="text-right">
            <span className="text-[8.5px] text-slate-500 uppercase font-semibold block">Type</span>
            <span className="text-slate-700 font-medium">{vessel.vesselType}</span>
          </div>
        </div>

        {/* Maritime Zone */}
        <div>
          <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase block mb-1">
            Maritime Jurisdiction Zone
          </span>
          <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
              <span className="font-semibold text-slate-900">{zone.label}</span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono">
              {zone.code === 'TERRITORIAL_SEA' ? '12 NM' : zone.code === 'EEZ' ? '200 NM' : 'INTL'}
            </span>
          </div>
        </div>

        {/* Real Coordinates */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-200">
          <div>
            <span className="text-[9px] text-slate-500 uppercase block">Latitude</span>
            <span className="font-mono text-slate-900 font-semibold">{vessel.lat.toFixed(4)}° N</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block">Longitude</span>
            <span className="font-mono text-slate-900 font-semibold">{vessel.lon.toFixed(4)}° E</span>
          </div>
        </div>

        {/* EO Sensor Detection Association & Correlation Evidence */}
        {(assocCamera || vessel.detectedByCamera) && (
          <div className="bg-sky-50 p-2.5 rounded border border-sky-200 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-sky-800 tracking-wide">
                DETECTED BY {assocCamera?.id || vessel.detectedByCamera}
              </span>
              <span className="text-[8.5px] font-mono bg-sky-100 text-sky-800 border border-sky-300 px-1.5 py-0.5 rounded font-bold">
                {isGeographicallyInCameraFov ? 'FOV CONFIRMED' : 'OPTICAL FIX'}
              </span>
            </div>
            <div className="text-[10px] text-slate-600 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Sensor Station:</span>
                <span className="text-slate-800 font-medium">{assocCamera?.siteName || 'PSS Madras (CAM-04)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Distance from Camera:</span>
                <span className="text-sky-700 font-mono font-medium">{cameraDistKm || '11.8'} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {isDark ? 'Classification:' : 'AIS Correlation:'}
                </span>
                <span
                  className={`font-mono font-bold ${
                    isDark ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {isDark ? 'NO MATCHING AIS OBSERVATION' : `MATCHED (${vessel.confidence || 94}% CONF)`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Telemetry (SOG, COG) */}
        <div className="grid grid-cols-2 gap-2 text-slate-600">
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-slate-500" style={{ transform: `rotate(${vessel.heading}deg)` }} />
            <span>Heading: <strong className="text-slate-900 font-mono">{vessel.heading}°</strong></span>
          </div>
          <div>
            <span>Speed: <strong className="text-slate-900 font-mono">{vessel.speed} kn</strong></span>
          </div>
        </div>

        {/* Authorised Registry & 3D Envelope Evaluation */}
        {(() => {
          const registryEntry = checkAuthorisedRegistry(vessel.id, vessel.mmsi);
          const alt = vessel.altitude ?? 0;
          const maxAlt = registryEntry?.altitudeEnvelope.maxAltitudeMeters ?? 45;
          const isOut = Boolean(vessel.isOutOfEnvelope || alt > maxAlt);

          return (
            <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[10px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase font-semibold text-[8.5px]">Registry Authority</span>
                {isDark ? (
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300">
                    DARK CONTACT
                  </span>
                ) : registryEntry ? (
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" />
                    <span>AUTHORISED</span>
                  </span>
                ) : (
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>UNREGISTERED</span>
                  </span>
                )}
              </div>
              {registryEntry && (
                <div className="flex justify-between text-slate-500">
                  <span>Permit:</span>
                  <span className="text-slate-800 font-mono text-[9px]">{registryEntry.organisation}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 border-t border-slate-200 pt-1">
                <span>Envelope Test:</span>
                <span className={`font-mono text-[9px] ${isOut ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                  {isOut ? `FAIL: ${alt}m > ${maxAlt}m` : `PASS: ${alt}m (Max ${maxAlt}m)`}
                </span>
              </div>
            </div>
          );
        })()}

        {vessel.mmsi && (
          <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[10px]">
            <span className="text-slate-500">MMSI</span>
            <span className="font-mono text-slate-800">{vessel.mmsi}</span>
          </div>
        )}

        {/* Dynamic Dark Vessel Re-Correlation (Scenario 3) */}
        {isDark && onSimulateAisMatch && (
          <button
            onClick={() => onSimulateAisMatch(vessel.id)}
            className="w-full mt-2 py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-[10.5px] flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98"
            title="Ingest live AIS transponder message to dynamically correlate this contact"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>INGEST MATCHING AIS TELEMETRY</span>
          </button>
        )}

        {/* Attribution Footnote */}
        <div className="pt-1 text-[8.5px] text-slate-400 flex items-center justify-between border-t border-slate-200">
          <span>Feed: {isDark ? 'EO Optical Detection' : 'AIS Live Stream'}</span>
          <span className="text-sky-600 font-medium">Coastal View</span>
        </div>
      </div>
    </aside>
  );
};
