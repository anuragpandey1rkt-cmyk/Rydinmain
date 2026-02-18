import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin, Train, Plane, GraduationCap, Building2,
  Search, X, Navigation, Star, Zap
} from "lucide-react";
import { useTravelZones, TravelZone } from "@/hooks/useTravelZones";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SelectedPlace {
  name: string;
  displayName: string;   // "name, locality, city"
  lat: number;
  lng: number;
  type?: string;         // station, airport, university, zone, etc.
  isZone?: boolean;      // true if from travel_zones
  zoneId?: string;       // zone id if from travel_zones
  radiusKm?: number;     // zone radius if from travel_zones
}

interface PhotonFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    locality?: string;
    city?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    type?: string;
  };
}

interface PlaceAutocompleteProps {
  placeholder: string;
  onSelect: (place: SelectedPlace) => void;
  className?: string;
  /** Optional initial value to pre-fill the input */
  initialValue?: string;
}

// ─── Zone → SelectedPlace ─────────────────────────────────────────────────────
function zoneToPlace(z: TravelZone): SelectedPlace {
  return {
    name: z.name,
    displayName: z.name,
    lat: z.center_latitude,
    lng: z.center_longitude,
    type: z.category || "zone",
    isZone: true,
    zoneId: z.id,
    radiusKm: z.radius_km,
  };
}

// ─── Zone category → icon ─────────────────────────────────────────────────────
const getZoneIcon = (category?: string) => {
  switch (category) {
    case "airport": return Plane;
    case "railway": return Train;
    case "campus": return GraduationCap;
    case "bus": return Navigation;
    case "metro": return Train;
    default: return MapPin;
  }
};

// ─── Photon feature → icon ────────────────────────────────────────────────────
const getPhotonIcon = (feature: PhotonFeature) => {
  const val = feature.properties.osm_value || "";
  const key = feature.properties.osm_key || "";
  if (val === "aerodrome" || val === "airport") return Plane;
  if (val === "station" || val === "halt" || key === "railway") return Train;
  if (val === "university" || val === "college" || val === "school") return GraduationCap;
  if (val === "bus_station" || val === "bus_stop") return Navigation;
  if (key === "building" || val === "house") return Building2;
  return MapPin;
};

// ─── Format a Photon feature into a human-readable label ─────────────────────
const formatFeature = (f: PhotonFeature): SelectedPlace => {
  const p = f.properties;
  const name = p.name || p.street || "Unknown place";
  const parts = [p.locality, p.district, p.city].filter(Boolean);
  const displayName = parts.length ? `${name}, ${parts.join(", ")}` : name;
  const [lng, lat] = f.geometry.coordinates;
  return {
    name,
    displayName,
    lat,
    lng,
    type: p.osm_value || p.type,
    isZone: false,
  };
};

// ─── In-memory Photon result cache (cleared on page reload) ───────────────────
const photonCache = new Map<string, SelectedPlace[]>();

