"use client"

import * as React from "react"
import { useAction } from "convex/react"
import { api } from "../../convex/_generated/api"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ChevronsUpDown } from "lucide-react"

type SearchToken = {
  address: string
  symbol: string
  name: string
  chain: string
  pairAddress: string
  priceUsd: number
  priceChange24h: number
  liquidity: number
}

export type TokenValue = {
  address: string
  symbol: string
  chain: string
  pairAddress: string
}

export function TokenCombobox({
  value,
  onSelect,
  onBlur,
  placeholder = "Search token...",
}: {
  value: TokenValue | null
  onSelect: (token: TokenValue | null) => void
  onBlur?: () => void
  placeholder?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchToken[]>([])
  const [loading, setLoading] = React.useState(false)
  const searchTokens = useAction(api.tokens.search)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(null)
  const requestIdRef = React.useRef(0)

  React.useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const id = ++requestIdRef.current
      setLoading(true)
      try {
        const res = await searchTokens({ query })
        if (id === requestIdRef.current) setResults(res ?? [])
      } catch {
        if (id === requestIdRef.current) setResults([])
      } finally {
        if (id === requestIdRef.current) setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, searchTokens])

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) onBlur?.()
      }}
    >
      <PopoverTrigger
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-[10px] border border-border bg-bg-200 px-3 text-sm font-medium",
          value ? "text-fg-base" : "text-fg-400"
        )}
      >
        {value ? value.symbol : placeholder}
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search tokens..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-fg-400">
                Searching...
              </div>
            ) : query.length < 2 ? (
              <div className="py-6 text-center text-sm text-fg-400">
                Type at least 2 characters
              </div>
            ) : (
              <>
                <CommandEmpty>No tokens found.</CommandEmpty>
                <CommandGroup>
                  {results.map((token) => (
                    <CommandItem
                      key={`${token.chain}-${token.pairAddress}`}
                      value={`${token.chain}-${token.pairAddress}`}
                      data-checked={
                        value?.pairAddress === token.pairAddress &&
                        value?.chain === token.chain
                      }
                      onSelect={() => {
                        onSelect({
                          address: token.address,
                          symbol: token.symbol,
                          chain: token.chain,
                          pairAddress: token.pairAddress,
                        })
                        setOpen(false)
                        setQuery("")
                      }}
                    >
                      <div className="flex flex-1 items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">
                              {token.symbol}
                            </span>
                            <span className="rounded bg-bg-300 px-1 py-0.5 text-[10px] font-medium text-fg-400">
                              {token.chain}
                            </span>
                          </div>
                          <span className="max-w-[140px] truncate text-xs text-fg-400">
                            {token.name}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-medium">
                            $
                            {token.priceUsd.toLocaleString(undefined, {
                              maximumFractionDigits: 6,
                            })}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-medium",
                              token.priceChange24h >= 0
                                ? "text-success"
                                : "text-destructive"
                            )}
                          >
                            {token.priceChange24h >= 0 ? "+" : ""}
                            {token.priceChange24h.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
