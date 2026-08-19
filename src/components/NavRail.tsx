import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Newspaper, Plus, User, Volleyball, Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { PromptTypes } from "@kinde/js-utils";
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { MESSAGE_MAP } from '@/lib/notificationMessages';

const BASE_ITEMS = [
  { to: "/", label: "Feed", icon: Volleyball, special: false },
  { to: "/news", label: "News", icon: Newspaper, special: false },
  { to: "/create", label: "Create Room", icon: Plus, special: true },
  { to: "/notifications", label: "Notifications", icon: Bell, special: false },
] as const;

interface PopupNotification {
  title: string;
  detail: string;
}

export function NavRail() {
  const { pathname } = useLocation();
  const { isAuthenticated, isLoading, login, user } = useKindeAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [popup, setPopup] = useState<PopupNotification | null>(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    if (!error) setUnreadCount(count ?? 0);
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [user?.id]);

  // Realtime subscription + popup trigger
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`nav-notif-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const mesCode = payload.new?.mes;
            const message = MESSAGE_MAP[mesCode] || {
              title: 'New notification',
              detail: mesCode,
            };
            setPopup({ title: message.title, detail: message.detail });
          }
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Auto-dismiss popup after 6 seconds
  useEffect(() => {
    if (!popup) return;
    const timer = setTimeout(() => setPopup(null), 6000);
    return () => clearTimeout(timer);
  }, [popup]);

  return (
    <>
      {/* Notification popup (fixed, non-blocking) */}
      {popup && (
        <div
          className="fixed top-4 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-[#141414] border border-white/10 shadow-2xl rounded-2xl p-4 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-[#1E90FF]/15 flex items-center justify-center">
                <Bell className="h-5 w-5 text-[#1E90FF]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white truncate">{popup.title}</h4>
                  <button
                    onClick={() => setPopup(null)}
                    className="text-gray-400 hover:text-white transition p-0.5"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{popup.detail}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setPopup(null);
                  navigate('/notifications');
                }}
                className="text-xs font-medium text-[#1E90FF] hover:underline"
              >
                View notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: fixed left icon rail */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center justify-center gap-7 border-r border-border bg-background/95 md:flex"
      >
        {BASE_ITEMS.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;

          if (item.special) {
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className="group relative translate-x-2 rounded-full bg-primary p-3.5 text-primary-foreground transition-transform duration-200 hover:scale-110 glow-blue"
              >
                <Icon className="h-6 w-6" strokeWidth={2.5} />
                <Tooltip label={item.label} />
              </Link>
            );
          }

          const badge = item.to === "/notifications" && unreadCount > 0;

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={cn(
                "group relative rounded-xl p-2.5 transition-colors",
                active
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <span className="relative inline-flex">
                <Icon className="h-6 w-6" />
                {badge && <UnreadBadge count={unreadCount} />}
              </span>
              <Tooltip label={item.label} />
            </Link>
          );
        })}

        {/* Profile / Login button – the watchdog */}
        {isLoading ? (
          <div className="rounded-xl p-2.5 text-muted-foreground opacity-50">
            <User className="h-6 w-6" />
          </div>
        ) : isAuthenticated ? (
          <Link
            to="/onboarding"
            aria-label="Profile"
            className={cn(
              "group relative rounded-xl p-2.5 transition-colors",
              pathname.startsWith("/onboarding") || pathname.startsWith("/profile")
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <User className="h-6 w-6" />
            <Tooltip label="Profile" />
          </Link>
        ) : (
          <button
            onClick={() => login({ prompt: PromptTypes.login })}
            aria-label="Sign in"
            className={cn(
              "group relative rounded-xl p-2.5 transition-colors text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <User className="h-6 w-6" />
            <Tooltip label="Sign in" />
          </button>
        )}
      </nav>

      {/* Mobile: fixed bottom bar */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 items-center border-t border-border bg-background/95 backdrop-blur md:hidden"
      >
        {BASE_ITEMS.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;

          if (item.special) {
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className="mx-auto grid h-14 w-14 -translate-y-4 place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 active:scale-95 glow-blue"
              >
                <Icon className="h-7 w-7" strokeWidth={2.5} />
              </Link>
            );
          }

          const badge = item.to === "/notifications" && unreadCount > 0;

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={cn(
                "mx-auto grid h-full w-full place-items-center transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className="relative inline-flex">
                <Icon className="h-6 w-6" />
                {badge && <UnreadBadge count={unreadCount} />}
              </span>
            </Link>
          );
        })}

        {/* Profile / Login for mobile */}
        {isLoading ? (
          <div className="mx-auto grid h-full w-full place-items-center text-muted-foreground opacity-50">
            <User className="h-6 w-6" />
          </div>
        ) : isAuthenticated ? (
          <Link
            to="/onboarding"
            aria-label="Profile"
            className={cn(
              "mx-auto grid h-full w-full place-items-center transition-colors",
              pathname.startsWith("/onboarding") || pathname.startsWith("/profile")
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            <User className="h-6 w-6" />
          </Link>
        ) : (
          <button
            onClick={() => login({ prompt: PromptTypes.login })}
            className="mx-auto grid h-full w-full place-items-center text-muted-foreground"
          >
            <User className="h-6 w-6" />
          </button>
        )}
      </nav>
    </>
  );
}

function UnreadBadge({ count }: { count: number }) {
  return (
    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-4 -translate-y-1/2 translate-x-1 rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
      {label}
    </span>
  );
}

export default NavRail;