export const REGISTRATION_BONUS = 500;
export const WEEKLY_TOPUP = 100;
export const MIN_WAGER = 10;
export const MAX_WAGER = 500;
export const MAX_ACTIVE_BETS = 5;
export const LIQUIDITY_THRESHOLD = 50_000;
export const PRICE_CACHE_TTL = 60_000;
export const MAX_COUNTER_ROUNDS = 3;
export const CHALLENGE_EXPIRY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_MU = 25;
export const DEFAULT_SIGMA = 25 / 3;
export const DEFAULT_DISPLAY_RATING = DEFAULT_MU - 3 * DEFAULT_SIGMA;

export const XP_PER_BET = 10;
export const XP_WIN_BONUS = 5;
export const XP_BADGE_BONUS = 20;
export const STREAK_BONUS_BASE = 10;
export const STREAK_BONUS_MULTIPLIER = 1.5;

export const LEVEL_THRESHOLDS = [
  0, 0, 50, 150, 300, 500, 750, 1100, 1500, 2000, 2600,
  3300, 4100, 5000, 6000, 7200, 8500, 10000, 12000, 14500, 17500,
];

export function getLevelForXp(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 1;
}

export const DURATION_MS: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
};
