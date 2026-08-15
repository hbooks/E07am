import { useEffect, useRef, useState } from 'react';
import { Copy, Check, Eye, EyeOff, DoorOpen, KeyRound, Sparkles, LockKeyhole} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COUNTDOWN_SECONDS = 15;
const RING_R = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

interface ClaimModalProps {
  roomNumber: string;
  password: string | null;
  onExpire: () => void;
}

function timerColor(secondsLeft: number): string {
  if (secondsLeft <= 5) return '#ef4444';
  if (secondsLeft <= 10) return '#eab308';
  return '#22c55e';
}

export function ClaimModal({ roomNumber, password, onExpire }: ClaimModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'room' | 'password' | null>(null);

  // Keep the latest onExpire without letting it re-trigger the interval below —
  // this is the fix: previously `onExpire` (a fresh inline function from the
  // parent's per-second re-render) was a dependency, so the interval was torn
  // down and restarted roughly every second and never reliably reached zero.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          onExpireRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []); // mount once — the timer must not be at the mercy of parent re-renders

  // Prevent Escape key — this reveal is intentionally time-boxed, not dismissible early by accident
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') e.preventDefault();
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, []);

  const color = timerColor(secondsLeft);
  const isUrgent = secondsLeft <= 3;
  const progress = secondsLeft / COUNTDOWN_SECONDS;
  const dashoffset = RING_CIRCUMFERENCE * (1 - progress);

  const copy = async (value: string, label: string, field: 'room' | 'password') => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
      setCopiedField(field);
      setTimeout(() => setCopiedField((f) => (f === field ? null : f)), 1400);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <style>{`
        @keyframes cm-urgent-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes cm-pop-in {
          0% { opacity: 0; transform: scale(0.9) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes cm-check-in {
          0% { opacity: 0; transform: scale(0.5) rotate(-15deg); }
          60% { opacity: 1; transform: scale(1.2) rotate(5deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
      `}</style>

      <div
        className="w-full max-w-sm overflow-hidden rounded-3xl border shadow-2xl"
        style={{
          background: `radial-gradient(140% 100% at 50% -20%, ${hexToRgba(color, 0.08)}, transparent 55%), linear-gradient(180deg, #161616, #101010)`,
          borderColor: hexToRgba(color, 0.2),
          animation: 'cm-pop-in .25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Hero: countdown ring is the whole point of this modal — everything else supports it */}
        <div className="flex flex-col items-center gap-2 px-5 pb-4 pt-6">
          <div
            className="relative h-24 w-24"
            style={{ animation: isUrgent ? 'cm-urgent-pulse 0.6s ease-in-out infinite' : 'none' }}
          >
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r={RING_R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
              <circle
                cx="50"
                cy="50"
                r={RING_R}
                fill="none"
                stroke={color}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={dashoffset}
                className="transition-[stroke-dashoffset,stroke] duration-1000 ease-linear"
                style={{ filter: `drop-shadow(0 0 5px ${hexToRgba(color, 0.5)})` }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-mono text-2xl font-bold tabular-nums" style={{ color }}>
                {secondsLeft}
              </span>
            </div>
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {isUrgent ? "Closing — go, go, go" : 'Closes automatically'}
          </p>
        </div>

        <div className="space-y-4 px-5 pb-5">
          {/* Success framing before the urgency — you got the room, now act on it */}
          <div className="flex items-center justify-center gap-1.5 text-emerald-400">
            <LockKeyhole className="h-6 w-6" />
            <p className="text-sm font-semibold">Room secured</p>
          </div>

          {/* Room Number */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-500">
              <DoorOpen className="h-3 w-3" />
              Room number
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="truncate font-mono text-2xl font-bold tracking-[0.3em] text-emerald-400">
                {roomNumber}
              </span>
              <button
                onClick={() => copy(roomNumber, 'Room number', 'room')}
                aria-label="Copy room number"
                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                {copiedField === 'room' ? (
                  <Check className="h-5 w-5 text-emerald-400" style={{ animation: 'cm-check-in .35s ease' }} />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-500">
              <KeyRound className="h-3 w-3" />
              Password
            </p>
            {password ? (
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-mono text-xl font-bold tracking-widest text-white">
                  {showPassword ? password : '••••••••'}
                </span>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => copy(password, 'Password', 'password')}
                    aria-label="Copy password"
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {copiedField === 'password' ? (
                      <Check className="h-5 w-5 text-emerald-400" style={{ animation: 'cm-check-in .35s ease' }} />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm italic text-gray-500">No password</p>
            )}
          </div>

          <p className="text-center text-xs text-gray-600">
            Enter the room ID and password in eFootball to join.
          </p>

          {/* Lets someone who's already copied both close early, without weakening the auto-expire for anyone else */}
          <button
            onClick={() => onExpireRef.current()}
            className="w-full rounded-xl border border-white/5 bg-white/[0.02] py-2 text-xs font-semibold text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            I'm in — close this
          </button>
        </div>
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}