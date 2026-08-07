import { useEffect, useState } from "react";
import { Search, SearchX, TriangleAlert } from "lucide-react";
import { PLAYERS } from "@/lib/mock-data";
import { sanitizeSearchQuery } from "@/lib/sanitize";
import { PlayerAvatar, RankPill } from "@/components/PlayerAvatar";


function SearchPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(false);

  // Debounced mock search — simulates a backend round-trip.
  useEffect(() => {
    if (!query) {
      setSearching(false);
      return;
    }
    setSearching(true);
    setError(false);
    const t = setTimeout(() => setSearching(false), 400);
    return () => clearTimeout(t);
  }, [query]);

  const results = query
    ? PLAYERS.filter((p) => p.username.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-16 pb-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <h1 className="mb-4 text-2xl font-black tracking-tight">Search</h1>

      {/* Sticky search bar — query sanitized on change */}
      <div className="sticky top-0 z-20 -mx-4 bg-background/95 px-4 pb-3 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(sanitizeSearchQuery(e.target.value))}
            placeholder="Search players…"
            aria-label="Search players"
            autoComplete="off"
            className="w-full rounded-full border border-input bg-card py-3 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="mt-3">
        {searching ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
                <div className="h-11 w-11 rounded-full bg-secondary shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 rounded bg-secondary shimmer" />
                  <div className="h-3 w-1/4 rounded bg-secondary shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={<TriangleAlert className="h-8 w-8 text-destructive" />}
            title="Unable to search, try again."
          />
        ) : !query ? (
          <EmptyState
            icon={<Search className="h-8 w-8 text-muted-foreground" />}
            title="Search for players"
            subtitle="Find rivals and teammates by username."
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<SearchX className="h-8 w-8 text-muted-foreground" />}
            title="No users found."
            subtitle={`Nothing matches “${query}”.`}
          />
        ) : (
          <ul className="space-y-2.5">
            {results.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40 animate-in fade-in duration-150"
              >
                <PlayerAvatar player={p} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.username}</p>
                  <p className="text-xs text-muted-foreground">
                    Squad strength {p.squadStrength.toLocaleString()} · {p.playerRank}
                  </p>
                </div>
                <RankPill rank={p.rank} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      {icon}
      <p className="mt-3 text-lg font-semibold">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export default SearchPage;