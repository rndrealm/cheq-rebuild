"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
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
  ChevronDownIcon,
  LandingAvatarIcon,
  PlusIcon,
  SignOutIcon,
} from "@/lib/svgs";
import { cn, simpleHash } from "@/lib/utils";

const MotionLink = motion.create(Link);

const NAV_ITEMS = [
  { label: "Dashboard", href: AppRoutes.home.path },
  { label: "Feed", href: AppRoutes.feed.path },
];

export function AppHeader() {
  const user = useUser();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-card">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-4 px-6">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-8 lg:gap-16">
          <Link
            href={AppRoutes.home.path}
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-fg-base"
          >
            <LandingAvatarIcon size={28} />
            cheq
          </Link>

          <nav className="flex items-center gap-5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    active ? "text-fg-base" : "text-fg-400 hover:text-fg-base",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: new bet + account */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Matches the bet dialog's submit button (default variant). */}
          <MotionLink
            href={AppRoutes.createBet.path}
            aria-label="New bet"
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="flex h-10 items-center justify-center gap-1 rounded-[10px] bg-[#0B0B0B] pr-4 pl-3 text-caption font-medium text-card shadow-[inset_0px_2px_4px_0px_#0B0B0B,inset_0px_2.5px_0px_0px_#FFFFFFB2] outline-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 active:opacity-80"
          >
            <PlusIcon className="size-5" />
            <span className="hidden sm:inline">New bet</span>
          </MotionLink>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Account menu"
              className="flex cursor-pointer items-center gap-1 rounded-[10px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="flex size-10 items-center justify-center rounded-[10px] bg-bg-300">
                <Avatar
                  expressionIndex={simpleHash(user._id) % EXPRESSIONS.length}
                  colorIndex={simpleHash(user._id + "c") % COLORS.length}
                  size={30}
                />
              </span>
              <ChevronDownIcon className="size-6 text-fg-base" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56">
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
      </div>
    </header>
  );
}
