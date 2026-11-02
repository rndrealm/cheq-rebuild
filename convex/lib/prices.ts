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
