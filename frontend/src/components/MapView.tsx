import React, { useEffect, useRef, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Vessel } from '../data/vessels';
import { MOCK_CAMERAS } from '../data/mockCameras';
import { EOCamera, RestrictedArea, PatrolUnit } from '../types/maritime';
import { VesselLayerController } from '../map/VesselLayer';
import { MaritimeBoundaryLayerController } from '../map/MaritimeBoundaryLayer';
import { CameraLayerController } from '../map/CameraLayer';
import { RestrictedAreaLayerController } from '../map/RestrictedAreaLayer';
import { PatrolLayerController, InterceptVectorData } from '../map/PatrolLayer';
import { MapLayersState } from './LayerControlPopover';

interface MapViewProps {
  vessels: Vessel[];
  selectedVesselId: string | null;
  selectedCamera: EOCamera | null;
  onSelectVessel: (vessel: Vessel | null) => void;
  onSelectCamera: (camera: EOCamera | null) => void;
  onCursorMove: (pos: { lat: number; lon: number }) => void;
  onZoomChange: (zoom: number) => void;
  mapInstanceRef: React.MutableRefObject<maplibregl.Map | null>;
  layers: MapLayersState;

  // Tactical Coastal Patrol Units & Intercept Route
  patrolUnits?: PatrolUnit[];
  selectedPatrolId?: string | null;
  activeIntercept?: InterceptVectorData | null;
  onSelectPatrol?: (patrol: PatrolUnit | null) => void;

  // Restricted Area Features
  restrictedAreas: RestrictedArea[];
  selectedRestrictedArea: RestrictedArea | null;
  onSelectRestrictedArea: (area: RestrictedArea | null) => void;
  isDrawingRestricted: boolean;
  pendingPolygonCoords?: [number, number][] | null;
  onDrawingComplete: (coords: [number, number][]) => void;
  onDrawingCancel: () => void;
  onFinishDrawingRef?: React.MutableRefObject<(() => void) | null>;
  drawPointCount?: number;
  onPointCountChange?: (count: number) => void;
  onDrawPointsChange?: (points: [number, number][]) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  vessels,
  selectedVesselId,
  selectedCamera,
  onSelectVessel,
  onSelectCamera,
  onCursorMove,
  onZoomChange,
  mapInstanceRef,
  layers,
  patrolUnits = [],
  selectedPatrolId = null,
  activeIntercept = null,
  onSelectPatrol,
  restrictedAreas,
  selectedRestrictedArea,
  onSelectRestrictedArea,
  isDrawingRestricted,
  pendingPolygonCoords,
  onDrawingComplete,
  onDrawingCancel,
  onFinishDrawingRef,
  onPointCountChange,
  onDrawPointsChange,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const vesselControllerRef = useRef<VesselLayerController | null>(null);
  const boundaryControllerRef = useRef<MaritimeBoundaryLayerController | null>(null);
  const cameraControllerRef = useRef<CameraLayerController | null>(null);
  const restrictedControllerRef = useRef<RestrictedAreaLayerController | null>(null);
  const patrolControllerRef = useRef<PatrolLayerController | null>(null);

  // Esri World Imagery (Terrain, bathymetry, coastlines)
  const getTileSources = useCallback(() => {
    return {
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 18,
    };
  }, []);

  // Refs to avoid stale closures in MapLibre event listeners
  const onSelectVesselRef = useRef(onSelectVessel);
  onSelectVesselRef.current = onSelectVessel;

  const onSelectCameraRef = useRef(onSelectCamera);
  onSelectCameraRef.current = onSelectCamera;

  const onSelectRestrictedAreaRef = useRef(onSelectRestrictedArea);
  onSelectRestrictedAreaRef.current = onSelectRestrictedArea;

  const onSelectPatrolRef = useRef(onSelectPatrol);
  onSelectPatrolRef.current = onSelectPatrol;

  const onDrawingCompleteRef = useRef(onDrawingComplete);
  onDrawingCompleteRef.current = onDrawingComplete;

  const onDrawingCancelRef = useRef(onDrawingCancel);
  onDrawingCancelRef.current = onDrawingCancel;

  const onDrawPointsChangeRef = useRef(onDrawPointsChange);
  onDrawPointsChangeRef.current = onDrawPointsChange;

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;

