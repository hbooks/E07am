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

  // Listen for manual "mark all read" from NotificationsPage / bell panel
  useEffect(() => {
    const handler = () => fetchUnreadCount();
    window.addEventListener('ctr:notifications-updated', handler);
    return () => window.removeEventListener('ctr:notifications-updated', handler);
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
      {/* Toast-style popup — appears below the bell, doesn't overlap */}
      {popup && (
        <div
          className="fixed top-20 right-4 left-4 z-[70] mx-auto max-w-sm md:left-auto md:right-5 md:mx-0"
          role="alert"
          aria-live="assertive"
        >
          <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#141414] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.9)] animate-in slide-in-from-top-1 fade-in duration-150">
            <div className="flex items-start gap-3 p-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.04]">
                <Bell className="h-4 w-4 text-[#5CA8FF]" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[13px] font-semibold text-white">
                    {popup.title}
                  </p>
                  <button
                    onClick={() => setPopup(null)}
                    className="-mt-0.5 -mr-0.5 shrink-0 rounded-md p-1 text-gray-500 transition-colors hover:bg-white/[0.05] hover:text-gray-200"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-gray-500">
                  {popup.detail}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setPopup(null);
                navigate('/notifications');
              }}
              className="block w-full border-t border-white/[0.06] px-4 py-2 text-left text-[11px] font-semibold text-[#5CA8FF] transition-colors hover:bg-white/[0.03]"
            >
              View notifications →
            </button>
          </div>
        </div>
      )}

      {/* Desktop: fixed left icon rail */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center justify-center gap-7 border-r border-white/[0.06] bg-[#08090b]/95 md:flex"
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
                className="group relative translate-x-2 rounded-full bg-[#1E90FF] p-3.5 text-white transition-transform duration-200 hover:scale-110 glow-blue"
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
                  ? "bg-white/[0.05] text-[#5CA8FF]"
                  : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-200",
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

        {/* Profile / Login button */}
        {isLoading ? (
          <div className="rounded-xl p-2.5 text-gray-500 opacity-50">
            <User className="h-6 w-6" />
          </div>
        ) : isAuthenticated ? (
          <Link
            to="/onboarding"
            aria-label="Profile"
            className={cn(
              "group relative rounded-xl p-2.5 transition-colors",
              pathname.startsWith("/onboarding") || pathname.startsWith("/profile")
                ? "bg-white/[0.05] text-[#5CA8FF]"
                : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-200",
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
              "group relative rounded-xl p-2.5 transition-colors text-gray-500 hover:bg-white/[0.04] hover:text-gray-200",
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
        className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 items-center border-t border-white/[0.06] bg-[#08090b]/95 backdrop-blur md:hidden"
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
                className="mx-auto grid h-14 w-14 -translate-y-4 place-items-center rounded-full bg-[#1E90FF] text-white transition-transform duration-200 active:scale-95 glow-blue"
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
                active ? "text-[#5CA8FF]" : "text-gray-500",
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
          <div className="mx-auto grid h-full w-full place-items-center text-gray-500 opacity-50">
            <User className="h-6 w-6" />
          </div>
        ) : isAuthenticated ? (
          <Link
            to="/onboarding"
            aria-label="Profile"
            className={cn(
              "mx-auto grid h-full w-full place-items-center transition-colors",
              pathname.startsWith("/onboarding") || pathname.startsWith("/profile")
                ? "text-[#5CA8FF]"
                : "text-gray-500",
            )}
          >
            <User className="h-6 w-6" />
          </Link>
        ) : (
          <button
            onClick={() => login({ prompt: PromptTypes.login })}
            className="mx-auto grid h-full w-full place-items-center text-gray-500"
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
    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#1E90FF] px-1 text-[10px] font-bold text-white ring-2 ring-[#08090b]">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-4 -translate-y-1/2 translate-x-1 rounded-md border border-white/[0.08] bg-[#141414] px-2.5 py-1 text-xs font-medium whitespace-nowrap text-gray-200 opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
      {label}
    </span>
  );
}

export default NavRail;