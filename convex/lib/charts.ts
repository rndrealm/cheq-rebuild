import { binanceApiUrl, toBinanceSymbol } from "./tokens";

export type OHLCVCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type OHLCVInterval = "1h" | "4h" | "1d";

export async function fetchOHLCV(
  symbol: string,
  interval: OHLCVInterval = "1h",
  limit = 100,
): Promise<OHLCVCandle[]> {
  const res = await fetch(
    binanceApiUrl(
      `/api/v3/klines?symbol=${toBinanceSymbol(symbol)}&interval=${interval}&limit=${limit}`,
    ),
  );
  if (!res.ok) return [];

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data.map((c: number[]) => ({
    time: Math.floor(c[0] / 1000),
    open: parseFloat(String(c[1])),
    high: parseFloat(String(c[2])),
    low: parseFloat(String(c[3])),
    close: parseFloat(String(c[4])),
    volume: parseFloat(String(c[5])),
  }));
}
