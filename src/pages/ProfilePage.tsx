import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Info,
  LogOut,
  Mail,
  MoreVertical,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { CURRENT_USER } from "@/lib/mock-data";
import { PlayerAvatar, RankPill } from "@/components/PlayerAvatar";

function ProfilePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const placeholder = (label: string) => () =>
    toast(`${label} coming soon`, { description: "This is a placeholder for now." });

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-16 pb-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Header with three-dot menu */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">Profile</h1>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Profile options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full border border-border p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <MoreVertical className="h-4.5 w-4.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 z-30 w-48 overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
              <MenuItem icon={Settings} label="Settings" onClick={placeholder("Settings")} />
              <MenuItem
                icon={SlidersHorizontal}
                label="Request Changes"
                onClick={placeholder("Request Changes")}
              />
              <MenuItem
                icon={LogOut}
                label="Logout"
                destructive
                onClick={() => toast("Logged out (demo)")}
              />
            </div>
          )}
        </div>
      </div>

      {/* Player card */}
      <div className="pitch-texture rounded-3xl border border-border p-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Change profile picture"
            onClick={placeholder("Photo upload")}
            className="group relative shrink-0"
          >
            <PlayerAvatar player={CURRENT_USER} size="lg" />
            <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background transition-transform group-hover:scale-110">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">{CURRENT_USER.username}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <RankPill rank={CURRENT_USER.rank} />
              <span className="text-xs text-muted-foreground">{CURRENT_USER.playerRank}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatCard icon={Trophy} label="Rank" value={CURRENT_USER.rank.label} />
          <StatCard
            icon={ShieldCheck}
            label="Squad Strength"
            value={CURRENT_USER.squadStrength.toLocaleString()}
          />
          <StatCard icon={SlidersHorizontal} label="Player Rank" value={CURRENT_USER.playerRank} />
        </div>
      </div>

      {/* Account info — read-only */}
      <div className="mt-4 rounded-3xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-sm font-bold tracking-wide uppercase text-muted-foreground">
            Account Info
          </h3>
          <span
            className="group relative"
            tabIndex={0}
            aria-label="For security reasons, this information is tied to your login provider and cannot be changed here."
          >
            <Info className="h-4 w-4 cursor-help text-muted-foreground" />
            <span className="pointer-events-none absolute left-1/2 top-6 z-30 w-56 -translate-x-1/2 rounded-xl border border-border bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              For security reasons, this information is tied to your login provider and cannot be
              changed here.
            </span>
          </span>
        </div>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" /> Email
            </dt>
            <dd className="font-medium">youaregoat@gmail.com</dd>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Login method
            </dt>
            <dd className="font-medium">Google</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 px-3 py-3.5 text-center">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-1.5 truncate text-sm font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary ${
        destructive ? "text-destructive" : "text-popover-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export default ProfilePage;