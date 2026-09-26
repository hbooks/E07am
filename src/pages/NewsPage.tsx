import { useEffect, useRef, useState, useMemo } from "react";
import {
  BadgeCheck, ChevronDown, Heart, Send, RefreshCw, Loader2,
  ShieldCheck, Gamepad2, Users, AlertTriangle, Sparkles, Search, X, Plus,
  MessageSquare, Repeat2, BarChart3, Share, Calendar, Clock, Copy, LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { sanitizePostText } from "@/lib/sanitize";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const TABS = ["Admin Updates", "Game Updates", "Community"] as const;
type Tab = (typeof TABS)[number];

const TAB_META: Record<Tab, { icon: typeof ShieldCheck; accent: string }> = {
  "Admin Updates": { icon: ShieldCheck, accent: "#1E90FF" },
  "Game Updates": { icon: Gamepad2, accent: "#22c55e" },
  "Community": { icon: Users, accent: "#5CA8FF" },
};

const COMMUNITY_HINTS = [
  "Ask the community…",
  "Who's up for a 1v1 tonight?",
  "Got a formation that's working?",
  "Report a bug with @bug",
];

const MENTION_TAGS = ["admin", "issue", "bug", "moderator"];
const PAGE_SIZE = 20;

// ============================================================
// Global shimmer style
// ============================================================
const SHIMMER_STYLE = `
  @keyframes np-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .np-shimmer {
    background-image: linear-gradient(
      90deg,
      rgba(255,255,255,0.02) 0%,
      rgba(255,255,255,0.045) 20%,
      rgba(255,255,255,0.09) 50%,
      rgba(255,255,255,0.045) 80%,
      rgba(255,255,255,0.02) 100%
    );
    background-size: 200% 100%;
    animation: np-shimmer 1.1s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .np-shimmer { animation: none; }
  }
`;

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

function formatFullDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="font-medium text-[#5CA8FF] hover:underline">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] px-6 py-16 text-center">
      <Icon className="h-7 w-7 text-gray-600" />
      <p className="mt-3 text-base font-semibold text-white">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-gray-500">{body}</p>
    </div>
  );
}

