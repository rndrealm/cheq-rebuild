// Shared with the server (checkpoint detection uses the same rules), so the
// logic lives in convex/lib and stays free of server imports.
export {
  distanceToTarget,
  getBetWindow,
  getStanding,
  getStartPrices,
  percentChange,
  type Standing,
} from "../../../convex/lib/betProgress";
