import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck, ChevronDown, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, RefreshCw, Loader2,
  ShieldCheck, Gamepad2, Users, AlertTriangle, Sparkles, Radio, Flame,
} from "lucide-react";
import { toast } from "sonner";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import {
  ADMIN_MESSAGES,
  GAME_MESSAGES,
} from "@/lib/mock-data"; // we still keep this for fallback but will replace with real fetch
import { sanitizePostText } from "@/lib/sanitize";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const TABS = ["Admin Updates", "Game Updates", "Community"] as const;
type Tab = (typeof TABS)[number];

const TAB_META: Record<Tab, { icon: typeof ShieldCheck; blurb: string; accent: string }> = {
  "Admin Updates": { icon: ShieldCheck, blurb: "Official word from the team", accent: "var(--primary)" },
  "Game Updates": { icon: Gamepad2, blurb: "Live from eFootball's own patch notes", accent: "#22c55e" },
  "Community": { icon: Users, blurb: "What players are saying right now", accent: "#8b5cf6" },
};

const COMMUNITY_HINTS = [
  "Ask the community… use @ to mention",
  "Who's up for a 1v1 tonight?",
  "Rate your last squad performance…",
  "Got a formation that's working? Share it.",
];

const PARTICLE_VECTORS: [number, number][] = [
  [0, -20], [17, -10], [17, 10], [0, 20], [-17, 10], [-17, -10],
];

// ---------- Types ----------
interface PostComment {
  id: number;
  post_id: number;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  created_at: string;
}

interface CommunityPostItem {
  id: number;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  isv: boolean;
  iss: boolean;
  comments: PostComment[];
}

interface NewsItem {
  id: number;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  category: string;
  content: string;
  created_at: string;
}

