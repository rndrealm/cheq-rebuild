const DEXSCREENER_TO_DEXPAPRIKA: Record<string, string> = {
  zksyncera: "zksync",
  hyperliquid: "hyperevm",
};

function mapChain(dexScreenerChain: string): string {
  return DEXSCREENER_TO_DEXPAPRIKA[dexScreenerChain] ?? dexScreenerChain;
}

export type OHLCVCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type OHLCVInterval = "1h" | "6h" | "12h" | "24h";

export async function fetchOHLCV(
  pairAddress: string,
  chain: string,
  interval: OHLCVInterval = "1h",
): Promise<OHLCVCandle[]> {
  const network = mapChain(chain);
  const url = `https://api.dexpaprika.com/networks/${network}/pools/${pairAddress}/ohlcv?start=-24h&interval=${interval}&limit=100`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data.map((c: any) => ({
    time: Math.floor(new Date(c.time_open).getTime() / 1000),
    open: parseFloat(c.open) || 0,
    high: parseFloat(c.high) || 0,
    low: parseFloat(c.low) || 0,
    close: parseFloat(c.close) || 0,
    volume: parseFloat(c.volume) || 0,
  }));
}
