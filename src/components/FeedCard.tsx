import { Clock, Swords, Users, Trophy, Bot, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import type { MatchWithHost } from '@/types';
import { ClaimModal } from '@/components/ClaimModal';

const STAFF_BADGE = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380915/ff7rn60eiylq1x1oixsz.png';
const VERIFIED_BADGE = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380916/rsfa4dftmbz427k5cnmw.png';

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

  // Troll level
  const trollPct = Math.min(100, Math.max(0, Number(match.tc) || 0));
  let trollLabel = 'Chill';
  let trollColor = '#22c55e';
  if (trollPct >= 67) { trollLabel = 'Troll'; trollColor = '#ef4444'; }
  else if (trollPct >= 34) { trollLabel = 'Cheeky'; trollColor = '#eab308'; }

  // Expiry timer colour
  let timerColor = '#22c55e';
  if (remainingMs < EXPIRY_MS * 0.3) timerColor = '#ef4444';
  else if (remainingMs < EXPIRY_MS * 0.6) timerColor = '#eab308';

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

  return (
    <>
      <div className="rounded-2xl border border-white/5 bg-[#141414] p-4 sm:p-5 hover:border-white/10 transition-colors">
        {/* Avatar + username + badges */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#0A0A0A] border border-white/10 flex-shrink-0">
            <img src={match.p_url} alt={match.house} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold truncate">{match.house}</h3>
              {/* Badges – now larger and rounded */}
              {match.iss && (
                <img src={STAFF_BADGE} alt="Staff" className="h-5 w-5 rounded-full object-contain" title="Staff" />
              )}
              {match.isv && (
                <img src={VERIFIED_BADGE} alt="Verified" className="h-5 w-5 rounded-full object-contain" title="Verified" />
              )}
              {match.squad_rank && (
                <div className="flex items-center gap-1" title={match.squad_rank}>
                  {match.r_url && (
                    <img src={match.r_url} alt={match.squad_rank} className="h-5 w-5 rounded-full object-contain" />
                  )}
                  <span className="text-[10px] font-medium text-gray-400">{match.squad_rank}</span>
                </div>
              )}
              {match.player_rank && (
                <div className="flex items-center gap-1" title={match.player_rank}>
                  {match.pr_url && (
                    <img src={match.pr_url} alt={match.player_rank} className="h-5 w-5 rounded-full object-contain" />
                  )}
                  <span className="text-[10px] font-medium text-gray-400">{match.player_rank}</span>
                </div>
              )}
            </div>
            {/* Time & match type */}
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo(match.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <TypeIcon className="h-3 w-3" />
                {match.coop_sub ? `${match.coop_sub}` : match.match_type}
              </span>
              <span>{match.nopr} player{match.nopr > 1 ? 's' : ''} needed</span>
            </div>
          </div>
        </div>

        {/* Troll label + Expiry timer – side by side */}
        <div className="mt-3 flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="text-gray-400">Troll:</span>
            <span className="font-semibold" style={{ color: trollColor }}>{trollLabel}</span>
          </span>
          {!isExpired ? (
            <span className="flex items-center gap-1.5 font-mono tabular-nums" style={{ color: timerColor }}>
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTime(remainingMs)}</span>
            </span>
          ) : (
            <span className="text-red-500 font-semibold">Expired</span>
          )}
        </div>

        {/* Claim button – now a proper button */}
        <button
          onClick={handleClaim}
          disabled={!canClaim || claiming}
          className={`mt-3 w-full py-2.5 rounded-xl font-semibold transition ${canClaim
              ? 'bg-[#1E90FF] hover:bg-blue-600 text-white'
              : isExpired
                ? 'bg-[#0A0A0A] text-red-500 cursor-not-allowed border border-red-500/20'
                : isHost
                  ? 'bg-[#0A0A0A] text-gray-500 cursor-not-allowed border border-white/5'
                  : alreadyClaimed
                    ? 'bg-[#0A0A0A] text-green-400 cursor-not-allowed border border-green-500/20'
                    : 'bg-[#0A0A0A] text-gray-600 cursor-not-allowed border border-white/5'
            }`}
        >
          {isHost
            ? 'Your room'
            : alreadyClaimed
              ? 'Claimed ✓'
              : isExpired
                ? 'Expired'
                : claiming
                  ? 'Claiming...'
                  : 'Claim Room'}
        </button>
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
    <div className="rounded-2xl border border-white/5 bg-[#141414] p-5 space-y-3">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#1F1F1F] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="w-1/3 h-4 bg-[#1F1F1F] rounded animate-pulse" />
          <div className="w-1/2 h-3 bg-[#1F1F1F] rounded animate-pulse" />
        </div>
      </div>
      <div className="w-full h-2 bg-[#1F1F1F] rounded animate-pulse" />
      <div className="w-full h-10 bg-[#1F1F1F] rounded-full animate-pulse" />
    </div>
  );
}