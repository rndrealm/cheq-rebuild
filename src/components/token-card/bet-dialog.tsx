"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MIN_WAGER, MAX_WAGER } from "../../../convex/lib/constants";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { BlurText } from "@/components/ui/blur-text";
import { useOptionalUser } from "@/components/providers/user-provider";
import { DURATIONS } from "@/lib/constants/bets";
import { cn } from "@/lib/utils";

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

const INPUT_CLASS =
  "w-25 rounded-[7px] bg-[#f3f3f3] py-1.75 pl-2.75 pr-2 text-xs font-medium text-[#111] shadow-[0_0_0_1px_rgba(0,0,0,0.06)] outline-none placeholder:text-[#111]";

const BET_TYPE_OPTIONS: DropdownSelectOption[] = [
  { label: "Up/down", value: "up_down" },
  { label: "Over/under", value: "hit_price" },
];

const DIRECTION_OPTIONS_MAP: Record<string, DropdownSelectOption[]> = {
  up_down: [
    {
      label: "Up",
      value: "up",
      icon: "/media/arrow-up.svg",
      iconBg: "bg-[#f1fbf1]",
    },
    {
      label: "Down",
      value: "down",
      icon: "/media/arrow-down.svg",
      iconBg: "bg-[#ffeaeb]",
      iconRotation: "rotate-180",
    },
  ],
  hit_price: [
    {
      label: "Goes Over",
      value: "up",
      icon: "/media/arrow-up.svg",
      iconBg: "bg-[#f1fbf1]",
    },
    {
      label: "Goes Under",
      value: "down",
      icon: "/media/arrow-down.svg",
      iconBg: "bg-[#ffeaeb]",
      iconRotation: "rotate-180",
    },
  ],
};

const DURATION_OPTIONS: DropdownSelectOption[] = DURATIONS.map((d) => ({
  label: d.label,
  value: d.value,
}));

type BetType = "up_down" | "hit_price";
type Duration = (typeof DURATIONS)[number]["value"];

// Fixed row height so the panel height can be derived from the row count.
// Five rows (Over/under) is the most that fits inside the card.
const ROW_H = 40;
// Outer padding + gap + submit button + inner padding.
const PANEL_CHROME_H = 24 + 12 + 48 + 24;

export type BetDirection = "up" | "down" | null;

const DIRECTION_SENTIMENT: Record<string, BetDirection> = {
  up: "up",
  down: "down",
};

import type { TokenCardVariant } from "./index";

export function BetDialog({
  symbol,
  variant = "default",
  onClose,
  onDirectionChange,
}: {
  symbol: string;
  variant?: TokenCardVariant;
  onClose: () => void;
  onDirectionChange?: (direction: BetDirection) => void;
}) {
  const user = useOptionalUser();
  const createBet = useAction(api.betActions.createBet);

  const [betType, setBetType] = useState<BetType>("up_down");
  const [direction, setDirection] = useState("up");
  const [targetPrice, setTargetPrice] = useState("");
  const [duration, setDuration] = useState<Duration>("24h");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  // The hero card is a showcase, and public pages have no user: both stay fake.
  const isLive = variant !== "hero" && user !== null;

  const directionOptions =
    DIRECTION_OPTIONS_MAP[betType] ?? DIRECTION_OPTIONS_MAP["up_down"];
  const sentiment = DIRECTION_SENTIMENT[direction] ?? null;

  const wager = Number(amount);
  const target = Number(targetPrice);
  const maxWager = Math.min(MAX_WAGER, user?.points ?? MAX_WAGER);
  const isValid =
    !isLive ||
    (amount !== "" &&
      wager >= MIN_WAGER &&
      wager <= maxWager &&
      (betType !== "hit_price" || target > 0));

  const rowCount = betType === "hit_price" ? 5 : 4;
  const panelHeight = PANEL_CHROME_H + rowCount * ROW_H;

  async function handleSubmit() {
    if (status === "success") {
      onClose();
      return;
    }

    if (!isLive) {
      setStatus("loading");
      setTimeout(() => setStatus("success"), 3000);
      return;
    }

    setError(null);
    setStatus("loading");
    try {
      await createBet({
        type: betType,
        token: { symbol },
        betTerms:
          betType === "hit_price"
            ? { targetPrice: target, direction: direction as "up" | "down" }
            : { direction: direction as "up" | "down" },
        wager,
        duration,
      });
      setStatus("success");
    } catch {
      setError("Failed, try again");
      setStatus("idle");
    }
  }

  function handleBetTypeChange(value: string) {
    setBetType(value as BetType);
    const newDirection = DIRECTION_OPTIONS_MAP[value]?.[0]?.value ?? "up";
    setDirection(newDirection);
    onDirectionChange?.(DIRECTION_SENTIMENT[newDirection] ?? "up");
  }

  function handleDirectionChange(value: string) {
    setDirection(value);
    onDirectionChange?.(DIRECTION_SENTIMENT[value] ?? null);
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
        <motion.div
          initial={false}
          animate={{ height: panelHeight }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-3 overflow-hidden rounded-[22px] bg-[#f3f3f3] p-3"
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
              <div className="flex flex-col divide-y divide-border *:h-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-fg-base">
                    Bet Type
                  </span>
                  <DropdownSelect
                    value={betType}
                    options={BET_TYPE_OPTIONS}
                    onChange={handleBetTypeChange}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-fg-base">
                    Direction
                  </span>
                  <DropdownSelect
                    value={direction}
                    options={directionOptions}
                    onChange={handleDirectionChange}
                  />
                </div>

                {betType === "hit_price" && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-fg-base">
                      Target Price
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder="Enter price"
                      className={INPUT_CLASS}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-fg-base">
                    Timeframe
                  </span>
                  <DropdownSelect
                    value={duration}
                    options={DURATION_OPTIONS}
                    onChange={(v) => setDuration(v as Duration)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-fg-base">
                    Stake Amount
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={MIN_WAGER}
                    max={maxWager}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={isLive ? `${MIN_WAGER}–${maxWager}` : "Enter amount"}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Layer 2: Button */}
          <motion.button
            type="button"
            disabled={status === "loading" || (status === "idle" && !isValid)}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={handleSubmit}
            className={cn(
              "flex h-12 shrink-0 w-full items-center justify-center overflow-hidden rounded-full text-caption! font-medium text-card hover:opacity-90 active:opacity-80 disabled:pointer-events-none transition-none duration-300",
              variant === "hero"
                ? sentiment === "up"
                  ? "bg-[#00DD48]"
                  : "bg-[#FF5997]"
                : "bg-[#0B0B0B]",
            )}
            style={{
              boxShadow:
                variant === "hero"
                  ? sentiment === "up"
                    ? "0px 2px 0px 0px #00DD48 inset, 0px 3.5px 0px 0px #57F189 inset"
                    : "0px 2px 4px 0px #FF5997 inset, 0px 2.5px 0px 0px #FFF0F5 inset"
                  : "0px 2px 4px 0px #0B0B0B inset, 0px 2.5px 0px 0px #FFFFFFB2 inset",
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
              ) : error ? (
                <BlurText key="error" text={error} enterAsWhole exitAsWhole />
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
        </motion.div>
      </motion.div>
    </>
  );
}
