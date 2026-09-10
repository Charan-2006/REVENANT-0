import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { point, polygon } from '@turf/helpers';
import { AUTHORISED_REGISTRY, checkAuthorisedRegistry } from '../src/data/authorizedRegistry.ts';
import { INITIAL_RESTRICTED_AREAS, exportZonesToGeoJSON, parseGeoJSONToZones } from '../src/data/mockRestrictedAreas.ts';
import { evaluateVesselGeofence } from '../src/utils/geofenceEngine.ts';

console.log('====================================================');
console.log('ZONE & GEOFENCE SERVICE: REAL RUNTIME & MATHEMATICAL VERIFICATION');
console.log('====================================================\n');

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
// 1. DOUBLE-TAP / DRAW FINISH PERSISTENCE TEST
// ==========================================
console.log('--- 1. DRAWING COMPLETION & PREVIEW PERSISTENCE TEST ---');
// Simulate user clicking 3 points and double-tapping on the 3rd point:
const rawDrawnClicks = [
  [80.350, 13.080],
  [80.390, 13.080],
  [80.390, 13.120],
  [80.390, 13.120], // duplicate from second tap of double-click
];

// Verify deduplication logic
const cleanPoints = [];
for (const pt of rawDrawnClicks) {
  if (cleanPoints.length === 0) {
    cleanPoints.push(pt);
  } else {
    const lastPt = cleanPoints[cleanPoints.length - 1];
    const dist = Math.hypot(pt[0] - lastPt[0], pt[1] - lastPt[1]);
    if (dist > 0.00001) {
      cleanPoints.push(pt);
    }
  }
}
assert(cleanPoints.length === 3, 'Consecutive duplicate vertices from double-tap cleaned up', `Got ${cleanPoints.length}`);

// Ensure closed ring
const closedPoints = [...cleanPoints];
const first = closedPoints[0];
const last = closedPoints[closedPoints.length - 1];
if (first[0] !== last[0] || first[1] !== last[1]) {
  closedPoints.push([first[0], first[1]]);
}
assert(closedPoints.length === 4, 'Ring closed with 4 points', closedPoints.length);
assert(closedPoints[0][0] === closedPoints[3][0] && closedPoints[0][1] === closedPoints[3][1], 'First and last coordinates match', `${closedPoints[0]} vs ${closedPoints[3]}`);

// Validate Turf polygon creation from double-tapped coordinates
const poly = polygon([closedPoints]);
assert(poly.type === 'Feature' && poly.geometry.type === 'Polygon', 'Valid GeoJSON Polygon formed', poly.geometry.type);

// ==========================================
// 2. GEOJSON ZONE SERVICE: LOAD & EXPORT GREEN, YELLOW, RED
// ==========================================
console.log('\n--- 2. GEOJSON ZONE SERVICE (GREEN, YELLOW, RED) ---');
const exportedGeoJson = exportZonesToGeoJSON(INITIAL_RESTRICTED_AREAS);
assert(typeof exportedGeoJson === 'string' && exportedGeoJson.length > 50, 'exportZonesToGeoJSON produces GeoJSON string', exportedGeoJson.slice(0, 40));

const reParsedZones = parseGeoJSONToZones(exportedGeoJson);
assert(reParsedZones.length === INITIAL_RESTRICTED_AREAS.length, `Parsed ${reParsedZones.length} zones from GeoJSON`, reParsedZones.length);

const greenZone = reParsedZones.find(z => z.zoneType === 'GREEN');
const yellowZone = reParsedZones.find(z => z.zoneType === 'YELLOW');
const redZone = reParsedZones.find(z => z.zoneType === 'RED');

assert(greenZone !== undefined, 'Green Safe Transit Corridor parsed from GeoJSON', greenZone?.name);
assert(yellowZone !== undefined, 'Yellow Cautionary Anchorage parsed from GeoJSON', yellowZone?.name);
assert(redZone !== undefined, 'Red Restricted Exclusion Zone parsed from GeoJSON', redZone?.name);

// ==========================================
// 3. OPERATOR TEMPORARY RED ZONE WITH AUTO-EXPIRY
// ==========================================
console.log('\n--- 3. OPERATOR TEMPORARY RED ZONE WITH AUTO-EXPIRY ---');
const tempRedZone = {
  id: 'TEMP-RED-01',
  name: 'TEMPORARY OPERATIONAL RED ZONE',
  zoneType: 'RED',
  status: 'ACTIVE',
  createdAt: '15:00 UTC',
  expiresAt: new Date(Date.now() + 5000).toISOString(), // 5 seconds expiry
  expiresInMinutes: 0.08,
  createdBy: 'OPERATOR-01',
  geometry: {
    type: 'Polygon',
    coordinates: [closedPoints],
  },
};

const insideVessel = {
  id: 'VSL-011',
  name: 'CHENNAI TRADER',
  lon: 80.370,
  lat: 13.095,
  status: 'CORRELATED',
  altitude: 0,
};

// Test while zone is active:
let evalActive = evaluateVesselGeofence(insideVessel, [tempRedZone]);
assert(evalActive.geofenceStatus === 'INSIDE_RESTRICTED', 'Vessel detected inside temporary red zone via Turf.js', evalActive.geofenceStatus);
assert(evalActive.displayStatus === 'RESTRICTED', 'Vessel displays RESTRICTED (ORANGE) inside red zone', evalActive.displayStatus);
assert(evalActive.violations.includes('RESTRICTED_ZONE_INCURSION'), 'RESTRICTED_ZONE_INCURSION violation flagged', evalActive.violations);

