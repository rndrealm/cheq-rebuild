"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useAction } from "convex/react";
import { useUser } from "@/components/providers/user-provider";
import { api } from "../../../../convex/_generated/api";
import { AppRoutes } from "@/lib/routes";
import { FieldError } from "@/components/ui/form-field";
import { DurationPicker } from "@/components/duration-picker";
import { TokenCombobox, type TokenValue } from "@/components/token-combobox";
import {
  DropdownSelect,
  type DropdownSelectOption,
} from "@/components/ui/dropdown-select";

const ELLIPTIC_REVEAL_STYLES = `
  @property --reveal {
    syntax: '<percentage>';
    inherits: true;
    initial-value: 0%;
  }
  .elliptic-reveal {
    --reveal: 0%;
    mask-image: radial-gradient(
      ellipse 100% 100% at 50% 100%,
      black calc(var(--reveal) - 30%),
      transparent var(--reveal)
    );
    -webkit-mask-image: radial-gradient(
      ellipse 100% 100% at 50% 100%,
      black calc(var(--reveal) - 30%),
      transparent var(--reveal)
    );
    transition: --reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .elliptic-reveal[data-revealed="true"] {
    --reveal: 160%;
  }
`;

const MIN_WAGER = 10;
const MAX_WAGER = 500;

// Lets the "Position Opened" reveal (0.7s) finish before navigating away.
const REDIRECT_DELAY_MS = 1000;

const BET_TYPE_OPTIONS: DropdownSelectOption[] = [
  { label: "Up/Down", value: "up_down" },
  { label: "Over/Under", value: "hit_price" },
  { label: "Token vs Token", value: "token_vs_token" },
];

