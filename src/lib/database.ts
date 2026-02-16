import { supabase } from "@/integrations/supabase/client";

/**
 * Atomically join a ride using Supabase RPC function
 * This prevents race conditions and overbooking
 */
export const joinRideAtomic = async (rideId: string, userId: string) => {
  const { data, error } = await supabase.rpc('join_ride', {
    p_ride_id: rideId,
    p_user_id: userId,
  });

  if (error) throw error;
  return data;
};

/**
 * Request to join a ride (Approval flow)
 */
export const requestJoinRide = async (rideId: string, userId: string) => {
  const { data, error } = await supabase.rpc('request_join_ride', {
    p_ride_id: rideId,
    p_user_id: userId,
  });

  if (error) throw error;
  return data;
};

/**
 * Check if user already joined a ride
 */
export const isUserInRide = async (rideId: string, userId: string) => {
  const { data, error } = await supabase
    .from('ride_members')
    .select('id')
    .eq('ride_id', rideId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
};

/**
 * Get ride members with their profile info
 */
export const getRideMembers = async (rideId: string) => {
  try {
    const { data: members, error: membersError } = await supabase
      .from('ride_members')
      .select('id, user_id, joined_at, payment_status, ride_id, status')
      .eq('ride_id', rideId)
      .order('joined_at', { ascending: true });

    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];

    const userIds = members.map(m => m.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, trust_score, department, gender, phone')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    const profilesMap = new Map(profiles?.map(p => [p.id, p]));
    return members.map(member => ({
      ...member,
      profiles: profilesMap.get(member.user_id) || null
    }));
  } catch (error) {
    console.error("Error in getRideMembers:", error);
    throw error;
  }
};

/**
 * Get ride host info
 */
export const getRideHost = async (rideId: string) => {
  try {
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('host_id')
      .eq('id', rideId)
      .maybeSingle();

    if (rideError) throw rideError;
    if (!ride) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, trust_score, department, gender')
      .eq('id', ride.host_id)
      .maybeSingle();

    if (profileError) throw profileError;

    return {
      host_id: ride.host_id,
      profiles: profile
    };
  } catch (error) {
    console.error("Error in getRideHost:", error);
    throw error;
  }
};

/**
 * Update trust score
 */
export const updateTrustScore = async (userId: string, delta: number) => {
  const { data: currentProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('trust_score')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const newScore = Math.max(1, (currentProfile?.trust_score ?? 4.0) + delta);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ trust_score: newScore })
    .eq('id', userId);

  if (updateError) throw updateError;
  return newScore;
};

/**
 * Mark ride as locked (started)
 */
export const lockRide = async (rideId: string) => {
  const { error } = await supabase
    .from('rides')
    .update({
      status: 'locked',
      locked_at: new Date().toISOString(),
    })
    .eq('id', rideId);

  if (error) throw error;
};

/**
 * Mark ride as completed
 */
export const completeRide = async (rideId: string) => {
  const { error } = await supabase
    .from('rides')
    .update({
      status: 'completed',
    })
    .eq('id', rideId);

  if (error) throw error;

  // Award trust points to all members
  const members = await getRideMembers(rideId);
  for (const member of members) {
    await updateTrustScore(member.user_id, 1);
  }
};

/**
 * Cancel ride and penalize host
 */
export const cancelRide = async (rideId: string, hostId: string) => {
  const { error } = await supabase
    .from('rides')
    .update({
      status: 'cancelled',
    })
    .eq('id', rideId);

  if (error) throw error;

  // Penalize host for cancellation after lock
  const ride = await supabase
    .from('rides')
    .select('locked_at')
    .eq('id', rideId)
    .maybeSingle();

  if (ride.data?.locked_at) {
    // Cancelled after ride was locked
    await updateTrustScore(hostId, -2);
  }
};

/**
 * Mark user as no-show in ride
 */
export const markNoShow = async (userId: string) => {
  await updateTrustScore(userId, -5);
};

/**
 * Calculate savings for a ride based on estimated fare
 */
export const calculateRideSavings = (estimatedFare: number, seatsTotal: number, seatsTaken: number) => {
  if (seatsTotal <= 1) return 0;
  const perPersonCost = Math.round(estimatedFare / seatsTotal);
  const savedPerPerson = estimatedFare - (perPersonCost * seatsTotal);
  return savedPerPerson * (seatsTaken + 1); // +1 for the host
};

/**
 * Generate shareable ride link
 */
export const generateRideShareLink = (rideId: string): string => {
  return `${window.location.origin}/?ride=${rideId}`;
};
