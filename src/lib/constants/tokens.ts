export type TokenInfo = {
  name: string;
  image: string;
};

export const TOKENS: Record<string, TokenInfo> = {
  BTC: { name: "Bitcoin", image: "/media/tokens/btc.png" },
  ETH: { name: "Ethereum", image: "/media/tokens/eth.png" },
  BNB: { name: "BNB", image: "/media/tokens/bnb.png" },
  SOL: { name: "Solana", image: "/media/tokens/sol.png" },
  XRP: { name: "XRP", image: "/media/tokens/xrp.png" },
  DOGE: { name: "Dogecoin", image: "/media/tokens/doge.png" },
  ADA: { name: "Cardano", image: "/media/tokens/ada.png" },
  TRX: { name: "TRON", image: "/media/tokens/trx.png" },
  AVAX: { name: "Avalanche", image: "/media/tokens/avax.png" },
  LINK: { name: "Chainlink", image: "/media/tokens/link.png" },
  TON: { name: "Toncoin", image: "/media/tokens/ton.png" },
  SHIB: { name: "Shiba Inu", image: "/media/tokens/shib.png" },
  SUI: { name: "Sui", image: "/media/tokens/sui.png" },
  DOT: { name: "Polkadot", image: "/media/tokens/dot.png" },
  XLM: { name: "Stellar", image: "/media/tokens/xlm.png" },
  BCH: { name: "Bitcoin Cash", image: "/media/tokens/bch.png" },
  HBAR: { name: "Hedera", image: "/media/tokens/hbar.png" },
  UNI: { name: "Uniswap", image: "/media/tokens/uni.png" },
  LTC: { name: "Litecoin", image: "/media/tokens/ltc.png" },
  NEAR: { name: "NEAR Protocol", image: "/media/tokens/near.png" },
  APT: { name: "Aptos", image: "/media/tokens/apt.png" },
  ICP: { name: "Internet Computer", image: "/media/tokens/icp.png" },
  PEPE: { name: "Pepe", image: "/media/tokens/pepe.png" },
  ETC: { name: "Ethereum Classic", image: "/media/tokens/etc.png" },
  RENDER: { name: "Render", image: "/media/tokens/render.png" },
  FET: { name: "Fetch.ai", image: "/media/tokens/fet.png" },
  AAVE: { name: "Aave", image: "/media/tokens/aave.png" },
  STX: { name: "Stacks", image: "/media/tokens/stx.png" },
  IMX: { name: "Immutable", image: "/media/tokens/imx.png" },
  FIL: { name: "Filecoin", image: "/media/tokens/fil.png" },
  ARB: { name: "Arbitrum", image: "/media/tokens/arb.png" },
  OP: { name: "Optimism", image: "/media/tokens/op.png" },
  MKR: { name: "Maker", image: "/media/tokens/mkr.png" },
  INJ: { name: "Injective", image: "/media/tokens/inj.png" },
  ATOM: { name: "Cosmos", image: "/media/tokens/atom.png" },
  VET: { name: "VeChain", image: "/media/tokens/vet.png" },
  GRT: { name: "The Graph", image: "/media/tokens/grt.png" },
  ALGO: { name: "Algorand", image: "/media/tokens/algo.png" },
  FTM: { name: "Fantom", image: "/media/tokens/ftm.png" },
  SEI: { name: "Sei", image: "/media/tokens/sei.png" },
  RUNE: { name: "THORChain", image: "/media/tokens/rune.png" },
  FLOW: { name: "Flow", image: "/media/tokens/flow.png" },
  MANA: { name: "Decentraland", image: "/media/tokens/mana.png" },
  ENS: { name: "ENS", image: "/media/tokens/ens.png" },
  SAND: { name: "The Sandbox", image: "/media/tokens/sand.png" },
  AXS: { name: "Axie Infinity", image: "/media/tokens/axs.png" },
  GALA: { name: "Gala", image: "/media/tokens/gala.png" },
  CRV: { name: "Curve DAO", image: "/media/tokens/crv.png" },
  WIF: { name: "dogwifhat", image: "/media/tokens/wif.png" },
  POL: { name: "Polygon", image: "/media/tokens/pol.png" },
};

export const TOKEN_SYMBOLS = Object.keys(TOKENS);

export function getTokenInfo(symbol: string): TokenInfo | undefined {
  return TOKENS[symbol];
}

export function getTokenImage(symbol: string): string {
  return TOKENS[symbol]?.image ?? "/media/token-placeholder.svg";
}

export function getTokenName(symbol: string): string {
  return TOKENS[symbol]?.name ?? symbol;
}
