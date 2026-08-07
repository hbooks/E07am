import { useNavigate } from 'react-router-dom';
import { useState } from "react";
import { Eye, EyeOff, Swords, Users, X } from "lucide-react";
import { toast } from "sonner";
import { sanitizePassword, sanitizeRoomNumber } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
 
type MatchType = "1v1" | "Co-op";

function CreateRoomPage() {
  const navigate = useNavigate();
  const [matchType, setMatchType] = useState<MatchType>("1v1");
  const [roomNumber, setRoomNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ room?: string; password?: string }>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewReveal, setReviewReveal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (!roomNumber.trim()) next.room = "Room number is required.";
    else if (roomNumber.length < 4) next.room = "Room number must be at least 4 characters.";
    if (password && password.length < 4)
      next.password = "Password must be at least 4 characters, or leave it empty.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const openReview = () => {
    if (!validate()) return;
    setReviewReveal(false);
    setReviewOpen(true);
  };

  const createMatch = async () => {
    setSubmitting(true);
    try {
      // Mock create call — in production this posts to the backend.
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Match created successfully!");
      navigate("/");
    } catch {
      // Never surface raw backend errors to the user.
      toast.error("Something went wrong, please try again.");
    } finally {
      setSubmitting(false);
      setReviewOpen(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-16 pb-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <header className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Create Room</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Post your eFootball room and let the lobby claim it.
        </p>
      </header>

      <div className="space-y-6 rounded-3xl border border-border bg-card p-5 md:p-7">
        {/* Match type segmented control */}
        <div>
          <p className="mb-2 text-sm font-semibold">Match type</p>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary/60 p-1.5" role="radiogroup" aria-label="Match type">
            {(["1v1", "Co-op"] as MatchType[]).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={matchType === t}
                onClick={() => setMatchType(t)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
                  matchType === t
                    ? "bg-primary text-primary-foreground glow-blue-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t === "1v1" ? <Swords className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Room number — sanitized on change (see src/lib/sanitize.ts) */}
        <div>
          <label htmlFor="room-number" className="mb-2 block text-sm font-semibold">
            Room Number
          </label>
          <input
            id="room-number"
            value={roomNumber}
            onChange={(e) => setRoomNumber(sanitizeRoomNumber(e.target.value))}
            placeholder="e.g. 7K2M4X"
            autoComplete="off"
            className={cn(
              "w-full rounded-xl border bg-background px-4 py-3 font-mono text-lg tracking-[0.25em] outline-none transition-colors placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30",
              errors.room ? "border-destructive" : "border-input",
            )}
          />
          {errors.room && <p className="mt-1.5 text-xs text-destructive">{errors.room}</p>}
        </div>

        {/* Password — sanitized on change, visually encrypted by default */}
        <div>
          <label htmlFor="room-password" className="mb-2 block text-sm font-semibold">
            Password <span className="font-normal text-muted-foreground">(if any)</span>
          </label>
          <div className="relative">
            <input
              id="room-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(sanitizePassword(e.target.value))}
              placeholder="Leave empty for an open room"
              autoComplete="new-password"
              className={cn(
                "w-full rounded-xl border bg-background px-4 py-3 pr-12 outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30",
                errors.password ? "border-destructive" : "border-input",
              )}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        <button
          type="button"
          onClick={openReview}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] glow-blue"
        >
          Review
        </button>
      </div>

      {reviewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Review match"
          className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setReviewOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Review your match</h2>
              <button
                type="button"
                aria-label="Close review"
                onClick={() => setReviewOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <dl className="space-y-3 text-sm">
              <SummaryRow label="Match type" value={matchType} />
              <SummaryRow label="Room" value={roomNumber} mono />
              <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
                <dt className="text-muted-foreground">Password</dt>
                <dd className="flex items-center gap-2 font-semibold">
                  {password ? (
                    <>
                      <span className="font-mono">
                        {reviewReveal ? password : "••••••••"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReviewReveal((v) => !v)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {reviewReveal ? "hide" : "reveal"}
                      </button>
                    </>
                  ) : (
                    "No"
                  )}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={createMatch}
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 glow-blue"
            >
              {submitting ? "Creating…" : "Create Match"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-semibold", mono && "font-mono tracking-[0.2em] text-primary")}>
        {value}
      </dd>
    </div>
  );
}

export default CreateRoomPage;