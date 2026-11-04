import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { AppRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <p className="text-sm font-medium text-gray-11">No bets yet.</p>
      <Link
        href={AppRoutes.createBet.path}
        className={cn(
          buttonVariants({ variant: "secondary" }),
          // The page is gray-3 (same as --secondary), so step up to stay visible.
          "bg-gray-4 hover:bg-gray-5",
        )}
      >
        Create your first bet
      </Link>
    </div>
  );
}
