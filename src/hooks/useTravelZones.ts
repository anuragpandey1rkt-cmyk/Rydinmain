/**
 * useTravelZones — Fetches and caches active travel_zones from Supabase.
 *
 * This is the primary location intelligence layer for Rydin.
 * Zones are fetched once per session and cached in module-level memory
 * so every PlaceAutocomplete instance shares the same data without
 * redundant network calls.
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TravelZone {
    id: string;
    name: string;
    center_latitude: number;
    center_longitude: number;
    radius_km: number;
    is_hub: boolean;
    is_active: boolean;
    category?: string;
}

// ─── Module-level cache (shared across all hook instances) ────────────────────
let _cachedZones: TravelZone[] | null = null;
let _fetchPromise: Promise<TravelZone[]> | null = null;

async function fetchZones(): Promise<TravelZone[]> {
    if (_cachedZones) return _cachedZones;
    if (_fetchPromise) return _fetchPromise;

    _fetchPromise = (async () => {
        const { data, error } = await supabase
            .from("travel_zones")
            .select("id, name, center_latitude, center_longitude, radius_km, is_hub, is_active, category")
            .eq("is_active", true)
            .order("is_hub", { ascending: false }); // hubs first

        if (error || !data) {
            _fetchPromise = null; // allow retry on error
            return [];
        }
        _cachedZones = data as TravelZone[];
        return _cachedZones;
    })();

    return _fetchPromise;
}

/** Clear the module-level cache (call on logout or page reload) */
export function clearZoneCache() {
    _cachedZones = null;
    _fetchPromise = null;
}

// ─── Haversine helper ─────────────────────────────────────────────────────────
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
 * Returns the zone that contains the given point (within its radius_km),
 * preferring hubs. Returns null if no zone matches.
 */
export function findZoneForPoint(
    lat: number,
    lng: number,
    zones: TravelZone[]
): TravelZone | null {
    let best: TravelZone | null = null;
    let bestDist = Infinity;

    for (const z of zones) {
        const d = haversineKm({ lat, lng }, { lat: z.center_latitude, lng: z.center_longitude });
        if (d <= z.radius_km && d < bestDist) {
            bestDist = d;
            best = z;
        }
    }
    return best;
}

/**
 * Returns the nearest zone within maxKm, regardless of radius.
 * Used for clustering anchor suggestions.
 */
export function findNearestZone(
    lat: number,
    lng: number,
    zones: TravelZone[],
    maxKm = 5
): TravelZone | null {
    let best: TravelZone | null = null;
    let bestDist = Infinity;

    for (const z of zones) {
        const d = haversineKm({ lat, lng }, { lat: z.center_latitude, lng: z.center_longitude });
        if (d < bestDist) {
            bestDist = d;
            best = z;
        }
    }
    return best && bestDist <= maxKm ? best : null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTravelZones() {
    const [zones, setZones] = useState<TravelZone[]>(_cachedZones || []);
    const [loading, setLoading] = useState(!_cachedZones);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (_cachedZones) {
            setZones(_cachedZones);
            setLoading(false);
            return;
        }

        setLoading(true);
        fetchZones()
            .then((data) => {
                setZones(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || "Failed to load zones");
                setLoading(false);
            });
    }, []);

    return { zones, loading, error };
}
