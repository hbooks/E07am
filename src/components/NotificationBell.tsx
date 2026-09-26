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

// Restrained per-kind accent. Icon tints only — no background, no glow.
const KIND_STYLES = {
  claim: { icon: Swords, color: '#5CA8FF' },
  match: { icon: Swords, color: '#22d3ee' },
  follow: { icon: UserPlus, color: '#a78bfa' },
  admin: { icon: Megaphone, color: '#f59e0b' },
} as const;

const DEFAULT_KIND_STYLE = { icon: Megaphone, color: '#9ca3af' };

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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef<number | null>(null);

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
    if (user) fetchNotifications();
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notif-bell-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchNotifications(),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchNotifications(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    if (prevUnreadRef.current !== null && unread > prevUnreadRef.current) {
      setRing(true);
      const t = setTimeout(() => setRing(false), 700);
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unread;
  }, [unread]);

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
    setNotifs((cur) => cur.map((n) => ({ ...n, read: true })));
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
      } else {
        // Tell NavRail to refresh its badge immediately
        window.dispatchEvent(new CustomEvent('ctr:notifications-updated'));
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
        className="fixed right-4 top-4 z-50 grid h-11 w-11 place-items-center rounded-full border border-white/[0.06] bg-[#141414]/90 backdrop-blur transition-colors hover:bg-[#1a1a1a]"
      >
        <Bell className={cn('h-5 w-5', ring && 'animate-[nb-ring_.65s_ease-in-out]')} />
        {unread > 0 && <UnreadBadge count={unread} />}
      </Link>
    );
  }

  return (
    <div ref={panelRef} className="fixed right-5 top-4 z-50">
      <style>{`
        @keyframes nb-ring {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-12deg); }
          40% { transform: rotate(9deg); }
          60% { transform: rotate(-6deg); }
          80% { transform: rotate(3deg); }
        }
        @keyframes nb-slide-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes nb-row-in {
          from { opacity: 0; }
          to   { opacity: 1; }
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
          'relative grid h-11 w-11 place-items-center rounded-full border border-white/[0.06] bg-[#141414]/90 backdrop-blur transition-colors',
          'hover:bg-[#1a1a1a]',
          open && 'border-white/[0.12] bg-[#1a1a1a]',
        )}
      >
        <Bell className={cn('h-5 w-5 text-gray-300', ring && 'animate-[nb-ring_.65s_ease-in-out]')} />
        {unread > 0 && <UnreadBadge count={unread} />}
      </button>

      {open && (
        <div className="absolute right-0 top-14 w-80 overflow-hidden rounded-xl border border-white/[0.08] bg-[#141414] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.9)] animate-[nb-slide-in_.15s_ease-out] sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">Notifications</p>
              {unread > 0 && (
                <span className="rounded-full bg-[#1E90FF] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {unread > 0 && (
                <button
                  type="button"
                  aria-label="Mark all as read"
                  title="Mark all as read"
                  onClick={handleMarkAllRead}
                  className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-white/[0.05] hover:text-gray-200"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                aria-label="Refresh"
                title="Refresh"
                onClick={fetchNotifications}
                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-white/[0.05] hover:text-gray-200"
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </button>
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-white/[0.05] hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="relative">
            {loading ? (
              <ul>
                {[0, 1, 2].map((i) => (
                  <RowSkeleton key={i} />
                ))}
              </ul>
            ) : error ? (
              <div className="grid place-items-center gap-2 px-4 py-10 text-center">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="text-sm text-gray-400">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="text-xs font-semibold text-[#5CA8FF] hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : notifs.length === 0 ? (
              <div className="grid place-items-center gap-2 py-12 px-4 text-center">
                <BellOff className="h-6 w-6 text-gray-600" />
                <p className="text-sm text-gray-400">No notifications yet.</p>
                <p className="text-xs text-gray-600">
                  Claims, follows, and updates will show up here.
                </p>
              </div>
            ) : (
              <ul className="max-h-96 overflow-y-auto">
                {notifs.map((n, i) => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    onNavigate={() => setOpen(false)}
                    index={i}
                    expandedId={expandedId}
                    onToggleExpand={setExpandedId}
                  />
                ))}
              </ul>
            )}
          </div>

          {!loading && !error && (
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 border-t border-white/[0.06] px-4 py-2.5 text-xs font-semibold text-[#5CA8FF] transition-colors hover:bg-white/[0.03]"
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

/* ============================================================
   NotificationRow — classic, tap-to-expand if clamped
   ============================================================ */
export function NotificationRow({
  n,
  onNavigate,
  index,
  expandedId,
  onToggleExpand,
}: {
  n: NotifItem;
  onNavigate?: () => void;
  index?: number;
  expandedId?: number | null;
  onToggleExpand?: (id: number | null) => void;
}) {
  const msg = MESSAGE_MAP[n.mes] || {
    title: 'New notification',
    detail: n.mes,
    kind: 'admin',
  };
  const style = KIND_STYLES[msg.kind as keyof typeof KIND_STYLES] || DEFAULT_KIND_STYLE;
  const Icon = style.icon;
  const timeAgo = formatTimeAgo(n.created_at);

  const delay = index !== undefined ? Math.min(index, 8) * 25 : 0;

  // Controlled when the parent passes expandedId; otherwise self-managed.
  const [localExpanded, setLocalExpanded] = useState(false);
  const isControlled = expandedId !== undefined;
  const expanded = isControlled ? expandedId === n.id : localExpanded;

  const toggle = () => {
    if (isControlled && onToggleExpand) {
      onToggleExpand(expanded ? null : n.id);
    } else {
      setLocalExpanded((v) => !v);
    }
  };

  return (
    <li
      className="border-b border-white/[0.04] last:border-b-0"
      style={{
        animation: `nb-row-in .2s ease-out ${delay}ms both`,
      }}
    >
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
          'hover:bg-white/[0.03]',
          !n.read && 'bg-white/[0.015]',
        )}
      >
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.04]">
          <Icon className="h-4 w-4" style={{ color: style.color }} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p
              className={cn(
                'flex-1 text-[13px] leading-snug',
                n.read ? 'font-medium text-gray-400' : 'font-semibold text-white',
              )}
            >
              {msg.title}
            </p>
            {!n.read && (
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1E90FF]" />
            )}
          </div>

          <p
            className={cn(
              'mt-0.5 text-[12px] leading-relaxed text-gray-500 transition-all duration-200',
              !expanded && 'line-clamp-2',
            )}
          >
            {msg.detail}
          </p>

          <p className="mt-1 text-[11px] text-gray-600">{timeAgo}</p>
        </div>
      </button>
    </li>
  );
}

function RowSkeleton() {
  return (
    <li className="flex items-start gap-3 border-b border-white/[0.04] px-4 py-3 last:border-b-0">
      <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-white/[0.04]" />
      <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
        <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.04]" />
        <div className="h-2.5 w-4/5 animate-pulse rounded bg-white/[0.04]" />
        <div className="h-2 w-1/4 animate-pulse rounded bg-white/[0.04]" />
      </div>
    </li>
  );
}

function UnreadBadge({ count }: { count: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#1E90FF] px-1 text-[10px] font-bold text-white ring-2 ring-[#141414]">
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