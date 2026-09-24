import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BellOff, CheckCheck, RefreshCw, AlertCircle, LogIn } from 'lucide-react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { NotificationRow } from '@/components/NotificationBell';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

interface NotifItem {
  id: number;
  mes: string;
  created_at: string;
  read: boolean;
}

interface NotifGroup {
  label: string;
  items: NotifItem[];
}

function groupByDate(notifs: NotifItem[]): NotifGroup[] {
  const today: NotifItem[] = [];
  const yesterday: NotifItem[] = [];
  const earlier: NotifItem[] = [];

  const now = new Date();
  const todayStr = now.toDateString();
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const yesterdayStr = y.toDateString();

  for (const n of notifs) {
    const ds = new Date(n.created_at).toDateString();
    if (ds === todayStr) today.push(n);
    else if (ds === yesterdayStr) yesterday.push(n);
    else earlier.push(n);
  }

  return [
    { label: 'Today', items: today },
    { label: 'Yesterday', items: yesterday },
    { label: 'Earlier', items: earlier },
  ].filter((g) => g.items.length > 0);
}

function NotificationsPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, login } = useKindeAuth();
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError('Network error');
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
      .channel(`notif-page-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
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

  const unreadCount = notifs.filter((n) => !n.read).length;
  const groups = groupByDate(notifs);

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return;
    const prev = notifs;
    setNotifs((cur) => cur.map((n) => ({ ...n, read: true })));

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/Mark_Read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('All caught up');
      } else {
        setNotifs(prev);
        toast.error(data.error || 'Failed to mark as read');
      }
    } catch {
      setNotifs(prev);
      toast.error('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-[#08090b] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        .np-display { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.01em; }
        .np-body { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="mx-auto w-full max-w-xl px-4 pb-24 np-body">
        {/* Header — sticky, subtle, matches IndexPage header */}
        <header className="sticky top-0 z-20 -mx-4 mb-5 flex items-center gap-3 border-b border-white/[0.06] bg-[#08090b]/85 px-4 py-3 backdrop-blur-xl">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate('/')}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center gap-2">
            <h1 className="np-display text-lg font-bold tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="rounded-full border border-[#1E90FF]/25 bg-[#1E90FF]/10 px-2 py-0.5 text-[10px] font-bold text-[#5CA8FF]">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={fetchNotifications}
            disabled={!user || loading}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#5CA8FF] transition-colors hover:bg-[#1E90FF]/10 disabled:opacity-40"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </header>

        {/* Content */}
        {authLoading ? (
          <SkeletonList />
        ) : !user ? (
          <EmptyState
            icon={<LogIn className="h-7 w-7 text-gray-500" />}
            title="Sign in to see your notifications"
            body="Claims, follows, and updates about your matches live here."
            action={
              login && (
                <button
                  onClick={() => login()}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1E90FF] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Sign in
                </button>
              )
            }
          />
        ) : loading ? (
          <SkeletonList />
        ) : error ? (
          <EmptyState
            icon={<AlertCircle className="h-7 w-7 text-red-400" />}
            title={error}
            titleClass="text-red-400"
            body="Your notifications couldn't be loaded."
            action={
              <button
                onClick={fetchNotifications}
                className="mt-5 rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-[#5CA8FF] transition-colors hover:bg-[#1E90FF]/10"
              >
                Try again
              </button>
            }
          />
        ) : notifs.length === 0 ? (
          <EmptyState
            icon={<BellOff className="h-7 w-7 text-gray-500" />}
            title="All caught up"
            body="No notifications right now."
          />
        ) : (
          <>
            {unreadCount > 0 && (
              <div className="mb-4 flex items-center justify-between px-1">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {unreadCount} unread
                </p>
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#5CA8FF] transition-colors hover:text-[#7BB8FF]"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </button>
              </div>
            )}

            <div className="space-y-5">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-600">
                    {group.label}
                  </p>
                  <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#141414]">
                    {group.items.map((n) => (
                      <NotificationRow key={n.id} n={n} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Empty / status state ---------- */

function EmptyState({
  icon,
  title,
  body,
  action,
  titleClass,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
  titleClass?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#101010] px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-white/5 bg-[#161616]">
        {icon}
      </div>
      <p className={cn('mt-4 text-base font-semibold', titleClass ?? 'text-white')}>{title}</p>
      <p className="mt-1 max-w-xs text-sm text-gray-500">{body}</p>
      {action}
    </div>
  );
}

/* ---------- Skeleton ---------- */

function SkeletonList() {
  return (
    <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#141414]">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="flex items-start gap-3 px-4 py-3.5">
          <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[#1f1f1f]" />
          <span className="min-w-0 flex-1 space-y-1.5 pt-0.5">
            <span className="block h-3 w-1/2 animate-pulse rounded bg-[#1f1f1f]" />
            <span className="block h-2.5 w-4/5 animate-pulse rounded bg-[#1f1f1f]" />
            <span className="block h-2 w-1/4 animate-pulse rounded bg-[#1f1f1f]" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export default NotificationsPage;