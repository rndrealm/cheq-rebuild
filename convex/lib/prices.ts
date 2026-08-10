type PriceResult = {
  price: number | null;
  source: "dexscreener" | "geckoterminal";
};

export async function fetchPrice(
  pairAddress: string,
  chain: string,
): Promise<PriceResult> {
  const dex = await fetchDexScreener(pairAddress, chain);
  if (dex !== null) {
    return { price: dex, source: "dexscreener" };
  }

  const gecko = await fetchGeckoTerminal(pairAddress, chain);
  if (gecko !== null) {
    return { price: gecko, source: "geckoterminal" };
  }

  return { price: null, source: "dexscreener" };
}

export async function fetchPriceWithRetry(
  pairAddress: string,
  chain: string,
  retries = 3,
): Promise<PriceResult> {
  for (let i = 0; i < retries; i++) {
    const result = await fetchPrice(pairAddress, chain);
    if (result.price !== null) return result;
    if (i < retries - 1) {
      await new Promise((r) => setTimeout(r, (i + 1) * 60_000));
    }
  }
  return { price: null, source: "dexscreener" };
}

async function fetchDexScreener(pairAddress: string, chain = "solana"): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairAddress}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const price = parseFloat(data?.pair?.priceUsd);
    return isNaN(price) ? null : price;
  } catch {
    return null;
  }
}

async function fetchGeckoTerminal(
  pairAddress: string,
  chain: string,
): Promise<number | null> {
  try {
    const network = chain === "solana" ? "solana" : chain;
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${pairAddress}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const price = parseFloat(
      data?.data?.attributes?.base_token_price_usd,
    );
    return isNaN(price) ? null : price;
  } catch {
    return null;
  }
}

export function pricesDisagree(
  priceA: number,
  priceB: number,
  threshold = 0.05,
): boolean {
  const diff = Math.abs(priceA - priceB) / Math.max(priceA, priceB);
  return diff > threshold;
}
