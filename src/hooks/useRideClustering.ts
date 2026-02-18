/**
 * useRideClustering — Uses travel_zones to find nearest hub and compute savings.
 * Now uses the shared useTravelZones cache instead of making its own Supabase call.
 */
import { useCallback } from "react";
import { useTravelZones, haversineKm } from "@/hooks/useTravelZones";

interface Coords {
  lat: number;
  lng: number;
}

export const useRideClustering = () => {
  const { zones } = useTravelZones();

  const findNearestHub = useCallback(
    async (point: Coords) => {
      const hubs = zones.filter((z) => z.is_hub);
      if (!hubs.length) return null;

      let nearest = hubs[0];
      let minDist = haversineKm(point, {
        lat: hubs[0].center_latitude,
        lng: hubs[0].center_longitude,
      });

      for (const hub of hubs) {
        const dist = haversineKm(point, {
          lat: hub.center_latitude,
          lng: hub.center_longitude,
        });
        if (dist < minDist) {
          minDist = dist;
          nearest = hub;
        }
      }

      return minDist <= 5 ? nearest : null; // Only suggest if within 5km
    },
    [zones]
  );

  const calculateSavings = (totalFare: number, numRiders: number) => {
    if (numRiders <= 1) return 0;
    const splitFare = totalFare / numRiders;
    return totalFare - splitFare;
  };

  return {
    findNearestHub,
    calculateSavings,
  };
};
