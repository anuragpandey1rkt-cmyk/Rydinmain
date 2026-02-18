/**
 * Trust Score Calculation Engine
 * Calculates a 1.0–5.0 trust score based on 6 weighted factors
 */

import { supabase } from '@/integrations/supabase/client';

export interface TrustScoreFactors {
    completedRides: number;
    noShowCount: number;
    identityVerified: boolean;
    profileComplete: boolean;
    hasAvatar: boolean;
    accountCreatedAt: string | null;
    reliabilityScore: number; // 0-100
}

export interface TrustScoreBreakdown {
    total: number;
    factors: {
        rides: number;
        noShows: number;
        identity: number;
        profile: number;
        accountAge: number;
        reliability: number;
    };
}

/**
 * Calculate trust score from raw factors
 * Returns a score between 1.0 and 5.0
 *
 * Weights:
 *   Completed Rides:    30%  (max 1.5 pts)
 *   No-Show Record:     25%  (max 1.25 pts)
 *   Identity Verified:  15%  (max 0.75 pts)
 *   Profile Complete:   10%  (max 0.5 pts)
 *   Account Age:        10%  (max 0.5 pts)
 *   Reliability Score:  10%  (max 0.5 pts)
 *
 * Base = 1.0, so range = 1.0 to 5.0
 */
export const calculateTrustScore = (factors: TrustScoreFactors): TrustScoreBreakdown => {
    // --- Completed Rides (30%, max 1.5) ---
    // Grows logarithmically: 1 ride = 0.45, 5 rides = 1.05, 10+ rides = 1.5
    const rideScore = Math.min(1.5, (Math.log10(factors.completedRides + 1) / Math.log10(11)) * 1.5);

    // --- No-Show Record (25%, max 1.25) ---
    // 0 no-shows = full score, each no-show removes 0.42 pts
    const noShowPenalty = Math.min(factors.noShowCount * 0.42, 1.25);
    const noShowScore = Math.max(0, 1.25 - noShowPenalty);

    // --- Identity Verified (15%, max 0.75) ---
    const identityScore = factors.identityVerified ? 0.75 : 0;

    // --- Profile Completeness (10%, max 0.5) ---
    // Profile complete = 0.35, has avatar = +0.15
    let profileScore = 0;
    if (factors.profileComplete) profileScore += 0.35;
    if (factors.hasAvatar) profileScore += 0.15;

    // --- Account Age (10%, max 0.5) ---
    // Linear growth over 30 days
    let accountAgeScore = 0;
    if (factors.accountCreatedAt) {
        const daysSinceCreation = Math.floor(
            (Date.now() - new Date(factors.accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        accountAgeScore = Math.min(0.5, (daysSinceCreation / 30) * 0.5);
    }

    // --- Reliability Score (10%, max 0.5) ---
    const reliabilityScoreNormalized = (factors.reliabilityScore / 100) * 0.5;

    // --- Total ---
    const total = Math.min(5.0, Math.max(1.0,
        1.0 + rideScore + noShowScore + identityScore + profileScore + accountAgeScore + reliabilityScoreNormalized
    ));

    return {
        total: Math.round(total * 10) / 10, // Round to 1 decimal
        factors: {
            rides: Math.round(rideScore * 100) / 100,
            noShows: Math.round(noShowScore * 100) / 100,
            identity: identityScore,
            profile: Math.round(profileScore * 100) / 100,
            accountAge: Math.round(accountAgeScore * 100) / 100,
            reliability: Math.round(reliabilityScoreNormalized * 100) / 100,
        },
    };
};

/**
 * Recalculate and save trust score for a user
 * Fetches all factors from the database, computes score, and updates profile
 */
export const recalculateTrustScore = async (userId: string): Promise<number> => {
    try {
        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('completed_rides, no_show_count, identity_verified, profile_complete, avatar_url, reliability_score, created_at')
            .eq('id', userId)
            .maybeSingle();

        if (profileError) {
            console.error('Failed to fetch profile for trust calculation:', profileError);
            return 4.0; // Default fallback
        }

        const factors: TrustScoreFactors = {
            completedRides: profile?.completed_rides ?? 0,
            noShowCount: profile?.no_show_count ?? 0,
            identityVerified: !!profile?.identity_verified,
            profileComplete: !!profile?.profile_complete,
            hasAvatar: !!profile?.avatar_url,
            accountCreatedAt: profile?.created_at || null,
            reliabilityScore: profile?.reliability_score ?? 100,
        };

        const result = calculateTrustScore(factors);

        // Save to database
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ trust_score: result.total })
            .eq('id', userId);

        if (updateError) {
            console.error('Failed to update trust score:', updateError);
        } else {
            console.log(`✅ Trust score updated for ${userId}: ${result.total}`, result.factors);
        }

        return result.total;
    } catch (err) {
        console.error('Trust score recalculation error:', err);
        return 4.0;
    }
};
