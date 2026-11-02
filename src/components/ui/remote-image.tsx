"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

export function RemoteImage({
  src,
  alt,
  size,
  fallback,
  className,
}: {
  src: string | undefined;
  alt: string;
  size: number;
  fallback: string | StaticImageData;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const isRemote = !!src;

  return (
    <div
      className={cn("relative overflow-hidden rounded-full", className)}
      style={{ width: size, height: size }}
    >
      <div
        className={cn(
          "absolute inset-0 animate-pulse rounded-full bg-fg-base/10 transition-opacity duration-200",
          loaded || !isRemote ? "opacity-0" : "opacity-100",
        )}
      />
      <Image
        src={src ?? fallback}
        alt={alt}
        width={size}
        height={size}
        className={cn(
          "rounded-full transition-opacity duration-200",
          isRemote && !loaded ? "opacity-0" : "opacity-100",
        )}
        unoptimized={isRemote}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
