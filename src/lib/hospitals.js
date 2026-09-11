/**
 * Halton Healthcare — multi-hospital configuration.
 * Used throughout the platform for location filtering, badges, and data relationships.
 * Designed to support additional hospitals in the future without redesign.
 */

export const HOSPITALS = {
  oakville: {
    id: 'oakville',
    name: 'Oakville Trafalgar Memorial Hospital',
    short: 'Oakville Trafalgar',
    code: 'OTMH',
    color: '#0066B2',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  milton: {
    id: 'milton',
    name: 'Milton District Hospital',
    short: 'Milton District',
    code: 'MDH',
    color: '#B45309',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  georgetown: {
    id: 'georgetown',
    name: 'Georgetown Hospital',
    short: 'Georgetown',
    code: 'GH',
    color: '#2D8659',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
};

export const HOSPITAL_LIST = Object.values(HOSPITALS);
export const HOSPITAL_IDS = Object.keys(HOSPITALS);

/**
 * Get hospital config by id, returns null if not found.
 */
export function getHospital(id) {
  return HOSPITALS[id] || null;
}

/**
 * Get short display name for a hospital id.
 */
export function getHospitalName(id) {
  const h = HOSPITALS[id];
  return h ? h.short : id || '—';
}

/**
 * Get full hospital name.
 */
export function getHospitalFullName(id) {
  const h = HOSPITALS[id];
  return h ? h.name : id || '—';
}

/**
 * Filter an array of records by hospital location.
 * Returns all records when location is 'all' or falsy.
 */
export function filterByLocation(items, location, field = 'hospital_location') {
  if (!location || location === 'all') return items;
  return items.filter(item => item[field] === location);
}

/**
 * Count records by hospital location.
 * Returns { oakville: n, milton: n, georgetown: n, all: total }
 */
/**
 * Convert a stored unique_id (e.g. "MS-2026-1001") to a hospital-relevant
 * display ID by swapping the "MS" prefix for the hospital code
 * (e.g. "OTMH-2026-1001", "MDH-2026-1001", "GH-2026-1001").
 */
export function displayCaseId(uniqueId, hospitalLocation) {
  if (!uniqueId) return '—';
  const hospital = HOSPITALS[hospitalLocation];
  if (!hospital) return uniqueId;
  if (uniqueId.startsWith('MS-')) {
    return hospital.code + '-' + uniqueId.slice(3);
  }
  return uniqueId;
}

export function countByLocation(items, field = 'hospital_location') {
  const counts = { oakville: 0, milton: 0, georgetown: 0, all: items.length };
  items.forEach(item => {
    const loc = item[field];
    if (loc && counts[loc] !== undefined) counts[loc]++;
    else if (!loc) counts.oakville++; // default to oakville for legacy records
  });
  return counts;
}