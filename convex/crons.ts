import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "poll touch bets",
  { seconds: 30 },
  internal.resolution.pollTouchBets,
);

crons.cron(
  "weekly topup",
  "0 0 * * 1",
  internal.progression.weeklyTopup,
);

crons.cron(
  "daily streak check",
  "0 0 * * *",
  internal.progression.checkStreaks,
);

export default crons;
