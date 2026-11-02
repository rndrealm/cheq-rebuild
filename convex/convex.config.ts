import { defineApp } from "convex/server";
import { v } from "convex/values";
import betterAuth from "@convex-dev/better-auth/convex.config";

const app = defineApp({
  env: {
    // Defaults to https://api.binance.us (prod runs in the US, where
    // binance.com is geo-blocked). Set to https://api.binance.com in dev.
    BINANCE_API_BASE: v.optional(v.string()),
  },
});
app.use(betterAuth);

export default app;
