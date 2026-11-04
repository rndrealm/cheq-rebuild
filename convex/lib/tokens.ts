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
