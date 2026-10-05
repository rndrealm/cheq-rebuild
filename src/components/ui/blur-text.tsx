"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface BlurTextProps {
  text: string;
  className?: string;
  staggerIn?: number;
  staggerOut?: number;
  durationIn?: number;
  durationOut?: number;
  blurIn?: string;
  blurOut?: string;
  yIn?: number;
  yOut?: number;
  scaleIn?: number;
  animateOnMount?: boolean;
  exitAsWhole?: boolean;
  enterAsWhole?: boolean;
}

export function BlurText({
  text,
  className,
  staggerIn = 0.02,
  staggerOut = 0.015,
  durationIn = 0.15,
  durationOut = 0.15,
  blurIn = "6px",
  blurOut = "12px",
  yIn = 4,
  yOut = -8,
  scaleIn = 1,
  animateOnMount = true,
  exitAsWhole = false,
  enterAsWhole = false,
}: BlurTextProps) {
  if (enterAsWhole) {
    return (
      <motion.span
        className={cn("inline-flex", className)}
        initial={animateOnMount ? { opacity: 0, filter: `blur(${blurIn})`, y: yIn, scale: scaleIn } : false}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0, scale: 1 }}
        exit={{ opacity: 0, filter: `blur(${blurOut})`, y: yOut }}
        transition={{ duration: durationIn }}
      >
        {text}
      </motion.span>
    );
  }

  return (
    <motion.span
      className={cn("inline-flex", className)}
      initial={animateOnMount ? "hidden" : false}
      animate="visible"
      exit="exit"
      variants={{
        visible: {
          transition: { staggerChildren: staggerIn },
        },
        exit: exitAsWhole
          ? {
              opacity: 0,
              filter: `blur(${blurOut})`,
              y: yOut,
              transition: { duration: durationOut },
            }
          : {
              transition: { staggerChildren: staggerOut },
            },
      }}
    >
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          style={char === " " ? { width: "0.25em" } : undefined}
          variants={{
            hidden: {
              opacity: 0,
              filter: `blur(${blurIn})`,
              y: yIn,
              scale: scaleIn,
            },
            visible: {
              opacity: 1,
              filter: "blur(0px)",
              y: 0,
              scale: 1,
              transition: { duration: durationIn },
            },
            ...(!exitAsWhole && {
              exit: {
                opacity: 0,
                filter: `blur(${blurOut})`,
                y: yOut,
                transition: { duration: durationOut },
              },
            }),
          }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
