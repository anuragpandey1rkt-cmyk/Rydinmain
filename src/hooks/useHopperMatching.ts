import { useCallback } from "react";

interface Coords {
  lat: number;
  lng: number;
}

interface TimeRange {
  departureTime: string;
  flexibilityMinutes: number;
}

/**
 * Calculates if two hopper departure times match within flexibility window
 * No fixed time window - allows ±3-5 hours with flexibility
 */
export const useHopperMatching = () => {
  const timeStringToMinutes = useCallback((timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }, []);

  const calculateTimeDifference = useCallback(
    (time1: string, time2: string): number => {
      const min1 = timeStringToMinutes(time1);
      const min2 = timeStringToMinutes(time2);
      return Math.abs(min1 - min2);
    },
    [timeStringToMinutes]
  );

  const isTimeMatch = useCallback(
    (userTime: TimeRange, hopperTime: TimeRange): boolean => {
      const maxFlexibility = Math.max(
        userTime.flexibilityMinutes,
        hopperTime.flexibilityMinutes
      );
      // Maximum match window: 5 hours (300 minutes)
      const maxWindow = Math.min(maxFlexibility + 60, 300);

      const timeDiff = calculateTimeDifference(
        userTime.departureTime,
        hopperTime.departureTime
      );

      return timeDiff <= maxWindow;
    },
    [calculateTimeDifference]
  );

  const isLocationMatch = useCallback(
    (userPickup: string, hopperPickup: string, userDrop: string, hopperDrop: string): boolean => {
      const normalize = (str: string) => str.toLowerCase().trim();
      return (
        normalize(userPickup) === normalize(hopperPickup) &&
        normalize(userDrop) === normalize(hopperDrop)
      );
    },
    []
  );

  const isDateMatch = useCallback((userDate: string, hopperDate: string): boolean => {
    return userDate === hopperDate;
  }, []);

  const calculateDistance = useCallback((p1: Coords, p2: Coords) => {
    const R = 6371; // km
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lng - p1.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const getBearing = useCallback((p1: Coords, p2: Coords) => {
    const y = Math.sin((p2.lng - p1.lng) * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180);
    const x = Math.cos(p1.lat * Math.PI / 180) * Math.sin(p2.lat * Math.PI / 180) -
      Math.sin(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.cos((p2.lng - p1.lng) * Math.PI / 180);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }, []);

  const isGeospatialMatch = useCallback(
    (
      userPickup: Coords,
      hopperPickup: Coords,
      userDrop: Coords,
      hopperDrop: Coords,
      radiusKm = 3.0 // expanded: 3km radius for city-wide Chennai matching
    ): boolean => {
      // Check if pickup and drop points are within radius
      const pickupDist = calculateDistance(userPickup, hopperPickup);
      const dropDist = calculateDistance(userDrop, hopperDrop);

      if (pickupDist > radiusKm || dropDist > radiusKm) return false;

      // Check direction compatibility (bearing)
      const userBearing = getBearing(userPickup, userDrop);
      const hopperBearing = getBearing(hopperPickup, hopperDrop);

      const bearingDiff = Math.abs(userBearing - hopperBearing);
      const normalizedDiff = Math.min(bearingDiff, 360 - bearingDiff);

      // Relaxed to 60 degrees for city-wide matching (was 45)
      return normalizedDiff <= 60;
    },
    [calculateDistance, getBearing]
  );

  const calculateMatchScore = useCallback(
    (userTime: TimeRange, hopperTime: TimeRange): number => {
      // Higher score = better match
      const timeDiff = calculateTimeDifference(
        userTime.departureTime,
        hopperTime.departureTime
      );
      // Score: 100 for exact time, decreasing with difference
      return Math.max(0, 100 - (timeDiff / 300) * 100);
    },
    [calculateTimeDifference]
  );

  return {
    isTimeMatch,
    isLocationMatch,
    isGeospatialMatch,
    isDateMatch,
    calculateDistance,
    getBearing,
    calculateTimeDifference,
    calculateMatchScore,
  };
};