    const baseSource = getTileSources();

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          'base-raster': {
            type: 'raster',
            ...baseSource,
          },
        },
        layers: [
          {
            id: 'base-layer',
            type: 'raster',
            source: 'base-raster',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [79.2000, 15.6000], // Full Indian Subcontinent coastline (Gujarat to Bengal, Lakshadweep & Sri Lanka)
      zoom: 4.7,
      minZoom: 2,
      maxZoom: 18,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    map.on('mousemove', (e: any) => {
      onCursorMove({ lat: e.lngLat.lat, lon: e.lngLat.lng });
      if (restrictedControllerRef.current && onPointCountChange) {
        onPointCountChange(restrictedControllerRef.current.getDrawPointCount());
      }
    });

    map.on('zoom', () => {
      onZoomChange(map.getZoom());
    });

    // Map click: cooperative deselect and precise proximity hit testing
    map.on('click', (e: any) => {
      if (restrictedControllerRef.current?.getIsDrawing()) return;
      if (e._cameraClicked || e._vesselClicked || e._patrolClicked || e._areaClicked) return;

      const clickBox: [maplibregl.PointLike, maplibregl.PointLike] = [
        [e.point.x - 10, e.point.y - 10],
        [e.point.x + 10, e.point.y + 10],
      ];

      const cameraLayers = ['camera-stations-core', 'camera-stations-halo', 'camera-stations-lens', 'camera-stations-labels'].filter((l) => map.getLayer(l));
      const cameraFeatures = cameraLayers.length ? map.queryRenderedFeatures(clickBox, { layers: cameraLayers }) : [];

      if (cameraFeatures.length > 0) {
        const camId = cameraFeatures[0].properties?.id;
        const cam = MOCK_CAMERAS.find((c) => c.id === camId) as EOCamera | undefined;
        if (cam) {
          if (onSelectCameraRef.current) onSelectCameraRef.current(cam);
          return;
        }
      }

      const vesselFeatures = map.getLayer('vessels-layer') ? map.queryRenderedFeatures(clickBox, { layers: ['vessels-layer'] }) : [];
      const patrolFeatures = map.getLayer('patrol-units-layer') ? map.queryRenderedFeatures(clickBox, { layers: ['patrol-units-layer'] }) : [];
      const areaFeatures = map.getLayer('restricted-areas-fill') ? map.queryRenderedFeatures(e.point, { layers: ['restricted-areas-fill'] }) : [];

      if (cameraFeatures.length === 0 && vesselFeatures.length === 0 && patrolFeatures.length === 0 && areaFeatures.length === 0) {
        if (onSelectVesselRef.current) onSelectVesselRef.current(null);
        if (onSelectCameraRef.current) onSelectCameraRef.current(null);
        if (onSelectPatrolRef.current) onSelectPatrolRef.current(null);
        if (onSelectRestrictedAreaRef.current) onSelectRestrictedAreaRef.current(null);
      }
    });

    map.on('load', async () => {
      // 1. Initialize Maritime Boundaries (Global EEZ WMS, India EEZ Vector, 12 NM Territorial Sea)
      const boundaryController = new MaritimeBoundaryLayerController({ map });
      boundaryController.init();
      boundaryControllerRef.current = boundaryController;

      // 2. Initialize Coastal EO Cameras & FOVs (only selected camera shows FOV)
      const cameraController = new CameraLayerController({
        map,
        cameras: MOCK_CAMERAS,
        onSelectCamera: (cam) => {
          if (onSelectCameraRef.current) onSelectCameraRef.current(cam);
        },
      });
      await cameraController.init();
      cameraController.setSelectedCamera(selectedCamera);
      cameraControllerRef.current = cameraController;

      // 3. Initialize Map-Native Vessel Tracking Layer (8–18px symbols, clusters, tracks)
      const vesselController = new VesselLayerController({
        map,
        vessels,
        onSelectVessel: (vsl) => {
          if (onSelectVesselRef.current) onSelectVesselRef.current(vsl);
        },
      });
      await vesselController.init();
      vesselController.setSelectedVessel(selectedVesselId);
      vesselControllerRef.current = vesselController;

      // 4. Initialize Tactical Coastal Patrol Fleet Layer (Interceptors, Intercept Route, Status Rings)
      const patrolController = new PatrolLayerController({
        map,
        patrolUnits,
        onSelectPatrol: (patrol) => {
          if (onSelectPatrolRef.current) onSelectPatrolRef.current(patrol);
        },
      });
      await patrolController.init();
      patrolController.setInterceptVector(activeIntercept);
      patrolController.setSelectedPatrol(selectedPatrolId);
      patrolControllerRef.current = patrolController;

      // 5. Initialize Restricted Areas Layer (GeoJSON polygon, free-draw tool)
      const restrictedController = new RestrictedAreaLayerController({
        map,
        restrictedAreas,
        onSelectArea: (area) => {
          if (onSelectRestrictedAreaRef.current) onSelectRestrictedAreaRef.current(area);
        },
        onDrawingComplete: (coords) => {
          if (onDrawingCompleteRef.current) onDrawingCompleteRef.current(coords);
        },
        onDrawingCancel: () => {
          if (onDrawingCancelRef.current) onDrawingCancelRef.current();
        },
        onDrawPointsChange: (pts) => {
          if (onDrawPointsChangeRef.current) onDrawPointsChangeRef.current(pts);
        },
      });
      restrictedController.init();
      restrictedControllerRef.current = restrictedController;

      if (onFinishDrawingRef) {
        onFinishDrawingRef.current = () => {
          restrictedController.finishDrawing();
        };
      }

      // Apply initial layer toggles
      boundaryController.setEezVisible(layers.eez);
      boundaryController.setTerritorialSeaVisible(layers.territorialSea);
      boundaryController.setContiguousZoneVisible(layers.contiguousZone);
      cameraController.setVisibility(layers.cameras);
      vesselController.setVisibility(layers.vessels);
      patrolController.setVisibility(layers.patrolUnits !== false);
    });

    return () => {
      // Stop the patrol tactical animation loop before the map is torn down.
      patrolControllerRef.current?.destroy();
      map.remove();
      mapInstanceRef.current = null;
      vesselControllerRef.current = null;
      boundaryControllerRef.current = null;
      cameraControllerRef.current = null;
      patrolControllerRef.current = null;
      restrictedControllerRef.current = null;
    };
  }, []);

  // Update vessels when dataset changes
  useEffect(() => {
    if (vesselControllerRef.current) {
      vesselControllerRef.current.updateVessels(vessels);
    }
  }, [vessels]);

  // Update selected vessel
  useEffect(() => {
    if (vesselControllerRef.current) {
      vesselControllerRef.current.setSelectedVessel(selectedVesselId);
    }
  }, [selectedVesselId]);

  // Update selected camera
  useEffect(() => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.setSelectedCamera(selectedCamera);
      cameraControllerRef.current.bringToFront();
    }
  }, [selectedCamera]);

  // Update restricted areas
  useEffect(() => {
    if (restrictedControllerRef.current) {
      restrictedControllerRef.current.updateAreas(restrictedAreas);
    }
  }, [restrictedAreas]);

  // Toggle drawing mode
  useEffect(() => {
    if (restrictedControllerRef.current) {
      if (isDrawingRestricted) {
        restrictedControllerRef.current.startDrawing();
      } else {
        restrictedControllerRef.current.stopDrawing();
      }
    }
    if (vesselControllerRef.current) {
      vesselControllerRef.current.setIsDrawing(isDrawingRestricted);
    }
    if (cameraControllerRef.current) {
      cameraControllerRef.current.setIsDrawing(isDrawingRestricted);
    }
  }, [isDrawingRestricted]);

  // Clear draw preview when pending coordinates are cleared (after save or cancel)
  useEffect(() => {
    if (restrictedControllerRef.current && !pendingPolygonCoords) {
      restrictedControllerRef.current.clearDrawPreview();
    }
  }, [pendingPolygonCoords]);

  // Update patrol units when dataset changes
  useEffect(() => {
    if (patrolControllerRef.current) {
      patrolControllerRef.current.updatePatrolUnits(patrolUnits);
    }
  }, [patrolUnits]);

  // Update tactical intercept vector route
  useEffect(() => {
    if (patrolControllerRef.current) {
      patrolControllerRef.current.setInterceptVector(activeIntercept);
    }
  }, [activeIntercept]);

  // Sync operator patrol selection ring
  useEffect(() => {
    if (patrolControllerRef.current) {
      patrolControllerRef.current.setSelectedPatrol(selectedPatrolId);
    }
  }, [selectedPatrolId]);

  // Sync layer toggles dynamically
  useEffect(() => {
    if (boundaryControllerRef.current) {
      boundaryControllerRef.current.setEezVisible(layers.eez);
      boundaryControllerRef.current.setTerritorialSeaVisible(layers.territorialSea);
      boundaryControllerRef.current.setContiguousZoneVisible(layers.contiguousZone);
    }
    if (cameraControllerRef.current) {
      cameraControllerRef.current.setVisibility(layers.cameras);
    }
    if (vesselControllerRef.current) {
      vesselControllerRef.current.setVisibility(layers.vessels);
    }
    if (patrolControllerRef.current) {
      patrolControllerRef.current.setVisibility(layers.patrolUnits !== false);
    }
  }, [layers]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};
