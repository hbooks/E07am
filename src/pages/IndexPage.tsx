import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { RefreshCw, Plus, Radar, AlertTriangle, Gamepad2, Headphones, Wifi, Trophy, Radio } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { toast } from 'sonner';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { FeedCard, FeedCardSkeleton } from '@/components/FeedCard';
import { useIsMobile } from '@/hooks/use-mobile';
import type { MatchWithHost } from '@/types';
import { supabase } from '@/lib/supabaseClient';

const PULL_THRESHOLD = 64;
const PULL_RESISTANCE = 0.45;
const PULL_MAX = 90;

type FilterType = '1v1' | 'tc';

// Lucide doesn't ship a soccer-ball glyph, so this matches its own conventions
// (24x24, currentColor stroke, round joins) instead of dropping in something off-style.
function FootballIcon(props: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.2l3 2.2-1.15 3.5h-3.7L9 9.4l3-2.2z" />
      <path d="M12 3v4.2M12 20.8V17M4 9.3l3.7 1.1M20 9.3l-3.7 1.1M5.3 17l3.3-2.4M18.7 17l-3.3-2.4" />
    </svg>
  );
}

// Icon set for the ambient blips — a spread of "what this app is about": play, comms,
// connection, competition. Assigned round-robin below, which reads as random since
// the underlying positions already are.
const BLIP_ICONS = [Gamepad2, Headphones, Wifi, FootballIcon, Trophy, Radio];

