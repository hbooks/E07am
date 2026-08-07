import { Swords, Users } from "lucide-react";
import { CURRENT_USER, type MatchRequest } from "@/lib/mock-data";
import { PlayerAvatar, RankPill } from "@/components/PlayerAvatar";

export function FeedCard({
  match,
  onClaim,
}: {
  match: MatchRequest;
  onClaim: (match: MatchRequest) => void;
}) {
  const isOwn = match.host.id === CURRENT_USER.id;

  return (
    <article className="pitch-texture rounded-2xl border border-border p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <PlayerAvatar player={match.host} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate font-semibold">{match.host.username}</h3>
            <RankPill rank={match.host.rank} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Squad strength {match.host.squadStrength.toLocaleString()} · {match.postedAgo}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
          {match.matchType === "1v1" ? (
            <Swords className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Users className="h-3.5 w-3.5 text-primary" />
          )}
          {match.matchType}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isOwn ? "Your room — waiting for a claim…" : "Room open. First come, first served."}
        </p>
        {isOwn ? (
          <button
            type="button"
            disabled
            title="You can't claim your own room"
            className="shrink-0 cursor-not-allowed rounded-full bg-secondary px-5 py-2 text-sm font-semibold text-muted-foreground opacity-50"
          >
            Claim
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onClaim(match)}
            className="shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-95 glow-blue-soft"
          >
            Claim
          </button>
        )}
      </div>
    </article>
  );
}

export function FeedCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-full bg-secondary shimmer" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 w-1/3 rounded bg-secondary shimmer" />
          <div className="h-3 w-1/2 rounded bg-secondary shimmer" />
        </div>
        <div className="h-6 w-16 rounded-full bg-secondary shimmer" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-3 w-2/5 rounded bg-secondary shimmer" />
        <div className="h-9 w-20 rounded-full bg-secondary shimmer" />
      </div>
    </div>
  );
}

export default FeedCard;