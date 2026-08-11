export const STAFF_BADGE_URL = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380915/ff7rn60eiylq1x1oixsz.png';
export const VERIFIED_BADGE_URL = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380916/rsfa4dftmbz427k5cnmw.png';

interface UserBadgesProps {
    isStaff?: boolean;
    isVerified?: boolean;
    squadRankBadgeUrl?: string | null;
    playerRankBadgeUrl?: string | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const SIZE_MAP: Record<NonNullable<UserBadgesProps['size']>, string> = {
    sm: 'h-5 w-5',
    md: 'h-9 w-9',
    lg: 'h-14 w-14',
};

/**
 * Standard badge order for anywhere a user's identity is shown alongside
 * their name: Staff, Verified, Squad Rank, Player Rank. Used inline on the
 * profile page (Staff + Verified only, next to the username) today - reuse
 * the full set on community post cards, claimed-match cards, etc. so the
 * order stays consistent everywhere a user appears across the app.
 */
export default function UserBadges({
    isStaff,
    isVerified,
    squadRankBadgeUrl,
    playerRankBadgeUrl,
    size = 'sm',
    className = '',
}: UserBadgesProps) {
    const dim = SIZE_MAP[size];
    const hasAny = isStaff || isVerified || squadRankBadgeUrl || playerRankBadgeUrl;
    if (!hasAny) return null;

    return (
        <span className={`inline-flex items-center gap-1.5 flex-shrink-0 ${className}`}>
            {isStaff && (
                <img src={STAFF_BADGE_URL} alt="Staff" title="CTR Staff" className={`${dim} object-contain rounded-full`} />
            )}
            {isVerified && (
                <img src={VERIFIED_BADGE_URL} alt="Verified" title="Verified player" className={`${dim} object-contain rounded-full`} />
            )}
            {squadRankBadgeUrl && (
                <img src={squadRankBadgeUrl} alt="Squad rank" className={`${dim} object-contain rounded-full`} />
            )}
            {playerRankBadgeUrl && (
                <img src={playerRankBadgeUrl} alt="Player rank" className={`${dim} object-contain rounded-full`} />
            )}
        </span>
    );
}