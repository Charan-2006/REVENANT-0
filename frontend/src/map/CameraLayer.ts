import * as maplibregl from 'maplibre-gl';
import { EOCamera } from '../types/maritime';
import { destinationPoint } from '../utils/geoUtils';

export interface CameraLayerOptions {
  map: maplibregl.Map;
  cameras: EOCamera[];
  onSelectCamera?: (camera: EOCamera | null) => void;
}

/**
 * Generates the FOV wedge polygon, range arc, and range label GeoJSON for a selected camera
 */
export function generateSelectedCameraFovGeoJSON(cam: EOCamera): GeoJSON.FeatureCollection {
  const steps = 32;
  const startAngle = cam.heading - cam.fov / 2;
  const endAngle = cam.heading + cam.fov / 2;
  const stepAngle = (endAngle - startAngle) / steps;

  const arcCoords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + i * stepAngle;
    const pt = destinationPoint(cam.lon, cam.lat, cam.rangeKm, angle);
    arcCoords.push(pt);
  }

  // 1. Sector polygon: [origin] + arcCoords + [origin]
  const polygonCoords: [number, number][] = [[cam.lon, cam.lat], ...arcCoords, [cam.lon, cam.lat]];

  // 2. Midpoint of range arc for distance label
  const midAngle = cam.heading;
  const rangeLabelPt = destinationPoint(cam.lon, cam.lat, cam.rangeKm * 0.95, midAngle);

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'fov-wedge-polygon',
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoords],
        },
        properties: {
          id: cam.id,
          name: cam.name,
          rangeKm: cam.rangeKm,
          heading: cam.heading,
          fov: cam.fov,
        },
      },
      {
        type: 'Feature',
        id: 'fov-outer-arc',
        geometry: {
          type: 'LineString',
          coordinates: arcCoords,
        },
        properties: {
          id: cam.id,
          rangeKm: cam.rangeKm,
        },
      },
      {
        type: 'Feature',
        id: 'fov-range-label',
        geometry: {
          type: 'Point',
          coordinates: rangeLabelPt,
        },
        properties: {
          label: `${cam.rangeKm} km`,
        },
      },
    ],
  };
}

export class CameraLayerController {
  private map: maplibregl.Map;
  private cameras: EOCamera[];
  private selectedCameraId: string | null = null;
  private onSelectCamera?: (camera: EOCamera | null) => void;
  private hoverPopup: maplibregl.Popup;
  private isInitialized = false;
  private isDrawing = false;

