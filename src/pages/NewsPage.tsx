import { useEffect, useState } from "react";
import {
  BadgeCheck, ChevronDown, Heart, MessageCircle, Send, RefreshCw, Loader2,
  ShieldCheck, Gamepad2, Users, AlertTriangle, Sparkles, Radio,
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

const TAB_META: Record<Tab, { icon: typeof ShieldCheck; blurb: string }> = {
  "Admin Updates": { icon: ShieldCheck, blurb: "Official word from the team" },
  "Game Updates": { icon: Gamepad2, blurb: "Live from eFootball's own patch notes" },
  "Community": { icon: Users, blurb: "What players are saying right now" },
};

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

// Shared skeleton row for the two broadcast-style tabs (Admin / Game)
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
  const activeIndex = TABS.indexOf(tab);

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-16 pb-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <style>{`
        @keyframes np-heart-burst {
          0% { transform: scale(0.8); }
          40% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        @keyframes np-ring-in {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <header className="mb-4">
        <h1 className="text-2xl font-black tracking-tight">News</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{TAB_META[tab].blurb}</p>
      </header>

      {/* Tabs — icon + label, sliding highlight */}
      <div
        role="tablist"
        aria-label="News categories"
        className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border bg-background/95 px-4 pb-3 pt-1 backdrop-blur"
      >
        <div className="relative flex rounded-full border border-border bg-card p-1">
          <div
            className="absolute inset-y-1 rounded-full bg-primary shadow-[0_2px_10px_-2px_var(--primary)] transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ width: `calc(${100 / TABS.length}% - 4px)`, left: 4, transform: `translateX(${activeIndex * 100}%)` }}
          />
          {TABS.map((t) => {
            const Icon = TAB_META[t].icon;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm",
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
      </div>

      {tab === "Admin Updates" && <AdminUpdatesTab />}
      {tab === "Game Updates" && <GameUpdatesTab />}
      {tab === "Community" && <CommunityFeed />}
    </div>
  );
}

// ---------- Admin Updates Tab (real fetch from Neon) ----------
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

  if (loading) {
    return <BroadcastSkeleton />;
  }

  if (error) {
    return <BroadcastError onRetry={fetchPosts} message={error} />;
  }

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
      {posts.map((post, i) => {
        const avatarUrl =
          post.author_id === 'system'
            ? 'https://api.dicebear.com/10.x/pixelbot/svg?animationVariant=fastest&seed=blue'
            : 'https://api.dicebear.com/10.x/thumbs/svg?seed=classic&animationVariant=fastest';
        return (
          <div key={post.id} className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <div className="relative flex-shrink-0">
              <img src={avatarUrl} alt={post.author_name} className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/30" />
              <ShieldCheck className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background text-primary" />
            </div>
            <div className="min-w-0 max-w-[85%] flex-1">
              <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{post.author_name}</span>
                <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                {i === 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    Latest
                  </span>
                )}
                <span>· {timeAgo(post.created_at)}</span>
              </p>
              <div className="chat-tail relative overflow-hidden rounded-2xl rounded-tl-sm border-l-2 border-primary/40 bg-secondary px-4 py-3 text-sm leading-relaxed">
                {post.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Game Updates Tab (real fetch) ----------
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

  if (loading) {
    return <BroadcastSkeleton />;
  }

  if (error) {
    return <BroadcastError onRetry={fetchPosts} message={error} />;
  }

  if (posts.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <Gamepad2 className="mb-2 h-7 w-7 text-muted-foreground" />
        <p className="text-lg font-semibold">No game updates yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">Check back later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, i) => {
        const avatarUrl = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786816744/xjmy5l2vonnhwmn2cvon.jpg';
        return (
          <div key={post.id} className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <div className="relative flex-shrink-0">
              <img src={avatarUrl} alt={post.author_name} className="h-10 w-10 rounded-full object-cover ring-2 ring-emerald-500/30" />
              <Gamepad2 className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background text-emerald-400" />
            </div>
            <div className="min-w-0 max-w-[85%] flex-1">
              <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <Radio className="h-3 w-3 text-emerald-400" />
                  {post.author_name}
                </span>
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
                {i === 0 && (
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                    New
                  </span>
                )}
                <span>· {timeAgo(post.created_at)}</span>
              </p>
              <div className="chat-tail relative overflow-hidden rounded-2xl rounded-tl-sm border-l-2 border-emerald-500/40 bg-secondary px-4 py-3 text-sm leading-relaxed">
                {post.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Community Feed (already fully functional with Crepo, Poco, Lipo, Comen) ----------
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

  if (error) {
    return <BroadcastError onRetry={() => fetchPosts()} message={error} />;
  }

  const remaining = 280 - draft.length;
  const ringPct = Math.min(1, draft.length / 280);
  const ringColor = remaining <= 20 ? "#ef4444" : remaining <= 80 ? "#eab308" : "#3b82f6";
  const ringCircumference = 2 * Math.PI * 12;

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
            placeholder="Ask the community… use @ to mention"
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

      {/* Posts list OR empty state */}
      {posts.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <Sparkles className="mb-2 h-7 w-7 text-muted-foreground" />
          <p className="text-lg font-semibold">No community posts yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Start a discussion!</p>
        </div>
      ) : (
        posts.map((post) => {
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
                "rounded-2xl border bg-card p-4 transition-all duration-300 hover:border-primary/20",
                isPending ? "border-primary/20 opacity-80" : "border-border",
              )}
            >
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
                  <p className="mt-1.5 text-sm leading-relaxed">
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
                      <Heart
                        key={isLiked ? "liked" : "unliked"}
                        className={cn("h-4 w-4", isLiked && "fill-destructive")}
                        style={{ animation: isLiked ? "np-heart-burst .35s ease" : "none" }}
                      />
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
                                className="h-7 w-7 text-[10px]"
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
                              <p className="mt-0.5 text-sm text-muted-foreground">
                                <MentionText text={c.content} />
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {/* Comment input */}
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
        })
      )}
    </div>
  );
}