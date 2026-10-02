import { useEffect, useState } from 'react';
import {
    Clock, Swords, Users, Trophy, Bot, UserPlus, Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MockUser } from '@/lib/mockMatches';

const NOISE_URI =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const STAFF_BADGE = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380915/ff7rn60eiylq1x1oixsz.png';
const VERIFIED_BADGE = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380916/rsfa4dftmbz427k5cnmw.png';

function hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace('#', '');
    const n = parseInt(clean, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface MockFeedCardProps {
    user: MockUser;
    /** Starting countdown value in ms — chosen by the parent, not the card. */
    initialCountdownMs: number;
    /** Fired when the user clicks Claim. Parent handles the modal + removal. */
    onClaimClick: () => void;
}

export function MockFeedCard({ user, initialCountdownMs, onClaimClick }: MockFeedCardProps) {
    const [isHovering, setIsHovering] = useState(false);
    const [flash, setFlash] = useState(false);

    // ── Visible countdown (theatre) ─────────────────────────
    // We compute remaining time from a fixed start point, not from a setState
    // ticker that resets on re-render.
    const startRef = useState(() => ({ t: Date.now() }))[0];
    const [, forceTick] = useState(0);

    useEffect(() => {
        const id = setInterval(() => forceTick((n) => n + 1), 1000);
        return () => clearInterval(id);
    }, []);

    const elapsed = Date.now() - startRef.t;
    const remainingMs = Math.max(0, initialCountdownMs - elapsed);
    const remainingPct = (remainingMs / initialCountdownMs) * 100;
    const isUrgent = remainingMs < initialCountdownMs * 0.15;

    const timerColor = remainingMs < initialCountdownMs * 0.3 ? '#ef4444'
        : remainingMs < initialCountdownMs * 0.6 ? '#eab308'
            : '#22c55e';

    const formatTime = (ms: number) => {
        const totalSec = Math.max(0, Math.floor(ms / 1000));
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // ── Visuals ─────────────────────────────────────────────
    const vibePct = user.vibe;
    let vibeLabel = 'Chill';
    let vibeColor = '#22c55e';
    if (vibePct <= 33) { vibeLabel = 'Troll'; vibeColor = '#ef4444'; }
    else if (vibePct <= 66) { vibeLabel = 'Cheeky'; vibeColor = '#eab308'; }

    const TypeIcon = user.matchType === '1v1' ? Swords
        : user.matchType === 'Co-op'
            ? (user.coopSub === '2 vs AI' ? Bot : UserPlus)
            : Trophy;

    const playersNeeded = user.matchType === '1v1' ? 1
        : user.matchType === 'Co-op' && user.coopSub === '2 vs AI' ? 1
            : user.matchType === 'Co-op' && user.coopSub === '3 vs 3' ? 5
                : user.tournamentSize === 4 ? 3
                    : user.tournamentSize === 8 ? 7
                        : 1;

    const handleClaim = () => {
        setFlash(true);
        // Give the flash a beat to render before the parent removes the card
        setTimeout(() => onClaimClick(), 180);
    };

    return (
        <>
            <div
                className="group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 sm:p-5"
                style={{
                    borderColor: hexToRgba(vibeColor, 0.14),
                    background: `radial-gradient(130% 100% at 12% -10%, ${hexToRgba(vibeColor, 0.05)}, transparent 55%), linear-gradient(180deg, #161616, #101010)`,
                    boxShadow: `0 10px 28px -18px ${hexToRgba(vibeColor, 0.09)}`,
                }}
            >
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
                    style={{ backgroundImage: `url("${NOISE_URI}")` }}
                />
                <div
                    className="pointer-events-none absolute inset-0 opacity-60"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, transparent 1px, transparent 26px), repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, transparent 1px, transparent 26px)',
                    }}
                />

                <TypeIcon
                    className="pointer-events-none absolute -right-5 -top-5 h-28 w-28 rotate-12 text-white/[0.03] transition-transform duration-500 group-hover:rotate-6"
                    strokeWidth={1.25}
                />

                <div
                    className="absolute inset-x-0 top-0 h-px"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${hexToRgba(vibeColor, 0.9)}, transparent)`,
                    }}
                />

                <div className="relative z-10">
                    <div className="flex items-start gap-3.5">
                        <div
                            className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-[#0A0A0A]"
                            style={{ boxShadow: `0 0 0 2px #101012, 0 0 0 3px ${hexToRgba(vibeColor, 0.3)}` }}
                        >
                            <img
                                src={user.avatarUrl}
                                alt={user.username}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <h3 className="truncate text-[15px] font-bold tracking-tight text-white">
                                    {user.username}
                                </h3>
                                {user.isStaff && (
                                    <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1.5 pr-2.5">
                                        <img src={STAFF_BADGE} alt="" className="h-5 w-5 object-contain" />
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-300">
                                            Staff
                                        </span>
                                    </span>
                                )}
                                {user.isVerified && (
                                    <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1.5 pr-2.5">
                                        <img
                                            src={VERIFIED_BADGE}
                                            alt=""
                                            className="h-5 w-5 object-contain"
                                        />
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-300">
                                            Verified
                                        </span>
                                    </span>
                                )}
                            </div>

                            {(user.squadRank || user.playerRank) && (
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                    {user.squadRank && (
                                        <span className="flex items-center gap-1.5 rounded-full bg-white/[0.03] py-1 pl-1.5 pr-2.5 text-[10px] font-medium text-gray-400">
                                            <img
                                                src={user.squadRankBadge}
                                                alt=""
                                                className="h-4 w-4 rounded-full object-contain"
                                            />
                                            {user.squadRank}
                                        </span>
                                    )}
                                    {user.playerRank && (
                                        <span className="flex items-center gap-1.5 rounded-full bg-white/[0.03] py-1 pl-1.5 pr-2.5 text-[10px] font-medium text-gray-400">
                                            <img
                                                src={user.playerRankBadge}
                                                alt=""
                                                className="h-4 w-4 rounded-full object-contain"
                                            />
                                            {user.playerRank}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    just now
                                </span>
                                <span className="flex items-center gap-1">
                                    <TypeIcon className="h-3 w-3" />
                                    {user.coopSub ?? (user.tournamentSize ? `${user.tournamentSize} players` : user.matchType)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {playersNeeded} player{playersNeeded > 1 ? 's' : ''} needed
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-gray-400">
                                <Flame className="h-3 w-3" style={{ color: vibeColor }} />
                                Room vibe
                            </span>
                            <span className="font-semibold" style={{ color: vibeColor }}>
                                {vibeLabel} · {vibePct}%
                            </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${vibePct}%`, background: vibeColor }}
                            />
                        </div>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between gap-3">
                        <span
                            className={cn(
                                'flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums',
                                isUrgent && 'animate-pulse',
                            )}
                            style={{ color: timerColor }}
                        >
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(remainingMs)}
                        </span>
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-linear"
                                style={{ width: `${remainingPct}%`, background: timerColor }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleClaim}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                        className="relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-b from-[#2E8FFF] to-[#1B77D6] py-2.5 text-sm font-bold text-white shadow-[0_2px_10px_-4px_rgba(30,144,255,0.35)] transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_4px_16px_-4px_rgba(30,144,255,0.5)] active:scale-[0.96]"
                    >
                        {flash && (
                            <span
                                className="pointer-events-none absolute inset-0 rounded-xl bg-white"
                                style={{ animation: 'mock-press-flash .5s ease-out' }}
                                onAnimationEnd={() => setFlash(false)}
                            />
                        )}
                        {isHovering ? (
                            <span className="inline-flex items-center gap-2">
                                <Swords className="h-4 w-4" />
                                <span className="uppercase tracking-wider">Game on</span>
                            </span>
                        ) : (
                            'Claim room'
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes mock-press-flash {
                    0% { opacity: .5; transform: scale(.92); }
                    100% { opacity: 0; transform: scale(1.18); }
                }
            `}</style>
        </>
    );
}