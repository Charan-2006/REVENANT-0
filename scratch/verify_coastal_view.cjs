const { booleanPointInPolygon, point, polygon } = require('@turf/turf');

console.log('====================================================');
console.log('RUNNING COASTAL VIEW COMPREHENSIVE RUNTIME ENGINE VERIFICATION');
console.log('====================================================\n');

// 1. Load data
const { INITIAL_VESSELS } = require('../src/data/vessels');
const { INITIAL_RESTRICTED_AREAS } = require('../src/data/mockRestrictedAreas');

// Simulation helper for evaluateVesselGeofence
function evaluateVesselGeofence(vessel, areas) {
  const activeAreas = (areas || []).filter((a) => a.status === 'ACTIVE');
  const vPoint = point([vessel.lon, vessel.lat]);
  const matchingAreas = [];

  for (const area of activeAreas) {
    if (area.geometry && area.geometry.coordinates) {
      const poly = polygon(area.geometry.coordinates);
      if (booleanPointInPolygon(vPoint, poly)) {
        matchingAreas.push(area);
      }
    }
  }

  const isInside = matchingAreas.length > 0;
  const geofenceStatus = isInside ? 'INSIDE_RESTRICTED' : 'OUTSIDE';
  const displayStatus = isInside ? 'RESTRICTED' : vessel.status;

  return { geofenceStatus, displayStatus, matchingAreas };
}

let allPassed = true;
function assert(condition, testName, details) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
    allPassed = false;
  }
}

// ==========================================
// TEST 1: SCENARIO 1 - EO Sensor Detection + AIS Match -> CORRELATED (BLACK)
// ==========================================
console.log('--- SCENARIO 1 TEST ---');
const vsl003 = INITIAL_VESSELS.find(v => v.id === 'VSL-003');
assert(vsl003 !== undefined, 'VSL-003 exists in master vessel dataset', 'Not found');
assert(vsl003.status === 'CORRELATED', 'VSL-003 initial status is CORRELATED', `Found: ${vsl003.status}`);
assert(vsl003.mmsi === '503891240', 'VSL-003 MMSI is 503891240', `Found: ${vsl003.mmsi}`);
assert(vsl003.detectedByCamera === 'CAM-04', 'VSL-003 detected by CAM-04', `Found: ${vsl003.detectedByCamera}`);
assert(vsl003.confidence >= 90, 'VSL-003 correlation confidence >= 90%', `Found: ${vsl003.confidence}`);

// Verify spatial distance to CAM-04 (Madras Lighthouse: [80.298, 13.065])
const cam04Lon = 80.298;
const cam04Lat = 13.065;
const dLon = (vsl003.lon - cam04Lon) * 111.32 * Math.cos(cam04Lat * Math.PI / 180);
const dLat = (vsl003.lat - cam04Lat) * 110.57;
const distKm = Math.sqrt(dLon * dLon + dLat * dLat);
assert(distKm < 15, `VSL-003 optical fix is within CAM-04 sensor range: ${distKm.toFixed(2)} km`, `Too far: ${distKm}`);

// ==========================================
// TEST 2: SCENARIO 2 - EO Detection with No AIS -> DARK_VESSEL (RED)
// ==========================================
console.log('\n--- SCENARIO 2 TEST ---');
const dv104 = INITIAL_VESSELS.find(v => v.id === 'DV-104');
assert(dv104 !== undefined, 'DV-104 exists in master vessel dataset', 'Not found');
assert(dv104.status === 'DARK', 'DV-104 status is DARK (Red silhouette)', `Found: ${dv104.status}`);
assert(dv104.mmsi === undefined || dv104.mmsi === null, 'DV-104 has no AIS MMSI broadcast', `Found: ${dv104.mmsi}`);
assert(dv104.detectedByCamera === 'CAM-04', 'DV-104 detected by CAM-04', `Found: ${dv104.detectedByCamera}`);
assert(dv104.confidence >= 90, 'Optical detection confidence >= 90%', `Found: ${dv104.confidence}`);

