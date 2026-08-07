import { useState } from "react";
import { BadgeCheck, ChevronDown, Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_MESSAGES,
  COMMUNITY_POSTS,
  CURRENT_USER,
  GAME_MESSAGES,
  type CommunityPost,
} from "@/lib/mock-data";
import { sanitizePostText } from "@/lib/sanitize";
import { PlayerAvatar, RankPill } from "@/components/PlayerAvatar";
import { cn } from "@/lib/utils";


const TABS = ["Admin Updates", "Game Updates", "Community"] as const;
type Tab = (typeof TABS)[number];

function NewsPage() {
  const [tab, setTab] = useState<Tab>("Admin Updates");

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-16 pb-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <header className="mb-4">
        <h1 className="text-2xl font-black tracking-tight">News</h1>
      </header>

      {/* Tabs — horizontally scrollable on mobile */}
      <div
        role="tablist"
        aria-label="News categories"
        className="sticky top-0 z-20 -mx-4 mb-5 overflow-x-auto border-b border-border bg-background/95 px-4 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex min-w-max gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "relative px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors",
                tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
              {tab === t && (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary glow-blue-soft" />
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === "Admin Updates" && <ChatFeed messages={ADMIN_MESSAGES} label="Admin" />}
      {tab === "Game Updates" && <ChatFeed messages={GAME_MESSAGES} label="eFootball" />}
      {tab === "Community" && <CommunityFeed />}
    </div>
  );
}

function ChatFeed({
  messages,
  label,
}: {
  messages: { id: string; text: string; timeAgo: string }[];
  label: string;
}) {
  return (
    <div className="space-y-4">
      {messages.map((m) => (
        <div key={m.id} className="flex items-start gap-2.5 animate-in fade-in duration-200">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
            <BadgeCheck className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 max-w-[85%]">
            <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{label}</span>
              <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-label="Verified" />
              <span>· {m.timeAgo}</span>
            </p>
            <div className="chat-tail rounded-2xl rounded-tl-sm bg-secondary px-4 py-3 text-sm leading-relaxed">
              {m.text}
            </div>
          </div>
        </div>
      ))}
      <p className="pt-2 text-center text-xs text-muted-foreground/70">
        Only the {label} team can post here.
      </p>
    </div>
  );
}

function CommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>(COMMUNITY_POSTS);
  const [draft, setDraft] = useState("");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

  const publish = () => {
    // Sanitized client-side; re-validate server-side in production.
    const text = sanitizePostText(draft);
    if (!text) return;
    setPosts((p) => [
      {
        id: `local-${Date.now()}`,
        author: CURRENT_USER,
        text,
        timeAgo: "just now",
        likes: 0,
        comments: [],
      },
      ...p,
    ]);
    setDraft("");
    toast.success("Posted to the community");
  };

  const toggleLike = (id: string) => setLiked((l) => ({ ...l, [id]: !l[id] }));
  const toggleComments = (id: string) =>
    setOpenComments((c) => ({ ...c, [id]: !c[id] }));

  return (
    <div className="space-y-4">
      {/* Composer */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex gap-3">
          <PlayerAvatar player={CURRENT_USER} size="sm" />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 280))}
            placeholder="Ask the community… use @ to mention"
            rows={2}
            className="min-w-0 flex-1 resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground/70">{draft.length}/280</span>
          <button
            type="button"
            onClick={publish}
            disabled={!draft.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 glow-blue-soft"
          >
            <Send className="h-4 w-4" />
            Post
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-lg font-semibold">No community posts yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Start a discussion!</p>
        </div>
      ) : (
        posts.map((post) => {
          const isLiked = !!liked[post.id];
          const commentsOpen = !!openComments[post.id];
          return (
            <article key={post.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <PlayerAvatar player={post.author} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold">{post.author.username}</span>
                    <RankPill rank={post.author.rank} />
                    <span className="text-xs text-muted-foreground">· {post.timeAgo}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed">
                    <MentionText text={post.text} />
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
                      <Heart className={cn("h-4 w-4", isLiked && "fill-destructive")} />
                      {post.likes + (isLiked ? 1 : 0)}
                    </button>
                    {post.comments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleComments(post.id)}
                        aria-expanded={commentsOpen}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {post.comments.length}
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition-transform",
                            commentsOpen && "rotate-180",
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {commentsOpen && post.comments.length > 0 && (
                    <div className="mt-3 space-y-3 border-l-2 border-border pl-3 animate-in fade-in duration-150">
                      {post.comments.map((c) => (
                        <div key={c.id} className="flex items-start gap-2.5">
                          <PlayerAvatar player={c.author} size="sm" className="h-7 w-7 text-[10px]" />
                          <div className="min-w-0">
                            <p className="text-xs">
                              <span className="font-semibold">{c.author.username}</span>{" "}
                              <span className="text-muted-foreground">· {c.timeAgo}</span>
                            </p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              <MentionText text={c.text} />
                            </p>
                          </div>
                        </div>
                      ))}
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

/** Renders text with @mentions highlighted as tags. */
function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span
            key={i}
            className="rounded-md bg-primary/15 px-1 py-0.5 font-medium text-primary"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default NewsPage;