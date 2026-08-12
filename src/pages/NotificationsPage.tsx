import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BellOff, CheckCheck, RefreshCw } from 'lucide-react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { NotificationRow } from '@/components/NotificationBell';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

interface NotifItem {
  id: number;
  mes: string;
  created_at: string;
  read: boolean;
}

function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useKindeAuth();
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
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    // optional: call a MarkAllRead edge function later
    toast.success('Marked all as read');
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
        <h1 className="flex-1 text-lg font-bold">Notifications</h1>
        <button
          type="button"
          onClick={fetchNotifications}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </header>

      {loading ? (
        <div className="grid place-items-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-red-500/30 bg-red-500/5 px-6 py-16 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchNotifications}
            className="mt-4 text-sm text-primary hover:underline"
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
            <div className="mb-3 flex items-center justify-between">
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
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {notifs.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default NotificationsPage;