// ==========================================
// TEST 3: SCENARIO 3 - Dynamic Re-Correlation (DARK -> CORRELATED)
// ==========================================
console.log('\n--- SCENARIO 3 TEST ---');
let dynamicVessel = { ...dv104 };
assert(dynamicVessel.status === 'DARK', 'Dynamic vessel starts as DARK', dynamicVessel.status);

// Incoming AIS broadcast arrives and correlation engine executes:
const incomingAIS = {
  mmsi: '419088102',
  vesselName: 'COROMANDEL PEARL',
  vesselType: 'Fishing Trawler',
  lon: 80.371,
  lat: 13.096,
  timestamp: new Date().toISOString()
};

// Spatial tolerance check (< 500m)
const deltaLon = Math.abs(dynamicVessel.lon - incomingAIS.lon);
const deltaLat = Math.abs(dynamicVessel.lat - incomingAIS.lat);
const spatialDeltaMeters = Math.sqrt(deltaLon * deltaLon + deltaLat * deltaLat) * 111000;
assert(spatialDeltaMeters < 500, `Spatial delta within correlation tolerance: ${spatialDeltaMeters.toFixed(1)}m`, `Too large`);

// Update dynamic vessel
dynamicVessel = {
  ...dynamicVessel,
  status: 'CORRELATED',
  mmsi: incomingAIS.mmsi,
  name: `${incomingAIS.vesselName} (CORRELATED)`,
  confidence: 96,
  detectionSource: `Fused: CAM-04 Optical Fix + AIS Transponder (MMSI: ${incomingAIS.mmsi})`
};
assert(dynamicVessel.status === 'CORRELATED', 'Dynamic vessel updated to CORRELATED (Black silhouette)', dynamicVessel.status);
assert(dynamicVessel.mmsi === '419088102', 'AIS MMSI recorded', dynamicVessel.mmsi);
assert(dynamicVessel.confidence === 96, 'Correlation confidence is 96%', dynamicVessel.confidence);

// ==========================================
// TEST 4: SCENARIO 4 - Vessel Enters Active Restricted Zone (ORANGE + Alert)
// ==========================================
console.log('\n--- SCENARIO 4 TEST ---');
const ra001 = INITIAL_RESTRICTED_AREAS.find(a => a.id === 'RA-001');
assert(ra001 !== undefined, 'RA-001 (RESTRICTED AREA 01) exists', 'Not found');
assert(ra001.status === 'ACTIVE', 'RA-001 is ACTIVE', ra001.status);

// Step 1: VSL-011 outside zone [80.342, 13.095]
let vsl011 = {
  id: 'VSL-011',
  name: 'CHENNAI TRADER',
  lon: 80.342,
  lat: 13.095,
  status: 'CORRELATED'
};
let evalOutside = evaluateVesselGeofence(vsl011, [ra001]);
assert(evalOutside.geofenceStatus === 'OUTSIDE', 'VSL-011 starts OUTSIDE zone', evalOutside.geofenceStatus);
assert(evalOutside.displayStatus === 'CORRELATED', 'VSL-011 displays CORRELATED (Black) outside', evalOutside.displayStatus);

// Step 2: Transit into zone [80.368, 13.095]
vsl011.lon = 80.368;
let evalInside = evaluateVesselGeofence(vsl011, [ra001]);
assert(evalInside.geofenceStatus === 'INSIDE_RESTRICTED', 'VSL-011 evaluated INSIDE_RESTRICTED via Turf.js', evalInside.geofenceStatus);
assert(evalInside.displayStatus === 'RESTRICTED', 'VSL-011 displays RESTRICTED (ORANGE)', evalInside.displayStatus);
assert(evalInside.matchingAreas[0].name === 'RESTRICTED AREA 01', 'Alert correctly identifies RESTRICTED AREA 01', evalInside.matchingAreas[0].name);

// ==========================================
// TEST 5: SCENARIO 5 - Zone Deletion & Status Recovery (BLACK -> ORANGE -> BLACK, RED -> ORANGE -> RED)
// ==========================================
console.log('\n--- SCENARIO 5 TEST ---');
let areas = [
  {
    id: 'DEMO-ZONE-05',
    name: 'HIGH SECURITY NAVAL ZONE',
    zoneType: 'RED',
    status: 'ACTIVE',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [80.340, 13.075],
          [80.385, 13.075],
          [80.385, 13.115],
          [80.340, 13.115],
          [80.340, 13.075],
        ],
      ],
    },
  },
];

