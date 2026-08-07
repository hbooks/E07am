import { cn } from "@/lib/utils";
import type { Player } from "@/lib/mock-data";

/** Deterministic gradient avatar built from the player's avatarHue. */
export function PlayerAvatar({
  player,
  size = "md",
  className,
}: {
  player: Player;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "sm" ? "h-9 w-9 text-xs" : size === "lg" ? "h-20 w-20 text-2xl" : "h-11 w-11 text-sm";

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold text-white ring-2 ring-border",
        sizeClass,
        className,
      )}
      style={{
        background: `linear-gradient(135deg, oklch(0.55 0.18 ${player.avatarHue}), oklch(0.35 0.12 ${player.avatarHue + 40}))`,
      }}
      aria-label={`${player.username}'s avatar`}
    >
      {player.initials}
    </div>
  );
}

export function RankPill({ rank }: { rank: Player["rank"] }) {
  const color =
    rank.tier === "gold"
      ? "text-gold border-gold/40 bg-gold/10"
      : rank.tier === "silver"
        ? "text-silver border-silver/40 bg-silver/10"
        : "text-bronze border-bronze/40 bg-bronze/10";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        color,
      )}
    >
      {rank.label}
    </span>
  );
}

export default PlayerAvatar;