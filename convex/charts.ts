import { action } from "./_generated/server";
import { v } from "convex/values";
import { fetchOHLCV, type OHLCVInterval } from "./lib/charts";

const VALID_INTERVALS: OHLCVInterval[] = ["1h", "4h", "1d"];

export const getOHLCV = action({
  args: {
    symbol: v.string(),
    interval: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const interval = VALID_INTERVALS.includes(args.interval as OHLCVInterval)
      ? (args.interval as OHLCVInterval)
      : "1h";

    return await fetchOHLCV(args.symbol, interval);
  },
});
