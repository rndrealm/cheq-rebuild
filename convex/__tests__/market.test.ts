import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { api, internal } from "../_generated/api";
import { modules } from "../test.setup";
import { parseTickers, type MarketTicker } from "../lib/market";

const row = (symbol: string, overrides: Record<string, string> = {}) => ({
  symbol,
  lastPrice: "100.5",
  priceChangePercent: "-1.25",
  priceChange: "-1.27",
  openPrice: "101.77",
  highPrice: "103",
  lowPrice: "99",
  quoteVolume: "123456.7",
  ...overrides,
});

const ticker = (symbol: string, price = 100): MarketTicker => ({
  symbol,
  price,
  priceChange24h: 1,
  priceChangeAbs24h: 1,
  open24h: 99,
  high24h: 101,
  low24h: 98,
  volume: 1000,
});

describe("parseTickers", () => {
  test("maps Binance pairs back to our symbols", () => {
    expect(parseTickers([row("BTCUSDT")], ["BTC"])).toEqual([
      {
        symbol: "BTC",
        price: 100.5,
        priceChange24h: -1.25,
        priceChangeAbs24h: -1.27,
        open24h: 101.77,
        high24h: 103,
        low24h: 99,
        volume: 123456.7,
      },
    ]);
  });

  test("drops pairs we didn't ask for", () => {
    expect(parseTickers([row("XYZUSDT")], ["BTC"])).toEqual([]);
  });

  test("drops rows with a missing number instead of treating it as 0", () => {
    const missing = row("BTCUSDT");
    delete (missing as Partial<typeof missing>).priceChangePercent;
    expect(parseTickers([missing], ["BTC"])).toEqual([]);
  });

  test("returns nothing for a non-array response", () => {
    expect(parseTickers({ code: -1121 }, ["BTC"])).toEqual([]);
  });
});

describe("market snapshot", () => {
  test("saves one row per token and updates it in place", async () => {
    const t = convexTest({ schema, modules });

    expect(
      await t.mutation(internal.market.saveSnapshot, {
        tickers: [ticker("BTC"), ticker("ETH")],
      }),
    ).toBe(2);
    expect(
      await t.mutation(internal.market.saveSnapshot, {
        tickers: [ticker("BTC", 105)],
      }),
    ).toBe(1);

    const rows = await t.query(api.market.snapshot, {});
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.symbol === "BTC")?.price).toBe(105);
  });

  test("doesn't rewrite a row that hasn't changed", async () => {
    const t = convexTest({ schema, modules });
    await t.mutation(internal.market.saveSnapshot, { tickers: [ticker("BTC")] });
    expect(
      await t.mutation(internal.market.saveSnapshot, {
        tickers: [ticker("BTC")],
      }),
    ).toBe(0);
  });
});
