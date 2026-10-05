"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { BlurText } from "@/components/ui/blur-text";

import type { DropdownSelectOption } from "@/components/ui/dropdown-select";

function CheckCircleIcon() {
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
      <motion.circle
        cx="34"
        cy="34"
        r="28.33"
        fill="#6DCB72"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "34px 34px" }}
      />
      <motion.path
        d="M22 36.5 L29 43 L46 24"
        stroke="white"
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

const BET_TYPE_OPTIONS: DropdownSelectOption[] = [
  { label: "Up/down", value: "Up/down" },
  { label: "Over/under", value: "Over/under" },
];

const DIRECTION_OPTIONS_MAP: Record<string, DropdownSelectOption[]> = {
  "Up/down": [
    {
      label: "Up",
      value: "Up",
      icon: "/media/arrow-up.svg",
      iconBg: "bg-[#f1fbf1]",
    },
    {
      label: "Down",
      value: "Down",
      icon: "/media/arrow-down.svg",
      iconBg: "bg-[#ffeaeb]",
      iconRotation: "rotate-180",
    },
    {
      label: "Sideways",
      value: "Sideways",
      icon: "/media/arrow-sideways.svg",
      iconBg: "bg-[#cfc6ff]",
      iconRotation: "-rotate-90",
    },
  ],
  "Over/under": [
    {
      label: "Goes Over",
      value: "Goes Over",
      icon: "/media/arrow-up.svg",
      iconBg: "bg-[#f1fbf1]",
    },
    {
      label: "Goes Under",
      value: "Goes Under",
      icon: "/media/arrow-down.svg",
      iconBg: "bg-[#ffeaeb]",
      iconRotation: "rotate-180",
    },
  ],
};

export function BetDialog({ onClose }: { onClose: () => void }) {
  const [betType, setBetType] = useState("Up/down");
  const [direction, setDirection] = useState("Up");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const directionOptions =
    DIRECTION_OPTIONS_MAP[betType] ?? DIRECTION_OPTIONS_MAP["Up/down"];

  function handleBetTypeChange(value: string) {
    setBetType(value);
    setDirection(DIRECTION_OPTIONS_MAP[value]?.[0]?.value ?? "Up");
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-10"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="absolute inset-x-5.5 bottom-21 z-20"
      >
        <div
          className="flex h-61 flex-col gap-3 overflow-hidden rounded-[22px] bg-[#f3f3f3] p-3"
          style={{
            boxShadow:
              "0px 0px 0px 1px #00000014, 0px 6px 34px -7px #00000040, 0px 4px 20px 0px #00000014",
          }}
        >
          {status === "success" ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
              <motion.div
                initial={{
                  opacity: 0,
                  filter: "blur(10px)",
                  rotate: 180,
                  y: -8,
                }}
                animate={{ opacity: 1, filter: "blur(0px)", rotate: 0, y: 0 }}
                transition={{
                  duration: 0.45,
                  ease: [0.16, 1, 0.3, 1],
                  rotate: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                  y: {
                    duration: 0.8,
                    delay: 0.15,
                    ease: [0.34, 1.56, 0.64, 1],
                  },
                }}
              >
                <CheckCircleIcon />
              </motion.div>
              <BlurText
                text="Position Opened"
                className="text-caption! font-semibold text-[#111]"
                staggerIn={0.01}
                durationIn={0.25}
                blurIn="3px"
                yIn={2}
                scaleIn={1}
              />
            </div>
          ) : (
            <div
              className="min-h-0 flex-1 rounded-2xl bg-white p-3"
              style={{
                boxShadow:
                  "0px 0px 0px 0.5px #0000000A, 0px 4px 24px 0px #0000000F",
              }}
            >
              <div className="flex flex-col divide-y divide-border">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-semibold text-fg-base">
                    Bet Type
                  </span>
                  <DropdownSelect
                    value={betType}
                    options={BET_TYPE_OPTIONS}
                    onChange={handleBetTypeChange}
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-xs font-semibold text-fg-base">
                    Direction
                  </span>
                  <DropdownSelect
                    value={direction}
                    options={directionOptions}
                    onChange={setDirection}
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-xs font-semibold text-fg-base">
                    Stake Amount
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-25 rounded-[7px] bg-[#f3f3f3] py-1.75 pl-2.75 pr-2 text-xs font-medium text-[#111] shadow-[0_0_0_1px_rgba(0,0,0,0.06)] outline-none placeholder:text-[#111]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Layer 2: Button */}
          <motion.button
            type="button"
            disabled={status === "loading"}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={() => {
              if (status === "success") {
                onClose();
                return;
              }
              setStatus("loading");
              setTimeout(() => setStatus("success"), 3000);
            }}
            className="flex h-12 shrink-0 w-full items-center justify-center overflow-hidden rounded-full bg-foreground text-caption font-medium text-card hover:opacity-90 active:opacity-80 disabled:pointer-events-none"
            style={{
              boxShadow:
                "0px 2px 4px 0px #0B0B0B inset, 0px 2.5px 0px 0px rgba(255, 255, 255, 0.70) inset",
            }}
          >
            <AnimatePresence mode="wait">
              {status === "loading" ? (
                <motion.div
                  key="spinner"
                  initial={{ opacity: 0, filter: "blur(6px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{
                    opacity: 0,
                    filter: "blur(4px)",
                    y: 8,
                    transition: { duration: 0.2 },
                  }}
                  transition={{ duration: 0.2 }}
                  className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                />
              ) : status === "success" ? (
                <BlurText key="continue" text="Continue" enterAsWhole />
              ) : (
                <BlurText
                  key="open"
                  text="Open New Position"
                  animateOnMount={false}
                  exitAsWhole
                />
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
