import {
  getLevelForXp,
  DEFAULT_MU,
  DEFAULT_SIGMA,
  DEFAULT_DISPLAY_RATING,
} from "../lib/constants";

export const TEST_TOKEN = {
  address: "0xtoken1",
  symbol: "PEPE",
  chain: "ethereum",
  pairAddress: "0xpair1",
};

export const TEST_TOKEN_B = {
  address: "0xtoken2",
  symbol: "DOGE",
  chain: "ethereum",
  pairAddress: "0xpair2",
};

export function makeUser(
  overrides: {
    authId?: string;
    name?: string;
    username?: string;
    points?: number;
    xp?: number;
    mu?: number;
    sigma?: number;
    displayRating?: number;
    currentStreak?: number;
    longestStreak?: number;
    lastActiveAt?: number;
    currentWinStreak?: number;
    totalWins?: number;
    totalBetsResolved?: number;
  } = {},
) {
  const xp = overrides.xp ?? 0;
  return {
    authId: overrides.authId ?? "auth1",
    name: overrides.name ?? "Test User",
    username: overrides.username ?? "testuser",
    points: overrides.points ?? 500,
    level: getLevelForXp(xp),
    xp,
    mu: overrides.mu ?? DEFAULT_MU,
    sigma: overrides.sigma ?? DEFAULT_SIGMA,
    displayRating: overrides.displayRating ?? DEFAULT_DISPLAY_RATING,
    currentStreak: overrides.currentStreak ?? 0,
    longestStreak: overrides.longestStreak ?? 0,
    lastActiveAt: overrides.lastActiveAt ?? Date.now(),
    ...(overrides.currentWinStreak !== undefined
      ? { currentWinStreak: overrides.currentWinStreak }
      : {}),
    ...(overrides.totalWins !== undefined
      ? { totalWins: overrides.totalWins }
      : {}),
    ...(overrides.totalBetsResolved !== undefined
      ? { totalBetsResolved: overrides.totalBetsResolved }
      : {}),
  };
}
