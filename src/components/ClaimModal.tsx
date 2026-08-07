import { useEffect, useState } from "react";
import { Copy, Eye, EyeOff, Timer } from "lucide-react";
import { toast } from "sonner";
import type { MatchRequest } from "@/lib/mock-data";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { cn } from "@/lib/utils";

const COUNTDOWN_SECONDS = 15;

/**
 * Room reveal modal. Intentionally NON-closable: no X button, backdrop clicks
 * are ignored, Escape is swallowed. It only closes when the countdown ends.
 */
export function ClaimModal({
  match,
  onExpire,
}: {
  match: MatchRequest;
  onExpire: () => void;
}) {
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

  // Swallow Escape so the modal can't be dismissed early
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Unable to copy, please try again.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Room claimed — match details"
      className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-2xl glow-blue-soft animate-in zoom-in-95 duration-200">
        {/* Countdown header */}
        <div className="border-b border-border px-5 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Timer className="h-4 w-4" />
              Room automatically closing in
            </span>
            <span
              className={cn(
                "text-2xl font-black tabular-nums",
                secondsLeft <= 5 ? "text-destructive" : "text-foreground",
              )}
            >
              {secondsLeft}s
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary animate-timer-bar"
              key={match.id}
            />
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="flex items-center gap-3">
            <PlayerAvatar player={match.host} size="sm" />
            <div>
              <p className="text-sm font-semibold">{match.host.username}'s room</p>
              <p className="text-xs text-muted-foreground">
                {match.matchType} · {match.host.rank.label}
              </p>
            </div>
          </div>

          {/* Room number — tap to copy */}
          <CopyRow
            label="Room Number"
            value={match.roomNumber}
            onCopy={() => copy(match.roomNumber, "Room number")}
          />

          {/* Password — hidden by default, tap to copy */}
          {match.password ? (
            <div className="rounded-2xl border border-border bg-secondary/50 p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                  Password
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    aria-label="Copy password"
                    onClick={() => copy(match.password!, "Password")}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => copy(match.password!, "Password")}
                className="mt-1 font-mono text-xl font-bold tracking-widest text-foreground"
              >
                {showPassword ? match.password : "••••••••"}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground">
              No password — open room.
            </div>
          )}

          <p className="rounded-xl bg-accent/50 px-3.5 py-3 text-center text-xs leading-relaxed text-accent-foreground">
            Go to eFootball, enter room ID and password (If set) to join.
          </p>
        </div>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-primary/40 bg-accent/40 p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
        <button
          type="button"
          aria-label={`Copy ${label.toLowerCase()}`}
          onClick={onCopy}
          className="rounded-lg p-1.5 text-primary transition-colors hover:bg-primary/10"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="mt-1 font-mono text-2xl font-black tracking-[0.3em] text-primary"
      >
        {value}
      </button>
    </div>
  );
}

export default ClaimModal;