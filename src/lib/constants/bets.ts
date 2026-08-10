export const BET_TYPES = [
  { value: "up_down", label: "Up / Down" },
  { value: "hit_price", label: "Hit Price" },
  { value: "token_vs_token", label: "Token vs Token" },
] as const;

export const DURATIONS = [
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "24h", label: "24H" },
  { value: "3d", label: "3D" },
  { value: "1w", label: "1W" },
] as const;
