"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AppSidebar } from "@/components/app-sidebar";
import { PageSwitch } from "@/components/dashboard/page-switch";
import { useUser } from "@/components/providers/user-provider";

/** Shell for Home and Feed: the sidebar and switch button stay put between them. */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser();
  // Keeps your bets subscribed on Home, so the Feed carousel is ready the
  // moment the transition starts instead of arriving as a skeleton.
  useQuery(api.bets.feedForUser, { userId: user._id });
  // Same for market prices, so the ticker and chart stats are there the
  // moment Home remounts.
  useQuery(api.market.snapshot);

  return (
    <div className="relative flex flex-1 bg-card">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col px-8 pt-10 pb-6 font-geist">
        {children}
      </div>
      <PageSwitch />
    </div>
  );
}
