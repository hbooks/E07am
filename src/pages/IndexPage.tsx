import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { RefreshCw, Radar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { FeedCard, FeedCardSkeleton } from '@/components/FeedCard';
import { useIsMobile } from '@/hooks/use-mobile';
import type { MatchWithHost } from '@/types';
import { supabase } from '@/lib/supabaseClient';

const PULL_THRESHOLD = 64;
const PULL_RESISTANCE = 0.45;
const PULL_MAX = 90;
const FILTER_STORAGE_KEY = 'ctr_feed_filter';
const SWIPE_HINT_KEY = 'ctr_swipe_hint_seen';

const SWIPE_MIN = 60;
const SWIPE_MAX_Y = 50;

type FilterType = '1v1' | 'tournament' | 'coop';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: '1v1', label: '1v1' },
  { id: 'tournament', label: 'Tournament' },
  { id: 'coop', label: 'Co-op' },
];

const ACCENT: Record<FilterType, string> = {
  '1v1': '#1E90FF',
  'tournament': '#8B5CF6',
  'coop': '#22c55e',
};

// The exact collision point in viewport %. Both orbs' keyframes are written
// so that on a meet frame, both land here. Ring is pinned here too.
const MEET_X = 46;
const MEET_Y = 34;

const DUEL_PALETTES: [string, string, string][] = [
  ['#ef4444', '#f97316', '#eab308'], // red + orange -> yellow
  ['#1E90FF', '#ef4444', '#a855f7'], // blue + red -> magenta
  ['#1E90FF', '#22c55e', '#06b6d4'], // blue + green -> cyan
  ['#f97316', '#eab308', '#f59e0b'], // orange + yellow -> amber
  ['#1E90FF', '#8B5CF6', '#8B5CF6'], // blue + purple -> violet
  ['#ef4444', '#22c55e', '#f97316'], // red + green -> ember
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function timeAgoShort(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function IndexPage() {
  const { user } = useKindeAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<MatchWithHost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number>(Date.now());

  const [filter, setFilter] = useState<FilterType>(() => {
    try {
      const stored = localStorage.getItem(FILTER_STORAGE_KEY);
      if (stored === '1v1' || stored === 'tournament' || stored === 'coop') return stored;
    } catch { /* ignore */ }
    return '1v1';
  });
  useEffect(() => {
    try { localStorage.setItem(FILTER_STORAGE_KEY, filter); } catch { /* ignore */ }
  }, [filter]);

  // Rotate palette every 90s — one full cycle of the 30s loop x3.
  const [duelPaletteIdx, setDuelPaletteIdx] = useState(() =>
    Math.floor(Math.random() * DUEL_PALETTES.length)
  );
  useEffect(() => {
    if (filter !== '1v1') return;
    const id = setInterval(() => {
      setDuelPaletteIdx((i) => (i + 1 + Math.floor(Math.random() * (DUEL_PALETTES.length - 1))) % DUEL_PALETTES.length);
    }, 90_000);
    return () => clearInterval(id);
  }, [filter]);

  const [duelA, duelB, duelRing] = DUEL_PALETTES[duelPaletteIdx];

  const [showSwipeHint, setShowSwipeHint] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(SWIPE_HINT_KEY)) return;
    } catch { /* ignore */ }
    const t = setTimeout(() => setShowSwipeHint(true), 800);
    return () => clearTimeout(t);
  }, []);
  const dismissSwipeHint = useCallback(() => {
    setShowSwipeHint(false);
    try { localStorage.setItem(SWIPE_HINT_KEY, '1'); } catch { /* ignore */ }
  }, []);

  const touchStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const [swipeNudge, setSwipeNudge] = useState<'left' | 'right' | null>(null);

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const fetchMatches = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/Fema`);
      if (!res.ok) throw new Error('Failed to fetch matches');
      const data = await res.json();
      if (Array.isArray(data)) {
        setMatches(shuffleArray(data));
        setLastFetched(Date.now());
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
        { event: '*', schema: 'public', table: 'matches' },
        () => { fetchMatches(true); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMatches]);

  const handleRefresh = () => {
    if (loading || refreshing) return;
    setRefreshing(true);
    fetchMatches(true);
  };

  const filteredMatches = useMemo(() => {
    switch (filter) {
      case '1v1': return matches.filter((m) => m.match_type === '1v1');
      case 'tournament': return matches.filter((m) => m.match_type === 'Tournament');
      case 'coop': return matches.filter((m) => m.match_type === 'Co-op');
    }
  }, [matches, filter]);

  const setFilterWithNudge = useCallback((next: FilterType, direction: 'left' | 'right') => {
    setFilter(next);
    setSwipeNudge(direction);
    setTimeout(() => setSwipeNudge(null), 220);
    if (showSwipeHint) dismissSwipeHint();
  }, [showSwipeHint, dismissSwipeHint]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    swipeStart.current = { x: t.clientX, y: t.clientY };
    touchStartY.current = window.scrollY <= 0 && !refreshing ? t.clientY : null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    if (touchStartY.current !== null) {
      const delta = t.clientY - touchStartY.current;
      if (delta > 0 && window.scrollY <= 0) {
        setPullDistance(Math.min(delta * PULL_RESISTANCE, PULL_MAX));
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (swipeStart.current) {
      const end = e.changedTouches[0];
      if (end) {
        const dx = end.clientX - swipeStart.current.x;
        const dy = end.clientY - swipeStart.current.y;
        if (Math.abs(dx) > SWIPE_MIN && Math.abs(dy) < SWIPE_MAX_Y) {
          const idx = FILTERS.findIndex((f) => f.id === filter);
          if (dx < 0 && idx < FILTERS.length - 1) {
            setFilterWithNudge(FILTERS[idx + 1].id, 'left');
          } else if (dx > 0 && idx > 0) {
            setFilterWithNudge(FILTERS[idx - 1].id, 'right');
          }
        }
      }
      swipeStart.current = null;
    }
    if (touchStartY.current !== null) {
      if (pullDistance > PULL_THRESHOLD) handleRefresh();
      setPullDistance(0);
      touchStartY.current = null;
    }
  };

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const activeIdx = FILTERS.findIndex((f) => f.id === filter);
  const accent = ACCENT[filter];

  return (
    <div
      className="relative min-h-screen text-white cr-body"
      style={{ background: '#08090b' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <style>{`
        @keyframes swipe-hint-left {
          0%, 100% { transform: translateX(0); opacity: 1; }
          50% { transform: translateX(-6px); opacity: .55; }
        }
        @keyframes swipe-hint-right {
          0%, 100% { transform: translateX(0); opacity: 1; }
          50% { transform: translateX(6px); opacity: .55; }
        }
        @keyframes pill-kick {
          0%, 100% { box-shadow: 0 2px 10px -3px var(--pill-glow); }
          50% { box-shadow: 0 2px 20px -3px var(--pill-glow); }
        }
        @keyframes bg-ripple {
          0% { transform: translate(-50%, -50%) scale(.6); opacity: 0; }
          20% { opacity: .55; }
          100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }
        @keyframes bg-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ============================================================
           1v1 — dual glow duel (30s loop, 2 meets + 1 obvious miss)
           Both orbs are children of the viewport with top/left set to 0;
           their transform is the full position. Both keyframes reach the
           same (MEET_X, MEET_Y) at 26% and 93% — those are the collisions.
           The miss lap peaks at 55% and both veer away.
           ============================================================ */

        /* Orb A */
        @keyframes duel-orb-a {
          0%   { transform: translate(16vw, 24vh) scale(1);   opacity: 0; }
          4%   {                                              opacity: .85; }
          20%  { transform: translate(38vw, 30vh) scale(1);   }             /* slow down approaching */
          26%  { transform: translate(${MEET_X}vw, ${MEET_Y}vh) scale(1.15); }  /* MEET #1 */
          28%  { transform: translate(${MEET_X}vw, ${MEET_Y}vh) scale(1.35); opacity: .85; } /* brief bloom */
          32%  { transform: translate(${MEET_X}vw, ${MEET_Y}vh) scale(0);   opacity: 0; }     /* dissolve slow */
          36%  { transform: translate(14vw, 48vh) scale(0);   opacity: 0; }
          40%  { transform: translate(14vw, 48vh) scale(1);   opacity: .85; }  /* reappear */
          48%  { transform: translate(34vw, 38vh) scale(1);   }              /* approach miss */
          55%  { transform: translate(44vw, 40vh) scale(.9);  }              /* MISS — near miss point */
          60%  { transform: translate(72vw, 54vh) scale(1);   }              /* burst past fast */
          74%  { transform: translate(30vw, 22vh) scale(1);   }
          88%  { transform: translate(38vw, 28vh) scale(1);   }              /* slow down */
          93%  { transform: translate(${MEET_X}vw, ${MEET_Y}vh) scale(1.15); } /* MEET #2 */
          95%  { transform: translate(${MEET_X}vw, ${MEET_Y}vh) scale(1.35); opacity: .85; }
          100% { transform: translate(${MEET_X}vw, ${MEET_Y}vh) scale(0);   opacity: 0; }
        }

        /* Orb B */
        @keyframes duel-orb-b {
          0%   { transform: translate(80vw, 26vh) scale(1);   opacity: 0; }
          4%   {                                              opacity: .85; }
          20%  { transform: translate(54vw, 30vh) scale(1);   }
          26%  { transform: translate(${MEET_X}vw, ${MEET_Y}vh) scale(1.15); } /* MEET #1 */
          28%  { transform: translate(${MEET_X}vw, ${MEET_Y}vh) scale(1.35); opacity: .85; }
          32%  { transform: translate(${MEET_X}vw, ${MEET_Y}vh) scale(0);   opacity: 0; }
          36%  { transform: translate(78vw, 50vh) scale(0);   opacity: 0; }
          40%  { transform: translate(78vw, 50vh) scale(1);   opacity: .85; }
          48%  { transform: translate(56vw, 38vh) scale(1);   }
          55%  { transform: translate(50vw, 42vh) scale(.9);  }              /* MISS — veers opposite side */
          60%  { transform: translate(24vw, 58vh) scale(1);   }              /* whoosh past */
          74%  { transform: translate(66vw, 24vh) scale(1);   }
          88%  { transform: translate(56vw, 28vh) scale(1);   }
          93%  { transform: translate(${MEET_X}vw, ${MEET_Y}vh) scale(1.15); } /* MEET #2 */
          95%  { transform: translate(${MEET_X}vw, ${MEET_Y}vh) scale(1.35); opacity: .85; }
          100% { transform: translate(${MEET_X}vw, ${MEET_Y}vh) scale(0);   opacity: 0; }
        }

        /* Ring — pinned to the meet point. Two separate rings share these keyframes
           but are offset by a delay so each fires exactly when its collision happens. */
        @keyframes duel-ring {
          0%   { transform: translate(-50%, -50%) scale(.15); opacity: 0;   border-width: 3px; }
          10%  { transform: translate(-50%, -50%) scale(.6);  opacity: .95; border-width: 3px; }   /* flash */
          55%  { transform: translate(-50%, -50%) scale(3.2); opacity: .35; border-width: 1.5px; } /* slow expand */
          100% { transform: translate(-50%, -50%) scale(4.2); opacity: 0;   border-width: 1px; }
        }

        @keyframes duel-undercurrent {
          0%, 100% { opacity: .3; }
          50%      { opacity: .55; }
        }

        @keyframes tide-a {
          0%   { transform: translateX(-14%) scaleX(1);    opacity: .55; }
          50%  { transform: translateX(14%)  scaleX(1.08); opacity: .8; }
          100% { transform: translateX(-14%) scaleX(1);    opacity: .55; }
        }
        @keyframes tide-b {
          0%   { transform: translateX(10%)  scaleX(1);    opacity: .5; }
          50%  { transform: translateX(-12%) scaleX(1.12); opacity: .75; }
          100% { transform: translateX(10%)  scaleX(1);    opacity: .5; }
        }
        @keyframes tide-c {
          0%   { transform: translateX(-6%)  scaleX(1);    opacity: .4; }
          50%  { transform: translateX(18%)  scaleX(1.1);  opacity: .7; }
          100% { transform: translateX(-6%)  scaleX(1);    opacity: .4; }
        }
        @keyframes tide-container {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-1.2%); }
        }
        @keyframes bg-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .bg-scene { animation: bg-fade-in .8s ease-out both; }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(120% 60% at 50% 0%, #101820 0%, #08090b 45%, #050505 100%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, transparent 1px, transparent 32px), repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, transparent 1px, transparent 32px)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        <div key={filter} className="bg-scene absolute inset-0">
          {filter === '1v1' && (
            <>
              {/* faint undercurrent so page isn't empty between encounters */}
              <div
                className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${hexToRgba('#1E90FF', 0.06)} 0%, transparent 65%)`,
                  filter: 'blur(80px)',
                  animation: 'duel-undercurrent 12s ease-in-out infinite',
                }}
              />

              {/* Orb A — its own 30s loop, uses a smooth in/out easing */}
              <div
                className="absolute h-[220px] w-[220px] rounded-full"
                style={{
                  top: '-110px',
                  left: '-110px',
                  background: `radial-gradient(circle, ${hexToRgba(duelA, 0.55)} 0%, ${hexToRgba(duelA, 0.18)} 35%, transparent 70%)`,
                  filter: 'blur(50px)',
                  animation: 'duel-orb-a 30s ease-in-out infinite',
                  willChange: 'transform, opacity',
                }}
              />

              {/* Orb B — same 30s loop */}
              <div
                className="absolute h-[220px] w-[220px] rounded-full"
                style={{
                  top: '-110px',
                  left: '-110px',
                  background: `radial-gradient(circle, ${hexToRgba(duelB, 0.55)} 0%, ${hexToRgba(duelB, 0.18)} 35%, transparent 70%)`,
                  filter: 'blur(50px)',
                  animation: 'duel-orb-b 30s ease-in-out infinite',
                  willChange: 'transform, opacity',
                }}
              />

              {/* Ring 1 — fires exactly at the first meet (26% of 30s ≈ 7.8s) */}
              <div
                className="absolute rounded-full"
                style={{
                  top: `${MEET_Y}vh`,
                  left: `${MEET_X}vw`,
                  width: '260px',
                  height: '260px',
                  border: `2px solid ${hexToRgba(duelRing, 0.9)}`,
                  boxShadow: `0 0 60px ${hexToRgba(duelRing, 0.55)}, inset 0 0 40px ${hexToRgba(duelRing, 0.35)}`,
                  animation: 'duel-ring 30s ease-out infinite',
                  animationDelay: '7.8s',
                  willChange: 'transform, opacity',
                }}
              />

              {/* Ring 2 — fires exactly at the second meet (93% of 30s ≈ 27.9s) */}
              <div
                className="absolute rounded-full"
                style={{
                  top: `${MEET_Y}vh`,
                  left: `${MEET_X}vw`,
                  width: '260px',
                  height: '260px',
                  border: `2px solid ${hexToRgba(duelRing, 0.9)}`,
                  boxShadow: `0 0 60px ${hexToRgba(duelRing, 0.55)}, inset 0 0 40px ${hexToRgba(duelRing, 0.35)}`,
                  animation: 'duel-ring 30s ease-out infinite',
                  animationDelay: '27.9s',
                  willChange: 'transform, opacity',
                }}
              />
            </>
          )}

          {filter === 'tournament' && (
            <>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="absolute left-1/2 top-[18%] h-[320px] w-[320px] rounded-full"
                  style={{
                    border: `1px solid ${hexToRgba(accent, 0.35)}`,
                    animation: 'bg-ripple 9s ease-out infinite',
                    animationDelay: `${i * 3}s`,
                  }}
                />
              ))}
              <div
                className="absolute left-1/2 top-[18%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2"
                style={{ animation: 'bg-orbit 45s linear infinite' }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ border: `1px dashed ${hexToRgba(accent, 0.16)}` }}
                />
              </div>
              <div
                className="absolute left-1/2 top-[18%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2"
                style={{ animation: 'bg-orbit 70s linear infinite reverse' }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ border: `1px dashed ${hexToRgba(accent, 0.10)}` }}
                />
              </div>
              <div
                className="absolute left-1/2 top-[18%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${hexToRgba(accent, 0.12)} 0%, transparent 70%)`,
                  filter: 'blur(50px)',
                }}
              />
            </>
          )}

          {filter === 'coop' && (
            <div
              className="absolute inset-0"
              style={{ animation: 'tide-container 22s ease-in-out infinite' }}
            >
              <div
                className="absolute left-1/2 top-[22%] h-[220px] w-[560px] -translate-x-1/2 rounded-[50%]"
                style={{
                  background: `radial-gradient(ellipse at center, ${hexToRgba('#22c55e', 0.22)} 0%, ${hexToRgba('#22c55e', 0.08)} 45%, transparent 75%)`,
                  filter: 'blur(60px)',
                  animation: 'tide-a 16s ease-in-out infinite',
                }}
              />
              <div
                className="absolute left-1/2 top-[46%] h-[240px] w-[620px] -translate-x-1/2 rounded-[50%]"
                style={{
                  background: `radial-gradient(ellipse at center, ${hexToRgba('#10b981', 0.20)} 0%, ${hexToRgba('#10b981', 0.07)} 45%, transparent 75%)`,
                  filter: 'blur(70px)',
                  animation: 'tide-b 20s ease-in-out infinite',
                }}
              />
              <div
                className="absolute left-1/2 top-[68%] h-[260px] w-[520px] -translate-x-1/2 rounded-[50%]"
                style={{
                  background: `radial-gradient(ellipse at center, ${hexToRgba('#34d399', 0.18)} 0%, ${hexToRgba('#34d399', 0.06)} 45%, transparent 75%)`,
                  filter: 'blur(80px)',
                  animation: 'tide-c 24s ease-in-out infinite',
                }}
              />
            </div>
          )}
        </div>

        <div
          className="absolute inset-x-0 top-0 h-40"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.35), transparent)' }}
        />
      </div>

      <div
        className="relative z-10 flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: refreshing ? 48 : pullDistance }}
      >
        <div
          className="grid h-8 w-8 place-items-center rounded-full border bg-[#141414]"
          style={{ borderColor: hexToRgba(accent, 0.25) }}
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            style={{
              color: accent,
              transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg) scale(${0.7 + pullProgress * 0.3})`,
            }}
          />
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#08090b]/70 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-xl px-4">
          <div className="flex items-center justify-between pt-4 pb-3">
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              CTR <span style={{ color: accent }} className="transition-colors duration-500">Lobbies</span>
            </h1>
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              title="Refresh"
              aria-label="Refresh matches"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-[#141414] text-gray-400 transition hover:bg-[#1a1a1a] hover:text-white disabled:opacity-40"
              style={{ borderColor: hexToRgba(accent, 0.15) }}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex justify-center pb-3">
            <div className="relative flex items-center rounded-full border border-white/5 bg-[#101010] p-1">
              <div
                className="pointer-events-none absolute inset-y-1 rounded-full transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  width: `calc(${100 / FILTERS.length}% - ${(FILTERS.length - 1) * 2 / FILTERS.length}px)`,
                  left: 4,
                  transform: `translateX(calc(${activeIdx * 100}% + ${activeIdx * 2}px))`,
                  background: `linear-gradient(180deg, ${hexToRgba(accent, 1)}, ${hexToRgba(accent, 0.85)})`,
                  boxShadow: `0 2px 10px -3px ${hexToRgba(accent, 0.55)}`,
                  animation: swipeNudge ? 'pill-kick 0.22s ease-out' : undefined,
                  ['--pill-glow' as any]: hexToRgba(accent, 0.75),
                }}
                aria-hidden
              />
              {FILTERS.map((f, i) => {
                const active = filter === f.id;
                const hintSide =
                  showSwipeHint && i === activeIdx + 1 ? 'left'
                    : showSwipeHint && i === activeIdx - 1 ? 'right'
                      : null;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      if (f.id === filter) return;
                      const direction = i > activeIdx ? 'left' : 'right';
                      setFilterWithNudge(f.id, direction);
                    }}
                    className={`relative z-10 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:px-5 sm:text-sm ${active ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    style={
                      hintSide
                        ? { animation: `${hintSide === 'left' ? 'swipe-hint-left' : 'swipe-hint-right'} 1.1s ease-in-out 2` }
                        : undefined
                    }
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {!loading && !error && (
            <div className="flex items-center justify-center gap-1.5 pb-3 text-[11px] text-gray-500">
              <span
                className="h-1.5 w-1.5 rounded-full transition-colors"
                style={{ background: filteredMatches.length > 0 ? accent : '#4b5563' }}
              />
              <span className="tabular-nums">
                {filteredMatches.length} open · {timeAgoShort(lastFetched)}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-xl px-4 pt-4 pb-24">
        {loading && (
          <div className="space-y-4">
            <FeedCardSkeleton />
            <FeedCardSkeleton />
            <FeedCardSkeleton />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-500/15 bg-[#141414] p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-7 w-7 text-red-400" />
            <p className="mb-4 text-sm text-red-400">Couldn't load lobbies.</p>
            <button
              onClick={() => fetchMatches()}
              className="inline-flex items-center gap-2 rounded-full bg-red-600/20 px-5 py-2.5 text-sm text-red-400 transition hover:bg-red-600/30"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-white/5 bg-[#101010]">
              <Radar className="h-5 w-5 text-gray-600" />
            </div>
            <p className="mt-4 text-base font-semibold text-white">No lobbies open</p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Be the first — hit <span className="text-gray-300">＋ New Room</span> in the nav to open one.
            </p>
          </div>
        )}

        {!loading && !error && matches.length > 0 && filteredMatches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-white/5 bg-[#101010]">
              <Radar className="h-5 w-5 text-gray-600" />
            </div>
            <p className="mt-4 text-base font-semibold text-white">
              No {filter === '1v1' ? '1v1' : filter === 'tournament' ? 'tournament' : 'co-op'} lobbies
            </p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Try another tab, or check back in a moment.
            </p>
          </div>
        )}

        {!loading && !error && filteredMatches.length > 0 && (
          <div className="space-y-4">
            {filteredMatches.map((match, i) => (
              <div
                key={match.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                  animationDelay: `${Math.min(i, 8) * 45}ms`,
                  animationFillMode: 'backwards',
                }}
              >
                <FeedCard match={match} currentUserId={user?.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}