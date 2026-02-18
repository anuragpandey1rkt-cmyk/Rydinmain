/**
 * Chennai & Surrounding Areas — Shared Geography Config
 *
 * Used by:
 *  1. CreateRide  — validates pickup/drop are within the Chennai metro region
 *  2. MapPicker   — sets map center and zoom to cover all of Chennai
 *  3. useHopperMatching — uses MATCH_RADIUS_KM for geospatial ride matching
 *
 * The single source of truth for all location logic in Rydin.
 */

export interface Zone {
    name: string;
    lat: number;
    lng: number;
    radiusKm: number;
    isHub: boolean;
    category: 'campus' | 'airport' | 'railway' | 'metro' | 'bus' | 'general';
}

// ─── Map defaults ────────────────────────────────────────────────────────────
/** Center of Greater Chennai — shown when the map first loads */
export const CHENNAI_MAP_CENTER: [number, number] = [13.0827, 80.2707]; // Chennai Central
/** Zoom level that shows all of Chennai + surroundings (~80 km radius) */
export const CHENNAI_MAP_ZOOM = 11;

// ─── Matching radius ─────────────────────────────────────────────────────────
/** How close two pickup/drop points must be (km) to count as a Hopper match */
export const MATCH_RADIUS_KM = 3.0; // expanded from 1 km → 3 km for city-wide matching

// ─── Outer boundary ──────────────────────────────────────────────────────────
/** Single large circle that covers Greater Chennai + satellite towns */
export const CHENNAI_BOUNDARY = {
    center: { lat: 13.0827, lng: 80.2707 }, // Chennai Central
    radiusKm: 80, // covers Kancheepuram, Tiruvallur, Mahabalipuram, Chengalpattu
};