// ---------- Helpers ----------
function timeAgo(dateString: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="rounded-md bg-primary/15 px-1 py-0.5 font-medium text-primary">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function BroadcastSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-secondary" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-28 animate-pulse rounded bg-secondary" />
            <div className="h-16 w-full animate-pulse rounded-2xl rounded-tl-sm bg-secondary/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BroadcastError({ onRetry, message }: { onRetry: () => void; message: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
      <AlertTriangle className="mb-2 h-7 w-7 text-destructive" />
      <p className="text-destructive">{message}</p>
      <button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-full bg-destructive/15 px-5 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/25">
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

// ---------- Page Component ----------
export default function NewsPage() {
  const [tab, setTab] = useState<Tab>("Admin Updates");
  const [direction, setDirection] = useState<1 | -1>(1);
  const activeIndex = TABS.indexOf(tab);

  const goToIndex = (idx: number) => {
    if (idx < 0 || idx >= TABS.length || idx === activeIndex) return;
    setDirection(idx > activeIndex ? 1 : -1);
    setTab(TABS[idx]);
  };

  // Swipe between sections — a decisive gesture, not a live-dragged carousel, so
  // panels of very different heights (a chat log vs. a social feed) never fight
  // each other for space, and normal vertical scrolling is never intercepted.
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    touchStartY.current = e.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const endY = e.changedTouches[0]?.clientY ?? touchStartY.current ?? endX;
    const deltaX = endX - touchStartX.current;
    const deltaY = endY - (touchStartY.current ?? endY);
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) < Math.abs(deltaY) * 1.4) return;
    goToIndex(activeIndex + (deltaX < 0 ? 1 : -1));
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-16 pb-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <style>{`
        @keyframes np-heart-pop { 0% { transform: scale(0.8); } 45% { transform: scale(1.3); } 100% { transform: scale(1); } }
        @keyframes np-particle {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
        }
        @keyframes np-ring-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes np-wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes np-hint-fade {
          0%, 45% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      <header className="relative mb-4 overflow-hidden rounded-2xl transition-colors duration-500">
        {/* Ambient broadcast-wave header — colour follows the active channel, so the page's
            whole mood shifts with the tab instead of just the cards inside it. */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] transition-colors duration-500">
          <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="h-full w-[200%]" style={{ animation: "np-wave 9s linear infinite" }}>
            <path d="M0 30 Q 20 5, 40 30 T 80 30 T 120 30 T 160 30 T 200 30 T 240 30 T 280 30 T 320 30 T 360 30 T 400 30" fill="none" stroke={TAB_META[tab].accent} strokeWidth="2" className="transition-[stroke] duration-500" />
            <path d="M400 30 Q 420 5, 440 30 T 480 30 T 520 30 T 560 30 T 600 30 T 640 30 T 680 30 T 720 30 T 760 30 T 800 30" fill="none" stroke={TAB_META[tab].accent} strokeWidth="2" className="transition-[stroke] duration-500" />
          </svg>
        </div>
        <div className="relative px-1 py-2">
          <h1 className="text-2xl font-black tracking-tight">News</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{TAB_META[tab].blurb}</p>
        </div>
      </header>

      {/* Tabs — icon + label, sliding highlight */}
      <div
        role="tablist"
        aria-label="News categories"
        className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border bg-background/95 px-4 pb-3 pt-1 backdrop-blur relative"
      >
        <div className="relative flex rounded-full border border-border bg-card p-1">
          <div
            className="absolute inset-y-1 rounded-full shadow-[0_2px_14px_-2px_rgba(0,0,0,0.35)] transition-[transform,background-color] duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              width: `calc(${100 / TABS.length}% - 4px)`,
              left: 4,
              transform: `translateX(${activeIndex * 100}%)`,
              backgroundColor: TAB_META[tab].accent,
            }}
          />
          {TABS.map((t, idx) => {
            const Icon = TAB_META[t].icon;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => goToIndex(idx)}
                className={cn(
                  "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold whitespace-nowrap transition-colors active:scale-95 sm:text-sm",
                  tab === t ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t}</span>
                <span className="sm:hidden">{t.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Swipe affordance — a quiet nudge that fades after a few seconds, mobile only */}
        <div className="pointer-events-none absolute inset-y-0 left-1 top-1 flex items-center sm:hidden" style={{ animation: "np-hint-fade 3.5s ease forwards" }}>
          <ChevronLeft className="h-3 w-3 text-muted-foreground/50" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-1 top-1 flex items-center sm:hidden" style={{ animation: "np-hint-fade 3.5s ease forwards" }}>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
        </div>
      </div>

      {/* Swipeable content area — a decisive gesture switches sections with a directional slide */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {tab === "Admin Updates" && (
          <div key="admin" className={cn("animate-in fade-in duration-300", direction === 1 ? "slide-in-from-right-6" : "slide-in-from-left-6")}>
            <AdminUpdatesTab />
          </div>
        )}
        {tab === "Game Updates" && (
          <div key="game" className={cn("animate-in fade-in duration-300", direction === 1 ? "slide-in-from-right-6" : "slide-in-from-left-6")}>
            <GameUpdatesTab />
          </div>
        )}
        {tab === "Community" && (
          <div key="community" className={cn("animate-in fade-in duration-300", direction === 1 ? "slide-in-from-right-6" : "slide-in-from-left-6")}>
            <CommunityFeed />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Admin Updates Tab — "official transmission log" ----------
function AdminUpdatesTab() {
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/Get_Admin_News`);
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setPosts(data);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) return <BroadcastSkeleton />;
  if (error) return <BroadcastError onRetry={fetchPosts} message={error} />;

  if (posts.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <ShieldCheck className="mb-2 h-7 w-7 text-muted-foreground" />
        <p className="text-lg font-semibold">No updates yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">Check back later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Official channel banner — sets the register before a single post is read */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-4 py-3">
        <ShieldCheck className="pointer-events-none absolute -right-3 -top-4 h-20 w-20 text-primary/[0.08]" />
        <p className="relative flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Official channel
        </p>
      </div>

      {posts.map((post, i) => {
        const avatarUrl =
          post.author_id === 'system'
            ? 'https://api.dicebear.com/10.x/pixelbot/svg?animationVariant=fastest&seed=blue'
            : 'https://api.dicebear.com/10.x/thumbs/svg?seed=classic&animationVariant=fastest';
        const transmissionNo = String(posts.length - i).padStart(3, "0");
        return (
          <div key={post.id} className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <div className="relative flex-shrink-0">
              <img src={avatarUrl} alt={post.author_name} className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/30" />
              <ShieldCheck className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background text-primary" />
            </div>
            <div className="min-w-0 max-w-[85%] flex-1">
              <p className="mb-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{post.author_name}</span>
                <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                {i === 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    Latest
                  </span>
                )}
                <span className="font-mono text-[10px] text-muted-foreground/60">TX-{transmissionNo}</span>
                <span>· {timeAgo(post.created_at)}</span>
              </p>
              <div className="chat-tail rounded-2xl rounded-tl-sm bg-secondary px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Game Updates Tab — "hero patch + changelog" ----------
function GameUpdatesTab() {
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/Get_Game_News`);
      if (!res.ok) throw new Error("Failed to fetch game news");
      const data = await res.json();
      setPosts(data);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) return <BroadcastSkeleton />;
  if (error) return <BroadcastError onRetry={fetchPosts} message={error} />;

  if (posts.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <Gamepad2 className="mb-2 h-7 w-7 text-muted-foreground" />
        <p className="text-lg font-semibold">No game updates yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">Game updates are fetched every Thursday after efootball server maintenance is complete.</p>
      </div>
    );
  }

  const avatarUrl = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786816744/xjmy5l2vonnhwmn2cvon.jpg';
  const [hero, ...rest] = posts;

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent px-4 py-3">
        <Gamepad2 className="pointer-events-none absolute -right-3 -top-4 h-20 w-20 text-emerald-400/[0.08]" />
        <p className="relative flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
          <Radio className="h-3.5 w-3.5" />
          Patch feed
        </p>
      </div>

      {/* Hero — the newest patch, given real weight instead of blending into the list */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/10 to-transparent p-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
        <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
          <Sparkles className="h-3 w-3" />
          Latest update
        </span>
        <div className="flex items-start gap-3">
          <img src={avatarUrl} alt={hero.author_name} className="h-14 w-14 flex-shrink-0 rounded-2xl object-cover ring-2 ring-emerald-500/40" />
          <div className="min-w-0 flex-1">
            <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{hero.author_name}</span>
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>· {timeAgo(hero.created_at)}</span>
            </p>
            <p className="text-[15px] font-semibold leading-snug">{hero.content}</p>
          </div>
        </div>
      </div>

      {/* Rest — compact changelog rows, not competing with the hero */}
      {rest.length > 0 && (
        <div className="space-y-1.5">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">Earlier</p>
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {rest.map((post) => (
              <div key={post.id} className="flex items-center gap-2.5 bg-card px-3 py-2.5 animate-in fade-in duration-200">
                <Gamepad2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400/70" />
                <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">
                  <MentionText text={post.content} />
                </p>
                <span className="flex-shrink-0 text-[10px] text-muted-foreground/60">{timeAgo(post.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Community Feed — the heart ----------
function CommunityFeed() {
  const { user } = useKindeAuth();
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<number, number>>({});
  const [commentsOpen, setCommentsOpen] = useState<Record<number, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [commenting, setCommenting] = useState<Record<number, boolean>>({});
  const [tempComments, setTempComments] = useState<Record<number, PostComment[]>>({});
  const [hintIndex, setHintIndex] = useState(0);

  // Purely cosmetic — rotates the composer's placeholder. Never touches `draft`.
  useEffect(() => {
    const id = setInterval(() => setHintIndex((i) => (i + 1) % COMMUNITY_HINTS.length), 4000);
    return () => clearInterval(id);
  }, []);

  const fetchPosts = async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/Poco?userId=${encodeURIComponent(user.id)}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data);
      const liked: Record<number, boolean> = {};
      const counts: Record<number, number> = {};
      data.forEach((p: CommunityPostItem) => {
        liked[p.id] = p.liked_by_me;
        counts[p.id] = p.like_count;
      });
      setLikedMap(liked);
      setLikeCountMap(counts);
    } catch (err: any) {
      setError(err.message || "Network error");
      if (!silent) toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetch(`${BASE_URL}/Get_Up?userId=${encodeURIComponent(user.id)}`)
        .then((res) => res.json())
        .then((data) => setProfile(data))
        .catch(() => { });
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPosts();
  }, [user?.id]);

  const publishPost = async () => {
    if (!user?.id || !profile?.username) {
      toast.error("Your profile is not ready yet.");
      return;
    }
    const text = sanitizePostText(draft);
    if (!text.trim()) return;

    setPosting(true);
    const tempId = -Date.now();
    const tempPost: CommunityPostItem = {
      id: tempId,
      author_id: user.id,
      author_name: profile.username,
      author_avatar: profile.p_url,
      content: text,
      created_at: new Date().toISOString(),
      like_count: 0,
      comment_count: 0,
      liked_by_me: false,
      isv: profile.isv ?? false,
      iss: profile.iss ?? false,
      comments: [],
    };
    setPosts((prev) => [tempPost, ...prev]);
    setDraft("");
    try {
      const res = await fetch(`${BASE_URL}/Crepo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          username: profile.username,
          avatar: profile.p_url,
          content: text,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create post");
      setPosts((prev) =>
        prev.map((p) => (p.id === tempId ? { ...result, comments: [] } : p))
      );
      toast.success("Posted to the community");
    } catch (err: any) {
      toast.error(err.message || "Failed to post");
      setPosts((prev) => prev.filter((p) => p.id !== tempId));
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId: number) => {
    if (!user?.id) return;
    const currentLiked = likedMap[postId];
    const newLiked = !currentLiked;
    const currentCount = likeCountMap[postId] || 0;
    setLikedMap((prev) => ({ ...prev, [postId]: newLiked }));
    setLikeCountMap((prev) => ({
      ...prev,
      [postId]: newLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
    }));

    try {
      const res = await fetch(`${BASE_URL}/Lipo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update like");
      setLikeCountMap((prev) => ({ ...prev, [postId]: data.likeCount }));
      setLikedMap((prev) => ({ ...prev, [postId]: data.liked }));
    } catch (err: any) {
      setLikedMap((prev) => ({ ...prev, [postId]: currentLiked }));
      setLikeCountMap((prev) => ({ ...prev, [postId]: currentCount }));
      toast.error(err.message || "Failed to like");
    }
  };

  const toggleComments = (postId: number) => {
    setCommentsOpen((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const addComment = async (postId: number) => {
    if (!user?.id || !profile?.username) return;
    const draftText = commentDrafts[postId];
    if (!draftText?.trim()) return;

    const safeContent = sanitizePostText(draftText);
    if (!safeContent) return;

    const tempComment: PostComment = {
      id: -Date.now(),
      post_id: postId,
      author_id: user.id,
      author_name: profile.username,
      author_avatar: profile.p_url,
      content: safeContent,
      created_at: new Date().toISOString(),
    };
    setTempComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), tempComment],
    }));
    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    setCommenting((prev) => ({ ...prev, [postId]: true }));

    try {
      const res = await fetch(`${BASE_URL}/Comen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          userId: user.id,
          username: profile.username,
          avatar: profile.p_url,
          content: safeContent,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to comment");
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
              ...p,
              comments: [...p.comments, result],
              comment_count: p.comment_count + 1,
            }
            : p
        )
      );
      setTempComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== tempComment.id),
      }));
      toast.success("Comment added");
    } catch (err: any) {
      toast.error(err.message || "Failed to comment");
      setTempComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== tempComment.id),
      }));
    } finally {
      setCommenting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex gap-3">
            <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-full bg-secondary" />
            <div className="h-16 flex-1 animate-pulse rounded-xl bg-secondary" />
          </div>
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-full bg-secondary" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
                <div className="h-10 w-full animate-pulse rounded bg-secondary" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) return <BroadcastError onRetry={() => fetchPosts()} message={error} />;

  const remaining = 280 - draft.length;
  const ringPct = Math.min(1, draft.length / 280);
  const ringColor = remaining <= 20 ? "#ef4444" : remaining <= 80 ? "#eab308" : "#3b82f6";
  const ringCircumference = 2 * Math.PI * 12;

  // Spotlight: the most-liked live post, pulled to the top and given a bigger stage.
  // Derived purely from data already in state — no new fetch, no logic change.
  const livePosts = posts.filter((p) => p.id > 0);
  const spotlight = livePosts.length > 1
    ? livePosts.reduce((max, p) => ((likeCountMap[p.id] ?? p.like_count) > (likeCountMap[max.id] ?? max.like_count) ? p : max))
    : null;
  const spotlightLikes = spotlight ? (likeCountMap[spotlight.id] ?? spotlight.like_count) : 0;
  const showSpotlight = !!spotlight && spotlightLikes > 0;
  const restPosts = showSpotlight ? posts.filter((p) => p.id !== spotlight!.id) : posts;

  function renderPost(post: CommunityPostItem, featured: boolean) {
    const isLiked = !!likedMap[post.id];
    const likeCount = likeCountMap[post.id] ?? 0;
    const isCommentsOpen = !!commentsOpen[post.id];
    const tempPostComments = tempComments[post.id] || [];
    const allComments = [...post.comments, ...tempPostComments];
    const commentCount = allComments.length;
    const isPending = post.id < 0;

    return (
      <article
        key={post.id}
        className={cn(
          "relative rounded-2xl border bg-card p-4 transition-all duration-300 hover:border-primary/20",
          isPending ? "border-primary/20 opacity-80" : "border-border",
          featured && "border-amber-500/30 bg-gradient-to-b from-amber-500/[0.06] to-transparent",
        )}
      >
        {featured && (
          <span className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
            <Flame className="h-3 w-3" />
            Trending
          </span>
        )}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <PlayerAvatar
              player={{ username: post.author_name, avatarHue: 210, initials: post.author_name.charAt(0).toUpperCase() } as any}
              imageUrl={post.author_avatar || ""}
              size="sm"
            />
            {isPending && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-card bg-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold">{post.author_name}</span>
              {post.iss && (
                <span className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 py-0.5 pl-1 pr-2" title="Staff">
                  <img
                    src="https://res.cloudinary.com/ctr-cloud/image/upload/v1786380915/ff7rn60eiylq1x1oixsz.png"
                    alt=""
                    className="h-3.5 w-3.5 rounded-full object-cover"
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Staff</span>
                </span>
              )}
              {post.isv && (
                <span className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 py-0.5 pl-1 pr-2" title="Verified">
                  <img
                    src="https://res.cloudinary.com/ctr-cloud/image/upload/v1786380916/rsfa4dftmbz427k5cnmw.png"
                    alt=""
                    className="h-3.5 w-3.5 rounded-full object-cover"
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Verified</span>
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                · {isPending ? "sending…" : timeAgo(post.created_at)}
              </span>
            </div>
            <p className={cn("mt-1.5 leading-relaxed", featured ? "text-[15px]" : "text-sm")}>
              <MentionText text={post.content} />
            </p>

            <div className="mt-3 flex items-center gap-5">
              <button
                type="button"
                onClick={() => toggleLike(post.id)}
                aria-label={isLiked ? "Unlike" : "Like"}
                aria-pressed={isLiked}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium transition-colors",
                  isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive",
                )}
              >
                <span className="relative inline-flex h-4 w-4 items-center justify-center">
                  <Heart
                    key={isLiked ? "liked" : "unliked"}
                    className={cn("h-4 w-4", isLiked && "fill-destructive")}
                    style={{ animation: isLiked ? "np-heart-pop .35s ease" : "none" }}
                  />
                  {isLiked && PARTICLE_VECTORS.map(([tx, ty], idx) => (
                    <span
                      key={`${post.id}-${idx}-${isLiked}`}
                      className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-destructive"
                      style={{
                        ["--tx" as any]: `${tx}px`,
                        ["--ty" as any]: `${ty}px`,
                        animation: `np-particle .45s ease-out ${idx * 15}ms forwards`,
                      }}
                    />
                  ))}
                </span>
                {likeCount}
              </button>
              <button
                type="button"
                onClick={() => toggleComments(post.id)}
                aria-expanded={isCommentsOpen}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <MessageCircle className="h-4 w-4" />
                {commentCount}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isCommentsOpen && "rotate-180")} />
              </button>
            </div>

            {isCommentsOpen && (
              <div className="mt-3 space-y-3 border-l-2 border-border pl-3 animate-in fade-in duration-150">
                {allComments.map((c) => {
                  const commentPending = c.id < 0;
                  return (
                    <div key={c.id} className="flex items-start gap-2.5">
                      <div className="relative flex-shrink-0">
                        <PlayerAvatar
                          player={{ username: c.author_name, avatarHue: 210, initials: c.author_name.charAt(0).toUpperCase() } as any}
                          imageUrl={c.author_avatar || ""}
                          size="sm"
                          className="h-7 w-7 text-[10px] ring-2 ring-card"
                        />
                        {commentPending && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 animate-pulse rounded-full border border-card bg-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs">
                          <span className="font-semibold">{c.author_name}</span>{" "}
                          <span className="text-muted-foreground">
                            · {commentPending ? "sending…" : timeAgo(c.created_at)}
                          </span>
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground whitespace-pre-wrap">
                          <MentionText text={c.content} />
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-start gap-2">
                  <textarea
                    value={commentDrafts[post.id] || ""}
                    onChange={(e) =>
                      setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value.slice(0, 280) }))
                    }
                    placeholder="Add a comment…"
                    rows={1}
                    className="min-w-0 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => addComment(post.id)}
                    disabled={!commentDrafts[post.id]?.trim() || commenting[post.id]}
                    className="rounded-full bg-primary p-2 text-primary-foreground transition active:scale-90 disabled:opacity-40"
                  >
                    {commenting[post.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-4">
      {/* Composer – always visible */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex gap-3">
          <PlayerAvatar
            player={{ username: profile?.username || "You", avatarHue: 210, initials: (profile?.username?.[0] || "Y").toUpperCase() } as any}
            imageUrl={profile?.p_url || ""}
            size="sm"
          />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 280))}
            placeholder={draft ? undefined : COMMUNITY_HINTS[hintIndex]}
            rows={2}
            className="min-w-0 flex-1 resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {draft.length > 0 && (
              <svg viewBox="0 0 28 28" className="h-6 w-6 -rotate-90" style={{ animation: "np-ring-in .2s ease" }}>
                <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-secondary" />
                <circle
                  cx="14" cy="14" r="12" fill="none" strokeWidth="2.5" strokeLinecap="round"
                  stroke={ringColor}
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringCircumference * (1 - ringPct)}
                  className="transition-[stroke-dashoffset,stroke] duration-200"
                />
              </svg>
            )}
            <span className="text-xs text-muted-foreground/70">{remaining} left</span>
          </div>
          <button
            type="button"
            onClick={publishPost}
            disabled={!draft.trim() || posting}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 glow-blue-soft"
          >
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <Sparkles className="mb-2 h-7 w-7 text-muted-foreground" />
          <p className="text-lg font-semibold">No community posts yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Start a discussion!</p>
        </div>
      ) : (
        <>
          {showSpotlight && renderPost(spotlight!, true)}
          {restPosts.map((post) => renderPost(post, false))}
        </>
      )}
    </div>
  );
}