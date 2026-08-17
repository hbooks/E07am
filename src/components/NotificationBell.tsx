import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, ChevronRight, Megaphone, Swords, UserPlus, X, RefreshCw, BellOff,
  CheckCheck, AlertCircle,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { cn } from '@/lib/utils';
import { MESSAGE_MAP } from '@/lib/notificationMessages';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

// Each notification "kind" gets its own icon + accent, so the list stays scannable
// without reading every line — colour tells you what you're looking at before the text does.
const KIND_STYLES = {
  claim: { icon: Swords, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  match: { icon: Swords, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  follow: { icon: UserPlus, color: 'text-violet-400', bg: 'bg-violet-500/15' },
  admin: { icon: Megaphone, color: 'text-amber-400', bg: 'bg-amber-500/15' },
} as const;
const DEFAULT_KIND_STYLE = { icon: Megaphone, color: 'text-muted-foreground', bg: 'bg-secondary' };

interface NotifItem {
  id: number;
  mes: string;
  created_at: string;
  read: boolean;
}

export function NotificationBell() {
  const isMobile = useIsMobile();
  const { user } = useKindeAuth();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ring, setRing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef<number | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/Feno?userId=${encodeURIComponent(user.id)}`
      );
      const data = await res.json();
      if (Array.isArray(data)) setNotifs(data);
      else setNotifs([]);
    } catch {
      setError('Could not load notifications');
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notif-bell-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const unread = notifs.filter((n) => !n.read).length;

  // One-shot "something just arrived" cue — never a looping animation, just a single ring on increase.
  useEffect(() => {
    if (prevUnreadRef.current !== null && unread > prevUnreadRef.current) {
      setRing(true);
      const t = setTimeout(() => setRing(false), 650);
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unread;
  }, [unread]);

  useEffect(() => {
    if (!loading && notifs.length >= 0) hasLoadedRef.current = true;
  }, [loading, notifs]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => setOpen(false), [isMobile]);

  const handleMarkAllRead = async () => {
    if (!user || unread === 0) return;
    const prev = notifs;
    setNotifs((cur) => cur.map((n) => ({ ...n, read: true }))); // optimistic
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/Mark_Read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotifs(prev);
        toast.error(data.error || 'Failed to mark as read');
      }
    } catch {
      setNotifs(prev);
      toast.error('Network error');
    }
  };

  if (!user) return null;

  if (isMobile) {
    return (
      <Link
        to="/notifications"
        aria-label={`Notifications, ${unread} unread`}
        className="fixed right-4 top-4 z-50 grid h-11 w-11 place-items-center rounded-full border border-border bg-card/90 backdrop-blur transition-colors hover:bg-secondary"
      >
        <Bell className={cn('h-5 w-5', ring && 'animate-[nb-ring_.6s_ease-in-out]')} />
        {unread > 0 && <UnreadBadge count={unread} pulse={ring} />}
      </Link>
    );
  }

  return (
    <div ref={panelRef} className="fixed right-5 top-4 z-50">
      <style>{`
        @keyframes nb-ring {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-14deg); }
          40% { transform: rotate(11deg); }
          60% { transform: rotate(-7deg); }
          80% { transform: rotate(4deg); }
        }
        @keyframes nb-pop {
          0% { transform: scale(0.6); }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>

      <button
        type="button"
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) fetchNotifications();
        }}
        className={cn(
          'grid h-11 w-11 place-items-center rounded-full border border-border bg-card/90 backdrop-blur transition-colors hover:bg-secondary',
          open && 'border-primary/60 text-primary glow-blue-soft',
        )}
      >
        <Bell className={cn('h-5 w-5', ring && 'animate-[nb-ring_.6s_ease-in-out]')} />
        {unread > 0 && <UnreadBadge count={unread} pulse={ring} />}
      </button>

      {open && (
        <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 top-14 w-80 overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl duration-150 sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  type="button"
                  aria-label="Mark all as read"
                  title="Mark all as read"
                  onClick={handleMarkAllRead}
                  className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                aria-label="Refresh"
                title="Refresh"
                onClick={fetchNotifications}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </button>
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            {loading ? (
              <ul>
                {[0, 1, 2].map((i) => (
                  <RowSkeleton key={i} />
                ))}
              </ul>
            ) : error ? (
              <div className="grid place-items-center gap-2 px-4 py-10 text-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : notifs.length === 0 ? (
              <div className="grid place-items-center gap-2 py-12 px-4 text-center">
                <BellOff className="h-7 w-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
                <p className="text-xs text-muted-foreground/70">
                  Claims, follows, and updates will show up here.
                </p>
              </div>
            ) : (
              <>
                <ul className="max-h-96 overflow-y-auto">
                  {notifs.map((n) => (
                    <NotificationRow key={n.id} n={n} onNavigate={() => setOpen(false)} />
                  ))}
                </ul>
                {/* Scroll hint — fades the last row rather than cutting it off sharply */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-popover to-transparent" />
              </>
            )}
          </div>

          {!loading && !error && (
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 border-t border-border px-4 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-secondary/70"
            >
              View all notifications
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function NotificationRow({
  n,
  onNavigate,
}: {
  n: NotifItem;
  onNavigate?: () => void;
}) {
  const msg = MESSAGE_MAP[n.mes] || {
    title: 'New notification',
    detail: n.mes,
    kind: 'admin',
  };
  const style = KIND_STYLES[msg.kind as keyof typeof KIND_STYLES] || DEFAULT_KIND_STYLE;
  const Icon = style.icon;
  const timeAgo = formatTimeAgo(n.created_at);

  return (
    <li>
      <Link
        to="/notifications"
        onClick={onNavigate}
        className={cn(
          'group relative flex items-start gap-3 border-l-2 border-transparent px-4 py-3 transition-colors hover:bg-secondary/70',
          !n.read && 'border-l-current bg-accent/30',
          !n.read && style.color,
        )}
      >
        <span className={cn('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full', style.bg, style.color)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 text-current">
          <span className="flex items-center gap-2">
            <span className={cn('truncate text-sm font-semibold', !n.read ? 'text-foreground' : 'text-foreground/90')}>
              {msg.title}
            </span>
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            {msg.detail}
          </span>
          <span className="mt-1 block text-[11px] text-muted-foreground/70">{timeAgo}</span>
        </span>
        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

function RowSkeleton() {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-secondary" />
      <span className="min-w-0 flex-1 space-y-1.5 pt-0.5">
        <span className="block h-3 w-2/3 animate-pulse rounded bg-secondary" />
        <span className="block h-2.5 w-4/5 animate-pulse rounded bg-secondary" />
        <span className="block h-2 w-1/4 animate-pulse rounded bg-secondary" />
      </span>
    </li>
  );
}

function UnreadBadge({ count, pulse }: { count: number; pulse?: boolean }) {
  return (
    <span
      className={cn(
        'absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background',
        pulse && 'animate-[nb-pop_.4s_cubic-bezier(0.34,1.56,0.64,1)]',
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

function formatTimeAgo(dateString: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}