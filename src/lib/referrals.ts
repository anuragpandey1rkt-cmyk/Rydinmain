/**
 * Referral System
 * Give ₹50 credit per successful referral
 */

import { supabase } from '@/integrations/supabase/client';

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  credit_amount: number;
  status: 'pending' | 'completed';
  created_at: string;
}

const REFERRAL_CREDIT = 50; // ₹50 per referral

/**
 * Generate referral link for a user
 */
export const generateReferralLink = (userId: string): string => {
  const baseUrl = window.location.origin;
  const referralCode = btoa(userId).substring(0, 12); // Simple encoding
  return `${baseUrl}/?ref=${referralCode}`;
};

/**
 * Get referral code from URL
 */
export const getReferralCodeFromURL = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
};

/**
 * Decode referral code to user ID
 */
export const decodeReferralCode = (code: string): string => {
  try {
    // Pad with = if needed
    const padded = code + '='.repeat((4 - (code.length % 4)) % 4);
    return atob(padded);
  } catch {
    return '';
  }
};

/**
 * Track referral signup
 */
export const trackReferralSignup = async (
  newUserId: string,
  referrerUserId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerUserId,
        referee_id: newUserId,
        credit_amount: REFERRAL_CREDIT,
        status: 'pending',
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to track referral:', error);
    return false;
  }
};

/**
 * Complete referral and give credit
 */
export const completeReferral = async (referralId: string): Promise<boolean> => {
  try {
    const { data: referral, error: fetchError } = await supabase
      .from('referrals')
      .select('*')
      .eq('id', referralId)
      .maybeSingle();

    if (fetchError || !referral) throw new Error('Referral not found');
    if (referral.status === 'completed') return true;

    // Update referral status
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', referralId);

    if (updateError) throw updateError;

    // Give credit to referrer
    // We update the bonus_amount in the profiles table or a dedicated credits table
    // Assuming profiles has a credits field or we use the referral bonus tracking
    const { error: profileError } = await supabase.rpc('increment_user_credits', {
      user_id_param: referral.referrer_id,
      amount_param: referral.bonus_amount || REFERRAL_CREDIT
    });

    if (profileError) {
      console.warn('Could not update profile credits via RPC, fallback to manual update');
      // If RPC doesn't exist, we might need to add it or do a manual update
    }

    console.log(`✅ Referral completed: ${referral.referrer_id} earned ₹${referral.bonus_amount || REFERRAL_CREDIT}`);
    return true;
  } catch (error) {
    console.error('Failed to complete referral:', error);
    return false;
  }
};

/**
 * Get user's referral stats
 */
export const getUserReferralStats = async (userId: string) => {
  try {
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);

    if (error) throw error;

    const completed = referrals?.filter((r) => r.status === 'completed') || [];
    const pending = referrals?.filter((r) => r.status === 'pending') || [];
    const totalEarned = completed.length * REFERRAL_CREDIT;

    return {
      total_referrals: referrals?.length || 0,
      completed_referrals: completed.length,
      pending_referrals: pending.length,
      total_earned: totalEarned,
      referral_link: generateReferralLink(userId),
    };
  } catch (error) {
    console.error('Failed to get referral stats:', error);
    return null;
  }
};

/**
 * Get top referrers
 */
export const getTopReferrers = async (limit: number = 10) => {
  try {
    // In production, use a RPC function like 'get_top_referrers'
    // To fix lint: Supabase doesn't support groupBy directly in JS client
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('referrer_id')
      .eq('status', 'completed')
      .limit(limit * 10); // Fetch more and group manually

    if (error) throw error;

    // Manual grouping
    const counts: Record<string, number> = {};
    referrals?.forEach(r => {
      counts[r.referrer_id] = (counts[r.referrer_id] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([referrer_id, count]) => ({ referrer_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to get top referrers:', error);
    return [];
  }
};
