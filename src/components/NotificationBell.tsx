import { useEffect, useRef, useState } from "react";
import { Link } from 'react-router-dom';
import { Bell, ChevronRight, Megaphone, Swords, UserPlus, X } from "lucide-react";
import { NOTIFICATIONS } from "@/lib/mock-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const KIND_ICON = {
  claim: Swords,
  follow: UserPlus,
  admin: Megaphone,
  match: Swords,
} as const;

export function NotificationBell() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = NOTIFICATIONS.filter((n) => n.unread).length;


  // Close popover on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => setOpen(false), [isMobile]);

  if (isMobile) return null;

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
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid h-11 w-11 place-items-center rounded-full border border-border bg-card/90 backdrop-blur transition-colors hover:bg-secondary",
          open && "border-primary/60 text-primary glow-blue-soft",
        )}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && <UnreadBadge count={unread} />}
      </button>

      {open && (
        <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 top-14 w-80 overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl duration-150">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {NOTIFICATIONS.map((n) => (
              <NotificationRow key={n.id} id={n.id} onNavigate={() => setOpen(false)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function NotificationRow({
  id,
  onNavigate,
  unread,
}: {
  id: string;
  onNavigate?: () => void;
  unread?: boolean;
}) {
  const n = NOTIFICATIONS.find((x) => x.id === id)!;
  const isUnread = unread ?? n.unread;
  const Icon = KIND_ICON[n.kind];
  return (
    <li>
      <Link
        to="/notifications"
        onClick={onNavigate}
        className={cn(
          "group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/70",
          isUnread && "bg-accent/40",
        )}
      >
        <span
          className={cn(
            "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full",
            isUnread ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{n.title}</span>
            {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            {n.detail}
          </span>
          <span className="mt-1 block text-[11px] text-muted-foreground/70">{n.timeAgo}</span>
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

export default NotificationBell;