// Market data for our supported tokens: price and 24h stats from Binance's
// ticker/24hr endpoint. Fetched by the checkpoint poller every 30s and saved
// to the marketPrices table (see convex/market.ts), which the app reads.
import { binanceApiUrl, fetchBinance, toBinanceSymbol } from "./tokens";

export type MarketTicker = {
  symbol: string;
  price: number;
  // 24h change, % and absolute (Binance's rolling 24h window)
  priceChange24h: number;
  priceChangeAbs24h: number;
  open24h: number;
  high24h: number;
  low24h: number;
  // 24h volume in USDT
  volume: number;
};

const toNumber = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? Number(value)
    : NaN;

/**
 * Turns ticker/24hr rows into our tickers, keyed back to our symbols ("BTC").
 * Rows that aren't ours, or are missing a number, are dropped rather than
 * guessed at.
 */
export function parseTickers(data: unknown, symbols: string[]): MarketTicker[] {
  if (!Array.isArray(data)) return [];
  const bySymbol = new Map(symbols.map((s) => [toBinanceSymbol(s), s]));
  const tickers: MarketTicker[] = [];

  for (const row of data) {
    const symbol = bySymbol.get(row?.symbol);
    if (!symbol) continue;
    const ticker: MarketTicker = {
      symbol,
      price: toNumber(row.lastPrice),
      priceChange24h: toNumber(row.priceChangePercent),
      priceChangeAbs24h: toNumber(row.priceChange),
      open24h: toNumber(row.openPrice),
      high24h: toNumber(row.highPrice),
      low24h: toNumber(row.lowPrice),
      volume: toNumber(row.quoteVolume),
    };
    const numbers = Object.values(ticker).filter((v) => typeof v === "number");
    if (numbers.every((n) => Number.isFinite(n))) tickers.push(ticker);
  }

  return tickers;
}

/**
 * Tickers for these tokens. One filtered Binance call; if that fails (a host
 * without `symbols` support, or one delisted pair failing the whole batch),
 * one call per token. Tokens that can't be fetched are left out.
 */
export async function fetchMarketTickers(
  symbols: readonly string[],
): Promise<MarketTicker[]> {
  const unique = [...new Set(symbols)];
  if (unique.length === 0) return [];

  const param = encodeURIComponent(
    JSON.stringify(unique.map(toBinanceSymbol)),
  );
  const res = await fetchBinance(
    binanceApiUrl(`/api/v3/ticker/24hr?symbols=${param}`),
  );
  if (res?.ok) return parseTickers(await res.json(), unique);

  const single = await Promise.all(
    unique.map(async (symbol) => {
      const one = await fetchBinance(
        binanceApiUrl(`/api/v3/ticker/24hr?symbol=${toBinanceSymbol(symbol)}`),
      );
      return one?.ok ? parseTickers([await one.json()], [symbol]) : [];
    }),
  );
  return single.flat();
}
