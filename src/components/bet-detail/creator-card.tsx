import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";
import type { StatusConfig } from "@/lib/helpers/bets";
import Image from "next/image";
import mainAssets from "@/lib/assets";

export function CreatorCard({
  name,
  username,
  wager,
  statusConfig,
  expressionIndex,
  colorIndex,
}: {
  name: string;
  username?: string;
  wager: number;
  statusConfig: StatusConfig;
  expressionIndex?: number;
  colorIndex?: number;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-border bg-card px-5.5 pb-7 pt-5.5">
      <div className="flex items-center justify-between">
        {/* <Avatar
          size={72}
          expressionIndex={expressionIndex}
          colorIndex={colorIndex}
        /> */}
        <Image
          src={mainAssets.avatarImage}
          alt="avatar"
          width={72}
          height={72}
        />
        <div
          className={cn(
            "relative flex items-center justify-center overflow-clip rounded-full border-[0.5px] border-solid px-4 py-1.75",
            statusConfig.border,
          )}
        >
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 rounded-full bg-linear-to-b",
              statusConfig.gradient,
            )}
          />
          <span
            className={cn(
              "relative text-caption! font-semibold leading-4",
              statusConfig.text,
              statusConfig.textShadow,
            )}
          >
            {wager} Points
          </span>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 rounded-[inherit]",
              statusConfig.insetShadow,
            )}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-fg-base">{name}</span>
        {username && (
          <span className="text-xs font-medium text-fg-300">@{username}</span>
        )}
      </div>
    </div>
  );
}
