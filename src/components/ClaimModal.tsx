import { useEffect, useState } from 'react';
import { Copy, Eye, EyeOff, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COUNTDOWN_SECONDS = 15;

interface ClaimModalProps {
  roomNumber: string;
  password: string | null;
  onExpire: () => void;
}

export function ClaimModal({ roomNumber, password, onExpire }: ClaimModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onExpire]);

  // Prevent Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') e.preventDefault();
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, []);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
      <div className="w-full max-w-sm bg-[#141414] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Countdown bar */}
        <div className="bg-[#0A0A0A] px-5 py-3 flex items-center justify-between border-b border-white/5">
          <span className="flex items-center gap-2 text-sm text-gray-400">
            <Timer className="h-4 w-4" />
            Closes in
          </span>
          <span className={cn('text-xl font-bold', secondsLeft <= 5 ? 'text-red-400' : 'text-white')}>
            {secondsLeft}s
          </span>
        </div>

        <div className="p-5 space-y-5">
          {/* Room Number */}
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Room Number</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-2xl font-bold tracking-[0.3em] text-emerald-400">{roomNumber}</span>
              <button onClick={() => copy(roomNumber, 'Room number')} className="p-2 text-gray-400 hover:text-white">
                <Copy className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Password */}
          {password ? (
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Password</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-bold tracking-widest">
                  {showPassword ? password : '••••••••'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setShowPassword(!showPassword)} className="p-2 text-gray-400 hover:text-white">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <button onClick={() => copy(password, 'Password')} className="p-2 text-gray-400 hover:text-white">
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No password</p>
          )}

          <p className="text-xs text-gray-600 text-center">
            Enter room ID and password in eFootball to join.
          </p>
        </div>
      </div>
    </div>
  );
}