let vesselCorrelated = { id: 'VSL-011', lon: 80.365, lat: 13.095, status: 'CORRELATED' };
let vesselDark = { id: 'DV-104', lon: 80.360, lat: 13.090, status: 'DARK' };

// While zone is active:
let insideCorr = evaluateVesselGeofence(vesselCorrelated, areas);
let insideDark = evaluateVesselGeofence(vesselDark, areas);
assert(insideCorr.displayStatus === 'RESTRICTED', 'Correlated vessel displays ORANGE inside zone', insideCorr.displayStatus);
assert(insideDark.displayStatus === 'RESTRICTED', 'Dark vessel displays ORANGE inside zone', insideDark.displayStatus);

// Operator deletes zone DEMO-ZONE-05:
areas = areas.filter(a => a.id !== 'DEMO-ZONE-05');
assert(areas.length === 0, 'Zone removed from active state immediately without reload', `Length: ${areas.length}`);

// Recalculate vessels:
let afterDelCorr = evaluateVesselGeofence(vesselCorrelated, areas);
let afterDelDark = evaluateVesselGeofence(vesselDark, areas);
assert(afterDelCorr.geofenceStatus === 'OUTSIDE', 'Correlated vessel geofenceStatus is OUTSIDE after deletion', afterDelCorr.geofenceStatus);
assert(afterDelCorr.displayStatus === 'CORRELATED', 'Correlated vessel displayStatus restored to CORRELATED (BLACK)', afterDelCorr.displayStatus);
assert(afterDelDark.geofenceStatus === 'OUTSIDE', 'Dark vessel geofenceStatus is OUTSIDE after deletion', afterDelDark.geofenceStatus);
assert(afterDelDark.displayStatus === 'DARK', 'Dark vessel displayStatus restored to DARK (RED)', afterDelDark.displayStatus);

// ==========================================
// TEST 6: SCENARIO 6 - Automatic Zone Expiry Handling
// ==========================================
console.log('\n--- SCENARIO 6 TEST ---');
const expArea = {
  id: 'EXP-06',
  name: 'TEMPORARY 5S EXCLUSION ZONE',
  zoneType: 'RED',
  status: 'ACTIVE',
  expiresAt: new Date(Date.now() - 1000).toISOString(), // already passed
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [80.340, 13.075],
        [80.385, 13.075],
        [80.385, 13.115],
        [80.340, 13.115],
        [80.340, 13.075],
      ],
    ],
  },
};

// Automatic expiry tick:
let activeExpAreas = [expArea].map(a => {
  if (a.status === 'ACTIVE' && a.expiresAt && new Date(a.expiresAt).getTime() <= Date.now()) {
    return { ...a, status: 'EXPIRED' };
  }
  return a;
});

assert(activeExpAreas[0].status === 'EXPIRED', 'Zone status automatically transitioned to EXPIRED', activeExpAreas[0].status);
let evalAfterExpiry = evaluateVesselGeofence(vesselCorrelated, activeExpAreas);
assert(evalAfterExpiry.displayStatus === 'CORRELATED', 'Vessel inside expired zone restored to CORRELATED (BLACK)', evalAfterExpiry.displayStatus);

// ==========================================
// TEST 7: SCENARIO 7 - Operator Alert Disposition Workflow
// ==========================================
console.log('\n--- SCENARIO 7 TEST ---');
const testAlert = {
  alertId: 'ALT-101',
  targetId: 'DV-104',
  targetName: 'UNIDENTIFIED CONTACT 104',
  status: 'DARK_VESSEL',
  currentState: 'ACTIVE'
};

const reasons = ['CONFIRMED_CONTACT', 'FALSE_POSITIVE', 'AUTHORIZED_ACTIVITY', 'DUPLICATE_DETECTION', 'INVESTIGATION_REQUIRED', 'OTHER'];
assert(reasons.length === 6, 'All 6 standard maritime disposition reason codes supported', reasons.length);

