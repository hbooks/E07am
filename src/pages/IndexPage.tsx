import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { MATCH_REQUESTS, type MatchRequest } from "@/lib/mock-data";
import { FeedCard, FeedCardSkeleton } from "@/components/FeedCard";
import { ClaimModal } from "@/components/ClaimModal";

function FeedPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [claimed, setClaimed] = useState<MatchRequest | null>(null);

  // Pull-to-refresh tracking (mobile)
  const touchStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  const load = useCallback((delay = 1100) => {
    setLoading(true);
    const t = setTimeout(() => {
      setRequests(MATCH_REQUESTS);
      setLoading(false);
      setRefreshing(false);
    }, delay);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => load(), [load]);

  const refresh = useCallback(() => {
    if (loading || refreshing) return;
    setRefreshing(true);
    load(900);
  }, [loading, refreshing, load]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) touchStartY.current = e.touches[0]?.clientY ?? null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const dy = (e.touches[0]?.clientY ?? 0) - touchStartY.current;
    setPullDistance(dy > 0 ? Math.min(dy, 120) : 0);
  };
  const onTouchEnd = () => {
    if (pullDistance > 80) refresh();
    touchStartY.current = null;
    setPullDistance(0);
  };

  return (
    <div
      className="mx-auto w-full max-w-xl px-4 pt-16 pb-6 animate-in fade-in slide-in-from-bottom-3 duration-300"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="pointer-events-none fixed left-1/2 top-14 z-30 -translate-x-1/2 transition-opacity md:hidden"
        style={{ opacity: pullDistance > 8 || refreshing ? 1 : 0 }}
      >
        <div className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
          <RefreshCw
            className={`h-4 w-4 text-primary ${refreshing ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${pullDistance * 2}deg)` }}
          />
        </div>
      </div>

      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Match Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open eFootball rooms near you. Claim fast — rooms expire.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          aria-label="Refresh feed"
          className="hidden shrink-0 rounded-full border border-border p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:block"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
        </button>
      </header>

      <div className="space-y-4">
        {loading ? (
          <>
            <FeedCardSkeleton />
            <FeedCardSkeleton />
            <FeedCardSkeleton />
          </>
        ) : requests.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-lg font-semibold">No match requests yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Be the first to create one!</p>
            <button
              type="button"
              onClick={() => window.location.href = "/create"}
              aria-label="Create a match request"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-blue-soft"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Create Room
            </button>
          </div>
        ) : (
          requests.map((m) => <FeedCard key={m.id} match={m} onClaim={setClaimed} />)
        )}
      </div>

      {claimed && <ClaimModal match={claimed} onExpire={() => setClaimed(null)} />}
    </div>
  );
}

export default FeedPage;