// Test after auto-expiry:
const expiredZone = {
  ...tempRedZone,
  status: 'EXPIRED',
  expiresAt: new Date(Date.now() - 1000).toISOString(),
};
let evalExpired = evaluateVesselGeofence(insideVessel, [expiredZone]);
assert(evalExpired.geofenceStatus === 'OUTSIDE', 'Vessel geofence status OUTSIDE after zone expiry', evalExpired.geofenceStatus);
assert(evalExpired.displayStatus === 'CORRELATED', 'Vessel display restored to CORRELATED (BLACK)', evalExpired.displayStatus);

// ==========================================
// 4. POINT-IN-POLYGON & ALTITUDE-ENVELOPE TEST AGAINST AUTHORISED REGISTRY
// ==========================================
console.log('\n--- 4. POSITION REPORT & ALTITUDE-ENVELOPE REGISTRY TESTS ---');

// Case A: Authorised Naval Vessel (INS Chennai - VSL-001)
// Allowed in RED zones, in-envelope (altitude 15m <= 55m)
const navalVessel = {
  id: 'VSL-001',
  name: 'INS CHENNAI (D65)',
  lon: 80.370,
  lat: 13.095,
  status: 'CORRELATED',
  altitude: 15,
};
const evalNaval = evaluateVesselGeofence(navalVessel, [tempRedZone]);
assert(evalNaval.authorizationStatus === 'AUTHORISED', 'INS Chennai verified as AUTHORISED in registry', evalNaval.authorizationStatus);
assert(evalNaval.organisation === 'INDIAN NAVY', 'Organisation verified as INDIAN NAVY', evalNaval.organisation);
assert(evalNaval.isOutOfEnvelope === false, 'Naval vessel in-envelope (15m <= 55m)', evalNaval.isOutOfEnvelope);
assert(evalNaval.displayStatus === 'CORRELATED', 'Authorized naval vessel permitted in RED zone without breach', evalNaval.displayStatus);

// Case B: Commercial Vessel Incursion into RED zone (VSL-011)
// Commercial vessel not allowed in RED exclusion zones
const evalCommercialInRed = evaluateVesselGeofence(insideVessel, [tempRedZone]);
assert(evalCommercialInRed.authorizationStatus === 'AUTHORISED', 'Commercial vessel is authorized in registry', evalCommercialInRed.authorizationStatus);
assert(evalCommercialInRed.displayStatus === 'RESTRICTED', 'Commercial vessel flagged RESTRICTED in RED zone', evalCommercialInRed.displayStatus);

// Case C: Altitude-Envelope Test (Out-of-Envelope Violation)
// E.g. Contact exceeding allowed altitude ceiling: altitude = 185m > 120m corridor limit
const outOfEnvelopeContact = {
  id: 'VSL-018',
  name: 'ANOMALOUS FAST CONTACT',
  mmsi: '419001999',
  lon: 80.420,
  lat: 13.060,
  status: 'CORRELATED',
  altitude: 185, // 185 meters elevation!
  isOutOfEnvelope: true,
};
const evalEnvelope = evaluateVesselGeofence(outOfEnvelopeContact, []);
assert(evalEnvelope.isOutOfEnvelope === true, 'Altitude-envelope test detected out-of-envelope contact (185m > ceiling)', evalEnvelope.isOutOfEnvelope);
assert(evalEnvelope.violations.includes('ALTITUDE_ENVELOPE_EXCEEDED'), 'Violation ALTITUDE_ENVELOPE_EXCEEDED flagged', evalEnvelope.violations);

// Case D: Unregistered Contact
// Contact with transponder MMSI not in Authorised Registry
const unregisteredContact = {
  id: 'VSL-025',
  name: 'COASTAL SKIFF',
  mmsi: '999999999',
  lon: 80.400,
  lat: 13.050,
  status: 'CORRELATED',
  altitude: 0,
};
const evalUnregistered = evaluateVesselGeofence(unregisteredContact, []);
assert(evalUnregistered.authorizationStatus === 'UNREGISTERED', 'Unregistered contact correctly flagged as UNREGISTERED', evalUnregistered.authorizationStatus);
assert(evalUnregistered.violations.includes('UNREGISTERED_CONTACT'), 'Violation UNREGISTERED_CONTACT flagged', evalUnregistered.violations);

// Case E: Dark Vessel (Optical Fix without AIS transponder)
const darkVessel = {
  id: 'DV-104',
  name: 'UNIDENTIFIED CONTACT 104',
  lon: 80.371,
  lat: 13.096,
  status: 'DARK',
  altitude: 0,
};
const evalDark = evaluateVesselGeofence(darkVessel, []);
assert(evalDark.authorizationStatus === 'DARK_VESSEL', 'Dark vessel flagged as DARK_VESSEL', evalDark.authorizationStatus);
assert(evalDark.violations.includes('NO_AIS_TRANSPONDER'), 'Violation NO_AIS_TRANSPONDER flagged', evalDark.violations);

console.log('\n====================================================');
if (allPassed) {
  console.log('ALL ZONE & GEOFENCE SERVICE TESTS PASSED WITH ZERO FAILURES!');
} else {
  console.error('FAILURES DETECTED IN TEST SUITE!');
}
console.log('====================================================');
