/**
 * Geographic utility calculations for maritime GIS operations
 */

const EARTH_RADIUS_KM = 6371.0;

// Convert degrees to radians
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Convert radians to degrees
function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Calculates destination point given distance (km) and bearing (deg) from origin
 */
export function destinationPoint(
  lon: number,
  lat: number,
  distanceKm: number,
  bearingDeg: number
): [number, number] {
  const dByR = distanceKm / EARTH_RADIUS_KM;
  const lat1 = toRad(lat);
  const lon1 = toRad(lon);
  const brng = toRad(bearingDeg);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dByR) +
    Math.cos(lat1) * Math.sin(dByR) * Math.cos(brng)
  );

  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(dByR) * Math.cos(lat1),
    Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat2)
  );

  return [Number(toDeg(lon2).toFixed(6)), Number(toDeg(lat2).toFixed(6))];
}

/**
 * Generates an EO camera field-of-view wedge polygon (pointing towards sea)
 */
export function generateFovWedge(
  lon: number,
  lat: number,
  headingDeg: number,
  fovDeg: number,
  rangeKm: number,
  steps: number = 24
): [number, number][] {
  const coords: [number, number][] = [[lon, lat]];
  const startAngle = headingDeg - fovDeg / 2;
  const endAngle = headingDeg + fovDeg / 2;
  const stepAngle = (endAngle - startAngle) / steps;

  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + i * stepAngle;
    const pt = destinationPoint(lon, lat, rangeKm, angle);
    coords.push(pt);
  }

  // Close polygon back to origin
  coords.push([lon, lat]);
  return coords;
}

/**
 * Generates a circle polygon around a center point (e.g. 1,500m search radius)
 */
export function generateCirclePolygon(
  lon: number,
  lat: number,
  radiusMeters: number,
  steps: number = 36
): [number, number][] {
  const coords: [number, number][] = [];
  const radiusKm = radiusMeters / 1000;

  for (let i = 0; i < steps; i++) {
    const angle = (i * 360) / steps;
    const pt = destinationPoint(lon, lat, radiusKm, angle);
    coords.push(pt);
  }

  // Close ring
  coords.push(coords[0]);
  return coords;
}

/**
 * Format decimal coordinates to nautical DMS string: e.g. 8°31'07.68"N, 80°57'03.60"E
 */
export function formatCoordinatesDMS(lat: number, lon: number): string {
  const formatComponent = (val: number, posChar: string, negChar: string) => {
    const dir = val >= 0 ? posChar : negChar;
    const absVal = Math.abs(val);
    const deg = Math.floor(absVal);
    const minVal = (absVal - deg) * 60;
    const min = Math.floor(minVal);
    const sec = ((minVal - min) * 60).toFixed(2);
    return `${deg}°${min.toString().padStart(2, '0')}'${sec.padStart(5, '0')}"${dir}`;
  };

  return `${formatComponent(lat, 'N', 'S')}  ${formatComponent(lon, 'E', 'W')}`;
}

/**
 * Haversine distance in meters
 */
export function getDistanceMeters(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 1000);
}

/**
 * Calculates initial bearing from point 1 to point 2 in degrees (0..360)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);

  return (toDeg(theta) + 360) % 360;
}

/**
 * Checks whether a target point (lat, lon) is within an observer's range and FOV wedge
 */
export function isPointInFov(
  observerLat: number,
  observerLon: number,
  targetLat: number,
  targetLon: number,
  headingDeg: number,
  fovDeg: number,
  rangeKm: number
): boolean {
  const distMeters = getDistanceMeters(observerLon, observerLat, targetLon, targetLat);
  if (distMeters > rangeKm * 1000) return false;

  const brng = calculateBearing(observerLat, observerLon, targetLat, targetLon);
  const angleDiff = Math.abs(((brng - headingDeg + 540) % 360) - 180);
  return angleDiff <= fovDeg / 2;
}

