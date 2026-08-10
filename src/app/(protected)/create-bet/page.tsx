"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useAction } from "convex/react";
import { useUser } from "@/components/providers/user-provider";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FieldError } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BET_TYPES, DURATIONS } from "@/lib/constants/bets";
import { TokenCombobox, type TokenValue } from "@/components/token-combobox";

const MIN_WAGER = 10;
const MAX_WAGER = 500;

const tokenSchema = z.object({
  address: z.string(),
  symbol: z.string(),
  chain: z.string(),
  pairAddress: z.string(),
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

  const form = useForm({
    defaultValues: {
      token: null as TokenValue | null,
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
        router.push("/");
      } finally {
        setIsPending(false);
      }
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-h2 font-bold text-fg-base">New Position</h1>
        <p className="text-caption text-fg-400">{user.points} pts available</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        {/* Token */}
        <form.Field
          name="token"
          validators={{
            onChange: ({ value }) => (!value ? "Select a token" : undefined),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label>Token or Memecoin</Label>
              <TokenCombobox
                value={field.state.value}
                onSelect={(token) => field.handleChange(token)}
                onBlur={field.handleBlur}
                placeholder="Search token..."
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>

        {/* Bet Type */}
        <form.Field name="type">
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label>Bet Type</Label>
              <div className="flex gap-2">
                {BET_TYPES.map((bt) => (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => field.handleChange(bt.value)}
                    className={cn(
                      "h-10 flex-1 rounded-[10px] border text-xs text-caption font-medium transition-colors",
                      field.state.value === bt.value
                        ? "border-fg-base bg-fg-base text-bg-base"
                        : "border-border bg-bg-200 text-fg-400 hover:bg-bg-300",
                    )}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form.Field>

        {/* Conditional Bet Terms */}
        <form.Subscribe selector={(s) => s.values.type}>
          {(type) => (
            <>
              {type === "up_down" && (
                <form.Field name="direction">
                  {(field) => (
                    <div className="flex flex-col gap-2">
                      <Label>Direction</Label>
                      <div className="flex gap-2">
                        {(["up", "down"] as const).map((dir) => (
                          <button
                            key={dir}
                            type="button"
                            onClick={() => field.handleChange(dir)}
                            className={cn(
                              "h-10 flex-1 rounded-[10px] border text-caption font-medium text-xs capitalize transition-colors",
                              field.state.value === dir
                                ? dir === "up"
                                  ? "border-success bg-success-light text-fg-base"
                                  : "border-destructive bg-destructive/10 text-destructive"
                                : "border-border bg-bg-200 text-fg-400 hover:bg-bg-300",
                            )}
                          >
                            {dir === "up" ? "Goes Up" : "Goes Down"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </form.Field>
              )}

              {type === "hit_price" && (
                <form.Field name="targetPrice">
                  {(field) => (
                    <FormField
                      field={field}
                      label="Target Price"
                      type="number"
                      placeholder="e.g. 100"
                      hint="Condition definitions can't be altered once bet is placed"
                    />
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
                      <div className="flex flex-col gap-2">
                        <Label>Second Token</Label>
                        <TokenCombobox
                          value={field.state.value}
                          onSelect={(token) => field.handleChange(token)}
                          onBlur={field.handleBlur}
                          placeholder="Search second token..."
                        />
                        <FieldError field={field} />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="creatorSide">
                    {(field) => (
                      <div className="flex flex-col gap-2">
                        <Label>Your Pick</Label>
                        <div className="flex gap-2">
                          <form.Subscribe
                            selector={(s) => [s.values.token, s.values.tokenB]}
                          >
                            {([tokenA, tokenB]) =>
                              (
                                [
                                  {
                                    value: "tokenA" as const,
                                    label:
                                      (tokenA as TokenValue | null)?.symbol ??
                                      "Token A",
                                  },
                                  {
                                    value: "tokenB" as const,
                                    label:
                                      (tokenB as TokenValue | null)?.symbol ??
                                      "Token B",
                                  },
                                ] as const
                              ).map((side) => (
                                <button
                                  key={side.value}
                                  type="button"
                                  onClick={() => field.handleChange(side.value)}
                                  className={cn(
                                    "h-10 flex-1 rounded-[10px] border text-caption font-semibold uppercase transition-colors",
                                    field.state.value === side.value
                                      ? "border-fg-base bg-fg-base text-bg-base"
                                      : "border-border bg-bg-200 text-fg-400 hover:bg-bg-300",
                                  )}
                                >
                                  {side.label}
                                </button>
                              ))
                            }
                          </form.Subscribe>
                        </div>
                      </div>
                    )}
                  </form.Field>
                </>
              )}
            </>
          )}
        </form.Subscribe>

        {/* Duration */}
        <form.Field name="duration">
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label>Timeframe</Label>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => field.handleChange(d.value)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md text-xs font-semibold transition-colors",
                      field.state.value === d.value
                        ? "bg-fg-base text-bg-base"
                        : "bg-bg-200 text-fg-300 hover:bg-bg-300",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form.Field>

        {/* Wager */}
        <form.Field name="wager">
          {(field) => (
            <FormField field={field} label="Stake Amount">
              <div className="flex items-center gap-4">
                <Input
                  id="wager"
                  type="number"
                  min={MIN_WAGER}
                  max={Math.min(MAX_WAGER, user.points)}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  onBlur={field.handleBlur}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  {[25, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() =>
                        field.handleChange(
                          Math.min(
                            Math.floor((user.points * pct) / 100),
                            MAX_WAGER,
                          ),
                        )
                      }
                      className="flex h-8 items-center justify-center rounded-md bg-bg-200 px-2 text-sm font-semibold text-fg-300 transition-colors hover:bg-bg-300"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </FormField>
          )}
        </form.Field>

        {/* Summary */}
        <form.Subscribe selector={(s) => s.values.wager}>
          {(wager) => (
            <div className="flex flex-col gap-2 text-sm tracking-[-0.112px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-fg-base">Total Stake</span>
                <span className="font-bold text-fg-base">{wager} pts</span>
              </div>
              <div className="border-t border-dashed border-border" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-fg-base">Reward Pool</span>
                <span className="font-bold text-fg-base">{wager * 2} pts</span>
              </div>
            </div>
          )}
        </form.Subscribe>

        {/* Submit */}
        <form.Subscribe selector={(s) => s.canSubmit}>
          {(canSubmit) => (
            <Button
              type="submit"
              size="lg"
              loading={isPending}
              disabled={!canSubmit}
              className="mt-2 rounded-[10px]"
            >
              Open New Position
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
