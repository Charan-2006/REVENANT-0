const { point: turfPoint, polygon: turfPolygon } = require('@turf/helpers');
const { booleanPointInPolygon } = require('@turf/boolean-point-in-polygon');

const demoArea = {
  id: 'RA-001',
  name: 'RESTRICTED AREA 01',
  status: 'ACTIVE',
  createdAt: '14:10 UTC',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [80.355, 13.080],
        [80.395, 13.080],
        [80.395, 13.118],
        [80.355, 13.118],
        [80.355, 13.080]
      ]
    ]
  }
};

function isInside(lon, lat, area) {
  const pt = turfPoint([lon, lat]);
  const poly = turfPolygon(area.geometry.coordinates);
  return booleanPointInPolygon(pt, poly);
}

// Test 1: Vessel inside (VSL-003: 80.38042, 13.11472)
const vslInside = isInside(80.38042, 13.11472, demoArea);
console.log('Test 1 (VSL-003 inside RA-001):', vslInside === true ? 'PASS' : 'FAIL');

// Test 2: Vessel outside (VSL-011 initial: 80.34313, 13.09368)
const vslOutside = isInside(80.34313, 13.09368, demoArea);
console.log('Test 2 (VSL-011 outside RA-001):', vslOutside === false ? 'PASS' : 'FAIL');

// Test 3: Dark vessel inside (DV-104: 80.37138, 13.09611)
const dvInside = isInside(80.37138, 13.09611, demoArea);
console.log('Test 3 (DV-104 inside RA-001):', dvInside === true ? 'PASS' : 'FAIL');

// Test 4: Transition simulation (Approaches -> Enters -> Exits)
const path = [
  { lon: 80.345, expected: false }, // outside
  { lon: 80.350, expected: false }, // outside
  { lon: 80.360, expected: true },  // inside -> ENTRY event
  { lon: 80.380, expected: true },  // inside
  { lon: 80.400, expected: false }, // outside -> EXIT event
];

let previousState = false;
let entryCount = 0;
let exitCount = 0;

path.forEach((step, i) => {
  const currentState = isInside(step.lon, 13.09368, demoArea);
  console.log(`Step ${i} (lon ${step.lon}): inside=${currentState}, expected=${step.expected}`);
  if (!previousState && currentState) {
    entryCount++;
    console.log('  -> DISPATCH EVENT: RESTRICTED AREA ENTRY');
  }
  if (previousState && !currentState) {
    exitCount++;
    console.log('  -> DISPATCH EVENT: RESTRICTED AREA EXIT');
  }
  previousState = currentState;
});

console.log('Test 4 (Transition Events):', entryCount === 1 && exitCount === 1 ? 'PASS' : 'FAIL');