// Fixed positions for the ambient blips — deliberately sparse and off-grid,
// not a pattern, so they read as scattered contacts rather than decoration.
// Spread across the full viewport, since the layer they live on is fixed
// and stays on screen the whole time you're scrolling, not just up top.
const BLIPS = [
  { top: '6%', left: '16%', delay: '0s', duration: '6s' },
  { top: '3%', left: '64%', delay: '1.2s', duration: '5.5s' },
  { top: '13%', left: '84%', delay: '2.4s', duration: '6.5s' },
  { top: '2%', left: '40%', delay: '0.6s', duration: '5s' },
  { top: '34%', left: '8%', delay: '1.8s', duration: '7s' },
  { top: '46%', left: '90%', delay: '3.1s', duration: '6s' },
  { top: '58%', left: '30%', delay: '0.3s', duration: '6.5s' },
  { top: '68%', left: '72%', delay: '2.7s', duration: '5.5s' },
  { top: '80%', left: '14%', delay: '1.5s', duration: '7s' },
  { top: '90%', left: '55%', delay: '3.6s', duration: '6s' },
].map((b, i) => ({ ...b, Icon: BLIP_ICONS[i % BLIP_ICONS.length] }));

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

  useEffect(() => {
    const channel = supabase
      .channel('feed-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => {
          fetchMatches(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMatches]);

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

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div
      className="relative min-h-screen text-white cr-body"
      style={{ background: '#08090b' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <style>{`
        @keyframes fp-radar-spin { to { transform: rotate(360deg); } }
        @keyframes fp-radar-spin-reverse { to { transform: rotate(-360deg); } }
        @keyframes fp-blip-fade {
          0%, 100% { opacity: 0; transform: scale(0.7) rotate(-4deg); }
          15% { opacity: .4; transform: scale(1) rotate(0deg); }
          40% { opacity: 0; transform: scale(0.7) rotate(4deg); }
        }
      `}</style>

      {/* Ambient layer — fixed to the viewport, not the page, so the arena stays alive
          the whole time you're scrolling instead of only showing up near the header.
          Every piece here is faint on its own; the coverage is what creates the mood. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Base vignette */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(120% 60% at 50% 0%, #101820 0%, #08090b 45%, #050505 100%)' }}
        />

        {/* Hairline tactical grid — texture, kept just barely visible */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, transparent 1px, transparent 32px), repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, transparent 1px, transparent 32px)',
          }}
        />

        {/* Grain, matching the texture used on the match cards so the whole app feels of a piece */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Two slow radar sweeps, offset and counter-rotating so the motion never feels mechanical */}
        <div
          className="absolute left-1/2 top-[-420px] h-[600px] w-[600px] -translate-x-1/2 opacity-[0.11] blur-2xl"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, #1E90FF 18deg, transparent 70deg, transparent 360deg)',
            animation: 'fp-radar-spin 14s linear infinite',
          }}
        />
        <div
          className="absolute bottom-[-360px] left-[-200px] h-[520px] w-[520px] opacity-[0.07] blur-2xl"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, #3B9CFF 24deg, transparent 80deg, transparent 360deg)',
            animation: 'fp-radar-spin-reverse 22s linear infinite',
          }}
        />

        {/* Scattered gamer-icon blips across the full viewport — controller, headset,
            signal, ball, trophy, broadcast, each fading in and out on its own clock
            so the mix never settles into a visible pattern. */}
        {BLIPS.map((b, i) => (
          <b.Icon
            key={i}
            className="absolute text-[#5CA8FF]"
            style={{
              top: b.top,
              left: b.left,
              width: 16,
              height: 16,
              animation: `fp-blip-fade ${b.duration} ease-in-out infinite`,
              animationDelay: b.delay,
            }}
          />
        ))}
      </div>

      {/* Pull indicator */}
      <div
        className="relative z-10 flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: refreshing ? 48 : pullDistance }}
      >
        <div
          className="grid h-8 w-8 place-items-center rounded-full border border-[#1E90FF]/25 bg-[#141414]"
          style={{ transform: refreshing ? undefined : `scale(${0.7 + pullProgress * 0.3})` }}
        >
          <RefreshCw
            className={`h-4 w-4 text-[#1E90FF] ${refreshing ? 'animate-spin' : ''}`}
            style={refreshing ? undefined : { transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-xl px-4 pt-4 pb-6">
        {/* Hero */}
        <h1 className="text-center text-2xl font-black tracking-tight sm:text-3xl">
          CTR <span className="text-[#3B9CFF]">Lobbies</span>
        </h1>

        {/* Live status row */}
        <div className="mt-2 mb-5 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          <span className="normal-case tracking-normal text-gray-400">
            {loading ? 'scanning…' : `${filteredMatches.length} open now`}
          </span>
        </div>

        {/* Header – mode select with a sliding highlight, refresh on right (mobile) */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="relative flex w-64 items-center rounded-full border border-white/5 bg-[#141414] p-1">
            <div
              className="absolute inset-y-1 rounded-full bg-gradient-to-b from-[#3B9CFF] to-[#1B77D6] shadow-[0_2px_10px_-2px_rgba(30,144,255,0.45)] transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
              style={{ width: 'calc(50% - 4px)', left: 4, transform: filter === 'tc' ? 'translateX(100%)' : 'translateX(0%)' }}
            />
            <button
              onClick={() => setFilter('1v1')}
              className={`relative z-10 flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${filter === '1v1' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              1v1
            </button>
            <button
              onClick={() => setFilter('tc')}
              className={`relative z-10 flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${filter === 'tc' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              T&amp;C
            </button>
          </div>
          {/* Refresh button – only on mobile, absolute right */}
          {isMobile && (
            <button
              onClick={handleRefresh}
              className="absolute right-0 flex-shrink-0 rounded-full border border-transparent p-2.5 text-gray-400 transition hover:border-white/5 hover:bg-[#141414] hover:text-white"
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
          <div className="rounded-3xl border border-red-500/15 bg-[#141414] p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-7 w-7 text-red-400" />
            <p className="mb-4 text-red-400">Something went wrong while loading matches.</p>
            <button
              onClick={() => fetchMatches()}
              className="inline-flex items-center gap-2 rounded-full bg-red-600/20 px-5 py-2.5 text-red-400 transition hover:bg-red-600/30"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        )}

        {/* Empty states */}
        {!loading && !error && matches.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 bg-[#141414] p-10 text-center">
            <Radar className="mx-auto mb-3 h-8 w-8 text-gray-600" />
            <p className="mb-1 text-lg font-semibold">No signals yet</p>
            <p className="mb-6 text-sm text-gray-400">Be the first to open a lobby.</p>
            <a
              href="/create"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:brightness-110"
            >
              <Plus className="h-5 w-5" /> Create Room
            </a>
          </div>
        )}

        {!loading && !error && matches.length > 0 && filteredMatches.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 bg-[#141414] p-10 text-center">
            <Radar className="mx-auto mb-3 h-7 w-7 text-gray-600" />
            <p className="mb-1 text-lg font-semibold">
              No {filter === '1v1' ? '1v1' : 'Tournament & Co-op'} lobbies open
            </p>
            <p className="text-sm text-gray-400">
              Try the other tab, or check back in a bit.
            </p>
          </div>
        )}

        {/* Match cards */}
        {!loading && !error && filteredMatches.length > 0 && (
          <div className="space-y-4">
            {filteredMatches.map((match, i) => (
              <div
                key={match.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${Math.min(i, 8) * 45}ms`, animationFillMode: 'backwards' }}
              >
                <FeedCard match={match} currentUserId={user?.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop fixed refresh button – sits beside the notification bell */}
      {!isMobile && (
        <button
          onClick={handleRefresh}
          className="fixed right-16 top-4 z-50 rounded-full border border-white/5 bg-[#0A0A0A] p-2.5 text-gray-400 transition hover:border-[#1E90FF]/30 hover:bg-[#141414] hover:text-white"
          title="Refresh"
          disabled={loading || refreshing}
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}