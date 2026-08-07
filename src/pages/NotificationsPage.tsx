import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BellOff, CheckCheck } from "lucide-react";
import { useState } from "react";
import { NOTIFICATIONS } from "@/lib/mock-data";
import { NotificationRow } from "@/components/NotificationBell";


function NotificationsPage() {
  const navigate = useNavigate();
  const [readIds, setReadIds] = useState<string[]>([]);

  const allRead = readIds.length === NOTIFICATIONS.length;

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-4 pb-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate("/")}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-lg font-bold">Notifications</h1>
        <button
          type="button"
          onClick={() => setReadIds(NOTIFICATIONS.map((n) => n.id))}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </button>
      </header>

      {allRead ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <BellOff className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-lg font-semibold">All caught up</p>
          <p className="mt-1 text-sm text-muted-foreground">No new notifications right now.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {NOTIFICATIONS.map((n) => (
            <NotificationRow
              key={n.id}
              id={n.id}
              unread={n.unread && !readIds.includes(n.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationsPage;