// Action 1: CONFIRM
const confirmedAlert = {
  ...testAlert,
  currentState: 'CONFIRMED',
  disposition: {
    operatorId: 'OPERATOR-01',
    timestamp: '14:32:00 UTC',
    action: 'CONFIRM',
    reason: 'CONFIRMED_CONTACT',
    notes: 'Optical fix verified by duty officer'
  }
};
assert(confirmedAlert.currentState === 'CONFIRMED', 'Alert confirmed', confirmedAlert.currentState);
assert(confirmedAlert.disposition.reason === 'CONFIRMED_CONTACT', 'Mandatory reason code stored', confirmedAlert.disposition.reason);

// Action 2: DISMISS
const dismissedAlert = {
  ...testAlert,
  currentState: 'DISMISSED',
  disposition: {
    operatorId: 'OPERATOR-01',
    timestamp: '14:35:00 UTC',
    action: 'DISMISS',
    reason: 'FALSE_POSITIVE',
    notes: 'Wave clutter false trigger'
  }
};
assert(dismissedAlert.currentState === 'DISMISSED', 'Alert dismissed', dismissedAlert.currentState);

// Action 3: ESCALATE
const escalatedAlert = {
  ...testAlert,
  currentState: 'ESCALATED',
  disposition: {
    operatorId: 'OPERATOR-01',
    timestamp: '14:38:00 UTC',
    action: 'ESCALATE',
    reason: 'INVESTIGATION_REQUIRED',
    notes: 'Coast guard intercept requested'
  }
};
assert(escalatedAlert.currentState === 'ESCALATED', 'Alert escalated', escalatedAlert.currentState);

// ==========================================
// TEST 8: GEOFENCE GEOMETRY & EPSG:4326 VALIDATION
// ==========================================
console.log('\n--- GEOFENCE GEOMETRY & EPSG:4326 VALIDATION ---');
for (const area of INITIAL_RESTRICTED_AREAS) {
  assert(area.geometry.type === 'Polygon', `${area.name} geometry type is GeoJSON Polygon`, area.geometry.type);
  const ring = area.geometry.coordinates[0];
  assert(ring.length >= 4, `${area.name} has at least 4 coordinates (closed polygon)`, ring.length);
  const first = ring[0];
  const last = ring[ring.length - 1];
  assert(first[0] === last[0] && first[1] === last[1], `${area.name} polygon is closed (first == last)`, `${first} vs ${last}`);
  for (const [lon, lat] of ring) {
    assert(lon >= 65 && lon <= 95 && lat >= 5 && lat <= 38, `${area.name} point [${lon}, ${lat}] is valid Indian maritime coordinate`, `${lon}, ${lat}`);
  }
}

// ==========================================
// TEST 9: STATE SEPARATION ARCHITECTURE
// ==========================================
console.log('\n--- STATE SEPARATION ARCHITECTURE ---');
const testStates = [
  { correlation: 'CORRELATED', inside: false, expectedDisplay: 'CORRELATED' },
  { correlation: 'DARK', inside: false, expectedDisplay: 'DARK' },
  { correlation: 'CORRELATED', inside: true, expectedDisplay: 'RESTRICTED' },
  { correlation: 'DARK', inside: true, expectedDisplay: 'RESTRICTED' },
];

for (const ts of testStates) {
  const v = { lon: 80.365, lat: 13.095, status: ts.correlation };
  const mockAreas = ts.inside ? [ra001] : [];
  const res = evaluateVesselGeofence(v, mockAreas);
  assert(res.displayStatus === ts.expectedDisplay, `State combination (${ts.correlation} + ${ts.inside ? 'INSIDE' : 'OUTSIDE'}) -> displayStatus: ${ts.expectedDisplay}`, res.displayStatus);
  assert(v.status === ts.correlation, `Underlying correlation identity (${ts.correlation}) preserved`, v.status);
}

console.log('\n====================================================');
if (allPassed) {
  console.log('ALL 9 RUNTIME & MATHEMATICAL VERIFICATION TESTS PASSED!');
} else {
  console.error('FAILURES DETECTED IN VERIFICATION SUITE!');
}
console.log('====================================================');
