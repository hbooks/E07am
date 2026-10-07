import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Eye, EyeOff, X, Trophy, Bot, UserPlus, RefreshCw, ClipboardPaste,
  ShieldAlert, ArrowRight, Lock, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { trackFirstAction } from '@/lib/analytics';

// ---------- sanitizers ----------
function sanitizeRoomNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 12);
}
function sanitizePassword(value: string): string {
  return value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g, '').slice(0, 32);
}

type MatchType = '1v1' | 'Co-op' | 'Tournament';
type CoopSubType = '2 vs AI' | '3 vs 3' | null;
type TournamentSize = 4 | 8 | null;

const PULL_THRESHOLD = 64;
const PULL_RESISTANCE = 0.45;
const PULL_MAX = 80;

// ---------- shared styles ----------
const surface = 'rounded-2xl border border-white/[0.06] bg-[#0f0f11]';
const field = 'w-full rounded-[10px] border bg-[#08090b] px-4 py-3 outline-none transition-colors placeholder:text-gray-600';
const fieldOk = 'border-white/10 focus:border-[#1E90FF] focus:ring-1 focus:ring-[#1E90FF]/40';
const btnPrimary = 'flex w-full items-center justify-center gap-2 rounded-full bg-[#1E90FF] py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60';
const btnGhost = 'flex-1 rounded-full border border-white/10 py-3 text-sm font-semibold text-gray-200 transition hover:border-white/20 hover:bg-white/[0.03]';
const option = (active: boolean) => cn(
  'border transition-colors',
  active ? 'border-[#1E90FF] bg-[#1E90FF]/[0.06]' : 'border-white/10 bg-[#08090b] hover:border-white/20',
);

const TAGLINE: Record<MatchType, string> = {
  '1v1': 'Post a room and get a challenger. Your room stays live for 5 minutes.',
  'Co-op': 'Build your lobby and run it together. Your room stays live for 5 minutes.',
  'Tournament': 'Fill the bracket and let the games begin. Your room stays live for 5 minutes.',
};

