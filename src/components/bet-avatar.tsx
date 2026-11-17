import Image from "next/image";
import { cn, simpleHash } from "@/lib/utils";

const AVATAR_IMAGES = [
  "/media/demo/kurosawa.jpg",
  "/media/demo/mf-doom.jpg",
  "/media/avatar.png",
];

/** A player's picture on bet cards, stable per player. Placeholder images. */
export function BetAvatar({
  seed,
  size = 48,
  className,
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={AVATAR_IMAGES[simpleHash(seed) % AVATAR_IMAGES.length]}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full bg-[#f3f3f3] object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}