  constructor(options: CameraLayerOptions) {
    this.map = options.map;
    this.cameras = options.cameras;
    this.onSelectCamera = options.onSelectCamera;

    this.hoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, -12],
      className: 'camera-hover-popup',
    });
  }

  public setIsDrawing(drawing: boolean): void {
    this.isDrawing = drawing;
    if (drawing) {
      this.hoverPopup.remove();
    }
  }

  public async init(): Promise<void> {
    if (this.isInitialized || !this.map) return;

    // 1. Build GeoJSON FeatureCollection for all 87 DGLL NAIS Physical Shore Stations
    const cameraPointsGeoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: this.cameras.map((cam) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [cam.lon, cam.lat],
        },
        properties: {
          id: cam.id,
          stationCode: cam.stationCode || cam.id,
          siteName: cam.siteName || cam.name.replace(/^PSS\s+/i, ''),
          fullName: cam.fullName || cam.name,
          status: cam.status || 'REFERENCE',
          model: cam.model || 'Coastal Sensor Site',
          rangeKm: cam.rangeKm,
          heading: cam.heading,
          fov: cam.fov,
          rcc: cam.rcc || 'DGLL',
          state: cam.state || 'India',
          alolNo: cam.alolNo || '-',
          mmsi: cam.mmsi || '',
          communication: cam.communication || 'VSAT',
          detectionsCount: cam.detectionsCount || 0,
          lastFrame: cam.lastFrame || '05:00:00 GMT',
          associatedDetectionId: cam.associatedDetectionId || '',
          associatedAisId: cam.associatedAisId || '',
        },
      })),
    };

    // 2. Add GeoJSON Source
    if (!this.map.getSource('camera-stations-source')) {
      this.map.addSource('camera-stations-source', {
        type: 'geojson',
        data: cameraPointsGeoJSON,
        cluster: false,
      });
    }

    // 3. Add Dynamic FOV Sources
    if (!this.map.getSource('selected-camera-fov-source')) {
      this.map.addSource('selected-camera-fov-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!this.map.getSource('selected-camera-ring-source')) {
      this.map.addSource('selected-camera-ring-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    // 4. Add FOV Layers (Translucent Light Blue Fill, Dashed Perimeter, Range Arc & Distance Tag)
    if (!this.map.getLayer('camera-fov-fill')) {
      this.map.addLayer({
        id: 'camera-fov-fill',
        type: 'fill',
        source: 'selected-camera-fov-source',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': '#0ea5e9',
          'fill-opacity': 0.15,
        },
      });
    }

    if (!this.map.getLayer('camera-fov-outline')) {
      this.map.addLayer({
        id: 'camera-fov-outline',
        type: 'line',
        source: 'selected-camera-fov-source',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'line-color': '#38bdf8',
          'line-width': 1.2,
          'line-dasharray': [3, 2],
          'line-opacity': 0.85,
        },
      });
    }

    if (!this.map.getLayer('camera-fov-range-arc')) {
      this.map.addLayer({
        id: 'camera-fov-range-arc',
        type: 'line',
        source: 'selected-camera-fov-source',
        filter: ['==', '$type', 'LineString'],
        paint: {
          'line-color': '#0284c7',
          'line-width': 1.8,
          'line-opacity': 0.95,
        },
      });
    }

    if (!this.map.getLayer('camera-fov-range-label')) {
      this.map.addLayer({
        id: 'camera-fov-range-label',
        type: 'symbol',
        source: 'selected-camera-fov-source',
        filter: ['==', '$type', 'Point'],
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 9.5,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'text-anchor': 'bottom',
        },
        paint: {
          'text-color': '#7dd3fc',
          'text-halo-color': 'rgba(15, 23, 42, 0.95)',
          'text-halo-width': 1.5,
        },
      });
    }

    // 5. Add Selection Ring Layer
    if (!this.map.getLayer('selected-camera-ring')) {
      this.map.addLayer({
        id: 'selected-camera-ring',
        type: 'circle',
        source: 'selected-camera-ring-source',
        paint: {
          'circle-radius': 11.5,
          'circle-color': 'transparent',
          'circle-stroke-color': '#38bdf8',
          'circle-stroke-width': 2.0,
          'circle-stroke-opacity': 0.95,
        },
      });
    }

    // 6. Native WebGL High-Visibility Coastal Sensor Beacons (GUARANTEED TO RENDER ON ALL ZOOM LEVELS)
    // A) Outer glowing halo beacon (6px to 13px)
    if (!this.map.getLayer('camera-stations-halo')) {
      this.map.addLayer({
        id: 'camera-stations-halo',
        type: 'circle',
        source: 'camera-stations-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3.5, 5.0,
            6.0, 7.5,
            9.0, 10.5,
            13.0, 14.0
          ],
          'circle-color': [
            'match',
            ['get', 'status'],
            'DEMO ACTIVE',
            'rgba(14, 165, 233, 0.45)',
            /* default */ 'rgba(2, 132, 199, 0.28)',
          ],
          'circle-stroke-color': [
            'match',
            ['get', 'status'],
            'DEMO ACTIVE',
            '#38bdf8',
            /* default */ '#0ea5e9',
          ],
          'circle-stroke-width': 1.2,
          'circle-stroke-opacity': 0.85,
        },
      });
    }

    // B) Crisp Solid Center Sensor Body (3.5px to 8px)
    if (!this.map.getLayer('camera-stations-core')) {
      this.map.addLayer({
        id: 'camera-stations-core',
        type: 'circle',
        source: 'camera-stations-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3.5, 3.2,
            6.0, 4.5,
            9.0, 6.0,
            13.0, 8.0
          ],
          'circle-color': [
            'match',
            ['get', 'status'],
            'DEMO ACTIVE',
            '#0284c7',
            /* default */ '#0f172a',
          ],
          'circle-stroke-color': [
            'match',
            ['get', 'status'],
            'DEMO ACTIVE',
            '#38bdf8',
            /* default */ '#38bdf8',
          ],
          'circle-stroke-width': 1.5,
        },
      });
    }

    // C) Optical Lens Reflection Center Dot (1.2px to 3.2px)
    if (!this.map.getLayer('camera-stations-lens')) {
      this.map.addLayer({
        id: 'camera-stations-lens',
        type: 'circle',
        source: 'camera-stations-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3.5, 1.2,
            6.0, 1.8,
            9.0, 2.5,
            13.0, 3.2
          ],
          'circle-color': [
            'match',
            ['get', 'status'],
            'DEMO ACTIVE',
            '#ffffff',
            /* default */ '#7dd3fc',
          ],
        },
      });
    }

    // D) Clear Coastal Site Labels along the Indian Coastline
    if (!this.map.getLayer('camera-stations-labels')) {
      this.map.addLayer({
        id: 'camera-stations-labels',
        type: 'symbol',
        source: 'camera-stations-source',
        layout: {
          'text-field': ['get', 'siteName'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4.5, 8.0,
            7.0, 9.0,
            11.0, 10.5
          ],
          'text-offset': [0, 1.1],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'text-optional': true,
        },
        paint: {
          'text-color': '#f1f5f9',
          'text-halo-color': 'rgba(15, 23, 42, 0.98)',
          'text-halo-width': 1.8,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4.8, 0.70,
            6.0, 0.90,
            8.0, 1.0
          ],
        },
      });
    }

    this.bindEvents();
    this.isInitialized = true;
  }

  private bindEvents(): void {
    const interactiveLayers = ['camera-stations-core', 'camera-stations-halo'];

    interactiveLayers.forEach((layerId) => {
      // 1. Hover tooltip
      this.map.on('mouseenter', layerId, (e) => {
        if (this.isDrawing) return;
        this.map.getCanvas().style.cursor = 'pointer';
        if (!e.features || !e.features.length) return;

        const feature = e.features[0];
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const props = feature.properties;
        if (!props) return;

        const cameraId = props.id || 'CAM-01';
        const siteName = (props.siteName || props.name || 'COASTAL SITE').toUpperCase();
        const state = props.state || 'India';
        const rangeKm = props.rangeKm || 15;
        const heading = props.heading || 90;
        const isDemo = props.status === 'DEMO ACTIVE';

        const html = `
          <div class="maritime-camera-popup" style="font-family: ui-sans-serif, system-ui, sans-serif; min-width: 140px; padding: 6px 9px; border-radius: 6px; background: rgba(15, 23, 42, 0.96); border: 1px solid rgba(56, 189, 248, 0.6); box-shadow: 0 4px 16px rgba(0,0,0,0.6); backdrop-filter: blur(8px); line-height: 1.3;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <span style="font-family: ui-monospace, monospace; font-size: 10px; font-weight: 700; color: #38bdf8;">${cameraId}</span>
              <span style="font-size: 8px; font-weight: 700; color: ${isDemo ? '#38bdf8' : '#10b981'}; background: ${isDemo ? 'rgba(2, 132, 199, 0.3)' : 'rgba(6, 78, 59, 0.8)'}; border: 1px solid ${isDemo ? '#38bdf8' : 'rgba(16, 185, 129, 0.6)'}; padding: 1px 4px; border-radius: 3px;">
                ${isDemo ? 'PRIMARY EO' : 'COASTAL PSS'}
              </span>
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #f8fafc;">${siteName}</div>
            <div style="font-size: 9px; color: #94a3b8; margin-top: 1px;">${state} • Range: ${rangeKm} km • Azimuth: ${heading}°</div>
            <div style="font-size: 8.5px; color: #38bdf8; margin-top: 4px; border-top: 1px solid rgba(51, 65, 85, 0.8); padding-top: 3px; font-weight: 500;">
              Click to view optical coverage & observation feed
            </div>
          </div>
        `;

        this.hoverPopup.setLngLat(coordinates).setHTML(html).addTo(this.map);
      });

      this.map.on('mouseleave', layerId, () => {
        this.map.getCanvas().style.cursor = '';
        this.hoverPopup.remove();
      });

      // 2. Click handler
      this.map.on('click', layerId, (e) => {
        if (this.isDrawing) return;
        if (!e.features || !e.features.length) return;
        const id = e.features[0].properties?.id;
        const cam = this.cameras.find((c) => c.id === id) || null;

        this.setSelectedCamera(cam);
        if (this.onSelectCamera) {
          this.onSelectCamera(cam);
        }
      });
    });
  }

  /**
   * Sets or clears the active camera, updates FOV GeoJSON, and handles selection ring
   */
  public setSelectedCamera(cam: EOCamera | null): void {
    this.selectedCameraId = cam ? cam.id : null;
    if (!this.map || !this.map.isStyleLoaded()) return;

    const fovSource = this.map.getSource('selected-camera-fov-source') as maplibregl.GeoJSONSource;
    const ringSource = this.map.getSource('selected-camera-ring-source') as maplibregl.GeoJSONSource;

    if (!cam) {
      // Clear FOV and Selection Ring
      if (fovSource) fovSource.setData({ type: 'FeatureCollection', features: [] });
      if (ringSource) ringSource.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    // 1. Draw FOV GeoJSON (Polygon + Arc Line + Range Label)
    const fovGeoJSON = generateSelectedCameraFovGeoJSON(cam);
    if (fovSource) {
      fovSource.setData(fovGeoJSON);
    }

    // 2. Draw Selection Ring around the station
    if (ringSource) {
      ringSource.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [cam.lon, cam.lat],
            },
            properties: { id: cam.id },
          },
        ],
      });
    }

    // 3. Smoothly center and focus on the seaward viewing sector
    const focalPoint = destinationPoint(cam.lon, cam.lat, cam.rangeKm * 0.5, cam.heading);
    this.map.easeTo({
      center: focalPoint,
      zoom: 11.2,
      duration: 800,
    });
  }

  public setVisibility(visible: boolean): void {
    if (!this.map || !this.map.isStyleLoaded()) return;
    const val = visible ? 'visible' : 'none';

    [
      'camera-stations-halo',
      'camera-stations-core',
      'camera-stations-lens',
      'camera-stations-labels',
      'selected-camera-ring',
      'camera-fov-fill',
      'camera-fov-outline',
      'camera-fov-range-arc',
      'camera-fov-range-label',
    ].forEach((id) => {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', val);
      }
    });
  }
}
