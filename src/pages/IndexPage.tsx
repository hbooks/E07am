import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { FeedCard, FeedCardSkeleton } from '@/components/FeedCard';
import { useIsMobile } from '@/hooks/use-mobile';
import type { MatchWithHost } from '@/types';

const PULL_THRESHOLD = 64;
const PULL_RESISTANCE = 0.45;
const PULL_MAX = 80;

type FilterType = '1v1' | 'tc';

// Fisher‑Yates shuffle – creates a new array, doesn't mutate the original
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function FeedPage() {
  const { user } = useKindeAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<MatchWithHost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('1v1');

  const touchStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  const fetchMatches = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/Fema`);
      if (!res.ok) throw new Error('Failed to fetch matches');
      const data = await res.json();
      if (Array.isArray(data)) {
        setMatches(shuffleArray(data));
      } else {
        setMatches([]);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      if (!silent) toast.error('Failed to load matches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const handleRefresh = () => {
    if (loading || refreshing) return;
    setRefreshing(true);
    fetchMatches(true);
  };

  const filteredMatches = useMemo(() => {
    if (filter === '1v1') {
      return matches.filter((m) => m.match_type === '1v1');
    } else {
      return matches.filter(
        (m) => m.match_type === 'Tournament' || m.match_type === 'Co-op'
      );
    }
  }, [matches, filter]);

  // Pull‑to‑refresh handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = window.scrollY <= 0 && !refreshing ? e.touches[0]?.clientY : null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0]?.clientY - touchStartY.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPullDistance(Math.min(delta * PULL_RESISTANCE, PULL_MAX));
    }
  };
  const onTouchEnd = () => {
    if (touchStartY.current === null) return;
    if (pullDistance > PULL_THRESHOLD) handleRefresh();
    setPullDistance(0);
    touchStartY.current = null;
  };

  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-white cr-body"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: refreshing ? 48 : pullDistance }}
      >
        <RefreshCw
          className={`h-5 w-5 text-[#1E90FF] ${refreshing ? 'animate-spin' : ''}`}
          style={refreshing ? undefined : { transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)` }}
        />
      </div>

      <div className="mx-auto w-full max-w-xl px-4 pt-4 pb-6">
        {/* Header – filters centered, refresh on right (mobile) */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="flex items-center gap-1.5 bg-[#141414] rounded-full p-1 border border-white/5">
            <button
              onClick={() => setFilter('1v1')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition ${filter === '1v1'
                  ? 'bg-[#1E90FF] text-white shadow-lg shadow-[#1E90FF]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              1v1
            </button>
            <button
              onClick={() => setFilter('tc')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition ${filter === 'tc'
                  ? 'bg-[#1E90FF] text-white shadow-lg shadow-[#1E90FF]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              T&amp;C
            </button>
          </div>
          {/* Refresh button – only on mobile, absolute right */}
          {isMobile && (
            <button
              onClick={handleRefresh}
              className="absolute right-0 rounded-full p-2.5 text-gray-400 hover:text-white hover:bg-[#141414] transition flex-shrink-0"
              title="Refresh"
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            <FeedCardSkeleton />
            <FeedCardSkeleton />
            <FeedCardSkeleton />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-500/20 bg-[#141414] p-8 text-center">
            <p className="text-red-400 mb-4">Something went wrong while loading matches.</p>
            <button
              onClick={() => fetchMatches()}
              className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 px-5 py-2.5 rounded-full hover:bg-red-600/30 transition"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        )}

        {/* Empty states */}
        {!loading && !error && matches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#141414] p-10 text-center">
            <p className="text-lg font-semibold mb-1">No match requests yet.</p>
            <p className="text-sm text-gray-400 mb-6">Be the first to create one!</p>
            <a
              href="/create"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-full font-semibold hover:brightness-110 transition"
            >
              <Plus className="h-5 w-5" /> Create Room
            </a>
          </div>
        )}

        {!loading && !error && matches.length > 0 && filteredMatches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#141414] p-10 text-center">
            <p className="text-lg font-semibold mb-1">
              No {filter === '1v1' ? '1v1' : 'Tournament & Co-op'} matches
            </p>
            <p className="text-sm text-gray-400">
              Try switching to the other tab or check back later.
            </p>
          </div>
        )}

        {/* Match cards */}
        {!loading && !error && filteredMatches.length > 0 && (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <FeedCard
                key={match.id}
                match={match}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop fixed refresh button – sits beside the notification bell */}
      {!isMobile && (
        <button
          onClick={handleRefresh}
          className="fixed top-4 right-16 z-50 rounded-full p-2.5 text-gray-400 hover:text-white hover:bg-[#141414] transition border border-white/5 bg-[#0A0A0A]"
          title="Refresh"
          disabled={loading || refreshing}
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}