function ErrorState({ onRetry, message }: { onRetry: () => void; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-500/20 px-6 py-16 text-center">
      <AlertTriangle className="h-6 w-6 text-red-400" />
      <p className="mt-3 text-sm text-red-400">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-[#5CA8FF] transition hover:bg-[#1E90FF]/10"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}

function LoadMore({ onClick, remaining }: { onClick: () => void; remaining: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-transparent py-3 text-sm font-medium text-gray-400 transition hover:border-white/[0.12] hover:bg-white/[0.02] hover:text-white"
    >
      <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
      Load {remaining} more
    </button>
  );
}

// ============================================================
// SKELETONS
// ============================================================

function AdminSkeleton() {
  return (
    <div className="relative pl-5">
      <span
        className="pointer-events-none absolute left-[6px] top-3 bottom-3 w-px bg-white/[0.06]"
        aria-hidden
      />
      <div className="relative pb-3">
        <span
          className="absolute -left-[19px] top-3 h-2.5 w-2.5 rounded-full bg-[#1E90FF]/40 ring-4 ring-[#08090b]"
          aria-hidden
        />
        <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="np-shimmer h-4 w-20 rounded-full" />
            <div className="np-shimmer h-3 w-12 rounded-full" />
          </div>
          <div className="flex items-start gap-3">
            <div className="np-shimmer h-11 w-11 flex-shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2 pt-1">
              <div className="np-shimmer h-3 w-24 rounded" />
              <div className="np-shimmer h-3 w-full rounded" />
              <div className="np-shimmer h-3 w-full rounded" />
              <div className="np-shimmer h-3 w-3/5 rounded" />
            </div>
          </div>
        </div>
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i} className="relative pb-3 last:pb-0">
          <span
            className="absolute -left-[19px] top-3 h-2.5 w-2.5 rounded-full bg-white/[0.08] ring-4 ring-[#08090b]"
            aria-hidden
          />
          <div className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-[#0f0f11] px-3.5 py-3">
            <div className="np-shimmer mt-0.5 h-7 w-7 flex-shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="np-shimmer h-2.5 w-32 rounded" />
              <div className="np-shimmer h-2.5 w-4/5 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GameSkeleton() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-4">
        <div className="flex items-start gap-3">
          <div className="np-shimmer mt-0.5 h-10 w-10 flex-shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <div className="np-shimmer h-3 w-40 rounded" />
            <div className="np-shimmer h-3.5 w-full rounded" />
          </div>
        </div>
      </div>
      <div className="np-shimmer h-11 w-full rounded-full" />
      <div className="rounded-xl border border-white/[0.05] bg-[#0f0f11] px-4 py-3">
        <div className="space-y-1.5">
          <div className="np-shimmer h-2.5 w-full rounded" />
          <div className="np-shimmer h-2.5 w-4/5 rounded" />
        </div>
      </div>
    </div>
  );
}

function CommunitySkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="np-shimmer h-10 flex-1 rounded-full" />
        <div className="np-shimmer h-10 w-10 flex-shrink-0 rounded-full" />
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-4">
        <div className="flex gap-3">
          <div className="np-shimmer h-9 w-9 flex-shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="np-shimmer h-14 w-full rounded-xl" />
            <div className="flex items-center justify-between pt-1">
              <div className="np-shimmer h-3 w-16 rounded" />
              <div className="np-shimmer h-8 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d0d0f]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 px-4 py-3.5",
              i !== 2 && "border-b border-white/[0.06]",
            )}
          >
            <div className="np-shimmer h-9 w-9 flex-shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2 pt-1">
              <div className="np-shimmer h-2.5 w-40 rounded" />
              <div className="np-shimmer h-2.5 w-full rounded" />
              <div className="np-shimmer h-2.5 w-3/4 rounded" />
              <div className="flex items-center gap-4 pt-1.5">
                <div className="np-shimmer h-3 w-8 rounded" />
                <div className="np-shimmer h-3 w-8 rounded" />
                <div className="np-shimmer h-3 w-8 rounded" />
                <div className="np-shimmer h-3 w-8 rounded" />
                <div className="np-shimmer h-3 w-8 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MODAL
// ============================================================
function Modal({
  onClose,
  children,
  title,
}: {
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-t-2xl border border-white/[0.08] bg-[#161616] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.9)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <p className="text-sm font-semibold text-white">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-gray-500 transition hover:bg-white/[0.05] hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// REPOST MODAL
// ============================================================
function RepostModal({
  post,
  onClose,
  onConfirm,
}: {
  post: CommunityPostItem;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const handle = `@${post.author_name.toLowerCase().replace(/\s+/g, "")}`;

  return (
    <Modal onClose={onClose} title="Repost">
      <div className="px-5 py-5">
        <p className="text-[13px] leading-relaxed text-gray-500">
          Repost is coming soon. For now, copy this post to share it elsewhere.
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d0d0f]">
          <div className="flex items-center gap-2 border-b border-white/[0.05] px-3.5 py-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5CA8FF]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5CA8FF]">
              <Repeat2 className="h-3 w-3" />
              Preview
            </span>
            <span className="text-[11px] text-gray-600">·</span>
            <span className="text-[11px] text-gray-500">{timeAgo(post.created_at)}</span>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 pt-3.5">
            <PlayerAvatar
              player={{
                username: post.author_name,
                avatarHue: 210,
                initials: post.author_name.charAt(0).toUpperCase(),
              } as any}
              imageUrl={post.author_avatar || ""}
              size="sm"
              className="h-8 w-8 text-[11px]"
            />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white">
                {post.author_name}
              </p>
              <p className="truncate text-[11px] text-gray-500">{handle}</p>
            </div>
          </div>

          <div className="px-3.5 pb-4 pt-2.5">
            <p className="line-clamp-4 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-300">
              <MentionText text={post.content} />
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-white/[0.08] py-2.5 text-[13px] font-medium text-gray-300 transition hover:border-white/[0.14] hover:bg-white/[0.03]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#1E90FF] py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy text
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// ANALYTICS MODAL
// ============================================================
function AnalyticsModal({
  post,
  likeCount,
  commentCount,
  onClose,
}: {
  post: CommunityPostItem;
  likeCount: number;
  commentCount: number;
  onClose: () => void;
}) {
  const { date, time } = formatFullDate(post.created_at);

  return (
    <Modal onClose={onClose} title="Post details">
      <div className="px-5 py-5">
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0d0d0f] px-3.5 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#5CA8FF]/10">
            <Calendar className="h-4 w-4 text-[#5CA8FF]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Posted</p>
            <p className="truncate text-[13px] font-medium text-white">{date}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
              <Clock className="h-3 w-3" />
              {time}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <StatTile label="Likes" value={likeCount} icon={Heart} accent="#ef4444" />
          <StatTile
            label="Comments"
            value={commentCount}
            icon={MessageSquare}
            accent="#5CA8FF"
          />
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-gray-600">
          <span className="h-1 w-1 rounded-full bg-gray-700" />
          Post ID #{post.id}
          <span className="h-1 w-1 rounded-full bg-gray-700" />
        </div>
      </div>
    </Modal>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0f] p-3.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
        <span className="text-[11px] uppercase tracking-wide text-gray-500">{label}</span>
      </div>
      <p className="mt-1.5 text-2xl font-bold tabular-nums text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================
export default function NewsPage() {
  const [tab, setTab] = useState<Tab>("Admin Updates");
  const [direction, setDirection] = useState<1 | -1>(1);
  const activeIndex = TABS.indexOf(tab);

  const goToIndex = (idx: number) => {
    if (idx < 0 || idx >= TABS.length || idx === activeIndex) return;
    setDirection(idx > activeIndex ? 1 : -1);
    setTab(TABS[idx]);
  };

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
    <div className="min-h-screen bg-[#08090b] text-white">
      <style>{SHIMMER_STYLE}</style>
      <div className="mx-auto w-full max-w-xl px-4 pb-24 pt-4">
        <div
          role="tablist"
          aria-label="News categories"
          className="sticky top-3 z-20 mb-4 flex overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d0d0f]/95 backdrop-blur-xl"
        >
          {TABS.map((t, idx) => {
            const Icon = TAB_META[t].icon;
            const active = tab === t;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={active}
                onClick={() => goToIndex(idx)}
                className={cn(
                  "relative flex flex-1 items-center justify-center gap-1.5 px-3 py-3.5 text-xs font-semibold transition-colors sm:text-sm",
                  active ? "text-white" : "text-gray-500 hover:text-gray-300",
                )}
              >
                <Icon
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  style={{ color: active ? TAB_META[t].accent : undefined }}
                />
                <span className="hidden sm:inline">{t}</span>
                <span className="sm:hidden">{t.split(" ")[0]}</span>
                {active && (
                  <span
                    className="absolute inset-x-3 bottom-0 h-[2px] rounded-full"
                    style={{ background: TAB_META[t].accent }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {tab === "Admin Updates" && (
            <div
              key="admin"
              className={cn(
                "animate-in fade-in duration-200",
                direction === 1 ? "slide-in-from-right-4" : "slide-in-from-left-4",
              )}
            >
              <AdminUpdatesTab />
            </div>
          )}
          {tab === "Game Updates" && (
            <div
              key="game"
              className={cn(
                "animate-in fade-in duration-200",
                direction === 1 ? "slide-in-from-right-4" : "slide-in-from-left-4",
              )}
            >
              <GameUpdatesTab />
            </div>
          )}
          {tab === "Community" && (
            <div
              key="community"
              className={cn(
                "animate-in fade-in duration-200",
                direction === 1 ? "slide-in-from-right-4" : "slide-in-from-left-4",
              )}
            >
              <CommunityFeed />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN UPDATES — timeline rail, tap-to-expand
// ============================================================
function AdminUpdatesTab() {
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/Get_Admin_News`);
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
      setVisible(PAGE_SIZE);
      if (Array.isArray(data) && data.length > 0) {
        setExpandedId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) return <AdminSkeleton />;
  if (error) return <ErrorState onRetry={fetchPosts} message={error} />;
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No updates yet"
        body="Official announcements will appear here."
      />
    );
  }

  const shown = posts.slice(0, visible);
  const hasMore = visible < posts.length;

  const avatarFor = (post: NewsItem) =>
    post.author_id === "system"
      ? "https://api.dicebear.com/10.x/pixelbot/svg?animationVariant=fastest&seed=blue"
      : post.author_avatar ||
      "https://api.dicebear.com/10.x/thumbs/svg?seed=classic&animationVariant=fastest";

  return (
    <div className="space-y-3">
      <div className="relative pl-5">
        <span
          className="pointer-events-none absolute left-[6px] top-3 bottom-3 w-px bg-white/[0.06]"
          aria-hidden
        />

        {shown.map((post, i) => {
          const expanded = expandedId === post.id;
          const isNewest = i === 0;

          return (
            <div key={post.id} className="relative pb-3 last:pb-0">
              <span
                className={cn(
                  "absolute -left-[19px] top-3 h-2.5 w-2.5 rounded-full ring-4 ring-[#08090b] transition-colors",
                  expanded
                    ? "bg-[#1E90FF]"
                    : isNewest
                      ? "bg-[#1E90FF]/60"
                      : "bg-white/[0.15]",
                )}
                aria-hidden
              />

              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : post.id)}
                className={cn(
                  "w-full text-left transition-all duration-200",
                  expanded
                    ? "rounded-2xl border border-[#1E90FF]/20 bg-[#111113] p-4"
                    : "rounded-xl border border-white/[0.05] bg-[#0f0f11] px-3.5 py-3 hover:border-white/[0.09]",
                )}
              >
                {expanded ? (
                  <>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E90FF]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5CA8FF]">
                        <ShieldCheck className="h-3 w-3" />
                        Official
                      </span>
                      <span className="text-[11px] text-gray-500">
                        · {timeAgo(post.created_at)}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={avatarFor(post)}
                          alt={post.author_name}
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-[#1E90FF]/25"
                        />
                        <ShieldCheck className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#111113] text-[#1E90FF]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          <span className="font-semibold text-white">{post.author_name}</span>
                          <BadgeCheck className="h-3.5 w-3.5 text-[#1E90FF]" />
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-100">
                          <MentionText text={post.content} />
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-3">
                    <img
                      src={avatarFor(post)}
                      alt={post.author_name}
                      className="mt-0.5 h-7 w-7 flex-shrink-0 rounded-full object-cover ring-1 ring-white/[0.06]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                        <span className="font-medium text-gray-300">{post.author_name}</span>
                        <BadgeCheck className="h-3 w-3 text-[#1E90FF]/70" />
                        <span className="text-gray-600">·</span>
                        <span className="text-gray-600">{timeAgo(post.created_at)}</span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-[13px] leading-relaxed text-gray-400">
                        <MentionText text={post.content} />
                      </p>
                    </div>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <LoadMore onClick={() => setVisible((v) => v + PAGE_SIZE)} remaining={posts.length - visible} />
      )}
    </div>
  );
}

// ============================================================
// GAME UPDATES
// ============================================================
function GameUpdatesTab() {
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/Get_Game_News`);
      if (!res.ok) throw new Error("Failed to fetch game news");
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
      setExpanded(false);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) return <GameSkeleton />;
  if (error) return <ErrorState onRetry={fetchPosts} message={error} />;
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={Gamepad2}
        title="No game updates yet"
        body="Patch notes are fetched every Thursday after eFootball maintenance."
      />
    );
  }

  const avatarUrl =
    "https://res.cloudinary.com/ctr-cloud/image/upload/v1786816744/xjmy5l2vonnhwmn2cvon.jpg";

  const [latest, ...rest] = posts;

  return (
    <div className="space-y-3">
      <article className="rounded-2xl border border-white/[0.06] bg-[#111113] p-4">
        <div className="flex items-start gap-3">
          <img
            src={avatarUrl}
            alt={latest.author_name}
            className="mt-0.5 h-10 w-10 flex-shrink-0 rounded-xl object-cover ring-1 ring-white/[0.06]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              <span className="font-semibold text-white">{latest.author_name}</span>
              <BadgeCheck className="h-3.5 w-3.5 text-[#22c55e]" />
              <span className="text-gray-600">·</span>
              <span className="text-gray-500">{timeAgo(latest.created_at)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-100">
              <MentionText text={latest.content} />
            </p>
          </div>
        </div>
      </article>

      {rest.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="group flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-transparent py-3 text-sm font-medium text-gray-400 transition hover:border-white/[0.12] hover:bg-white/[0.02] hover:text-white"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
          {expanded
            ? "Hide earlier patches"
            : `View ${rest.length} earlier patch${rest.length === 1 ? "" : "es"}`}
        </button>
      )}

      {!expanded && rest.length > 0 && (
        <div className="rounded-xl border border-white/[0.05] bg-[#0f0f11] px-4 py-3">
          <p className="text-[12.5px] leading-relaxed text-gray-500">
            Patch notes are pulled from eFootball's official feed every Thursday
            after server maintenance completes. Tap "View earlier patches" above
            to browse the full history.
          </p>
        </div>
      )}

      {expanded && rest.length > 0 && (
        <div className="space-y-2 animate-in fade-in duration-200">
          {rest.map((post) => (
            <article
              key={post.id}
              className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-[#0f0f11] px-3.5 py-3"
            >
              <img
                src={avatarUrl}
                alt={post.author_name}
                className="mt-0.5 h-7 w-7 flex-shrink-0 rounded-lg object-cover ring-1 ring-white/[0.06]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                  <span className="font-medium text-gray-400">{post.author_name}</span>
                  <BadgeCheck className="h-3 w-3 text-[#22c55e]/60" />
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-600">{timeAgo(post.created_at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-400">
                  <MentionText text={post.content} />
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMMUNITY FEED
// ============================================================
function CommunityFeed() {
  const { user, isLoading: authLoading, login } = useKindeAuth();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [filteredMentions, setFilteredMentions] = useState<string[]>(MENTION_TAGS);
  const [repostTarget, setRepostTarget] = useState<CommunityPostItem | null>(null);
  const [analyticsTarget, setAnalyticsTarget] = useState<CommunityPostItem | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = setInterval(
      () => setHintIndex((i) => (i + 1) % COMMUNITY_HINTS.length),
      4000,
    );
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
      setPosts(Array.isArray(data) ? data : []);
      const liked: Record<number, boolean> = {};
      const counts: Record<number, number> = {};
      (data || []).forEach((p: CommunityPostItem) => {
        liked[p.id] = p.liked_by_me;
        counts[p.id] = p.like_count;
      });
      setLikedMap(liked);
      setLikeCountMap(counts);
      setVisible(PAGE_SIZE);
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

  const handleComposerChange = (value: string) => {
    const trimmed = value.slice(0, 280);
    setDraft(trimmed);
    const match = trimmed.match(/(?:^|\s)@(\w*)$/);
    if (match) {
      const q = match[1].toLowerCase();
      const filtered = MENTION_TAGS.filter((t) => t.startsWith(q));
      setFilteredMentions(filtered);
      setMentionOpen(filtered.length > 0);
    } else {
      setMentionOpen(false);
    }
  };

  const insertMention = (tag: string) => {
    const updated = draft.replace(/(?:^|\s)@(\w*)$/, (m) => {
      const prefix = m.startsWith(" ") ? " " : "";
      return `${prefix}@${tag} `;
    });
    setDraft(updated);
    setMentionOpen(false);
    composerRef.current?.focus();
  };

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
        prev.map((p) => (p.id === tempId ? { ...result, comments: [] } : p)),
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

  const copyPostText = async (post: CommunityPostItem) => {
    const handle = `@${post.author_name.toLowerCase().replace(/\s+/g, "")}`;
    const text = `${post.author_name} (${handle}):\n\n${post.content}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
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
            : p,
        ),
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

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => {
      if (p.content.toLowerCase().includes(q)) return true;
      if (p.author_name.toLowerCase().includes(q)) return true;
      if (p.comments.some((c) => c.content.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [posts, searchQuery]);

  // ---- AUTH GATE ----
  // Show skeleton only while Kinde is still resolving auth.
  if (authLoading) return <CommunitySkeleton />;

  // Not signed in → prompt to sign in. No fetch has run (guards above).
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] px-6 py-16 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full border border-white/5 bg-[#161616]">
          <Users className="h-5 w-5 text-gray-500" />
        </div>
        <p className="mt-4 text-base font-semibold text-white">
          Sign in to join the community
        </p>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-gray-500">
          You need an account to post, view, comment, and react to community content.
        </p>
        {login && (
          <button
            onClick={() => login()}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1E90FF] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign in
          </button>
        )}
      </div>
    );
  }

  if (loading) return <CommunitySkeleton />;
  if (error) return <ErrorState onRetry={() => fetchPosts()} message={error} />;

  const remaining = 280 - draft.length;
  const ringPct = Math.min(1, draft.length / 280);
  const ringColor = remaining <= 20 ? "#ef4444" : remaining <= 80 ? "#eab308" : "#5CA8FF";
  const ringCircumference = 2 * Math.PI * 12;

  const visiblePosts = filteredPosts.slice(0, visible);
  const hasMore = visible < filteredPosts.length;

  return (
    <div>
      {/* Search bar */}
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts, users, @mentions…"
            className="w-full rounded-full border border-white/[0.06] bg-[#111113] py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#5CA8FF]/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-500 transition hover:bg-white/5 hover:text-gray-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setSearchOpen(!searchOpen);
            if (!searchQuery.startsWith("@")) setSearchQuery("@" + searchQuery);
          }}
          className={cn(
            "grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-white/[0.06] bg-[#111113] text-gray-400 transition",
            searchOpen
              ? "border-[#5CA8FF]/40 text-[#5CA8FF]"
              : "hover:border-white/[0.12] hover:text-white",
          )}
          title="Search by @tag"
        >
          <span className="text-base font-bold">@</span>
        </button>
      </div>

      {searchOpen && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {MENTION_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSearchQuery(`@${tag}`)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                searchQuery === `@${tag}`
                  ? "border-[#5CA8FF]/40 bg-[#5CA8FF]/10 text-[#5CA8FF]"
                  : "border-white/[0.06] bg-[#111113] text-gray-400 hover:border-white/[0.12] hover:text-gray-200",
              )}
            >
              @{tag}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="mb-4 rounded-2xl border border-white/[0.06] bg-[#111113] p-4">
        <div className="flex gap-3">
          <PlayerAvatar
            player={{
              username: profile?.username || "You",
              avatarHue: 210,
              initials: (profile?.username?.[0] || "Y").toUpperCase(),
            } as any}
            imageUrl={profile?.p_url || ""}
            size="sm"
          />
          <div className="relative min-w-0 flex-1">
            <textarea
              ref={composerRef}
              value={draft}
              onChange={(e) => handleComposerChange(e.target.value)}
              onBlur={() => setTimeout(() => setMentionOpen(false), 150)}
              placeholder={draft ? undefined : COMMUNITY_HINTS[hintIndex]}
              rows={2}
              className="w-full resize-none rounded-xl border border-white/[0.06] bg-[#0d0d0f] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#5CA8FF]/40"
            />
            {mentionOpen && (
              <div className="absolute left-3 top-full z-30 mt-1 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-[#161616] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.9)]">
                <p className="border-b border-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Insert tag
                </p>
                <ul>
                  {filteredMentions.map((tag) => (
                    <li key={tag}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          insertMention(tag);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-200 transition hover:bg-white/[0.04]"
                      >
                        <span className="font-medium text-[#5CA8FF]">@{tag}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {draft.length > 0 && (
              <svg viewBox="0 0 28 28" className="h-6 w-6 -rotate-90">
                <circle
                  cx="14"
                  cy="14"
                  r="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-white/[0.06]"
                />
                <circle
                  cx="14"
                  cy="14"
                  r="12"
                  fill="none"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  stroke={ringColor}
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringCircumference * (1 - ringPct)}
                  className="transition-[stroke-dashoffset,stroke] duration-200"
                />
              </svg>
            )}
            <span className="text-xs text-gray-600">{remaining} left</span>
          </div>
          <button
            type="button"
            onClick={publishPost}
            disabled={!draft.trim() || posting}
            className="inline-flex items-center gap-2 rounded-full bg-[#1E90FF] px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No community posts yet"
          body="Be the first to start a discussion."
        />
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          body={`Nothing found for "${searchQuery}". Try a different search.`}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d0d0f]">
            {visiblePosts.map((post) => (
              <CommunityPost
                key={post.id}
                post={post}
                isLiked={!!likedMap[post.id]}
                likeCount={likeCountMap[post.id] ?? 0}
                isCommentsOpen={!!commentsOpen[post.id]}
                tempComments={tempComments[post.id] || []}
                commentDraft={commentDrafts[post.id] || ""}
                isCommenting={!!commenting[post.id]}
                onToggleLike={() => toggleLike(post.id)}
                onToggleComments={() => toggleComments(post.id)}
                onCommentDraftChange={(v) =>
                  setCommentDrafts((prev) => ({
                    ...prev,
                    [post.id]: v.slice(0, 280),
                  }))
                }
                onAddComment={() => addComment(post.id)}
                onRepost={() => setRepostTarget(post)}
                onAnalytics={() => setAnalyticsTarget(post)}
                onShare={() => copyPostText(post)}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-3">
              <LoadMore
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                remaining={filteredPosts.length - visible}
              />
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {repostTarget && (
        <RepostModal
          post={repostTarget}
          onClose={() => setRepostTarget(null)}
          onConfirm={async () => {
            await copyPostText(repostTarget);
            setRepostTarget(null);
          }}
        />
      )}
      {analyticsTarget && (
        <AnalyticsModal
          post={analyticsTarget}
          likeCount={likeCountMap[analyticsTarget.id] ?? analyticsTarget.like_count}
          commentCount={
            (analyticsTarget.comments?.length ?? 0) +
            (tempComments[analyticsTarget.id]?.length ?? 0)
          }
          onClose={() => setAnalyticsTarget(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// COMMUNITY POST
// ============================================================
function CommunityPost({
  post,
  isLiked,
  likeCount,
  isCommentsOpen,
  tempComments,
  commentDraft,
  isCommenting,
  onToggleLike,
  onToggleComments,
  onCommentDraftChange,
  onAddComment,
  onRepost,
  onAnalytics,
  onShare,
}: {
  post: CommunityPostItem;
  isLiked: boolean;
  likeCount: number;
  isCommentsOpen: boolean;
  tempComments: PostComment[];
  commentDraft: string;
  isCommenting: boolean;
  onToggleLike: () => void;
  onToggleComments: () => void;
  onCommentDraftChange: (v: string) => void;
  onAddComment: () => void;
  onRepost: () => void;
  onAnalytics: () => void;
  onShare: () => void;
}) {
  const allComments = [...post.comments, ...tempComments];
  const commentCount = allComments.length;
  const isPending = post.id < 0;

  const [showAllComments, setShowAllComments] = useState(false);
  const visibleComments = showAllComments ? allComments : allComments.slice(-2);
  const hiddenComments = allComments.length - visibleComments.length;

  const handle = `@${post.author_name.toLowerCase().replace(/\s+/g, "")}`;

  return (
    <article
      className={cn(
        "group relative border-b border-white/[0.06] px-4 py-3.5 transition-colors last:border-b-0 hover:bg-white/[0.015]",
        isPending && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <PlayerAvatar
            player={{
              username: post.author_name,
              avatarHue: 210,
              initials: post.author_name.charAt(0).toUpperCase(),
            } as any}
            imageUrl={post.author_avatar || ""}
            size="sm"
          />
          {isPending && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-[#0d0d0f] bg-[#5CA8FF]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
            <span className="font-semibold text-white">{post.author_name}</span>
            {post.iss && (
              <span className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] py-0.5 pl-1 pr-2">
                <img
                  src="https://res.cloudinary.com/ctr-cloud/image/upload/v1786380915/ff7rn60eiylq1x1oixsz.png"
                  alt=""
                  className="h-3 w-3 rounded-full object-cover"
                />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Staff
                </span>
              </span>
            )}
            {post.isv && (
              <span className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] py-0.5 pl-1 pr-2">
                <img
                  src="https://res.cloudinary.com/ctr-cloud/image/upload/v1786380916/rsfa4dftmbz427k5cnmw.png"
                  alt=""
                  className="h-3 w-3 rounded-full object-cover"
                />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Verified
                </span>
              </span>
            )}
            <span className="text-gray-500">{handle}</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-500">
              {isPending ? "sending…" : timeAgo(post.created_at)}
            </span>
          </div>

          <p className="mt-1.5 whitespace-pre-wrap text-[14.5px] leading-relaxed text-gray-200">
            <MentionText text={post.content} />
          </p>

          {/* Action row */}
          <div className="-ml-2 mt-2.5 flex items-center justify-between">
            <button
              type="button"
              onClick={onToggleComments}
              aria-expanded={isCommentsOpen}
              className="flex items-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-[#5CA8FF]/10 hover:text-[#5CA8FF]"
            >
              <MessageSquare className="h-4 w-4" />
              {commentCount > 0 && <span>{commentCount}</span>}
            </button>
            <button
              type="button"
              onClick={onRepost}
              className="flex items-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
              title="Repost"
            >
              <Repeat2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onToggleLike}
              aria-label={isLiked ? "Unlike" : "Like"}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors",
                isLiked
                  ? "text-red-400"
                  : "text-gray-500 hover:bg-red-500/10 hover:text-red-400",
              )}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-transform",
                  isLiked && "scale-105 fill-red-400",
                )}
              />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            <button
              type="button"
              onClick={onAnalytics}
              className="flex items-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-[#5CA8FF]/10 hover:text-[#5CA8FF]"
              title="Post details"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onShare}
              className="flex items-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-[#5CA8FF]/10 hover:text-[#5CA8FF]"
              title="Copy text"
            >
              <Share className="h-4 w-4" />
            </button>
          </div>

          {/* Comments */}
          {isCommentsOpen && (
            <div className="mt-3 space-y-3 border-t border-white/[0.06] pt-3">
              {hiddenComments > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllComments(true)}
                  className="text-xs font-medium text-gray-500 transition hover:text-[#5CA8FF]"
                >
                  View all {allComments.length} comments
                </button>
              )}
              {visibleComments.map((c) => {
                const commentPending = c.id < 0;
                return (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <div className="relative flex-shrink-0">
                      <PlayerAvatar
                        player={{
                          username: c.author_name,
                          avatarHue: 210,
                          initials: c.author_name.charAt(0).toUpperCase(),
                        } as any}
                        imageUrl={c.author_avatar || ""}
                        size="sm"
                        className="h-7 w-7 text-[10px]"
                      />
                      {commentPending && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 animate-pulse rounded-full border border-[#0d0d0f] bg-[#5CA8FF]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs">
                        <span className="font-semibold text-white">{c.author_name}</span>{" "}
                        <span className="text-gray-600">
                          @{c.author_name.toLowerCase().replace(/\s+/g, "")}
                        </span>{" "}
                        <span className="text-gray-500">
                          · {commentPending ? "sending…" : timeAgo(c.created_at)}
                        </span>
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-400">
                        <MentionText text={c.content} />
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-start gap-2">
                <textarea
                  value={commentDraft}
                  onChange={(e) => onCommentDraftChange(e.target.value)}
                  placeholder="Post your reply…"
                  rows={1}
                  className="min-w-0 flex-1 resize-none rounded-lg border border-white/[0.06] bg-[#111113] px-3 py-2 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#5CA8FF]/40"
                />
                <button
                  onClick={onAddComment}
                  disabled={!commentDraft.trim() || isCommenting}
                  className="rounded-full bg-[#5CA8FF] p-2 text-white transition active:scale-90 disabled:opacity-40"
                >
                  {isCommenting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}