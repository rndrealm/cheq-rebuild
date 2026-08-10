# Cheq: Research Findings & Design Decisions

---

## 1. Competitive Landscape

### Direct Competitors (Play-Money Crypto Prediction Games)

| Platform | Model | H2H Duels? | Memecoin Focus? | Gamification? |
|---|---|---|---|---|
| [**CryptoSim**](https://apps.apple.com/us/app/cryptosim-paper-trade-games/id1468838417) | Paper trading sim with quests/missions | No | No | XP, streaks, daily quests, leaderboards |
| [**Velotrade Sprint**](https://velotrade.com/blog/crypto-trading-simulator) | 5-min BTC prediction rounds | No | No (BTC only) | 4 leaderboard types, streak tracking |
| [**FrontRunner**](https://play.google.com/store/apps/details?id=com.app.frontrunner.frontrunner) | Play-money predictions on trending topics | No | No | BUX points, leaderboards |
| [**Manifold Markets**](https://manifold.markets/) | Play-money prediction market (Mana currency) | Custom markets for friends | No | Quarterly leagues, following, calibration scores |

### Adjacent Competitors (Fantasy Crypto / Trading Competitions)

| Platform | Model | H2H Duels? | Memecoin Focus? | Gamification? |
|---|---|---|---|---|
| [**LARP**](https://apps.apple.com/us/app/larp-fantasy-crypto/id6748700386) | Weekly fantasy portfolio ($100K sim) | No (pool leaderboard) | No | Weekly leaderboard |
| [**SwapRoyale**](https://swaproyale.com/) | Trading contests on Base (entry fee) | No (pool-based) | No | Leaderboards |
| [**Altcoin Fantasy**](https://www.altcoinfantasy.com/) | Free sim trading, 1000+ altcoins | No | No | Has badges, no streaks |
| [**CoinFantasy**](https://www.coinfantasy.io/) | Fantasy team of 7 tokens, DeFi | No | No | NFT leveling |
| [**TradingLeagues**](https://www.tradingleagues.app/) | eSports-style trading competitions | No | No | Social forum |
| [**Roostoo**](https://www.roostoo.com/) | Mock crypto trading sim with AI agents | No | No | XP, badges, social profiles |
| [**FOMO**](https://fomo.family/) | Social-first memecoin trading app | No | Yes | Leaderboard-driven |

### Closest Mechanic Matches (Non-Crypto)

| Platform | Model | H2H Duels? | Gamification? | Key Takeaway |
|---|---|---|---|---|
| [**StockBattle**](https://stockbattle.io/) | 15-min stock/crypto trading duels | Yes (real money) | Minimal | Closest to Cheq's duel mechanic but real money, stock-focused |
| [**Fliff**](https://www.getfliff.com/) | Social sportsbook / sweepstakes | Yes (friend challenges) | Avatars, badges, daily login, loyalty, chat | Best gamification reference in prediction space |
| [**PrizePicks**](https://www.prizepicks.com/) | DFS prediction platform | PvP Arena mode | Social feed, streaks ($1M prize), lineup sharing | Best social/streak reference |
| [**BettorEdge**](https://www.bettoredge.com/) | P2P sports betting | H2H matchups | Following, group chats, leaderboards, performance tracking | Strongest social layer in prediction markets |
| [**MMA Fantasy**](https://www.mma-fantasy.com/) | Fight prediction app | True 1v1 H2H | Win-loss record tracking | Simple H2H mechanic reference |

### Real-Money Prediction Markets (Reference Only)

| Platform | Volume | Social Features | Notes |
|---|---|---|---|
| [**Polymarket**](https://polymarket.com/) | $15-50M/day, $425M peak day | Comments, profiles, daily rewards. No friends/badges | Dominant liquidity. UMA oracle for resolution |
| [**Kalshi**](https://kalshi.com/) | $4.4B/month | Comments, leaderboards. No friends/badges | CFTC-regulated. Official data sources for resolution |
| [**OG (Crypto.com)**](https://og.com/) | Growing | Leaderboards, posting, live chat | Spun out after 40x growth |
| [**SnapMarkets (Blockchain.com)**](https://www.blockchain.com/blog/posts/blockchain-rolls-out-predictions-with-snapmarkets) | New (May 2026) | Leaderboard, live chat, streak tracking | 30-second BTC prediction rounds |

### On-Chain Prediction Protocols (Infrastructure Reference)

| Protocol | Blockchain | Mechanic | Key Innovation |
|---|---|---|---|
| [**Azuro**](https://azuro.org/) | Polygon, Gnosis, Chiliz | vAMM, unified liquidity pool | B2B infra layer, 30+ apps built on it, NFT bet slips |
| [**Drift BET**](https://www.drift.trade/) | Solana | AMM + order book | Earn yield on collateral while positions are open |
| [**SX Network**](https://sx.bet/) | Custom Polygon SDK chain | P2P order book | First P2P parlays, purpose-built blockchain |
| [**SanR (Santiment)**](https://insights.santiment.net/read/sanr-is-ready-to-reward-your-predictions-and-raise-your-reputation-7961) | Ethereum L2 | Price prediction sim (rebranding to ScoreArena) | On-chain reputation as NFTs, 3 reward leagues, copy trading |

---

## 2. Gap Analysis

### What Nobody Does (Cheq's Open Lane)

Across 30+ platforms researched, **no platform combines all four**:

1. **Play money** -- no friction, no legal headache, no wallet required
2. **Memecoin focus** -- the most volatile, social, entertaining crypto segment
3. **Friend-vs-friend rivalries** -- persistent win/loss records, direct challenges
4. **Full gamification stack** -- levels, badges, streaks, seasons, leaderboards together

### Specific Gaps by Feature

| Feature | Best Existing Example | Gap Cheq Fills |
|---|---|---|
| **1v1 friend duels** | StockBattle (real money, stocks) | Play-money, crypto, persistent rivalry records |
| **Memecoin predictions** | Nobody | First mover |
| **Badges + streaks + levels** | Fliff, PrizePicks (sports only) | First in crypto prediction space |
| **Shareable wins** | PrizePicks (lineup sharing) | Crypto-native, meme-culture friendly |
| **Simple bet UX** | Up vs Down (swipe) | Prediction format vs. portfolio building = lower barrier |

### Cheq's Strongest Differentiators

1. **The social rivalry layer** -- no competitor has persistent friend-vs-friend records
2. **Prediction format** (yes/no bets) vs. portfolio/trading sims -- dramatically lower barrier to entry
3. **Memecoin culture fit** -- the meme energy of the space is completely unserved by existing platforms
4. **No wallet / no risk** -- removes every friction point that on-chain platforms impose

---

## 3. Design Decisions Made

### Bet Types (Launch)

| Bet Type | Resolution Mechanic | Example |
|---|---|---|
| **Up or down** | Snapshot (check price once at deadline) | "DEGEN over the next 24h" |
| **Will it hit X price** | Touch (resolves the moment target is hit, snapshot at deadline if not) | "DEGEN reaches $0.05 by Friday" |
| **Token vs token** | Snapshot (check both prices at deadline, compare % change) | "DEGEN vs WIF, which pumps harder?" |

### Resolution: Hybrid Model

- **Touch** for price-target bets -- resolves instantly when the target is hit, otherwise snapshot at deadline confirms it didn't
- **Snapshot** for up/down and token-vs-token bets -- check once at deadline
- This allows starting with snapshot-only for MVP (up/down is simplest), then layering in touch monitoring
- **Rug/delist handling**: part of the game. If a token disappears, the "down" side wins. Mimics real life.

### Bet Durations

Preset options: **1h, 4h, 24h, 3d, 1w** (not fully custom at launch). Creates natural resolution cohorts.

### Point Economics

Configurable system with sensible defaults, tune based on real player behavior:
- **Registration bonus** -- enough to explore (5-10 bets)
- **Weekly topups** -- keep casual players in the game
- **Streak bonuses** -- reward daily engagement
- **Bet sizing, wager parity, level scaling** -- all configurable knobs, not architectural decisions

### Build Order

1. **Private game first** -- friend duels, points, rivalries, core progression
2. **Public game second** -- growth layer once the core loop is proven

---

## 4. Decisions Made (Post-Research)

### Price Data Source
- **Primary: [DexScreener API](https://docs.dexscreener.com/api/reference)** -- free, no API key, 60 req/min, excellent memecoin coverage
- **Fallback: [GeckoTerminal API](https://apiguide.geckoterminal.com/)** -- free, no API key, 30 req/min, adds OHLCV historical data
- **Upgrade path: [Birdeye API](https://docs.birdeye.so)** -- $199/mo for WebSocket price streaming with dedicated meme token channel
- Polling every ~30s for touch mechanic on active bets (sufficient at MVP scale)
- Cross-reference both sources for resolution disputes

### Challenge Flow
- **Direct challenges** (challenge a specific friend) and **open challenges** (anyone can pick up)
- **Counter-propose on wager amount only** -- bet terms (token, target, duration) are fixed
- **Points locked immediately** on challenge creation
- **Expiry: 24 hours or the bet deadline, whichever comes first**
- **Offline challenges supported** via push notification

### Token Allowlist / Moderation
- **Any token above a minimum liquidity threshold** -- no manual curation
- **High threshold for MVP** (~$50K-$100K DEX liquidity) to filter scam tokens
- DexScreener returns liquidity data per response, so filtering is automatic
- Lower the threshold over time as confidence in resolution system grows

### Monetization Direction (Post-MVP)
- **Cosmetics** -- custom avatars, bet card skins, profile themes
- **Sponsored predictions** -- token projects pay to feature a prediction, native to the product
- Battle pass / premium seasons can layer on later

### Remaining Open Questions
- **Shareability & cold start** -- shareable link format, social media integration, viral loop mechanics
- **Progression details** -- specific badge triggers, season length, level-up curve

---

## 5. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | Next.js | React ecosystem, SSR, Vercel-native |
| **Backend** | Convex | Realtime subscriptions, scheduled functions, server functions — natural fit for a live prediction game |
| **Auth** | Better Auth (Convex plugin) | Flexible, self-hosted auth with social logins |
| **Database** | Convex (built-in) | Comes with Convex — realtime queries, no separate DB to manage |
| **Price Data** | DexScreener (primary) + GeckoTerminal (fallback) | Free, no API key, best memecoin coverage |
| **Hosting** | Vercel | Natural pairing with Next.js |
| **Bet Resolution** | Convex scheduled functions | Cron for snapshot bets, recurring polls for touch bets |
| **Realtime** | Convex subscriptions | Live challenge notifications, bet status updates, leaderboards — no WebSocket boilerplate |

---

## 6. Platforms Worth Studying for UX Inspiration

| Platform | What to Study | Why |
|---|---|---|
| [**PrizePicks**](https://www.prizepicks.com/) | Social feed, streak mechanic, lineup sharing | Best-in-class social engagement in prediction apps |
| [**Fliff**](https://www.getfliff.com/) | Full gamification stack (badges, avatars, daily login, loyalty) | Closest to what Cheq's progression system should feel like |
| [**BettorEdge**](https://www.bettoredge.com/) | Friend system, H2H matchups, group chats | Strongest social layer in prediction market space |
| [**Manifold Markets**](https://manifold.markets/) | Play-money economy (Mana), custom market creation, seasons | Closest play-money prediction market reference |
| **SnapMarkets** | 30-second rounds, streak tracking, live chat | Fast-paced prediction UX, arcade-like feel |
| [**SanR**](https://insights.santiment.net/read/sanr-is-ready-to-reward-your-predictions-and-raise-your-reputation-7961) | On-chain reputation, multiple reward leagues, copy trading | Richest reputation/social system in crypto predictions |
| [**Azuro**](https://azuro.org/) | NFT bet slips, bet marketplace, leaderboard awards | Novel bet composability and gamification ideas |

---

## 6. Market Context

- Prediction market sector grew from ~$9B (2024) to $44B+ (2025) -- ~400% YoY
- Polymarket + Kalshi control ~97.5% of real-money volume
- Monthly volume hit $29B in April 2026
- 800,000+ unique active wallets participating across platforms
- Play-money segment is fragmented and underserved
- No platform has successfully combined social gaming with crypto predictions
