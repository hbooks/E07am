import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, ChevronRight, Megaphone, Swords, UserPlus, X, RefreshCw, BellOff,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { cn } from '@/lib/utils';
import { MESSAGE_MAP } from '@/lib/notificationMessages';
import { toast } from 'sonner';

const KIND_ICON = {
  claim: Swords,
  follow: UserPlus,
  admin: Megaphone,
  match: Swords,
} as const;

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
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/Feno?userId=${encodeURIComponent(user.id)}`
      );
      const data = await res.json();
      if (Array.isArray(data)) setNotifs(data);
      else setNotifs([]);
    } catch {
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

  const unread = notifs.filter((n) => !n.read).length;

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

  if (!user) return null;

  if (isMobile) {
    return (
      <Link
        to="/notifications"
        aria-label={`Notifications, ${unread} unread`}
        className="fixed right-4 top-4 z-50 grid h-11 w-11 place-items-center rounded-full border border-border bg-card/90 backdrop-blur transition-colors hover:bg-secondary"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && <UnreadBadge count={unread} />}
      </Link>
    );
  }

  return (
    <div ref={panelRef} className="fixed right-5 top-4 z-50">
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
        <Bell className="h-5 w-5" />
        {unread > 0 && <UnreadBadge count={unread} />}
      </button>

      {open && (
        <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 top-14 w-80 overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl duration-150">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Refresh"
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

          {loading ? (
            <div className="grid place-items-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notifs.length === 0 ? (
            <div className="grid place-items-center gap-2 py-12 px-4 text-center">
              <BellOff className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notifs.map((n) => (
                <NotificationRow key={n.id} n={n} onNavigate={() => setOpen(false)} />
              ))}
            </ul>
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
  const Icon = KIND_ICON[msg.kind as keyof typeof KIND_ICON] || Megaphone;
  const timeAgo = formatTimeAgo(n.created_at);

  return (
    <li>
      <Link
        to="/notifications"
        onClick={onNavigate}
        className={cn(
          'group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/70',
          !n.read && 'bg-accent/40',
        )}
      >
        <span
          className={cn(
            'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full',
            !n.read ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground',
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{msg.title}</span>
            {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
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

function UnreadBadge({ count }: { count: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
      {count}
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