const SEMAT_URL = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/Semat`;

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { user, login } = useKindeAuth();

  const [matchType, setMatchType] = useState<MatchType>('1v1');
  const [coopSub, setCoopSub] = useState<CoopSubType>(null);
  const [tournamentSize, setTournamentSize] = useState<TournamentSize>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ room?: string; password?: string; coop?: string; tournament?: string }>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewReveal, setReviewReveal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Active match (from louse)
  const [activeMatch, setActiveMatch] = useState<{ match_id: number; mrs: string } | null>(null);
  const [loadingActive, setLoadingActive] = useState(false);
  const [activeError, setActiveError] = useState<string | null>(null);

  // Error modal
  const [errorModal, setErrorModal] = useState<{
    title: string;
    message: string;
    actionLabel: string;
    actionUrl: string;
  } | null>(null);

  const [shakeRoom, setShakeRoom] = useState(false);
  const [shakePwd, setShakePwd] = useState(false);

  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);

  // Fetch active match from louse
  const fetchActiveMatch = async () => {
    if (!user?.id) return;
    setLoadingActive(true);
    setActiveError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/Get_Active_Match?userId=${encodeURIComponent(user.id)}`);
      if (!res.ok) throw new Error('Failed to load active match');
      const data = await res.json();
      setActiveMatch(data);
    } catch (err: any) {
      setActiveError(err.message || 'Failed to load active match');
    } finally {
      setLoadingActive(false);
    }
  };

  useEffect(() => {
    fetchActiveMatch();
  }, [user?.id]);

  // ---------- validation ----------
  const validate = () => {
    const next: typeof errors = {};

    const expectedLength = matchType === 'Tournament' ? 12 : 8;
    if (!roomNumber.trim()) {
      next.room = 'Room number is required.';
    } else if (roomNumber.length !== expectedLength) {
      next.room = `Room number must be exactly ${expectedLength} digits.`;
    }

    if (passwordEnabled) {
      if (!password.trim()) {
        next.password = 'Password cannot be empty.';
      } else if (password.length < 4) {
        next.password = 'Password must be at least 4 characters.';
      }
    }

    if (matchType === 'Co-op' && !coopSub) {
      next.coop = 'Please select a Co‑op mode.';
    }

    if (matchType === 'Tournament' && !tournamentSize) {
      next.tournament = 'Please select a tournament size.';
    }

    setErrors(next);
    setShakeRoom(!!next.room);
    setShakePwd(!!next.password);
    return Object.keys(next).length === 0;
  };

  const openReview = () => {
    if (!validate()) return;
    setReviewReveal(false);
    setReviewOpen(true);
  };

  const createMatch = async () => {
    if (!user) {
      toast.error('Please sign in to create a match');
      login();
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        userId: user.id,
        matchType,
        coopSub:
          matchType === 'Co-op' ? coopSub :
            matchType === 'Tournament' ? (tournamentSize ? String(tournamentSize) : null) :
              null,
        roomNumber,
        password: passwordEnabled ? password : null,
        nopr: getNopr(),
      };

      const res = await fetch(SEMAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Match created successfully!');
        window.dispatchEvent(
          new CustomEvent('ctr:music:reshuffle', { detail: { reason: 'create' } })
        );
        trackFirstAction(user.id, 'create');
        fetchActiveMatch();
        navigate('/');
      } else {
        if (data.error === 'ACTIVE_MATCH_EXISTS') {
          setErrorModal({
            title: 'Active Match Already',
            message: data.message || 'You already have an unclaimed match. Please wait for it to be claimed or expire (matches auto‑expire after 5 minutes).',
            actionLabel: 'View Feed',
            actionUrl: '/',
          });
        } else if (data.error === 'RESULTS_NEEDED') {
          setErrorModal({
            title: 'Record Previous Match Result',
            message: data.message || 'You must report the result of your last match before creating a new one.',
            actionLabel: 'Record Results',
            actionUrl: '/results',
          });
        } else if (data.error === 'SQUAD_NOT_VERIFIED') {
          setErrorModal({
            title: 'Squad Not Verified',
            message: data.message || 'Your squad strength must be verified before you can create a match. Please submit your squad screenshot on the profile page.',
            actionLabel: 'Update Squad',
            actionUrl: '/update-squad',
          });
        } else if (data.error === 'PROFILE_NOT_FOUND') {
          setErrorModal({
            title: 'Profile Not Found',
            message: data.message || 'You must complete your profile before creating a match.',
            actionLabel: 'Complete Profile',
            actionUrl: '/onboarding',
          });
        } else {
          toast.error(data.message || 'Something went wrong. Please try again.');
        }
      }
    } catch {
      toast.error('Network error – please try again.');
    } finally {
      setSubmitting(false);
      setReviewOpen(false);
    }
  };

  // ---------- paste handler ----------
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/\D/g, '').slice(0, 12);
      if (digits.length > 0) {
        setRoomNumber(digits);
        toast.success('Room number pasted');
      } else {
        toast.error('No digits found in clipboard');
      }
    } catch {
      toast.error('Unable to access clipboard please allow permissions and try again');
    }
  };

  // ---------- formatted display ----------
  const formattedRoomNumber = useMemo(() => {
    if (matchType === 'Tournament') {
      if (roomNumber.length > 8) return `${roomNumber.slice(0, 4)}-${roomNumber.slice(4, 8)}-${roomNumber.slice(8)}`;
      if (roomNumber.length > 4) return `${roomNumber.slice(0, 4)}-${roomNumber.slice(4)}`;
      return roomNumber;
    } else {
      return roomNumber.length > 4 ? `${roomNumber.slice(0, 4)}-${roomNumber.slice(4)}` : roomNumber;
    }
  }, [roomNumber, matchType]);

  // ---------- pull-to-refresh ----------
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = window.scrollY <= 0 && !refreshing ? e.touches[0].clientY : null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPullDistance(Math.min(delta * PULL_RESISTANCE, PULL_MAX));
    }
  };
  const handleTouchEnd = () => {
    if (touchStartY.current === null) return;
    if (pullDistance > PULL_THRESHOLD) {
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
        setRoomNumber('');
        setPassword('');
        setPasswordEnabled(false);
        setErrors({});
      }, 500);
    }
    setPullDistance(0);
    touchStartY.current = null;
  };

  // ---------- computed ----------
  const getNopr = (): number => {
    if (matchType === '1v1') return 1;
    if (matchType === 'Co-op') {
      if (coopSub === '2 vs AI') return 1;
      if (coopSub === '3 vs 3') return 5;
    }
    if (matchType === 'Tournament') {
      if (tournamentSize === 4) return 3;
      if (tournamentSize === 8) return 7;
    }
    return 0;
  };

  const getMatchTypeLabel = (): string => {
    if (matchType === '1v1') return '1 vs 1';
    if (matchType === 'Co-op') {
      if (coopSub === '2 vs AI') return 'Co‑op — 2 vs AI';
      if (coopSub === '3 vs 3') return 'Co‑op — 3 vs 3';
      return 'Co‑op';
    }
    if (matchType === 'Tournament') {
      return `Tournament — ${tournamentSize ?? '?'} players`;
    }
    return '';
  };

  if (loadingActive) {
    return <CreateRoomSkeleton />;
  }

  const roomLength = matchType === 'Tournament' ? 12 : 8;

  // ---------- render ----------
  return (
    <>
      {/* Error modal */}
      {errorModal && (
        <Modal title={errorModal.title} onClose={() => setErrorModal(null)} backdropClose={false}>
          <div className="rounded-xl border border-white/[0.06] bg-[#08090b] p-4">
            <p className="cr-display mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5CA8FF]">Action needed</p>
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
              <p className="text-sm leading-relaxed text-gray-300">{errorModal.message}</p>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={() => setErrorModal(null)} className={btnGhost}>
              Close
            </button>
            <button
              onClick={() => {
                setErrorModal(null);
                navigate(errorModal.actionUrl);
              }}
              className={cn(btnPrimary, 'flex-[1.4]')}
            >
              {errorModal.actionLabel} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Modal>
      )}

      {/* Main content */}
      <div
        className="relative min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#08090b] bg-[repeating-linear-gradient(90deg,transparent_0,transparent_64px,rgba(255,255,255,0.014)_64px,rgba(255,255,255,0.014)_128px)] text-white cr-body"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* pull indicator */}
        {(pullDistance > 0 || refreshing) && (
          <div
            className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-[#0f0f11] p-2.5"
            style={{ opacity: refreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1) }}
          >
            <RefreshCw
              className={`h-5 w-5 text-[#1E90FF] ${refreshing ? 'animate-spin' : ''}`}
              style={refreshing ? undefined : { transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)` }}
            />
          </div>
        )}

        <div className="mx-auto w-full max-w-xl px-4 pb-24 pt-16 animate-in fade-in duration-300 md:pb-10">
          <header className="relative mb-6 overflow-hidden">
            <svg
              aria-hidden="true"
              viewBox="0 0 120 80"
              className="pointer-events-none absolute -right-3 -top-4 h-24 w-36 fill-none stroke-white opacity-[0.08]"
              strokeWidth="1.5"
            >
              <path d="M60 0v80" />
              <circle cx="60" cy="40" r="26" />
              <circle cx="60" cy="40" r="2" className="fill-white" />
            </svg>
            <p className="cr-display text-sm font-semibold uppercase tracking-[0.2em] text-[#5CA8FF]">New lobby</p>
            <h1 className="cr-display text-4xl font-bold uppercase leading-none tracking-tight">Create a match</h1>
            <p className="mt-2 max-w-[22rem] text-sm text-gray-400">{TAGLINE[matchType]}</p>
          </header>

          {/* Active match section */}
          {activeMatch && activeMatch.mrs === 'NOR' ? (
            <div className={cn(surface, 'relative mb-4 overflow-hidden p-4 md:p-5')}>
              {/* Charging-shot sweep bar */}
              <div className="cr-sweep-track">
                <div className="cr-sweep-anchor" />
                <div className="cr-sweep-shot" />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="cr-display text-xs font-semibold uppercase tracking-[0.2em] text-[#5CA8FF]">Awaiting result</p>
                  <p className="mt-1 truncate font-mono text-lg font-semibold text-white">CTR_lm{activeMatch.match_id}</p>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-gray-400">
                    <Clock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    Report this result to unlock new rooms.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/results')}
                  className="w-full flex-shrink-0 rounded-full bg-[#1E90FF] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] sm:w-auto"
                >
                  Record results
                </button>
              </div>
              {loadingActive && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Refreshing...
                </div>
              )}
              {activeError && <p className="mt-3 text-xs text-red-400">{activeError}</p>}
            </div>
          ) : (
            <div className="mb-4 rounded-2xl border border-dashed border-white/10 px-4 py-3.5 text-center">
              <p className="text-sm text-gray-400">No unrecorded matches</p>
              <p className="mt-0.5 text-xs text-gray-500">Create a match below or claim one from the feed.</p>
            </div>
          )}

          <div className={cn(surface, 'relative space-y-6 p-5 md:p-6')}>
            <div className="absolute left-5 top-0 h-[3px] w-14 rounded-b bg-[#1E90FF]" />

            {/* Match type */}
            <div>
              <StepLabel n="01">Match type</StepLabel>
              <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Match type">
                {([
                  { type: '1v1' as const, desc: 'Head-to-head' },
                  { type: 'Co-op' as const, desc: 'Team play' },
                  { type: 'Tournament' as const, desc: '4 or 8 players' },
                ]).map(({ type: t, desc }) => {
                  const isActive = matchType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => {
                        setMatchType(t);
                        if (t !== 'Co-op') setCoopSub(null);
                        if (t !== 'Tournament') setTournamentSize(null);
                      }}
                      className={cn(
                        option(isActive),
                        'relative flex items-center gap-3 rounded-xl px-4 py-3 text-left sm:flex-col sm:gap-1.5 sm:px-2 sm:pb-3 sm:pt-4 sm:text-center',
                      )}
                    >
                      <ModeGlyph type={t} className={cn('h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8', isActive ? 'text-[#5CA8FF]' : 'text-gray-500')} />
                      <span className="min-w-0 flex-1 sm:flex-none">
                        <span className="cr-display block text-base font-bold uppercase leading-tight tracking-wide sm:text-[15px]">{t}</span>
                        <span className="block text-xs leading-tight text-gray-500 sm:mt-1 sm:text-[11px]">{desc}</span>
                      </span>
                      <span className={cn('grid h-4 w-4 flex-shrink-0 place-items-center rounded-full border sm:hidden', isActive ? 'border-[#1E90FF]' : 'border-white/20')}>
                        {isActive && <span className="h-2 w-2 rounded-full bg-[#1E90FF]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Co‑op sub‑type */}
            {matchType === 'Co-op' && (
              <div className="animate-in fade-in duration-200">
                <p className="mb-2.5 text-sm font-semibold">Co‑op mode</p>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Co-op mode">
                  {(['2 vs AI', '3 vs 3'] as CoopSubType[]).map((sub) => {
                    const isActive = coopSub === sub;
                    const Icon = sub === '2 vs AI' ? Bot : UserPlus;
                    return (
                      <button
                        key={sub}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setCoopSub(sub)}
                        className={cn(
                          option(isActive),
                          'flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold',
                          isActive ? 'text-white' : 'text-gray-400 hover:text-white',
                        )}
                      >
                        <Icon className={cn('h-4 w-4', isActive && 'text-[#5CA8FF]')} />
                        {sub}
                      </button>
                    );
                  })}
                </div>
                {errors.coop && <p className="mt-1.5 text-xs text-destructive">{errors.coop}</p>}
              </div>
            )}

            {/* Tournament size */}
            {matchType === 'Tournament' && (
              <div className="animate-in fade-in duration-200">
                <p className="mb-2.5 text-sm font-semibold">Tournament size</p>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tournament size">
                  {([4, 8] as const).map((size) => {
                    const isActive = tournamentSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setTournamentSize(size)}
                        className={cn(
                          option(isActive),
                          'flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold',
                          isActive ? 'text-white' : 'text-gray-400 hover:text-white',
                        )}
                      >
                        <Trophy className={cn('h-4 w-4', isActive && 'text-[#5CA8FF]')} />
                        {size} players
                      </button>
                    );
                  })}
                </div>
                {errors.tournament && <p className="mt-1.5 text-xs text-destructive">{errors.tournament}</p>}
              </div>
            )}

            <div className="h-px bg-white/[0.06]" />

            {/* Room number */}
            <div>
              <div className="mb-2.5 flex items-baseline justify-between">
                <StepLabel n="02" htmlFor="room-number" flush>Room code</StepLabel>
                <span className="font-mono text-xs text-gray-500">
                  <span className={roomNumber.length === roomLength ? 'text-[#5CA8FF]' : undefined}>{roomNumber.length}</span>/{roomLength}
                </span>
              </div>
              <div className="relative">
                <input
                  id="room-number"
                  value={formattedRoomNumber}
                  onChange={(e) => {
                    const maxDigits = matchType === 'Tournament' ? 12 : 8;
                    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, maxDigits);
                    setRoomNumber(raw);
                    if (errors.room) setErrors((prev) => ({ ...prev, room: undefined }));
                  }}
                  placeholder={matchType === 'Tournament' ? '0000-0000-0000' : '0000-0000'}
                  autoComplete="off"
                  inputMode="numeric"
                  className={cn(
                    field,
                    'pr-12 font-mono text-base tracking-[0.14em] placeholder:tracking-normal sm:pr-24 sm:text-xl sm:tracking-[0.22em]',
                    errors.room ? 'border-destructive' : fieldOk,
                    shakeRoom && 'animate-[shake_0.5s_ease-in-out]',
                  )}
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
                  title="Paste from clipboard"
                  aria-label="Paste from clipboard"
                >
                  <ClipboardPaste className="h-4 w-4" /> <span className="hidden sm:inline">Paste</span>
                </button>
              </div>
              <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-[#1E90FF] transition-[width] duration-200"
                  style={{ width: `${(roomNumber.length / roomLength) * 100}%` }}
                />
              </div>
              {errors.room ? (
                <p className="mt-1.5 text-xs text-destructive">{errors.room}</p>
              ) : (
                <p className="mt-1.5 text-xs text-gray-500">Copy it from your eFootball room screen.</p>
              )}
            </div>

            {/* Password toggle */}
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <StepLabel n="03" flush>
                    Room password <Lock className="ml-1.5 h-3.5 w-3.5 text-gray-500" />
                  </StepLabel>
                  <p className="mt-0.5 text-xs text-gray-500">Turn on if your room is protected by a password.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={passwordEnabled}
                  aria-label="Room has a password"
                  onClick={() => {
                    setPasswordEnabled((v) => !v);
                    if (!passwordEnabled) setPassword('');
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={cn(
                    'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors',
                    passwordEnabled ? 'border-[#1E90FF] bg-[#1E90FF]' : 'border-white/10 bg-[#08090b]',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                      passwordEnabled ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>

              <div
                className={cn(
                  'grid transition-all duration-300 ease-in-out',
                  passwordEnabled ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  <div className="relative mt-3">
                    <input
                      id="room-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(sanitizePassword(e.target.value));
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      placeholder="The eFootball room's password"
                      autoComplete="new-password"
                      className={cn(
                        field,
                        'pr-12',
                        errors.password ? 'border-destructive' : fieldOk,
                        shakePwd && 'animate-[shake_0.5s_ease-in-out]',
                      )}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1.5 text-xs text-destructive">{errors.password}</p>}
                </div>
              </div>
            </div>

            <button type="button" onClick={openReview} className={btnPrimary}>
              Review lobby
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Review modal */}
          {reviewOpen && (
            <Modal title="Ready to go live?" onClose={() => setReviewOpen(false)}>
              <div className="mb-4 rounded-xl border border-white/[0.06] bg-[#08090b] p-4">
                <p className="cr-display text-lg font-bold uppercase tracking-wide">{getMatchTypeLabel()}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2" aria-label={`You plus ${getNopr()} open slots`}>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1E90FF] text-[10px] font-bold uppercase text-white">You</span>
                  {Array.from({ length: getNopr() }).map((_, i) => (
                    <span key={i} className="h-8 w-8 rounded-full border border-dashed border-white/25" />
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {getNopr()} open {getNopr() === 1 ? 'slot' : 'slots'} for players to claim
                </p>
              </div>
              <dl className="divide-y divide-white/[0.06] border-y border-white/[0.06] text-sm">
                <SummaryRow label="Room code" value={formattedRoomNumber} mono />
                <div className="flex items-center justify-between py-3">
                  <dt className="text-gray-400">Password</dt>
                  <dd className="flex items-center gap-3 font-medium">
                    {passwordEnabled && password ? (
                      <>
                        <span className="font-mono">{reviewReveal ? password : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={() => setReviewReveal((v) => !v)}
                          className="text-xs font-medium text-[#5CA8FF] hover:underline"
                        >
                          {reviewReveal ? 'Hide' : 'Reveal'}
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-300">None</span>
                    )}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" /> Your room stays live for 5 minutes once you go live.
              </p>

              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => setReviewOpen(false)} disabled={submitting} className={btnGhost}>
                  Back
                </button>
                <button
                  type="button"
                  onClick={createMatch}
                  disabled={submitting}
                  className={cn(btnPrimary, 'flex-[1.4]')}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Going live…
                    </>
                  ) : (
                    'Go live'
                  )}
                </button>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </>
  );
}

// ---------- Small building blocks ----------
function StepLabel({
  n, children, htmlFor, flush,
}: { n: string; children: React.ReactNode; htmlFor?: string; flush?: boolean }) {
  return (
    <label htmlFor={htmlFor} className={cn('flex items-center text-sm font-semibold', !flush && 'mb-2.5')}>
      <span className="cr-display mr-2.5 text-sm font-bold tracking-wider text-[#5CA8FF]">{n}</span>
      {children}
    </label>
  );
}

function ModeGlyph({ type, className }: { type: MatchType; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {type === '1v1' && (<><circle cx="5.5" cy="12" r="3" /><circle cx="18.5" cy="12" r="3" /><path d="M10.5 12h3" strokeDasharray="1 2.5" /></>)}
      {type === 'Co-op' && (<><circle cx="12" cy="6.5" r="2.5" /><circle cx="6" cy="17" r="2.5" /><circle cx="18" cy="17" r="2.5" /><path d="M10.7 8.7 7.3 14.8M13.3 8.7l3.4 6.1M8.5 17h7" /></>)}
      {type === 'Tournament' && (<><path d="M3 5.5h5v13H3M8 12h6M14 8v8M14 12h7" /><circle cx="21" cy="12" r="0.8" fill="currentColor" /></>)}
    </svg>
  );
}

function Modal({
  title, onClose, backdropClose = true, children,
}: { title: string; onClose?: () => void; backdropClose?: boolean; children: React.ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 animate-in fade-in duration-150"
      onClick={backdropClose ? onClose : undefined}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-white/10 bg-[#0f0f11] p-5 text-white animate-in zoom-in-95 duration-150 sm:p-6 cr-body"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute left-5 top-0 h-[3px] w-14 rounded-b bg-[#1E90FF] sm:left-6" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="cr-display text-xl font-bold uppercase tracking-wide text-white">{title}</h2>
          {onClose && (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="-mr-1.5 rounded-full p-1.5 text-gray-500 transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-gray-400">{label}</dt>
      <dd className={cn('font-medium text-white', mono && 'font-mono tracking-[0.15em]')}>{value}</dd>
    </div>
  );
}

// ---------- Skeleton Loader ----------
function CreateRoomSkeleton() {
  const bar = 'animate-pulse rounded bg-white/[0.06]';
  return (
    <div className="min-h-screen bg-[#08090b] text-white cr-body">
      <div className="mx-auto w-full max-w-xl px-4 pt-16">
        <div className="mb-6 space-y-2">
          <div className={cn(bar, 'h-8 w-48')} />
          <div className={cn(bar, 'h-4 w-72 max-w-full')} />
        </div>
        <div className="mb-4 h-16 animate-pulse rounded-2xl border border-dashed border-white/10" />
        <div className={cn(surface, 'space-y-6 p-5 md:p-6')}>
          <div className="space-y-2">
            <div className={cn(bar, 'h-4 w-24')} />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[62px] animate-pulse rounded-xl border border-white/10 bg-[#08090b]" />
            ))}
          </div>
          <div className="space-y-2">
            <div className={cn(bar, 'h-4 w-24')} />
            <div className="h-12 animate-pulse rounded-[10px] bg-white/[0.06]" />
          </div>
          <div className="flex items-center justify-between">
            <div className={cn(bar, 'h-4 w-40')} />
            <div className="h-6 w-11 animate-pulse rounded-full bg-white/[0.06]" />
          </div>
          <div className="h-11 animate-pulse rounded-full bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}