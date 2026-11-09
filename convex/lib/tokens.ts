import { env } from "../_generated/server";
import { SUPPORTED_TOKENS } from "./constants";

export const SUPPORTED_SYMBOLS: ReadonlySet<string> = new Set(SUPPORTED_TOKENS);

export function toBinanceSymbol(symbol: string): string {
  return `${symbol}USDT`;
}

const DEFAULT_BINANCE_API_BASE = "https://api.binance.us";

export function binanceApiUrl(path: string): string {
  const base = (env.BINANCE_API_BASE ?? DEFAULT_BINANCE_API_BASE).replace(
    /\/+$/,
    "",
  );
  return `${base}${path}`;
}

const BINANCE_ATTEMPTS = 3;
const BINANCE_RETRY_DELAY_MS = 250;

// Fetch that rides out brief network drops to Binance. Resolves to null if
// every attempt fails, so market data calls can report "no data" instead of
// throwing; callers treat that the same as a bad response.
export async function fetchBinance(url: string): Promise<Response | null> {
  for (let attempt = 1; attempt <= BINANCE_ATTEMPTS; attempt++) {
    try {
      return await fetch(url);
    } catch (err) {
      if (attempt === BINANCE_ATTEMPTS) {
        console.warn(`[fetchBinance] Gave up on ${url}:`, err);
        return null;
      }
      await new Promise((r) => setTimeout(r, BINANCE_RETRY_DELAY_MS * attempt));
    }
  }
  return null;
}
