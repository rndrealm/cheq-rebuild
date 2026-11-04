import { binanceApiUrl, toBinanceSymbol } from "./tokens";

type PriceResult = {
  price: number | null;
  source: "binance";
};

export async function fetchPrice(symbol: string): Promise<PriceResult> {
  const binanceSymbol = toBinanceSymbol(symbol);
  const url = binanceApiUrl(`/api/v3/ticker/price?symbol=${binanceSymbol}`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[fetchPrice] Binance API error for ${binanceSymbol}: ${res.status} ${res.statusText}`,
        body,
      );
      return { price: null, source: "binance" };
    }
    const data = await res.json();
    const price = parseFloat(data.price);
    if (isNaN(price)) {
      console.error(
        `[fetchPrice] Failed to parse price for ${binanceSymbol}:`,
        data,
      );
      return { price: null, source: "binance" };
    }
    return { price, source: "binance" };
  } catch (err) {
    console.error(
      `[fetchPrice] Network error for ${binanceSymbol}:`,
      err,
    );
    return { price: null, source: "binance" };
  }
}

// Current prices for several tokens, keyed by our symbol ("BTC"). One batched
// Binance call; if that fails (e.g. a host without `symbols` support, or one
// unlisted pair failing the whole batch) falls back to one call per token.
// Tokens whose price can't be fetched are left out.
export async function fetchPrices(
  symbols: string[],
): Promise<Record<string, number>> {
  const unique = [...new Set(symbols)];
  if (unique.length === 0) return {};

  const bySymbol = new Map(unique.map((s) => [toBinanceSymbol(s), s]));
  try {
    const param = encodeURIComponent(JSON.stringify([...bySymbol.keys()]));
    const res = await fetch(binanceApiUrl(`/api/v3/ticker/price?symbols=${param}`));
    if (res.ok) {
      const data: unknown = await res.json();
      if (Array.isArray(data)) {
        const prices: Record<string, number> = {};
        for (const row of data) {
          const symbol = bySymbol.get(row?.symbol);
          const price = parseFloat(row?.price);
          if (symbol && !isNaN(price)) prices[symbol] = price;
        }
        return prices;
      }
    }
  } catch {
    // Fall through to per-token requests.
  }

  const prices: Record<string, number> = {};
  const results = await Promise.all(unique.map((s) => fetchPrice(s)));
  unique.forEach((s, i) => {
    const price = results[i].price;
    if (price !== null) prices[s] = price;
  });
  return prices;
}

export async function fetchPriceWithRetry(
  symbol: string,
  retries = 3,
): Promise<PriceResult> {
  for (let i = 0; i < retries; i++) {
    const result = await fetchPrice(symbol);
    if (result.price !== null) return result;
    if (i < retries - 1) {
      await new Promise((r) => setTimeout(r, (i + 1) * 60_000));
    }
  }
  return { price: null, source: "binance" };
}
