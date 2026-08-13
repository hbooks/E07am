import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import {
  Eye, EyeOff, Swords, Users, X, Trophy, Bot, UserPlus, RefreshCw, ClipboardPaste,
  ShieldAlert, ArrowRight, CheckCircle2, Zap, Ticket, Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { cn } from '@/lib/utils';

// ---------- sanitizers ----------
function sanitizeRoomNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8);
}
function sanitizePassword(value: string): string {
  return value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g, '').slice(0, 32);
}

type MatchType = '1v1' | 'Co-op' | 'Tournament';
type CoopSubType = '2 vs AI' | '3 vs 3' | null;

const PULL_THRESHOLD = 64;
const PULL_RESISTANCE = 0.45;
const PULL_MAX = 80;

const SEMAT_URL = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/Semat`;

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { user, login } = useKindeAuth(); // <-- get authenticated user

  const [matchType, setMatchType] = useState<MatchType>('1v1');
  const [coopSub, setCoopSub] = useState<CoopSubType>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ room?: string; password?: string; coop?: string }>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewReveal, setReviewReveal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // error modal
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

  // ---------- validation ----------
  const validate = () => {
    const next: typeof errors = {};
    if (!roomNumber.trim()) {
      next.room = 'Room number is required.';
    } else if (roomNumber.length !== 8) {
      next.room = 'Room number must be exactly 8 digits.';
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
        coopSub,
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
        navigate('/');
      } else {
        // structured backend errors
        if (data.error === 'ACTIVE_MATCH_EXISTS') {
          setErrorModal({
            title: 'Active Match Already',
            message: data.message || 'You already have an unclaimed match. Please wait for it to be claimed or expire (matches auto‑expire after 5 minutes).',
            actionLabel: 'View Feed',
            actionUrl: '/',
          });
        } else if (data.error === 'RESULTS_NEEDED') {
          setErrorModal({
            title: 'Report Previous Result',
            message: data.message || 'You must report the result of your last match before creating a new one.',
            actionLabel: 'Go to My Matches',
            actionUrl: '/results',
          });
        } else if (data.error === 'SQUAD_NOT_VERIFIED') {
          setErrorModal({
            title: 'Squad Not Verified',
            message: data.message || 'Your squad strength must be verified before you can create a match. Please submit your squad screenshot on the profile page.',
            actionLabel: 'Update Squad',
            actionUrl: '/profile',
          });
        } else if (data.error === 'PROFILE_NOT_FOUND') {
          setErrorModal({
            title: 'Profile Not Found',
            message: data.message || 'You must complete your profile before creating a match.',
            actionLabel: 'Complete Profile',
            actionUrl: '/onboarding',
          });
        } else {
          toast.error(data.message || 'Something went entirely wrong and the system does not know who to blame :| ');
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
      const digits = text.replace(/\D/g, '').slice(0, 8);
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
  const formattedRoomNumber = roomNumber.length > 4
    ? `${roomNumber.slice(0, 4)}-${roomNumber.slice(4)}`
    : roomNumber;

  // ---------- pull‑to‑refresh ----------
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
    return 0;
  };

  const getMatchTypeLabel = (): string => {
    if (matchType === '1v1') return '1 vs 1';
    if (matchType === 'Co-op') {
      if (coopSub === '2 vs AI') return 'Co‑op — 2 vs AI';
      if (coopSub === '3 vs 3') return 'Co‑op — 3 vs 3';
      return 'Co‑op';
    }
    return 'Tournament';
  };

  // ---------- render ----------
  return (
    <>
      {/* Error modal */}
      {errorModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl w-full max-w-sm p-6 border border-white/10 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
              <ShieldAlert className="h-7 w-7 text-yellow-500" />
            </div>
            <h2 className="text-lg text-red-500 font-bold mb-2">{errorModal.title}</h2>
            <p className="text-sm text-gray-300 mb-6">{errorModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setErrorModal(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl font-semibold transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setErrorModal(null);
                  navigate(errorModal.actionUrl);
                }}
                className="flex-1 bg-emerald-600 hover:brightness-110 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1 transition"
              >
                {errorModal.actionLabel} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className="relative min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#0A0A0A] text-white cr-body"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* pull indicator - absolute overlay, never occupies layout space */}
        {(pullDistance > 0 || refreshing) && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-[#141414] border border-white/10 rounded-full p-2.5 shadow-lg transition-opacity duration-150"
            style={{ opacity: refreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1) }}
          >
            <RefreshCw
              className={`h-5 w-5 text-emerald-500 ${refreshing ? 'animate-spin' : ''}`}
              style={refreshing ? undefined : { transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)` }}
            />
          </div>
        )}

        <div className="mx-auto w-full max-w-xl px-4 pt-16 pb-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <header className="mb-6 flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/15 border border-emerald-500/30">
                <Swords className="h-7 w-7 text-emerald-500" />
              </div>
              </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Create Your Match Request</h1>
            </div>
          </header>

          <div className="space-y-6 rounded-3xl border border-white/5 bg-[#141414] p-5 md:p-7">
            {/* Match type */}
            <div>
              <p className="mb-2 text-sm font-semibold">Match type</p>
              <div className="space-y-2" role="radiogroup">
                {([
                  { type: '1v1' as const, icon: Swords, desc: 'Head-to-head duel', accent: 'text-red-400' },
                  { type: 'Co-op' as const, icon: Users, desc: 'Team up with the lobby', accent: 'text-sky-400' },
                  { type: 'Tournament' as const, icon: Trophy, desc: 'Coming after the next update', accent: 'text-yellow-400' },
                ]).map(({ type: t, icon: Icon, desc, accent }) => {
                  const isDisabled = t === 'Tournament';
                  const isActive = matchType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      aria-disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        setMatchType(t);
                        if (t !== 'Co-op') setCoopSub(null);
                      }}
                      disabled={isDisabled}
                      title={isDisabled ? 'Tournament mode coming soon' : undefined}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all',
                        isDisabled && 'opacity-40 cursor-not-allowed',
                        isActive && !isDisabled
                          ? 'border-emerald-500/50 bg-emerald-600/10 ring-1 ring-emerald-500/30'
                          : 'border-white/10 bg-[#0A0A0A] hover:border-white/20',
                      )}
                    >
                      <div className={cn(
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/5',
                        isActive && !isDisabled && 'bg-emerald-600/20',
                      )}>
                        <Icon className={cn('h-5 w-5', isActive && !isDisabled ? 'text-emerald-500' : accent)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{t}</p>
                        <p className="text-xs text-gray-500 truncate">{desc}</p>
                      </div>
                      {isActive && !isDisabled && (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Co‑op sub‑type */}
            {matchType === 'Co-op' && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="mb-2 text-sm font-semibold">Co‑op mode</p>
                <div className="grid grid-cols-2 gap-2" role="radiogroup">
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
                          'flex flex-col items-center gap-1.5 rounded-xl border py-3 text-sm font-semibold transition-all',
                          isActive
                            ? 'border-emerald-500/50 bg-emerald-600/10 text-white ring-1 ring-emerald-500/30'
                            : 'border-white/10 bg-[#0A0A0A] text-gray-400 hover:border-white/20 hover:text-white',
                        )}
                      >
                        <Icon className={cn('h-4 w-4', isActive && 'text-emerald-500')} />
                        {sub}
                      </button>
                    );
                  })}
                </div>
                {errors.coop && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.coop}</p>
                )}
              </div>
            )}

            {/* Room number */}
            <div>
              <label htmlFor="room-number" className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Ticket className="h-3.5 w-3.5 text-emerald-500" />
                Room Code
              </label>
              <div className="relative">
                <input
                  id="room-number"
                  value={formattedRoomNumber}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
                    setRoomNumber(raw);
                    if (errors.room) setErrors((prev) => ({ ...prev, room: undefined }));
                  }}
                  placeholder="0000-0000"
                  autoComplete="off"
                  inputMode="numeric"
                  className={cn(
                    'w-full rounded-xl border bg-[#0A0A0A] px-4 py-3 pr-12 font-mono text-lg tracking-[0.25em] outline-none transition-colors placeholder:tracking-normal placeholder:text-gray-600',
                    errors.room ? 'border-destructive' : 'border-white/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30',
                    shakeRoom && 'animate-[shake_0.5s_ease-in-out]',
                  )}
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:text-white transition"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste className="h-5 w-5" />
                </button>
              </div>
              {errors.room && <p className="mt-1.5 text-xs text-destructive">{errors.room}</p>}
            </div>

            {/* Password toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold">
                  <Lock className="h-3.5 w-3.5 text-gray-500" />
                  Password
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={passwordEnabled}
                  onClick={() => {
                    setPasswordEnabled((v) => !v);
                    if (!passwordEnabled) setPassword('');
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={cn(
                    'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                    passwordEnabled ? 'bg-emerald-600' : 'bg-[#0A0A0A] border border-white/10',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                      passwordEnabled ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                Turn on if your room is protected by password.
              </p>

              <div
                className={cn(
                  'grid transition-all duration-300 ease-in-out',
                  passwordEnabled ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  <div className="relative mt-2">
                    <input
                      id="room-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(sanitizePassword(e.target.value));
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      placeholder="The efootball room's password"
                      autoComplete="new-password"
                      className={cn(
                        'w-full rounded-xl border bg-[#0A0A0A] px-4 py-3 pr-12 outline-none transition-colors placeholder:text-gray-600',
                        errors.password ? 'border-destructive' : 'border-white/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30',
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
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-destructive">{errors.password}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openReview}
              className="group relative flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              
              Review Match
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Review modal */}
          {reviewOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Review match"
              className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"
              onClick={() => setReviewOpen(false)}
            >
              <div
                className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#141414] shadow-2xl animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Ticket header band */}
                <div className="relative bg-emerald-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <Ticket className="h-5 w-5" />
                      <h2 className="text-base font-bold tracking-wide">Match Ready</h2>
                    </div>
                    <button
                      type="button"
                      aria-label="Close review"
                      onClick={() => setReviewOpen(false)}
                      className="rounded-full p-1.5 text-white/80 hover:bg-black/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Perforated divider, ticket-style */}
                <div className="relative h-0 border-t-2 border-dashed border-white/10">
                  <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#0A0A0A]" />
                  <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-[#0A0A0A]" />
                </div>

                <div className="p-6">
                  <dl className="space-y-3 text-sm">
                    <SummaryRow label="Match type" value={getMatchTypeLabel()} />
                    <SummaryRow label="Players remaining" value={String(getNopr())} />
                    <SummaryRow label="Room" value={roomNumber} mono />
                    <div className="flex items-center justify-between rounded-xl bg-[#0A0A0A] px-4 py-3">
                      <dt className="text-gray-400">Password</dt>
                      <dd className="flex items-center gap-2 font-semibold">
                        {passwordEnabled && password ? (
                          <>
                            <span className="font-mono">
                              {reviewReveal ? password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setReviewReveal((v) => !v)}
                              className="text-xs font-medium text-emerald-500 hover:underline"
                            >
                              {reviewReveal ? 'hide' : 'reveal'}
                            </button>
                          </>
                        ) : (
                          'No'
                        )}
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={createMatch}
                    disabled={submitting}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      <>
                        <Swords className="h-4 w-4" />
                        Create Match
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#0A0A0A] px-4 py-3">
      <dt className="text-gray-400">{label}</dt>
      <dd className={cn('font-semibold text-white', mono && 'font-mono tracking-[0.2em] text-emerald-400')}>
        {value}
      </dd>
    </div>
  );
}