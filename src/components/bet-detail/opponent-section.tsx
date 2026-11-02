import { Avatar } from "@/components/avatar";
import mainAssets from "@/lib/assets";
import { EXPRESSIONS, COLORS } from "@/lib/avatar-shapes";
import { simpleHash } from "@/lib/utils";
import Image from "next/image";

export function OpponentSection({
  opponent,
  isCreator,
}: {
  opponent: { id: string; name: string; username: string } | null;
  isCreator: boolean;
}) {
  if (opponent) {
    return (
      <div className="flex items-center gap-3 rounded-[20px] border border-border bg-card px-4 py-4">
        {/* <Avatar
          size={32}
          expressionIndex={simpleHash(opponent.id) % EXPRESSIONS.length}
          colorIndex={simpleHash(opponent.id + "c") % COLORS.length}
        /> */}
        <Image
          src={mainAssets.opponentImage}
          alt="avatar"
          width={32}
          height={32}
        />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-fg-base">
            {opponent.name}
          </span>
          <span className="text-xs font-semibold text-fg-300">
            @{opponent.username}
          </span>
        </div>
        <span className="ml-auto text-xs font-semibold text-fg-400">
          Opponent
        </span>
      </div>
    );
  }

  if (isCreator) {
    return (
      <div className="flex items-center justify-center rounded-[20px] bg-white px-4 py-4">
        <span className="text-sm font-semibold text-fg-300">
          Waiting For an Opponent
        </span>
      </div>
    );
  }

  return null;
}
