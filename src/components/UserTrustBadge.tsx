import { ShieldCheck } from 'lucide-react';

interface UserTrustBadgeProps {
    trustScore?: number;
    isVerified?: boolean;
    size?: 'sm' | 'md';
    showScore?: boolean;
}

/**
 * Compact trust score + verification badge
 * Shows: ⭐ 4.2 ✅ (trust score + green checkmark if verified)
 */
export const UserTrustBadge = ({
    trustScore,
    isVerified = false,
    size = 'sm',
    showScore = true,
}: UserTrustBadgeProps) => {
    const score = trustScore ?? 4.0;

    // Color based on score
    const getScoreColor = (s: number) => {
        if (s >= 4.5) return 'text-green-600';
        if (s >= 3.5) return 'text-amber-600';
        if (s >= 2.5) return 'text-orange-600';
        return 'text-red-600';
    };

    const isSmall = size === 'sm';

    return (
        <span className="inline-flex items-center gap-1">
            {showScore && (
                <span className={`inline-flex items-center gap-0.5 ${getScoreColor(score)} font-semibold ${isSmall ? 'text-xs' : 'text-sm'}`}>
                    <span className={isSmall ? 'text-[10px]' : 'text-xs'}>⭐</span>
                    {score.toFixed(1)}
                </span>
            )}
            {isVerified && (
                <ShieldCheck
                    className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-green-500 shrink-0`}
                />
            )}
        </span>
    );
};

export default UserTrustBadge;
