import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BellOff, BellRing, CheckCheck, RefreshCw, AlertCircle, LogIn } from 'lucide-react';
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
        // Sync the NavRail bell badge immediately
        window.dispatchEvent(new CustomEvent('ctr:notifications-updated'));
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

        @keyframes np-rise {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .np-rise { animation: np-rise 0.32s cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes np-shimmer {
          from { background-position: -300px 0; }
          to { background-position: 300px 0; }
        }
        .np-shimmer {
          background-image: linear-gradient(
            100deg,
            #1a1a1c 30%,
            #232326 45%,
            #1a1a1c 60%
          );
          background-size: 300px 100%;
          animation: np-shimmer 1.6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .np-rise { animation: none; }
          .np-shimmer { animation: none; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-xl px-4 pb-24 np-body">
        {/* Header */}
        <header className="sticky top-0 z-20 -mx-4 mb-6 flex items-center gap-3 border-b border-white/[0.06] bg-[#08090b]/85 px-4 py-3 backdrop-blur-xl">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate('/')}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-1 items-center gap-2.5">
            <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1E90FF]/10">
              <BellRing className="h-4 w-4 text-[#5CA8FF]" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#1E90FF] ring-2 ring-[#08090b]" />
              )}
            </span>
            <h1 className="np-display text-lg font-bold tracking-tight">Notifications</h1>
          </div>

          <button
            type="button"
            onClick={fetchNotifications}
            disabled={!user || loading}
            aria-label="Refresh notifications"
            className="flex items-center gap-1.5 rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </header>

        {/* Content */}
        {authLoading ? (
          <SkeletonList />
        ) : !user ? (
          <EmptyState
            icon={<LogIn className="h-6 w-6 text-gray-500" />}
            title="Sign in to see what's new"
            body="Claim requests, room updates, and match activity show up here."
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
            icon={<AlertCircle className="h-6 w-6 text-red-400" />}
            title="Couldn't load notifications"
            body={error === 'Network error' ? 'Check your connection and try again.' : error}
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
            icon={<BellOff className="h-6 w-6 text-gray-500" />}
            title="Nothing here yet"
            body="You'll see claims, follows, and match updates the moment they happen."
          />
        ) : (
          <div className="np-rise">
            {unreadCount > 0 && (
              <div className="mb-5 flex items-center justify-between px-1">
                <p className="text-[13px] text-gray-500">
                  <span className="font-semibold text-gray-300">{unreadCount}</span> unread
                </p>
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[#5CA8FF] transition-colors hover:text-[#7BB8FF]"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              </div>
            )}

            <div className="space-y-6">
              {groups.map((group, i) => (
                <div
                  key={group.label}
                  className="np-rise"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="mb-2.5 flex items-center gap-3 px-1">
                    <p className="shrink-0 text-[13px] font-semibold text-gray-400">
                      {group.label}
                    </p>
                    <span className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                  <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111113]">
                    {group.items.map((n) => (
                      <NotificationRow key={n.id} n={n} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
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
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#0d0d0f] px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-white/5 bg-[#161616]">
        {icon}
      </div>
      <p className="np-display mt-4 text-base font-bold">{title}</p>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-gray-500">{body}</p>
      {action}
    </div>
  );
}

/* ---------- Skeleton ---------- */

function SkeletonList() {
  return (
    <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111113]">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="flex items-start gap-3 px-4 py-3.5">
          <span className="np-shimmer h-9 w-9 shrink-0 rounded-full" />
          <span className="min-w-0 flex-1 space-y-1.5 pt-0.5">
            <span className="np-shimmer block h-3 w-1/2 rounded" />
            <span className="np-shimmer block h-2.5 w-4/5 rounded" />
            <span className="np-shimmer block h-2 w-1/4 rounded" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export default NotificationsPage;