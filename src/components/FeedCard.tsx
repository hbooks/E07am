import { Clock, Swords, Users, Trophy, Bot, UserPlus, Flame, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import type { MatchWithHost } from '@/types';
import { ClaimModal } from '@/components/ClaimModal';

const STAFF_BADGE = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380915/ff7rn60eiylq1x1oixsz.png';
const VERIFIED_BADGE = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380916/rsfa4dftmbz427k5cnmw.png';

// Faint fractal-noise grain, used to give the card surface some tooth instead of a flat gradient
const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

function timeAgo(dateString: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Expiry duration (5 minutes)
const EXPIRY_MINUTES = 5;
const EXPIRY_MS = EXPIRY_MINUTES * 60 * 1000;

export function FeedCard({ match, currentUserId }: { match: MatchWithHost; currentUserId?: string }) {
  const [claiming, setClaiming] = useState(false);
  const [claimedData, setClaimedData] = useState<{ room_number: string; password: string | null } | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    const expiry = new Date(match.created_at).getTime() + EXPIRY_MS;
    return Math.max(0, expiry - Date.now());
  });
  const [isHovering, setIsHovering] = useState(false);
  const [flash, setFlash] = useState(false);

  // Update expiry timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      const expiry = new Date(match.created_at).getTime() + EXPIRY_MS;
      const diff = Math.max(0, expiry - Date.now());
      setRemainingMs(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [match.created_at]);

  const isExpired = remainingMs <= 0;
  const remainingPct = Math.max(0, Math.min(100, (remainingMs / EXPIRY_MS) * 100));
  const isUrgent = !isExpired && remainingMs < EXPIRY_MS * 0.15; // last ~45s

  // Format remaining time as MM:SS
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isHost = currentUserId === match.host_id;
  const alreadyClaimed = currentUserId ? match.claimant_ids?.includes(currentUserId) : false;
  const canClaim = !isHost && !alreadyClaimed && match.status === 'Unclaimed' && !isExpired;

  // Room vibe gauge — troll score (tc) inverted, so the bar reads as how CHILL the room is.
  // tc 30 -> 70% chill. tc 0 -> 100% chill. tc 100 -> 0% chill (fully troll).
  const trollPct = Math.min(100, Math.max(0, Number(match.tc) || 0));
  const vibePct = 100 - trollPct;
  let vibeLabel = 'Chill';
  let vibeColor = '#22c55e';
  if (vibePct <= 33) { vibeLabel = 'Troll'; vibeColor = '#ef4444'; }
  else if (vibePct <= 66) { vibeLabel = 'Cheeky'; vibeColor = '#eab308'; }

  // Expiry timer colour
  let timerColor = '#22c55e';
  if (remainingMs < EXPIRY_MS * 0.3) timerColor = '#ef4444';
  else if (remainingMs < EXPIRY_MS * 0.6) timerColor = '#eab308';

  // Status-driven aura: what the card is "about" right now, ranked above raw room vibe.
  // Your own room -> blue. Something you've claimed -> green. Dead listing -> flat gray.
  // Otherwise the room's own vibe sets the tone before you've committed to anything.
  // Kept deliberately faint — this is a signal, not a spotlight.
  let auraColor = vibeColor;
  let auraStrength = 0.09;
  if (isHost) { auraColor = '#1E90FF'; auraStrength = 0.08; }
  else if (alreadyClaimed) { auraColor = '#22c55e'; auraStrength = 0.09; }
  else if (isExpired) { auraColor = '#52525b'; auraStrength = 0.04; }

  // Match type icon
  const TypeIcon = match.match_type === '1v1' ? Swords
    : match.match_type === 'Co-op' ? (match.coop_sub === '2 vs AI' ? Bot : UserPlus)
      : Trophy;

  const handleClaim = async () => {
    if (!currentUserId) {
      toast.error('You must be signed in to claim a room');
      return;
    }
    setClaiming(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/Upmat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, userId: currentUserId }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'SQUAD_NOT_VERIFIED') {
          toast.error('Your squad must be verified before claiming a room. Please update your squad via the profile page.');
        } else if (data.error === 'ACTIVE_MATCH_EXISTS') {
          toast.error(data.message || 'You already have an active match.');
        } else if (data.error === 'RESULTS_NEEDED') {
          toast.error(data.message || 'You must report your previous match result first.');
        } else {
          toast.error(data.message || 'Failed to claim room');
        }
      } else {
        setClaimedData(data);
      }
    } catch {
      toast.error('Network error – please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const onClaimClick = () => {
    if (!canClaim || claiming) return;
    setFlash(true);
    handleClaim();
  };

  return (
    <>
      {/* Local keyframes — move to your global stylesheet once wired in, this is just so the file works standalone */}
      <style>{`
        @keyframes fc-urgent-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .75; transform: scale(1.03); }
        }
        @keyframes fc-aura-breathe {
          0%, 100% { opacity: .4; }
          50% { opacity: .75; }
        }
        @keyframes fc-text-in {
          0% { opacity: 0; transform: translateY(3px) scale(.94); }
          60% { opacity: 1; transform: translateY(0) scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fc-press-flash {
          0% { opacity: .5; transform: scale(.92); }
          100% { opacity: 0; transform: scale(1.18); }
        }
      `}</style>

      <div
        className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 sm:p-5 ${isExpired ? 'grayscale-[0.35]' : ''}`}
        style={{
          borderColor: hexToRgba(auraColor, 0.14),
          background: `radial-gradient(130% 100% at 12% -10%, ${hexToRgba(auraColor, 0.05)}, transparent 55%), linear-gradient(180deg, #161616, #101010)`,
          boxShadow: `0 10px 28px -18px ${hexToRgba(auraColor, auraStrength)}`,
        }}
      >
        {/* Grain + hairline HUD grid — texture, not decoration */}
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

        {/* Ambient corner watermark — quiet reminder of what this room actually is */}
        <TypeIcon
          className="pointer-events-none absolute -right-5 -top-5 h-28 w-28 rotate-12 text-white/[0.03] transition-transform duration-500 group-hover:rotate-6"
          strokeWidth={1.25}
        />

        {/* Hairline aura rule along the top edge — the card's status, kept faint */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${hexToRgba(auraColor, 0.9)}, transparent)`,
            animation: !isExpired ? 'fc-aura-breathe 3.4s ease-in-out infinite' : 'none',
          }}
        />

        <div className="relative z-10">
          {/* Avatar + username + badges */}
          <div className="flex items-start gap-3.5">
            <div
              className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-[#0A0A0A]"
              style={{ boxShadow: `0 0 0 2px #101012, 0 0 0 3px ${hexToRgba(auraColor, 0.3)}` }}
            >
              <img src={match.p_url} alt={match.house} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="truncate text-[15px] font-bold tracking-tight text-white">{match.house}</h3>
                {match.iss && (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1.5 pr-2.5" title="Staff">
                    <img src={STAFF_BADGE} alt="" className="h-5 w-5 object-contain" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-300">Staff</span>
                  </span>
                )}
                {match.isv && (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1.5 pr-2.5" title="Verified">
                    <img src={VERIFIED_BADGE} alt="" className="h-5 w-5 object-contain" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-300">Verified</span>
                  </span>
                )}
              </div>

              {(match.squad_rank || match.player_rank) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {match.squad_rank && (
                    <span className="flex items-center gap-1.5 rounded-full bg-white/[0.03] py-1 pl-1.5 pr-2.5 text-[10px] font-medium text-gray-400" title={match.squad_rank}>
                      {match.r_url && <img src={match.r_url} alt="" className="h-4 w-4 rounded-full object-contain" />}
                      {match.squad_rank}
                    </span>
                  )}
                  {match.player_rank && (
                    <span className="flex items-center gap-1.5 rounded-full bg-white/[0.03] py-1 pl-1.5 pr-2.5 text-[10px] font-medium text-gray-400" title={match.player_rank}>
                      {match.pr_url && <img src={match.pr_url} alt="" className="h-4 w-4 rounded-full object-contain" />}
                      {match.player_rank}
                    </span>
                  )}
                </div>
              )}

              {/* Time & match type */}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(match.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <TypeIcon className="h-3 w-3" />
                  {match.coop_sub ? match.coop_sub : match.match_type}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {match.nopr} player{match.nopr > 1 ? 's' : ''} needed
                </span>
              </div>
            </div>
          </div>

          {/* Room vibe gauge (inverted troll score — higher bar = chiller room) */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-gray-400">
                <Flame className="h-3 w-3" style={{ color: vibeColor }} />
                Room vibe
              </span>
              <span className="font-semibold" style={{ color: vibeColor }}>{vibeLabel} · {vibePct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${vibePct}%`, background: vibeColor, boxShadow: `0 0 4px ${hexToRgba(vibeColor, 0.35)}` }}
              />
            </div>
          </div>

          {/* Expiry timer */}
          <div className="mt-3.5 flex items-center justify-between gap-3">
            {!isExpired ? (
              <>
                <span
                  className="flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums"
                  style={{
                    color: timerColor,
                    animation: isUrgent ? 'fc-urgent-pulse 1s ease-in-out infinite' : 'none',
                  }}
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
              </>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
                <XCircle className="h-4 w-4" />
                Expired
              </span>
            )}
          </div>

          {/* Claim button */}
          <button
            onClick={onClaimClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            disabled={!canClaim || claiming}
            className={`relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-2.5 text-sm font-bold transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.96] ${
              canClaim
                ? 'bg-gradient-to-b from-[#2E8FFF] to-[#1B77D6] text-white shadow-[0_2px_10px_-4px_rgba(30,144,255,0.35)] hover:shadow-[0_4px_16px_-4px_rgba(30,144,255,0.5)]'
                : isExpired
                  ? 'cursor-not-allowed border border-white/5 bg-white/[0.02] text-gray-600'
                  : isHost
                    ? 'cursor-not-allowed border border-[#1E90FF]/20 bg-[#1E90FF]/[0.06] text-[#5CA8FF]'
                    : alreadyClaimed
                      ? 'cursor-not-allowed border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400'
                      : 'cursor-not-allowed border border-white/5 bg-white/[0.02] text-gray-600'
            }`}
          >
            {/* Press/release flash */}
            {flash && (
              <span
                className="pointer-events-none absolute inset-0 rounded-xl bg-white"
                style={{ animation: 'fc-press-flash .5s ease-out' }}
                onAnimationEnd={() => setFlash(false)}
              />
            )}

            {isHost ? (
              'Your room'
            ) : alreadyClaimed ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                You're in
              </>
            ) : isExpired ? (
              'Expired'
            ) : claiming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : (
              <span key={isHovering ? 'gameon' : 'claim'} className="inline-flex items-center gap-2" style={{ animation: 'fc-text-in .22s ease' }}>
                {isHovering ? (
                  <>
                    <Swords className="h-4 w-4" />
                    <span className="uppercase tracking-wider">Game on</span>
                  </>
                ) : (
                  'Claim room'
                )}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Claim modal */}
      {claimedData && (
        <ClaimModal
          roomNumber={claimedData.room_number}
          password={claimedData.password}
          onExpire={() => setClaimedData(null)}
        />
      )}
    </>
  );
}

export function FeedCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-[#161616] to-[#101010] p-4 sm:p-5">
      <div className="flex items-center gap-3.5">
        <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-full bg-[#1F1F1F]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 animate-pulse rounded-full bg-[#1F1F1F]" />
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-[#1F1F1F]" />
        </div>
      </div>
      <div className="mt-4 h-1.5 w-full animate-pulse rounded-full bg-[#1F1F1F]" />
      <div className="mt-3.5 h-1 w-full animate-pulse rounded-full bg-[#1F1F1F]" />
      <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-[#1F1F1F]" />
    </div>
  );
}