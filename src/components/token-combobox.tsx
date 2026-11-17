"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useMarket } from "@/hooks/use-market";
import Image from "next/image";
import { RemoteImage } from "@/components/ui/remote-image";
import { CoinImage } from "@/components/ui/coin-image";
import {
  TOKEN_SYMBOLS,
  getTokenImage,
  getTokenName,
} from "@/lib/constants/tokens";
import { formatPrice } from "@/lib/helpers/format";

export type TokenValue = {
  symbol: string;
};

type TokenPriceData = { price: number; priceChange24h: number };

const TOKEN_FALLBACK = "/media/token-placeholder.svg";

const allSymbols = TOKEN_SYMBOLS;

function TokenIcon({ src, size = 20 }: { src?: string; size?: number }) {
  return (
    <RemoteImage
      src={src}
      alt=""
      size={size}
      fallback={TOKEN_FALLBACK}
      className="shrink-0"
    />
  );
}

function TokenRow({
  symbol,
  selected,
  onSelect,
  priceData,
}: {
  symbol: string;
  selected: boolean;
  onSelect: () => void;
  priceData?: TokenPriceData;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between rounded-[10px] px-2 py-2.25 text-left transition-colors hover:bg-[#f3f3f3]",
        selected && "bg-[#f3f3f3]",
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <TokenIcon src={getTokenImage(symbol)} size={20} />
        <span className="font-display text-caption font-medium leading-4 text-[#111]">
          {symbol}
        </span>
        <span className="truncate font-display text-caption leading-4 text-[#C2C2C2]">
          {getTokenName(symbol)}
        </span>
      </div>
      {priceData && (
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-display text-caption font-medium leading-4 text-[#111]">
            {formatPrice(priceData.price)}
          </span>
          <span
            className={cn(
              "font-display text-caption! font-medium leading-4",
              priceData.priceChange24h >= 0
                ? "text-price-up"
                : "text-price-down",
            )}
          >
            {priceData.priceChange24h >= 0 ? "+" : ""}
            {priceData.priceChange24h.toFixed(2)}%
          </span>
        </div>
      )}
    </button>
  );
}

export function TokenCombobox({
  value,
  onSelect,
  onBlur,
  placeholder = "Search token...",
  triggerClassName,
  triggerStyle,
  dropdownClassName,
}: {
  value: TokenValue | null;
  onSelect: (token: TokenValue | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  dropdownClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  // Live prices for the list; the token list itself is static.
  const market = useMarket();

  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);


  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
        onBlur?.();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onBlur]);

  const filtered = React.useMemo(() => {
    if (!query) return allSymbols;
    const q = query.toLowerCase();
    return allSymbols.filter(
      (s) =>
        s.toLowerCase().includes(q) ||
        getTokenName(s).toLowerCase().includes(q),
    );
  }, [query]);

  function selectToken(symbol: string) {
    onSelect({ symbol });
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Icon always mounted so FlipImage survives open/close */}
      <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2">
        <CoinImage
          src={value ? getTokenImage(value.symbol) : undefined}
          fallback={TOKEN_FALLBACK}
          size={20}
          className="shrink-0"
        />
      </div>

      {open ? (
        <div
          className={cn(
            "flex h-10 w-full items-center gap-1.5 rounded-[10px] border border-border bg-bg-200 px-3 text-sm font-medium text-fg-base",
            triggerClassName,
          )}
          style={{ boxShadow: "0px 0px 0px 2px #9391F7", ...triggerStyle }}
        >
          <div className="size-5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tokens"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-caption placeholder:text-[#C2C2C2]"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                setQuery("");
                onBlur?.();
              }
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex h-10 w-full items-center gap-1.5 rounded-[10px] border border-border bg-bg-200 px-3 text-sm font-medium",
            value ? "text-fg-base" : "text-fg-400",
            triggerClassName,
          )}
          style={triggerStyle}
        >
          <div className="size-5 shrink-0" />
          <span className="flex-1 truncate pl-1 text-left text-caption">
            {value ? value.symbol : placeholder}
          </span>
          <Image
            src="/media/chevron-down.svg"
            alt=""
            width={14}
            height={14}
            className="size-3.5 shrink-0"
          />
        </button>
      )}

      {open && (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-2 w-[281px] overflow-hidden rounded-[10px] bg-white shadow-[0_0_0_1px_#0000000A,0_4px_14px_0_#00000014]",
            dropdownClassName,
          )}
        >
          <div className="max-h-48.5 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-fg-400">
                No tokens found.
              </div>
            ) : (
              filtered.map((symbol) => (
                <TokenRow
                  key={symbol}
                  symbol={symbol}
                  selected={value?.symbol === symbol}
                  onSelect={() => selectToken(symbol)}
                  priceData={market?.get(symbol)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
