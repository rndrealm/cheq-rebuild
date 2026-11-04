"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useConvexMutation } from "@/hooks/use-convex-mutation";
import { cn } from "@/lib/utils";

const springTap = { type: "spring" as const, stiffness: 500, damping: 30 };

function ActionButton({
  onClick,
  loading,
  variant = "primary",
  children,
}: {
  onClick: () => void;
  loading: boolean;
  variant?: "primary" | "outline" | "destructive";
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      disabled={loading}
      whileTap={{ scale: 0.97 }}
      transition={springTap}
      onClick={onClick}
      className={cn(
        "flex h-12 w-full shrink-0 items-center justify-center rounded-full text-caption! font-medium transition-none duration-300 disabled:pointer-events-none",
        variant === "primary" &&
          "bg-[#0B0B0B] text-card hover:opacity-90 active:opacity-80",
        variant === "outline" &&
          "bg-white text-[#0B0B0B] hover:bg-[#f5f5f5] active:bg-[#eee]",
        variant === "destructive" &&
          "bg-[#0B0B0B] text-card hover:opacity-90 active:opacity-80",
      )}
      style={{
        boxShadow:
          variant === "primary"
            ? "0px 2px 4px 0px #0B0B0B inset, 0px 2.5px 0px 0px #FFFFFFB2 inset"
            : "0px 0px 0px 1px rgba(0,0,0,0.11)",
      }}
    >
      {loading ? (
        <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        children
      )}
    </motion.button>
  );
}

export function BetActions({
  betId,
  canAccept,
  canDecline,
  canCancel,
  canRematch,
}: {
  betId: Id<"bets">;
  canAccept: boolean;
  canDecline: boolean;
  canCancel: boolean;
  canRematch: boolean;
}) {
  const router = useRouter();

  // Accepting is an action: it fetches the start price before the bet starts.
  const acceptBetAction = useAction(api.betActions.acceptBet);
  const [isAccepting, setIsAccepting] = useState(false);
  const acceptBet = async (args: { betId: Id<"bets"> }) => {
    setIsAccepting(true);
    try {
      await acceptBetAction(args);
    } finally {
      setIsAccepting(false);
    }
  };
  const { mutate: declineBet, isPending: isDeclining } = useConvexMutation(
    api.bets.decline,
  );
  const { mutate: cancelBet, isPending: isCancelling } = useConvexMutation(
    api.bets.cancel,
  );
  const { mutate: rematchBet, isPending: isRematching } = useConvexMutation(
    api.bets.rematch,
  );

  return (
    <div className="flex flex-col gap-2">
      {canAccept && (
        <ActionButton
          loading={isAccepting}
          onClick={() => acceptBet({ betId })}
        >
          Accept Challenge
        </ActionButton>
      )}
      {canDecline && (
        <ActionButton
          variant="outline"
          loading={isDeclining}
          onClick={() => declineBet({ betId })}
        >
          Decline
        </ActionButton>
      )}
      {canCancel && (
        <ActionButton
          variant="destructive"
          loading={isCancelling}
          onClick={() => cancelBet({ betId })}
        >
          Cancel Bet
        </ActionButton>
      )}
      {canRematch && (
        <ActionButton
          loading={isRematching}
          onClick={async () => {
            const newBetId = await rematchBet({ betId });
            if (newBetId) router.push(`/bet/${newBetId}`);
          }}
        >
          Rematch
        </ActionButton>
      )}
    </div>
  );
}
