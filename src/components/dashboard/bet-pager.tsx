import { ChevronDownIcon } from "@/lib/svgs";

const STEP_CLASS =
  "relative flex size-8 cursor-pointer items-center justify-center rounded-full transition-[background-color,scale] duration-150 ease-out after:absolute after:-inset-1 after:content-[''] hover:bg-bg-400 active:scale-[0.96]";

/** Back / "1 / 3" / next pill for flipping between live bets. Wraps at both ends. */
export function BetPager({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (index: number) => void;
}) {
  return (
    <div className="absolute top-5.5 right-5.5 z-10 flex h-8 items-center rounded-full bg-bg-300 text-xs font-semibold tabular-nums text-fg-base">
      <button
        type="button"
        onClick={() => onChange((current - 1 + total) % total)}
        aria-label={`Show previous bet (${current + 1} of ${total})`}
        className={STEP_CLASS}
      >
        <ChevronDownIcon className="size-5 rotate-90" />
      </button>
      <span aria-hidden>
        {current + 1} / {total}
      </span>
      <button
        type="button"
        onClick={() => onChange((current + 1) % total)}
        aria-label={`Show next bet (${current + 1} of ${total})`}
        className={STEP_CLASS}
      >
        <ChevronDownIcon className="size-5 -rotate-90" />
      </button>
    </div>
  );
}
