import { action } from "./_generated/server";
import { v } from "convex/values";
import { fetchOHLCV, type OHLCVInterval } from "./lib/charts";

const VALID_INTERVALS: OHLCVInterval[] = ["1h", "6h", "12h", "24h"];

export const getOHLCV = action({
  args: {
    pairAddress: v.string(),
    chain: v.string(),
    interval: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const interval = VALID_INTERVALS.includes(args.interval as OHLCVInterval)
      ? (args.interval as OHLCVInterval)
      : "1h";

    return await fetchOHLCV(args.pairAddress, args.chain, interval);
  },
});
