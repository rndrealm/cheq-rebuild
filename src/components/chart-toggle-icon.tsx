"use client";

import { motion } from "motion/react";

type ChartToggleIconProps = {
  className?: string;
  layoutId?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export function ChartToggleIcon({
  className,
  layoutId,
  onClick,
}: ChartToggleIconProps) {
  const svg = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      onClick={onClick}
    >
      <rect width="32" height="32" rx="16" fill="#F3F3F3" />
      <path
        d="M-1 20.9091L2.915 14.4228C3.973 12.6705 5.631 11.3618 7.581 10.7401L8.032 10.5961C8.563 10.427 9.116 10.3409 9.673 10.3409C11.77 10.3409 13.678 11.5545 14.566 13.454L18.488 21.8398C18.93 22.7846 19.667 23.5601 20.588 24.0496C21.732 24.6573 23.073 24.7782 24.307 24.3847L24.588 24.2951C26.519 23.6794 27.956 22.0532 28.33 20.061L29.889 11.7515C30.08 10.7359 30.967 10 32 10"
        stroke="#A6A6A6"
        strokeWidth="2"
      />
    </svg>
  );

  if (layoutId) {
    return <motion.div layoutId={layoutId}>{svg}</motion.div>;
  }

  return svg;
}