// ─── Component ────────────────────────────────────────────────────────────────
const PlaceAutocomplete = ({
  placeholder,
  onSelect,
  className,
  initialValue,
}: PlaceAutocompleteProps) => {
  const { zones, loading: zonesLoading } = useTravelZones();

  const [query, setQuery] = useState(initialValue || "");
  const [zoneResults, setZoneResults] = useState<SelectedPlace[]>([]);
  const [photonResults, setPhotonResults] = useState<SelectedPlace[]>([]);
  const [photonLoading, setPhotonLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Filter zones locally against query ──────────────────────────────────────
  const filterZones = useCallback(
    (q: string): SelectedPlace[] => {
      if (!zones.length) return [];
      const lower = q.toLowerCase().trim();

      if (!lower) {
        // No query → show all hubs first, then others (max 8)
        const hubs = zones.filter((z) => z.is_hub).map(zoneToPlace);
        const rest = zones.filter((z) => !z.is_hub).map(zoneToPlace);
        return [...hubs, ...rest].slice(0, 8);
      }

      // Score-based matching: exact prefix > word prefix > substring
      const scored = zones
        .map((z) => {
          const name = z.name.toLowerCase();
          let score = 0;
          if (name === lower) score = 100;
          else if (name.startsWith(lower)) score = 80;
          else if (name.split(/\s+/).some((w) => w.startsWith(lower))) score = 60;
          else if (name.includes(lower)) score = 40;
          if (score > 0 && z.is_hub) score += 10; // hub bonus
          return { place: zoneToPlace(z), score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.place);

      return scored.slice(0, 6);
    },
    [zones]
  );

  // ── Search Photon (secondary, only when zone results are sparse) ─────────────
  const searchPhoton = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setPhotonResults([]);
      setPhotonLoading(false);
      return;
    }

    // Cache hit
    if (photonCache.has(q)) {
      setPhotonResults(photonCache.get(q)!);
      setPhotonLoading(false);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setPhotonLoading(true);
    try {
      const url = new URL("https://photon.komoot.io/api/");
      url.searchParams.set("q", q);
      url.searchParams.set("lat", "13.0827"); // bias toward Chennai
      url.searchParams.set("lon", "80.2707");
      url.searchParams.set("limit", "5");
      url.searchParams.set("lang", "en");

      const res = await fetch(url.toString(), {
        signal: abortRef.current.signal,
      });
      const data = await res.json();

      const places: SelectedPlace[] = (data.features as PhotonFeature[]).map(
        formatFeature
      );
      photonCache.set(q, places);
      setPhotonResults(places);
      setFallbackMode(false);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setPhotonResults([]);
        // If Photon fails and we have no zone results, enable map pin fallback
        if (zoneResults.length === 0) setFallbackMode(true);
      }
    } finally {
      setPhotonLoading(false);
    }
  }, [zoneResults.length]);

  // ── Main search orchestration ────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();

    // Always filter zones immediately (no debounce needed — it's local)
    const matched = filterZones(q);
    setZoneResults(matched);

    // Only call Photon if zone results are sparse (< 2 good matches)
    const needsPhoton = q.length >= 2 && matched.length < 2;

    if (!needsPhoton) {
      setPhotonResults([]);
      setPhotonLoading(false);
      abortRef.current?.abort();
      return;
    }

    // Debounce Photon call by 450ms
    setPhotonLoading(true);
    debounceRef.current = setTimeout(() => searchPhoton(q), 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, filterZones, searchPhoton]);

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Show zones immediately on focus (even with no query) ────────────────────
  const handleFocus = () => {
    setOpen(true);
    if (!query) {
      setZoneResults(filterZones(""));
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelect = (place: SelectedPlace) => {
    setSelected(place);
    setQuery(place.displayName);
    setOpen(false);
    setFallbackMode(false);
    onSelect(place);
  };

  const handleClear = () => {
    setQuery("");
    setSelected(null);
    setZoneResults(filterZones(""));
    setPhotonResults([]);
    setFallbackMode(false);
    setOpen(false);
    inputRef.current?.focus();
  };

  const allResults = [...zoneResults, ...photonResults];
  const isLoading = photonLoading || (zonesLoading && zoneResults.length === 0);
  const showDropdown = open && (isLoading || allResults.length > 0 || fallbackMode);

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
      {/* ── Input ─────────────────────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-2 h-12 px-3 rounded-lg border bg-card transition-all ${open ? "border-primary ring-1 ring-primary/20" : "border-border"
          }`}
      >
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) {
              setSelected(null);
              setPhotonResults([]);
            }
          }}
          onFocus={handleFocus}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground min-w-0"
        />
        {isLoading && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {query && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Dropdown ──────────────────────────────────────────────────────── */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-2xl z-[999] overflow-hidden">
          {/* Loading state */}
          {isLoading && allResults.length === 0 && (
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Searching…
            </div>
          )}

          {/* Zone results section */}
          {zoneResults.length > 0 && (
            <>
              <div className="px-4 pt-2.5 pb-1 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Chennai Zones
                </span>
              </div>
              {zoneResults.map((place, i) => {
                const zone = zones.find((z) => z.id === place.zoneId);
                const Icon = getZoneIcon(zone?.category);
                return (
                  <button
                    key={`zone-${place.zoneId || i}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(place);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left border-b border-border/30 last:border-0"
                  >
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${zone?.is_hub
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary"
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Text */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground truncate">
                          {place.name}
                        </span>
                        {zone?.is_hub && (
                          <Star className="w-3 h-3 text-amber-500 shrink-0 fill-amber-500" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {zone?.category?.replace(/_/g, " ") || "zone"} · {zone?.radius_km} km radius
                      </span>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Photon results section */}
          {photonResults.length > 0 && (
            <>
              <div className="px-4 pt-2.5 pb-1 flex items-center gap-1.5 border-t border-border/40">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Other Places
                </span>
              </div>
              {photonResults.map((place, i) => {
                const Icon = getPhotonIcon({
                  properties: { osm_value: place.type },
                } as PhotonFeature);
                return (
                  <button
                    key={`photon-${place.lat}-${place.lng}-${i}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(place);
                    }}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left border-b border-border/30 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">
                        {place.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {place.displayName.replace(place.name + ", ", "")}
                      </span>
                      {place.type && (
                        <span className="text-[10px] text-muted-foreground/70 font-medium mt-0.5 capitalize">
                          {place.type.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* No results */}
          {!isLoading && allResults.length === 0 && query.length >= 2 && !fallbackMode && (
            <div className="px-4 py-5 text-center text-sm text-muted-foreground">
              <MapPin className="w-7 h-7 mx-auto mb-2 opacity-25" />
              No results for "{query}"
            </div>
          )}

          {/* Fallback: both zone + Photon failed */}
          {fallbackMode && (
            <div className="px-4 py-4 text-center">
              <MapPin className="w-6 h-6 mx-auto mb-1.5 text-amber-500" />
              <p className="text-sm font-medium text-foreground mb-0.5">
                Can't find this place
              </p>
              <p className="text-xs text-muted-foreground">
                Use the map below to pin your location manually.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaceAutocomplete;
