import React from 'react';
import { DetailDrawer } from './DetailDrawer';
import { Vessel } from '../data/vessels';
import { MOCK_CAMERAS } from '../data/mockCameras';
import { isPointInFov, getDistanceMeters } from '../utils/geoUtils';
import { maritimeZoneEngine } from '../utils/maritimeZones';
import { checkAuthorisedRegistry } from '../data/authorizedRegistry';
import { Navigation, Anchor, ShieldAlert, Radio, CheckCircle, AlertTriangle } from 'lucide-react';

interface VesselDetailCardProps {
  vessel: Vessel | null;
  onClose: () => void;
  onSimulateAisMatch?: (vesselId: string) => void;
  onViewAlert?: (vesselId: string) => void;
}

export const VesselDetailCard: React.FC<VesselDetailCardProps> = ({
  vessel,
  onClose,
  onSimulateAisMatch,
  onViewAlert,
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

  const headerTitle =
    vessel.displayStatus === 'RESTRICTED'
      ? 'Restricted Alert'
      : isDark
      ? 'Uncorrelated Target'
      : 'Correlated Vessel';

  const headerIcon =
    vessel.displayStatus === 'RESTRICTED' ? (
      <ShieldAlert className="w-4 h-4 text-amber-400" />
    ) : isDark ? (
      <ShieldAlert className="w-4 h-4 text-rose-400" />
    ) : (
      <Anchor className="w-4 h-4 text-sky-400" />
    );

  return (
    <DetailDrawer
      isOpen={!!vessel}
      onClose={onClose}
      title={headerTitle}
      badge={`Track: ${vessel.id}`}
      icon={headerIcon}
      headerBg="bg-[#0f172a]"
      headerBorder="border-slate-800"
    >
      {/* Content Body */}
      <div className="p-3 space-y-2.5 text-[11px] font-sans text-slate-200">
        {/* Geofence Violation Banner */}
        {(vessel.displayStatus === 'RESTRICTED' || vessel.geofenceStatus === 'INSIDE_RESTRICTED') && (
          <div className="bg-[#1c1813] p-2.5 rounded border border-amber-900/70 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-amber-300 tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                RESTRICTED AREA BREACH
              </span>
              <span className="text-[8.5px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-bold">
                INSIDE
              </span>
            </div>
            <div className="text-[10px] text-slate-300 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Area:</span>
                <span className="text-amber-200 font-semibold">
                  {vessel.restrictedAreaNames?.join(', ') || 'RESTRICTED AREA 01'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-amber-300 font-mono font-bold">INSIDE GEOFENCE</span>
              </div>
              <div className="flex justify-between pt-0.5 border-t border-amber-900/60">
                <span className="text-slate-400">Correlation State:</span>
                <span className={`font-mono font-semibold ${isDark ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isDark ? 'UNCORRELATED (NO AIS)' : 'AIS MATCHED'}
                </span>
              </div>
              {onViewAlert && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewAlert(vessel.id);
                  }}
                  className="w-full mt-2 py-1 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-[9.5px] flex items-center justify-center gap-1 shadow-xs transition-colors"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>VIEW ALERT DETAILS & DISPOSITION</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* System Assigned Track ID vs Vessel Identity */}
        <div className="bg-[#111827] p-2.5 rounded border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[8.5px] text-slate-400 uppercase font-bold tracking-wider block">
                Sensor Track ID (Temporary)
              </span>
              <span className="text-slate-100 font-mono font-bold text-[12px]">{vessel.id}</span>
            </div>
            <div className="text-right">
              <span className="text-[8.5px] text-slate-400 uppercase font-bold tracking-wider block">
                AIS MMSI (Transponder)
              </span>
              <span className={`font-mono font-bold text-[11px] ${vessel.mmsi ? 'text-sky-400' : 'text-rose-400'}`}>
                {vessel.mmsi ? vessel.mmsi : 'NO AIS SIGNAL'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10.5px] pt-1 border-t border-slate-800">
            <span className="text-slate-400">Reported Name:</span>
            <span className="text-slate-200 font-medium">
              {vessel.name || (isDark ? 'Unidentified Contact' : 'Commercial Vessel')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-slate-400">Estimated Type:</span>
            <span className="text-slate-200 font-medium">{vessel.vesselType}</span>
          </div>
          {vessel.flag && (
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="text-slate-400">Flag State:</span>
              <span className="text-slate-200 font-medium">{vessel.flag}</span>
            </div>
          )}
        </div>

        {/* Maritime Jurisdiction Zone */}
        <div>
          <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase block mb-1">
            Maritime Jurisdiction Zone
          </span>
          <div className="flex items-center justify-between bg-[#111827] px-2.5 py-1.5 rounded border border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
              <span className="font-semibold text-slate-200">{zone.label}</span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">
              {zone.code === 'TERRITORIAL_SEA' ? '12 NM' : zone.code === 'EEZ' ? '200 NM' : 'HIGH SEAS'}
            </span>
          </div>
        </div>

        {/* Geographic Position */}
        <div className="grid grid-cols-2 gap-2 bg-[#111827] p-2 rounded border border-slate-800">
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase block font-medium">Latitude</span>
            <span className="font-mono text-slate-100 font-semibold">{vessel.lat.toFixed(4)}° N</span>
          </div>
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase block font-medium">Longitude</span>
            <span className="font-mono text-slate-100 font-semibold">{vessel.lon.toFixed(4)}° E</span>
          </div>
        </div>

        {/* Optical Sensor Sighting & AIS Association */}
        {(assocCamera || vessel.detectedByCamera) && (
          <div className="bg-[#101b2b] p-2.5 rounded border border-sky-900/60 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-sky-300 tracking-wide">
                OPTICAL FIX: {assocCamera?.id || vessel.detectedByCamera}
              </span>
              <span className="text-[8.5px] font-mono bg-sky-950 text-sky-300 border border-sky-800 px-1.5 py-0.5 rounded font-semibold">
                {isGeographicallyInCameraFov ? 'FOV VERIFIED' : 'OPTICAL SIGHTING'}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Sensor Station:</span>
                <span className="text-slate-200 font-medium">{assocCamera?.siteName || 'PSS Madras (CAM-04)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Station Range:</span>
                <span className="text-sky-300 font-mono font-medium">{cameraDistKm || '11.8'} km</span>
              </div>
              <div className="flex justify-between pt-0.5 border-t border-sky-950">
                <span className="text-slate-400">AIS Correlation:</span>
                <span
                  className={`font-mono font-bold ${
                    isDark ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {isDark ? 'NO MATCHING AIS' : `CORRELATED (${vessel.confidence || 94}% CONF)`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Telemetry (Heading, Speed) */}
        <div className="grid grid-cols-2 gap-2 text-slate-300 bg-[#111827] p-2 rounded border border-slate-800">
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-slate-400" style={{ transform: `rotate(${vessel.heading}deg)` }} />
            <span>Heading: <strong className="text-slate-100 font-mono">{vessel.heading}°</strong></span>
          </div>
          <div>
            <span>Speed: <strong className="text-slate-100 font-mono">{vessel.speed} kn</strong></span>
          </div>
        </div>

        {/* Regulatory Registry & Authorization Status */}
        {(() => {
          const registryEntry = checkAuthorisedRegistry(vessel.id, vessel.mmsi);
          const alt = vessel.altitude ?? 0;
          const maxAlt = registryEntry?.altitudeEnvelope.maxAltitudeMeters ?? 45;
          const isOut = Boolean(vessel.isOutOfEnvelope || alt > maxAlt);

          return (
            <div className="p-2 rounded bg-[#111827] border border-slate-800 text-[10px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 uppercase font-semibold text-[8.5px]">Registry Authority</span>
                {isDark ? (
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    DARK CONTACT
                  </span>
                ) : registryEntry ? (
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" />
                    <span>AUTHORISED</span>
                  </span>
                ) : (
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>UNREGISTERED</span>
                  </span>
                )}
              </div>
              {registryEntry && (
                <div className="flex justify-between text-slate-400">
                  <span>Permit:</span>
                  <span className="text-slate-200 font-mono text-[9px]">{registryEntry.organisation}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1">
                <span>Height Profile:</span>
                <span className={`font-mono text-[9px] ${isOut ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                  {isOut ? `FAIL: ${alt}m > ${maxAlt}m` : `PASS: ${alt}m`}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Dynamic Dark Vessel Re-Correlation (Scenario 3) */}
        {isDark && onSimulateAisMatch && (
          <button
            onClick={() => onSimulateAisMatch(vessel.id)}
            className="w-full mt-2 py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            title="Ingest live AIS transponder message to correlate this contact"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>INGEST MATCHING AIS TELEMETRY</span>
          </button>
        )}

        {/* Attribution Footnote */}
        <div className="pt-1 text-[8.5px] text-slate-500 flex items-center justify-between border-t border-slate-800">
          <span>Feed: {isDark ? 'Optical Video Observation' : 'AIS Receiver Stream'}</span>
          <span className="text-slate-400 font-mono">REVENANT-0</span>
        </div>
      </div>
    </DetailDrawer>
  );
};
