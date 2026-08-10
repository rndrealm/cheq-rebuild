import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppRoutes } from "@/lib/routes";

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <p className="text-base text-fg-300">No bets yet.</p>
      <Link href={AppRoutes.createBet.path} className="cursor-pointer">
        <Button variant={"secondary"}>Create Your First Bet</Button>
      </Link>
    </div>
  );
}
