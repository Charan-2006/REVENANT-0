import * as maplibregl from 'maplibre-gl';
import { EOCamera } from '../types/maritime';
import { destinationPoint } from '../utils/geoUtils';

export interface CameraLayerOptions {
  map: maplibregl.Map;
  cameras: EOCamera[];
  onSelectCamera?: (camera: EOCamera | null) => void;
}

/**
 * Creates a professional 28x28px ImageData fixed optical sensor silhouette image
 * Uses HTML5 Canvas for bulletproof WebGL texture rendering
 */
export function createCameraImageData(
  bodyColor: string,
  strokeColor: string,
  lensColor: string,
  size = 28
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.40;

  // Outer circular housing
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = bodyColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Inner sensor optic lens
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.50, 0, Math.PI * 2);
  ctx.fillStyle = lensColor;
  ctx.fill();

  // Optical highlight reflection
  ctx.beginPath();
  ctx.arc(cx - r * 0.16, cy - r * 0.16, r * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  return ctx.getImageData(0, 0, size, size);
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

  // 2. Midpoint of range arc for subtle distance label
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
      offset: [0, -10],
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

    // 1. Register Professional Sensor Markers synchronously via Canvas ImageData
    try {
      // Normal / Reference: Dark navy body, bright cyan border, high-visibility lens
      const normalImg = createCameraImageData('#0f172a', '#0284c7', '#38bdf8', 28);
      // Active Demo (e.g. PSS Madras): Slate body, vivid blue border, white lens
      const activeImg = createCameraImageData('#0369a1', '#38bdf8', '#ffffff', 28);
      // Selected highlight: Amber body, bright amber border, white center
      const selectedImg = createCameraImageData('#d97706', '#fbbf24', '#ffffff', 28);

      if (this.map.hasImage('camera-marker-normal')) this.map.removeImage('camera-marker-normal');
      this.map.addImage('camera-marker-normal', normalImg);

      if (this.map.hasImage('camera-marker-active')) this.map.removeImage('camera-marker-active');
      this.map.addImage('camera-marker-active', activeImg);

      if (this.map.hasImage('camera-marker-selected')) this.map.removeImage('camera-marker-selected');
      this.map.addImage('camera-marker-selected', selectedImg);
    } catch (e) {
      console.error('Failed to register camera canvas images', e);
    }

    // 2. Build GeoJSON FeatureCollection for all 87 DGLL NAIS Physical Shore Stations
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
          status: cam.status,
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

    // 3. Add GeoJSON Source (Direct individual rendering, no clustering)
    if (!this.map.getSource('camera-stations-source')) {
      this.map.addSource('camera-stations-source', {
        type: 'geojson',
        data: cameraPointsGeoJSON,
        cluster: false,
      });
    }

    // 6. Add Dynamic FOV Sources (Empty by default — only rendered when station selected)
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

    // 7. Add FOV Layers (Translucent Light Blue-Gray Fill, Thin Border, Range Arc & Distance Label)
    if (!this.map.getLayer('camera-fov-fill')) {
      this.map.addLayer({
        id: 'camera-fov-fill',
        type: 'fill',
        source: 'selected-camera-fov-source',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': '#0ea5e9',
          'fill-opacity': 0.10, // Very light translucent fill so seafloor bathymetry remains visible
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
          'line-width': 1.0,
          'line-dasharray': [3, 2],
          'line-opacity': 0.80,
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
          'line-width': 1.6,
          'line-opacity': 0.90,
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
          'text-size': 9,
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

    // 8. Add Subtle Selection Ring Layer around Selected Camera
    if (!this.map.getLayer('selected-camera-ring')) {
      this.map.addLayer({
        id: 'selected-camera-ring',
        type: 'circle',
        source: 'selected-camera-ring-source',
        paint: {
          'circle-radius': 9.5,
          'circle-color': 'transparent',
          'circle-stroke-color': '#38bdf8',
          'circle-stroke-width': 1.6,
          'circle-stroke-opacity': 0.90,
        },
      });
    }

    // 9. Add Camera Station Marker Symbol Layer (Direct individual sensor icons, 10–14px)
    // Label appears only at close zoom (minzoom 8.5) to keep map completely uncluttered
    if (!this.map.getLayer('camera-stations-layer')) {
      this.map.addLayer({
        id: 'camera-stations-layer',
        type: 'symbol',
        source: 'camera-stations-source',
        layout: {
          'icon-image': [
            'match',
            ['get', 'status'],
            'DEMO ACTIVE',
            'camera-marker-active',
            'SELECTED',
            'camera-marker-selected',
            /* default REFERENCE */ 'camera-marker-normal',
          ],
          'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3.5, 0.45, // ~13px
            5.0, 0.60, // ~17px
            7.5, 0.78, // ~22px
            11, 0.95,  // ~26px
            14, 1.0,   // ~28px
          ],
          'icon-anchor': 'center',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          // Labels shown only at close zoom to avoid crowding
          'text-field': ['get', 'siteName'],
          'text-size': 8.5,
          'text-offset': [0, 1.15],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'text-optional': true,
        },
        paint: {
          'text-color': '#cbd5e1',
          'text-halo-color': 'rgba(15, 23, 42, 0.95)',
          'text-halo-width': 1.5,
          // Fade in labels only at close zoom (zoom 8.5 to 9.5)
          'text-opacity': ['interpolate', ['linear'], ['zoom'], 7.8, 0, 8.5, 0.4, 9.5, 1.0],
        },
      });
    }

    this.bindEvents();
    this.isInitialized = true;
  }

  private bindEvents(): void {
    // 1. Station Hover: Compact, clean 3-line tooltip matching Part 15
    this.map.on('mouseenter', 'camera-stations-layer', (e) => {
      if (this.isDrawing) return;
      this.map.getCanvas().style.cursor = 'pointer';
      if (!e.features || !e.features.length) return;

      const feature = e.features[0];
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const props = feature.properties;
      if (!props) return;

      const cameraId = props.id || 'CAM-01';
      const siteName = (props.siteName || props.name || 'COASTAL SITE').toUpperCase();

      const html = `
        <div class="maritime-camera-popup" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 100px; padding: 5px 8px; border-radius: 4px; background: rgba(15, 23, 42, 0.96); border: 1px solid rgba(14, 165, 233, 0.6); box-shadow: 0 4px 14px rgba(0,0,0,0.5); line-height: 1.25; backdrop-filter: blur(8px);">
          <div style="font-family: ui-monospace, SFMono-Regular, monospace; font-size: 10px; font-weight: 700; color: #f1f5f9; letter-spacing: 0.04em;">${cameraId}</div>
          <div style="font-size: 8px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.06em; margin: 1px 0;">OPTICAL SENSOR</div>
          <div style="font-size: 8.5px; color: #94a3b8; font-weight: 500;">${siteName}</div>
        </div>
      `;

      this.hoverPopup.setLngLat(coordinates).setHTML(html).addTo(this.map);
    });

    this.map.on('mouseleave', 'camera-stations-layer', () => {
      this.map.getCanvas().style.cursor = '';
      this.hoverPopup.remove();
    });

    // 2. Click on Station: Select camera, render FOV, notify callback
    this.map.on('click', 'camera-stations-layer', (e) => {
      if (this.isDrawing) return;
      if (!e.features || !e.features.length) return;
      const id = e.features[0].properties?.id;
      const cam = this.cameras.find((c) => c.id === id) || null;

      this.setSelectedCamera(cam);
      if (this.onSelectCamera) {
        this.onSelectCamera(cam);
      }
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
      'camera-stations-layer',
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
