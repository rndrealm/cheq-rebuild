"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/components/providers/user-provider";
import { AppRoutes } from "@/lib/routes";
import {
  BetsIcon,
  HomeIcon,
  LandingAvatarIcon,
  SettingsIcon,
  SignOutIcon,
} from "@/lib/svgs";
import { cn } from "@/lib/utils";

const NAV_ITEMS: {
  label: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactNode;
}[] = [
  { label: "Home", href: AppRoutes.home.path, icon: HomeIcon },
  { label: "Bets", href: AppRoutes.feed.path, icon: BetsIcon },
];

const TILE_CLASS =
  "flex size-9 items-center justify-center rounded-lg text-gray-12 outline-none transition-[background-color,scale] duration-150 ease-out hover:bg-gray-3 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.96]";

/** Left-hand icon rail: logo, page nav, and settings (the account menu). */
export function AppSidebar() {
  const user = useUser();
  const pathname = usePathname();

  return (
    <aside
      className="sticky top-0 z-40 flex h-dvh w-14 shrink-0 flex-col items-center bg-card py-8.5"
      // Holds still during page transitions (see globals.css)
      style={{ viewTransitionName: "app-sidebar" }}
    >
      <Link
        href={AppRoutes.home.path}
        aria-label="cheq home"
        className="flex size-9 items-center justify-center"
      >
        <LandingAvatarIcon size={36} />
      </Link>

      <nav className="mt-[47px] flex flex-col items-center gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              aria-current={active ? "page" : undefined}
              className={cn(TILE_CLASS, active && "bg-gray-3")}
            >
              <Icon className="size-4.5" />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Settings"
            title="Settings"
            className={cn(TILE_CLASS, "cursor-pointer")}
          >
            <SettingsIcon className="size-4.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            sideOffset={12}
            className="w-56"
          >
            <div className="flex items-center justify-between px-1.5 py-1.5">
              <span className="text-sm text-fg-400">Points</span>
              <span className="text-sm font-semibold tabular-nums text-fg-base">
                {user.points.toLocaleString()}
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <SignOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
