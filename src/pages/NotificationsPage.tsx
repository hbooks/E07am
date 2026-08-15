import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BellOff, CheckCheck, RefreshCw, AlertCircle, LogIn } from 'lucide-react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { NotificationRow } from '@/components/NotificationBell';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

// Chronological data earns a real grouping — "Today" vs "Earlier" tells the reader
// something the timestamp alone doesn't: how fresh the whole batch is at a glance.
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

  const unreadCount = notifs.filter((n) => !n.read).length;
  const groups = groupByDate(notifs);

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return;
    const prev = notifs;
    setNotifs((cur) => cur.map((n) => ({ ...n, read: true }))); // optimistic

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
    <div className="mx-auto w-full max-w-xl px-4 pt-4 pb-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate('/')}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center gap-2">
          <h1 className="text-lg font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={fetchNotifications}
          disabled={!user || loading}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </header>

      {authLoading ? (
        <SkeletonList />
      ) : !user ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <LogIn className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-lg font-semibold">Sign in to see your notifications</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Claims, follows, and updates about your matches live here.
          </p>
          {login && (
            <button
              onClick={() => login()}
              className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign in
            </button>
          )}
        </div>
      ) : loading ? (
        <SkeletonList />
      ) : error ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="mt-3 font-semibold text-destructive">{error}</p>
          <p className="mt-1 text-sm text-muted-foreground">Your notifications couldn't be loaded.</p>
          <button
            onClick={fetchNotifications}
            className="mt-4 rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            Try again
          </button>
        </div>
      ) : notifs.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <BellOff className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-lg font-semibold">All caught up</p>
          <p className="mt-1 text-sm text-muted-foreground">No notifications right now.</p>
        </div>
      ) : (
        <>
          {unreadCount > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                {group.label}
              </p>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {group.items.map((n) => (
                  <NotificationRow key={n.id} n={n} />
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="flex items-start gap-3 px-4 py-3.5">
          <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-secondary" />
          <span className="min-w-0 flex-1 space-y-1.5 pt-0.5">
            <span className="block h-3 w-1/2 animate-pulse rounded bg-secondary" />
            <span className="block h-2.5 w-4/5 animate-pulse rounded bg-secondary" />
            <span className="block h-2 w-1/4 animate-pulse rounded bg-secondary" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export default NotificationsPage;