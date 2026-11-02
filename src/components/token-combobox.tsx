"use client";

import * as React from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { RemoteImage } from "@/components/ui/remote-image";
import { CoinImage } from "@/components/ui/coin-image";
import { TOKENS, getTokenImage, getTokenName } from "@/lib/constants/tokens";
import { formatPrice } from "@/lib/helpers/format";
import { WipeReveal } from "@/components/ui/wipe-reveal";

export type TokenValue = {
  symbol: string;
};

type TokenPriceData = { price: number; priceChange24h: number };
type PriceMap = Record<string, TokenPriceData>;

const TOKEN_FALLBACK = "/media/token-placeholder.svg";

const allSymbols = Object.keys(TOKENS);

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
                ? "text-[#47a95e]"
                : "text-destructive",
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

// DEMO: fake loading delay for initial list and search — remove before launch
const FAKE_INITIAL_DELAY = 800;
const FAKE_SEARCH_DELAY = 400;
const SKELETON_ROW_COUNT = 6;

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 rounded-[10px] px-2 py-2.25"
        >
          <span className="size-5 shrink-0 animate-pulse rounded-full bg-bg-300" />
          <div className="flex flex-1 items-center justify-between">
            <span className="h-3.5 w-24 animate-pulse rounded bg-bg-300" />
            <span className="h-3.5 w-20 animate-pulse rounded bg-bg-300" />
          </div>
        </div>
      ))}
    </>
  );
}

export function TokenCombobox({
  value,
  onSelect,
  onBlur,
  placeholder = "Search token...",
  triggerClassName,
  triggerStyle,
}: {
  value: TokenValue | null;
  onSelect: (token: TokenValue | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [prices, setPrices] = React.useState<PriceMap>({});
  // DEMO: fake loading states — remove before launch
  const [initialLoading, setInitialLoading] = React.useState(false);
  const [searchLoading, setSearchLoading] = React.useState(false);

  const getAllPrices = useAction(api.tokens.getAllPrices);
  const fetchedRef = React.useRef(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // DEMO: wait for both fake delay AND prices before revealing — remove before launch
  React.useEffect(() => {
    if (open && !fetchedRef.current) {
      fetchedRef.current = true;
      setInitialLoading(true);
      let timerDone = false;
      let pricesDone = false;
      const tryReveal = () => {
        if (timerDone && pricesDone) setInitialLoading(false);
      };
      const timer = setTimeout(() => {
        timerDone = true;
        tryReveal();
      }, FAKE_INITIAL_DELAY);
      getAllPrices({})
        .then((p) => {
          setPrices(p);
          pricesDone = true;
          tryReveal();
        })
        .catch(() => {
          pricesDone = true;
          tryReveal();
        });
      return () => clearTimeout(timer);
    }
  }, [open, getAllPrices]);

  // DEMO: fake search loading — remove before launch
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleQueryChange = React.useCallback((val: string) => {
    setQuery(val);
    clearTimeout(searchTimerRef.current);
    if (val) {
      setSearchLoading(true);
      searchTimerRef.current = setTimeout(
        () => setSearchLoading(false),
        FAKE_SEARCH_DELAY,
      );
    } else {
      setSearchLoading(false);
    }
  }, []);

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
            onChange={(e) => handleQueryChange(e.target.value)}
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
        <div className="absolute left-0 top-full z-50 mt-2 w-[281px] overflow-hidden rounded-[10px] bg-white shadow-[0_0_0_1px_#0000000A,0_4px_14px_0_#00000014]">
          {/* DEMO: search loading bar — remove before launch */}
          {searchLoading && (
            <div className="h-0.5 w-full overflow-hidden bg-[#E8E8FF]">
              <div className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] bg-[#9391F7]" />
            </div>
          )}
          <div className="max-h-48.5 overflow-y-auto p-2">
            {/* DEMO: WipeReveal skeleton transition — remove before launch */}
            <WipeReveal
              revealed={!initialLoading && !searchLoading}
              skeleton={<SkeletonRows />}
              className="bg-white"
            >
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
                    priceData={prices[symbol]}
                  />
                ))
              )}
            </WipeReveal>
          </div>
        </div>
      )}
    </div>
  );
}
