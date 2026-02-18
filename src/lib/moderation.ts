import { supabase } from "@/integrations/supabase/client";

export interface ModerationResult {
  isSuspicious: boolean;
  reason?: string;
  action?: 'flag' | 'block' | 'none';
}

export const checkSuspiciousActivity = async (userId: string): Promise<ModerationResult> => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Check for too many rides created in short time
  const { count: ridesToday } = await supabase
    .from("rides")
    .select("*", { count: 'exact', head: true })
    .eq("host_id", userId)
    .gte("created_at", twentyFourHoursAgo.toISOString());

  if ((ridesToday || 0) > 5) {
    return {
      isSuspicious: true,
      reason: "Too many rides created in 24 hours.",
      action: "flag"
    };
  }

  // 2. Check for recent cancellations
  const { count: cancellations } = await supabase
    .from("rides")
    .select("*", { count: 'exact', head: true })
    .eq("host_id", userId)
    .eq("status", "cancelled")
    .gte("created_at", twentyFourHoursAgo.toISOString());

  if ((cancellations || 0) > 2) {
    return {
      isSuspicious: true,
      reason: "High cancellation rate in the last 24 hours.",
      action: "flag"
    };
  }

  // 3. Check for unrealistic pickup patterns (e.g., multiple rides starting at the same time)
  // This is a more complex check, but we can start with a simple one:
  const { count: overlappingRides } = await supabase
    .from("rides")
    .select("*", { count: 'exact', head: true })
    .eq("host_id", userId)
    .eq("status", "open")
    .gte("created_at", oneHourAgo.toISOString());

  if ((overlappingRides || 0) > 2) {
     return {
      isSuspicious: true,
      reason: "Multiple active rides created in a very short window.",
      action: "flag"
    };
  }

  return { isSuspicious: false, action: "none" };
};

export const flagUser = async (userId: string, reason: string) => {
  // Update profile to reflect flagged status
  const { error } = await supabase
    .from("profiles")
    .update({ 
      is_flagged: true, 
      moderation_notes: reason,
      trust_score: 1.0 // Reduce trust score significantly
    })
    .eq("id", userId);

  if (error) console.error("Failed to flag user:", error);
};