// ─── Key hubs (used for fare estimation & match probability) ─────────────────
export const CHENNAI_ZONES: Zone[] = [
    // ── SRM / Kattankulathur Campus ──────────────────────────────────────────
    { name: 'SRM Main Gate', lat: 12.8231, lng: 80.0442, radiusKm: 0.5, isHub: true, category: 'campus' },
    { name: 'SRM Tech Park Gate', lat: 12.8215, lng: 80.0460, radiusKm: 0.3, isHub: true, category: 'campus' },
    { name: 'Potheri Station', lat: 12.8218, lng: 80.0385, radiusKm: 0.5, isHub: true, category: 'railway' },
    { name: 'Guduvancheri Station', lat: 12.8450, lng: 80.0560, radiusKm: 0.5, isHub: true, category: 'railway' },

    // ── South Chennai ─────────────────────────────────────────────────────────
    { name: 'Tambaram Railway', lat: 12.9229, lng: 80.1275, radiusKm: 1.0, isHub: true, category: 'railway' },
    { name: 'Chromepet', lat: 12.9516, lng: 80.1462, radiusKm: 0.8, isHub: false, category: 'general' },
    { name: 'Pallavaram', lat: 12.9675, lng: 80.1491, radiusKm: 0.8, isHub: false, category: 'general' },
    { name: 'Perungalathur', lat: 12.8780, lng: 80.0800, radiusKm: 0.5, isHub: false, category: 'general' },
    { name: 'Vandalur', lat: 12.8900, lng: 80.0820, radiusKm: 0.5, isHub: false, category: 'general' },
    { name: 'Urapakkam', lat: 12.8650, lng: 80.0650, radiusKm: 0.5, isHub: false, category: 'general' },

    // ── Airports ──────────────────────────────────────────────────────────────
    { name: 'Chennai Airport (T1)', lat: 12.9941, lng: 80.1709, radiusKm: 1.5, isHub: true, category: 'airport' },
    { name: 'Chennai Airport (T2)', lat: 12.9900, lng: 80.1650, radiusKm: 1.5, isHub: true, category: 'airport' },

    // ── Central / North Chennai ───────────────────────────────────────────────
    { name: 'Chennai Central', lat: 13.0827, lng: 80.2707, radiusKm: 1.5, isHub: true, category: 'railway' },
    { name: 'Chennai Egmore', lat: 13.0780, lng: 80.2620, radiusKm: 1.0, isHub: true, category: 'railway' },
    { name: 'Koyambedu CMBT', lat: 13.0694, lng: 80.1948, radiusKm: 1.5, isHub: true, category: 'bus' },
    { name: 'CMBT Bus Stand', lat: 13.0700, lng: 80.1960, radiusKm: 1.0, isHub: true, category: 'bus' },
    { name: 'Anna Nagar', lat: 13.0850, lng: 80.2101, radiusKm: 1.0, isHub: false, category: 'general' },
    { name: 'Vadapalani', lat: 13.0524, lng: 80.2120, radiusKm: 0.8, isHub: false, category: 'metro' },
    { name: 'Ashok Nagar', lat: 13.0350, lng: 80.2100, radiusKm: 0.8, isHub: false, category: 'general' },
    { name: 'T Nagar', lat: 13.0418, lng: 80.2341, radiusKm: 1.0, isHub: false, category: 'general' },
    { name: 'Guindy', lat: 13.0067, lng: 80.2206, radiusKm: 1.0, isHub: true, category: 'railway' },
    { name: 'St Thomas Mount', lat: 13.0010, lng: 80.1960, radiusKm: 0.8, isHub: false, category: 'metro' },
    { name: 'Alandur Metro', lat: 13.0020, lng: 80.2000, radiusKm: 0.8, isHub: false, category: 'metro' },

    // ── East Chennai / IT Corridor ────────────────────────────────────────────
    { name: 'OMR / Perungudi', lat: 12.9600, lng: 80.2450, radiusKm: 1.5, isHub: false, category: 'general' },
    { name: 'Sholinganallur', lat: 12.9010, lng: 80.2279, radiusKm: 1.0, isHub: false, category: 'general' },
    { name: 'Thoraipakkam', lat: 12.9290, lng: 80.2360, radiusKm: 1.0, isHub: false, category: 'general' },
    { name: 'Perungudi', lat: 12.9600, lng: 80.2450, radiusKm: 0.8, isHub: false, category: 'general' },
    { name: 'Velachery', lat: 12.9815, lng: 80.2180, radiusKm: 1.0, isHub: true, category: 'metro' },
    { name: 'Medavakkam', lat: 12.9220, lng: 80.1930, radiusKm: 0.8, isHub: false, category: 'general' },

    // ── West Chennai ──────────────────────────────────────────────────────────
    { name: 'Porur', lat: 13.0350, lng: 80.1570, radiusKm: 1.0, isHub: false, category: 'general' },
    { name: 'Ambattur', lat: 13.1143, lng: 80.1548, radiusKm: 1.0, isHub: false, category: 'general' },
    { name: 'Avadi', lat: 13.1143, lng: 80.0965, radiusKm: 1.0, isHub: false, category: 'railway' },

    // ── Satellite Towns ───────────────────────────────────────────────────────
    { name: 'Chengalpattu', lat: 12.6921, lng: 79.9764, radiusKm: 2.0, isHub: true, category: 'railway' },
    { name: 'Kancheepuram', lat: 12.8342, lng: 79.7036, radiusKm: 2.0, isHub: false, category: 'general' },
    { name: 'Mahabalipuram', lat: 12.6269, lng: 80.1927, radiusKm: 2.0, isHub: false, category: 'general' },
    { name: 'Tiruvallur', lat: 13.1427, lng: 79.9143, radiusKm: 2.0, isHub: false, category: 'railway' },
    { name: 'Sriperumbudur', lat: 12.9677, lng: 79.9477, radiusKm: 2.0, isHub: false, category: 'general' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Haversine distance in km between two lat/lng points */
export function haversineKm(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number }
): number {
    const R = 6371;
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns true if the point is within the Greater Chennai boundary.
 * This replaces the Supabase travel_zones check for zone validation.
 */
export function isWithinChennai(lat: number, lng: number): boolean {
    return (
        haversineKm({ lat, lng }, CHENNAI_BOUNDARY.center) <= CHENNAI_BOUNDARY.radiusKm
    );
}

/**
 * Returns true if the point is near a known hub (airport, railway, campus etc.)
 * Used for match probability estimation.
 */
export function isNearHub(lat: number, lng: number, thresholdKm = 1.5): boolean {
    return CHENNAI_ZONES.some(
        (z) => z.isHub && haversineKm({ lat, lng }, { lat: z.lat, lng: z.lng }) <= thresholdKm
    );
}

/**
 * Returns the nearest zone name for a given coordinate, or null if none within 5 km.
 */
export function getNearestZoneName(lat: number, lng: number): string | null {
    let nearest: Zone | null = null;
    let minDist = Infinity;
    for (const z of CHENNAI_ZONES) {
        const d = haversineKm({ lat, lng }, { lat: z.lat, lng: z.lng });
        if (d < minDist) { minDist = d; nearest = z; }
    }
    return nearest && minDist <= 5 ? nearest.name : null;
}
