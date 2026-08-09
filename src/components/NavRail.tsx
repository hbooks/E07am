import { Link, useLocation } from 'react-router-dom';
import { Newspaper, Plus, Search, User, Volleyball } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { PromptTypes } from "@kinde/js-utils";

const BASE_ITEMS = [
  { to: "/", label: "Feed", icon: Volleyball, special: false },
  { to: "/news", label: "News", icon: Newspaper, special: false },
  { to: "/create", label: "Create Room", icon: Plus, special: true },
  { to: "/search", label: "Search", icon: Search, special: false },
] as const;

export function NavRail() {
  const { pathname } = useLocation();
  const { isAuthenticated, isLoading, login } = useKindeAuth();

  return (
    <>
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
              <Icon className="h-6 w-6" />
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
              <Icon className="h-6 w-6" />
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

function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-4 -translate-y-1/2 translate-x-1 rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
      {label}
    </span>
  );
}

export default NavRail;