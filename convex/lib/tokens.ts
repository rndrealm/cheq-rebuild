import { env } from "../_generated/server";

export const SUPPORTED_SYMBOLS = new Set([
  "BTC", "ETH", "BNB", "SOL", "XRP", "DOGE", "ADA", "TRX",
  "AVAX", "LINK", "TON", "SHIB", "SUI", "DOT", "XLM", "BCH",
  "HBAR", "UNI", "LTC", "NEAR", "APT", "ICP", "PEPE", "ETC",
  "RENDER", "FET", "AAVE", "STX", "IMX", "FIL", "ARB", "OP",
  "MKR", "INJ", "ATOM", "VET", "GRT", "ALGO", "FTM", "SEI",
  "RUNE", "FLOW", "MANA", "ENS", "SAND", "AXS", "GALA", "CRV",
  "WIF", "POL",
]);

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
