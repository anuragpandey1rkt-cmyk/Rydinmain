import { useCallback } from "react";

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
    isDateMatch,
    calculateTimeDifference,
    calculateMatchScore,
  };
};
