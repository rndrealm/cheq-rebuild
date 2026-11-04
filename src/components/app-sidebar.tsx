"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Avatar } from "@/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/components/providers/user-provider";
import { EXPRESSIONS, COLORS } from "@/lib/avatar-shapes";
import { AppRoutes } from "@/lib/routes";
import {
  BetsIcon,
  HomeIcon,
  LandingAvatarIcon,
  PlusIcon,
  SignOutIcon,
} from "@/lib/svgs";
import { cn, simpleHash } from "@/lib/utils";

const NAV_ITEMS: {
  label: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactNode;
}[] = [
  { label: "Dashboard", href: AppRoutes.home.path, icon: HomeIcon },
  { label: "Bets", href: AppRoutes.feed.path, icon: BetsIcon },
  { label: "New bet", href: AppRoutes.createBet.path, icon: PlusIcon },
];

const TILE_CLASS =
  "flex items-center justify-center outline-none transition-[background-color,color,scale] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.96]";

/** Left-hand icon rail: logo, page nav, new bet, and the account menu. */
export function AppSidebar() {
  const user = useUser();
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-40 flex h-dvh w-20 shrink-0 flex-col items-center bg-gray-3 py-6">
      <Link
        href={AppRoutes.home.path}
        aria-label="cheq home"
        className="flex size-12 items-center justify-center"
      >
        <LandingAvatarIcon size={32} />
      </Link>

      {/* mt-22 puts the Home tile's top level with the dashboard's cards:
          pt-6 + 48px title row + mb-10 + h-9 heading row + gap-3 = 160px. */}
      <nav className="mt-22 flex flex-col items-center gap-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                TILE_CLASS,
                "h-9 w-[38px] rounded-[10px]",
                active
                  ? "bg-gray-5 text-fg-base"
                  : "text-gray-11 hover:bg-gray-4 hover:text-fg-base",
              )}
            >
              <Icon className="size-4.5" />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            className={cn(
              TILE_CLASS,
              "size-12 cursor-pointer rounded-[14px] bg-gray-4 hover:bg-gray-5",
            )}
          >
            <Avatar
              expressionIndex={simpleHash(user._id) % EXPRESSIONS.length}
              colorIndex={simpleHash(user._id + "c") % COLORS.length}
              size={32}
            />
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
