import React from 'react';
import { DetailDrawer } from './DetailDrawer';
import { EOCamera } from '../types/maritime';
import { Vessel } from '../data/vessels';
import { getDistanceMeters, isPointInFov } from '../utils/geoUtils';
import { X, Video, Compass, Radio, ExternalLink } from 'lucide-react';

interface CameraPopupCardProps {
  camera: EOCamera | null;
  onClose: () => void;
  onViewEo: (camera: EOCamera) => void;
  vessels?: Vessel[];
}

export const CameraPopupCard: React.FC<CameraPopupCardProps> = ({
  camera,
  onClose,
  onViewEo,
  vessels = [],
}) => {
  if (!camera) return null;

  const siteTitle = camera.siteName || camera.name.replace(/^PSS\s+/i, '');
  const isDemoActive = camera.status === 'DEMO ACTIVE';
  const observationRadiusKm = camera.rangeKm || 15;

  // Geographically calculate vessels within observation radius & FOV
  const nearbyVessels = React.useMemo(() => {
    if (!camera || !vessels.length) return [];
    return vessels.filter((v) => {
      const distM = getDistanceMeters(camera.lon, camera.lat, v.lon, v.lat);
      return distM <= observationRadiusKm * 1000;
    });
  }, [camera, vessels, observationRadiusKm]);

  const fovVessels = React.useMemo(() => {
    if (!camera || !vessels.length) return [];
    return vessels.filter((v) =>
      isPointInFov(
        camera.lat,
        camera.lon,
        v.lat,
        v.lon,
        camera.heading,
        camera.fov,
        observationRadiusKm
      )
    );
  }, [camera, vessels, observationRadiusKm]);

  const aisNearby = nearbyVessels.filter((v) => v.status === 'CORRELATED').length;
  const darkNearby = nearbyVessels.filter((v) => v.status === 'DARK').length;

  const aisInFov = fovVessels.filter((v) => v.status === 'CORRELATED');
  const darkInFov = fovVessels.filter((v) => v.status === 'DARK');


  return (
    <DetailDrawer
      isOpen={!!camera}
      onClose={onClose}
      title={`EO CAMERA • ${siteTitle}`}
      badge={camera.id}
      icon={
        <span
          className={`w-2 h-2 rounded-full ${
            isDemoActive ? 'bg-sky-500 animate-pulse' : 'bg-slate-400'
          }`}
        />
      }
    >

      {/* 2. Official Designation Banner */}
      <div className="px-3 py-1 bg-slate-100 border-b border-slate-200 text-[10px] text-slate-700 flex items-center justify-between font-medium">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-sky-600" />
          <span>Coastal Sensor Site • Physical Shore Station</span>
        </div>
        <span className="text-[9px] font-mono font-bold text-slate-500">{camera.state || 'India'}</span>
      </div>

      {/* 3. Sensor Metadata Body */}
      <div className="p-3 space-y-2.5 text-[11px]">
        {/* Network and Source Information */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-200/80">
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase block font-semibold">Network</span>
            <span className="font-bold text-slate-800 text-[10.5px]">DGLL NAIS</span>
          </div>
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase block font-semibold">Source</span>
            <a
              href={camera.sourceUrl || 'https://www.dgll.gov.in/about-DGLL/Service-reminders/nais'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-0.5"
            >
              <span>dgll.gov.in</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase block font-semibold">Site Type</span>
            <span className="text-slate-700">Shore Station (PSS)</span>
          </div>
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase block font-semibold">Data Status</span>
            <span className="font-medium text-slate-600">Public Reference</span>
          </div>
        </div>

        {/* Geographic Coordinates */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-200/80">
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase block font-semibold">Latitude</span>
            <span className="font-mono text-slate-800 font-bold">
              {camera.lat.toFixed(4)}° N
            </span>
            {camera.rawLat && (
              <span className="text-[8.5px] text-slate-400 font-mono block">{camera.rawLat}</span>
            )}
          </div>
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase block font-semibold">Longitude</span>
            <span className="font-mono text-slate-800 font-bold">
              {camera.lon.toFixed(4)}° E
            </span>
            {camera.rawLon && (
              <span className="text-[8.5px] text-slate-400 font-mono block">{camera.rawLon}</span>
            )}
          </div>
        </div>

        {/* Demonstration View Parameters: Heading, FOV, Range */}
        <div className="bg-sky-50/70 p-2 rounded border border-sky-100">
          <div className="text-[9px] text-sky-800 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Demo View Parameters</span>
            <span className="text-[8px] text-sky-600 font-normal">Seaward Orientation</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-white/80 p-1 rounded border border-sky-100">
              <span className="text-[8px] text-slate-400 uppercase block font-semibold">Heading</span>
              <div className="flex items-center justify-center gap-0.5 mt-0.5 font-mono font-bold text-slate-700">
                <Compass
                  className="w-3 h-3 text-sky-600"
                  style={{ transform: `rotate(${camera.heading}deg)` }}
                />
                <span>{camera.heading.toString().padStart(3, '0')}°</span>
              </div>
            </div>
            <div className="bg-white/80 p-1 rounded border border-sky-100">
              <span className="text-[8px] text-slate-400 uppercase block font-semibold">FOV Angle</span>
              <span className="font-mono font-bold text-slate-700 block mt-0.5">{camera.fov}°</span>
            </div>
            <div className="bg-white/80 p-1 rounded border border-sky-100">
              <span className="text-[8px] text-slate-400 uppercase block font-semibold">Range</span>
              <span className="font-mono font-bold text-sky-700 block mt-0.5">
                {camera.rangeKm} km
              </span>
            </div>
          </div>
        </div>

        {/* Geographic Nearby Vessels Calculation (Configurable Observation Radius) */}
        <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[10px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
              Nearby Vessels ({observationRadiusKm} km)
            </span>
            <span className="text-[8.5px] font-mono font-semibold text-slate-500">
              {nearbyVessels.length > 0 ? 'Contacts in Range' : 'Clear'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              AIS-Correlated:
            </span>
            <span className="font-mono font-medium text-slate-600">
              {aisNearby > 0 ? 'Active' : 'None'}
            </span>
          </div>
          <div className="flex items-center justify-between text-rose-700">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              Dark Detections:
            </span>
            <span className="font-mono font-medium text-rose-600">
              {darkNearby > 0 ? 'Active' : 'None'}
            </span>
          </div>
        </div>

        {/* Vessels Geographically Located Inside Camera FOV */}
        {fovVessels.length > 0 && (
          <div className="bg-sky-50/70 p-2 rounded border border-sky-200 text-[10px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-sky-800 uppercase tracking-wider">
                Inside FOV Wedge
              </span>
              <span className="text-[8px] font-mono text-sky-600 uppercase font-semibold">Angular Verified</span>
            </div>
            {darkInFov.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-rose-700 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Dark: <strong>{v.id}</strong>
                </span>
                <span className="text-[8.5px] font-mono bg-rose-100 text-rose-800 px-1 py-0.5 rounded font-semibold">
                  AIS: NO MATCH
                </span>
              </div>
            ))}
            {aisInFov.slice(0, 3).map((v) => (
              <div key={v.id} className="flex items-center justify-between text-slate-700 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  AIS: <strong>{v.name}</strong>
                </span>
                <span className="text-[8.5px] font-mono bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-semibold">
                  MATCHED
                </span>
              </div>
            ))}
            {aisInFov.length > 3 && (
              <div className="text-[8.5px] text-slate-500 text-right font-medium">
                Additional AIS vessels in FOV
              </div>
            )}
          </div>
        )}

        {/* Public Data Disclaimer Notice */}
        <div className="text-[8.5px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200 leading-tight">
          <span className="font-semibold text-slate-600">Disclaimer:</span> Public reference location from DGLL NAIS. Demonstration EO sensor model only; not an operational or live military feed.
        </div>

        {/* Primary Action: VIEW EO BUTTON */}
        <button
          onClick={() => onViewEo(camera)}
          className="w-full mt-1 flex items-center justify-center gap-2 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded font-semibold text-[11px] shadow-sm transition-all active:scale-[0.98]"
        >
          <Video className="w-3.5 h-3.5" />
          <span>VIEW EO OBSERVATION</span>
        </button>
      </div>
    </DetailDrawer>
  );
};