const DIRECTION_OPTIONS_MAP: Record<string, DropdownSelectOption[]> = {
  up_down: [
    {
      label: "Goes Up",
      value: "up",
      icon: "/media/arrow-up.svg",
      iconBg: "bg-[#f1fbf1]",
    },
    {
      label: "Goes Down",
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

const tokenSchema = z.object({
  symbol: z.string(),
});

const createBetSchema = z.object({
  token: tokenSchema.nullable(),
  type: z.enum(["up_down", "hit_price", "token_vs_token"]),
  direction: z.enum(["up", "down"]),
  targetPrice: z.number(),
  tokenB: tokenSchema.nullable(),
  creatorSide: z.enum(["tokenA", "tokenB"]),
  duration: z.enum(["1h", "4h", "24h", "3d", "1w"]),
  wager: z
    .number()
    .min(MIN_WAGER, `Min ${MIN_WAGER} pts`)
    .max(MAX_WAGER, `Max ${MAX_WAGER} pts`),
});

export default function CreateBetPage() {
  const user = useUser();
  const router = useRouter();
  const createBet = useAction(api.betActions.createBet);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      token: {
        symbol: "BTC",
      } as TokenValue | null,
      type: "up_down" as "up_down" | "hit_price" | "token_vs_token",
      direction: "up" as "up" | "down",
      targetPrice: 0,
      tokenB: null as TokenValue | null,
      creatorSide: "tokenA" as "tokenA" | "tokenB",
      duration: "24h" as "1h" | "4h" | "24h" | "3d" | "1w",
      wager: 50,
    },
    validators: {
      onChange: createBetSchema,
    },
    onSubmit: async ({ value }) => {
      if (!value.token) return;

      const betTerms: {
        direction?: "up" | "down";
        targetPrice?: number;
        creatorSide?: "tokenA" | "tokenB";
      } = {};

      if (value.type === "up_down") {
        betTerms.direction = value.direction;
      } else if (value.type === "hit_price") {
        betTerms.targetPrice = value.targetPrice;
      } else if (value.type === "token_vs_token") {
        betTerms.creatorSide = value.creatorSide;
      }

      setIsPending(true);
      try {
        await createBet({
          creatorId: user._id,
          type: value.type,
          token: value.token,
          tokenB:
            value.type === "token_vs_token" && value.tokenB
              ? value.tokenB
              : undefined,
          betTerms,
          wager: value.wager,
          duration: value.duration,
        });
        setIsSuccess(true);
        setTimeout(
          () => router.replace(AppRoutes.home.path),
          REDIRECT_DELAY_MS,
        );
      } finally {
        setIsPending(false);
      }
    },
  });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-79.25 items-center ">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4 rounded-[20px] bg-white px-7.5 pb-7 pt-5.5"
        style={{
          boxShadow: "0px 0px 0px 0.5px #0000000A, 0px 4px 24px 0px #0000000F",
        }}
      >
        <div className="flex flex-col">
          {/* Token */}
          <form.Field
            name="token"
            validators={{
              onChange: ({ value }) => (!value ? "Select a token" : undefined),
            }}
          >
            {(field) => (
              <div className="pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-semibold text-fg-base">
                    Token
                  </span>
                  <TokenCombobox
                    value={field.state.value}
                    onSelect={(token) => field.handleChange(token)}
                    onBlur={field.handleBlur}
                    placeholder="Select token"
                    triggerClassName="h-auto w-32 rounded-[10px] border-0 bg-[#f3f3f3] h-9.5  px-2 text-xs"
                  />
                </div>
                <FieldError field={field} />
              </div>
            )}
          </form.Field>

          {/* Bet Type */}
          <form.Field name="type">
            {(field) => (
              <div className="flex items-center justify-between pb-4">
                <span className="text-caption font-semibold text-fg-base">
                  Bet Type
                </span>
                <DropdownSelect
                  value={field.state.value}
                  options={BET_TYPE_OPTIONS}
                  triggerClassName="text-caption w-32 h-9.5 rounded-[10px]"
                  onChange={(v) =>
                    field.handleChange(
                      v as "up_down" | "hit_price" | "token_vs_token",
                    )
                  }
                />
              </div>
            )}
          </form.Field>

          {/* Conditional Bet Terms */}
          <form.Subscribe selector={(s) => s.values.type}>
            {(type) => (
              <>
                {(type === "up_down" || type === "hit_price") && (
                  <form.Field name="direction">
                    {(field) => (
                      <div className="flex items-center justify-between pb-4">
                        <span className="text-caption font-semibold text-fg-base">
                          Direction
                        </span>
                        <DropdownSelect
                          value={field.state.value}
                          triggerClassName="text-caption w-32 h-9.5 rounded-[10px]"
                          options={
                            DIRECTION_OPTIONS_MAP[type] ??
                            DIRECTION_OPTIONS_MAP["up_down"]
                          }
                          onChange={(v) =>
                            field.handleChange(v as "up" | "down")
                          }
                        />
                      </div>
                    )}
                  </form.Field>
                )}

                {type === "hit_price" && (
                  <form.Field name="targetPrice">
                    {(field) => (
                      <div className="pb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-fg-base">
                            Target Price
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={field.state.value || ""}
                            onChange={(e) =>
                              field.handleChange(Number(e.target.value))
                            }
                            onBlur={field.handleBlur}
                            placeholder="e.g. 100"
                            className="w-32 rounded-[10px] bg-[#f3f3f3] h-9.5 pl-2.75 pr-2 text-xs font-medium text-[#111] outline-none placeholder:text-[#111]"
                            style={{ boxShadow: "0px 0px 0px 1px #0000001C" }}
                          />
                        </div>
                        <FieldError field={field} />
                      </div>
                    )}
                  </form.Field>
                )}

                {type === "token_vs_token" && (
                  <>
                    <form.Field
                      name="tokenB"
                      validators={{
                        onChange: ({ value }) =>
                          !value ? "Select a second token" : undefined,
                      }}
                    >
                      {(field) => (
                        <div className="pb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-fg-base">
                              Second Token
                            </span>
                            <TokenCombobox
                              value={field.state.value}
                              onSelect={(token) => field.handleChange(token)}
                              onBlur={field.handleBlur}
                              placeholder="Select token"
                              triggerClassName="h-auto w-32 rounded-[10px] border-0 bg-[#f3f3f3] h-9 pl-2.75 pr-2 text-xs"
                            />
                          </div>
                          <FieldError field={field} />
                        </div>
                      )}
                    </form.Field>

                    <form.Field name="creatorSide">
                      {(field) => (
                        <div className="flex items-center justify-between pb-4">
                          <span className="text-xs font-semibold text-fg-base">
                            Your Pick
                          </span>
                          <form.Subscribe
                            selector={(s) => [s.values.token, s.values.tokenB]}
                          >
                            {([tokenA, tokenB]) => (
                              <DropdownSelect
                                triggerClassName="text-caption w-32 h-9.5 rounded-[10px]"
                                value={field.state.value}
                                options={[
                                  {
                                    label:
                                      (tokenA as TokenValue | null)?.symbol ??
                                      "Token A",
                                    value: "tokenA",
                                  },
                                  {
                                    label:
                                      (tokenB as TokenValue | null)?.symbol ??
                                      "Token B",
                                    value: "tokenB",
                                  },
                                ]}
                                onChange={(v) =>
                                  field.handleChange(v as "tokenA" | "tokenB")
                                }
                              />
                            )}
                          </form.Subscribe>
                        </div>
                      )}
                    </form.Field>
                  </>
                )}
              </>
            )}
          </form.Subscribe>

          {/* Timeframe */}
          <form.Field name="duration">
            {(field) => (
              <div className="flex items-center justify-between pb-4">
                <span className="text-caption font-semibold text-fg-base">
                  Timeframe
                </span>
                <DurationPicker
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              </div>
            )}
          </form.Field>

          {/* Stake Amount */}
          <form.Field name="wager">
            {(field) => (
              <div className="">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-semibold text-fg-base">
                    Stake Amount
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={MIN_WAGER}
                    max={Math.min(MAX_WAGER, user.points)}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    onBlur={field.handleBlur}
                    placeholder="Enter amount"
                    className="w-32 rounded-[10px] bg-[#f3f3f3] h-9.5 pl-2.75 pr-2 text-xs font-medium text-[#111] outline-none placeholder:text-[#111]"
                    style={{ boxShadow: "0px 0px 0px 1px #0000001C" }}
                  />
                </div>
                <FieldError field={field} />
              </div>
            )}
          </form.Field>
        </div>

        {/* Summary */}
        <form.Subscribe selector={(s) => s.values.wager}>
          {(wager) => (
            <div className="flex flex-col gap-4 border-t  border-border pt-4 text-sm tracking-[-0.112px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold leading-4 text-caption text-fg-base">
                  Total Stake
                </span>
                <span className="font-semibold leading-4 text-xs text-fg-base">
                  {wager} Points
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold leading-4 text-caption text-fg-base">
                  Reward Pool
                </span>
                <span className="font-semibold leading-4 text-xs text-fg-base">
                  {wager * 2} USD
                </span>
              </div>
            </div>
          )}
        </form.Subscribe>

        <p className="text-xs font-medium leading-4 text-hint">
          The point system translates 1:1 with the USD, 1 point is equal to 1
          USD
        </p>

        {/* Submit */}
        <div className="relative">
          <style>{ELLIPTIC_REVEAL_STYLES}</style>
          <form.Subscribe selector={(s) => s.canSubmit}>
            {(canSubmit) => (
              <button
                type="submit"
                disabled={!canSubmit || isPending || isSuccess}
                className="cursor-pointer flex h-12 w-full items-center justify-center rounded-full bg-[#0B0B0B] text-caption font-medium text-card hover:opacity-90 active:opacity-80 disabled:pointer-events-none disabled:opacity-50"
                style={{
                  boxShadow:
                    "0px 2px 4px 0px #0B0B0B inset, 0px 2.5px 0px 0px #FFFFFFB2 inset",
                }}
              >
                {isPending ? (
                  <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  "Open New Position"
                )}
              </button>
            )}
          </form.Subscribe>
          <div
            className="elliptic-reveal pointer-events-none absolute inset-0"
            data-revealed={isSuccess}
          >
            <div
              className="flex h-12 w-full items-center justify-center rounded-full bg-[#00DD48] text-caption font-medium text-white"
              style={{
                boxShadow:
                  "0px 2px 0px 0px #00DD48 inset, 0px 3.5px 0px 0px #57F189 inset",
              }}
            >
              Position Opened
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
