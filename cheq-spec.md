# Cheq: MVP Technical Spec

---

## 1. Product Summary

Cheq is a play-money prediction game for memecoins. Players bet points on where tokens are headed, challenge friends head-to-head, and climb leaderboards through streaks, badges, and seasonal rankings. No real money, no crypto wallets, no risk.

**MVP scope:** Private game (friend duels) with core progression. Public game comes post-MVP.

---

## 2. User Flows

### 2.1 Registration & Onboarding

1. User lands on the app
2. Signs up via Better Auth (Google, X/Twitter, email magic link)
3. Receives registration point bonus (configurable, default: enough for ~10 bets)
4. Guided prompt: "Challenge a friend" or "Explore tokens"

### 2.2 Creating a Bet (Challenger)

1. User selects a token (search by name/ticker, filtered by liquidity threshold)
2. Picks bet type:
   - **Up or down** — will this token go up or down?
   - **Hit price** — will this token reach $X?
   - **Token vs token** — which token performs better?
3. Picks duration: 1h, 4h, 24h, 3d, 1w
4. Sets wager amount (points)
5. Points are **locked immediately**
6. Chooses opponent:
   - **Search by username** — find any user and challenge them directly
   - **Pick from rivals** — challenge someone you've bet against before (shown as suggestions)
   - **Open challenge** — anyone can accept (post-MVP)
7. Bet is created with status `pending`, opponent notified

### 2.3 Receiving a Challenge (Opponent)

1. Push notification: "[User] challenged you: DEGEN up or down in 24h for 50 points"
2. Opponent opens the bet card, sees terms
3. Options:
   - **Accept** — takes the opposite side, points locked, bet goes `active`
   - **Counter** — proposes a different wager amount, sends back to challenger
   - **Decline** — bet cancelled, challenger's points unlocked
   - **Ignore** — bet expires automatically (24h or bet deadline, whichever is first), points unlocked

### 2.4 Counter-Propose Flow

1. Opponent counters with a different wager amount (bet terms stay fixed)
2. Original challenger gets notification with the counter-offer
3. Challenger can accept, counter again, or decline
4. Max 3 counter rounds, then auto-expire to prevent infinite loops

### 2.5 Bet Resolution

**Snapshot bets (up/down, token vs token):**
1. Convex scheduled function fires at deadline
2. Fetches current price from DexScreener (fallback: GeckoTerminal)
3. Compares to price at bet creation (stored on the bet record)
4. Determines winner (if price unchanged → tie/push)
5. Win: loser's wager goes to winner. Tie: both players' wagers returned.
6. Update both players' OpenSkill ratings
7. Bet status → `resolved` (or `tied`)
8. Both players notified

**Touch bets (hit price):**
1. Convex scheduled function polls price every ~30s for active touch bets
2. If price hits target → resolve immediately, winner notified
3. If deadline reached without hitting → snapshot resolves (target not hit, other side wins)
4. Bet status → `resolved`

**Edge cases:**
- Token delisted/rugged: price returns null or 0 → "down" side wins
- API failure at resolution time: retry 3 times over 5 minutes, then flag for manual review
- Both APIs disagree by >5%: flag for manual review, use the more conservative result

### 2.6 Rivalry & History

1. After resolution, the bet is added to the head-to-head rivalry record between the two players
2. Rivalry page shows: total wins/losses, current streak, all past bets
3. Players can rematch from the rivalry page with one tap

---

## 3. Data Model

### 3.1 Users

```
users
├── _id
├── name
├── username (unique)
├── avatarUrl
├── authId (Better Auth reference)
├── points (current balance)
├── level
├── xp (cumulative, never decreases)
├── rating (object, OpenSkill)
│   ├── mu (skill estimate, default: 25)
│   └── sigma (uncertainty, default: 25/3)
├── displayRating (mu - 3*sigma, the conservative estimate shown to users)
├── currentStreak (consecutive days with activity)
├── longestStreak
├── createdAt
└── lastActiveAt
```

### 3.2 Bets

```
bets
├── _id
├── creatorId (ref: users)
├── opponentId (ref: users, nullable for open challenges)
├── type: "up_down" | "hit_price" | "token_vs_token"
├── status: "pending" | "countered" | "active" | "resolved" | "tied" | "expired" | "cancelled" | "flagged"
├── token (object)
│   ├── address
│   ├── symbol
│   ├── chain
│   └── pairAddress (DexScreener pair)
├── tokenB (object, only for token_vs_token)
│   ├── address
│   ├── symbol
│   ├── chain
│   └── pairAddress
├── betTerms (object)
│   ├── direction: "up" | "down" (for up_down)
│   ├── targetPrice: number (for hit_price)
│   └── creatorSide: "tokenA" | "tokenB" (for token_vs_token)
├── creatorWager: number
├── opponentWager: number
├── priceAtCreation: number
├── priceAtCreationB: number (for token_vs_token)
├── priceAtResolution: number
├── priceAtResolutionB: number (for token_vs_token)
├── winnerId (ref: users)
├── duration: "1h" | "4h" | "24h" | "3d" | "1w"
├── expiresAt (challenge acceptance deadline)
├── resolvesAt (bet resolution deadline)
├── resolvedAt (actual resolution timestamp)
├── resolvedVia: "snapshot" | "touch" | "manual"
├── priceSource: "dexscreener" | "geckoterminal"
├── counterCount: number (tracks counter-proposals)
├── createdAt
└── updatedAt
```

### 3.3 Rivalries

```
rivalries
├── _id
├── userAId (ref: users, lower ID first for consistency)
├── userBId (ref: users)
├── userAWins: number
├── userBWins: number
├── totalBets: number
├── currentStreakHolder (ref: users)
├── currentStreakCount: number
└── lastBetAt
```

### 3.4 Badges

```
badges (reference table)
├── _id
├── key: string (unique slug)
├── name
├── description
├── iconUrl
└── trigger: string (describes the condition)

userBadges
├── _id
├── userId (ref: users)
├── badgeId (ref: badges)
└── earnedAt
```

### 3.5 Point Transactions

```
pointTransactions
├── _id
├── userId (ref: users)
├── amount: number (positive or negative)
├── type: "registration_bonus" | "weekly_topup" | "streak_bonus" | "bet_lock" | "bet_unlock" | "bet_win" | "bet_loss"
├── betId (ref: bets, nullable)
└── createdAt
```

### 3.6 Notifications

```
notifications
├── _id
├── userId (ref: users)
├── type: "challenge_received" | "challenge_accepted" | "challenge_declined" | "counter_received" | "bet_resolved" | "badge_earned" | "streak_bonus" | "weekly_topup"
├── title
├── body
├── betId (ref: bets, nullable)
├── read: boolean
└── createdAt
```

---

## 4. API Design (Convex Functions)

### 4.1 Mutations (Write Operations)

```
bets/create          — create a new bet, lock points
bets/accept          — accept a challenge, lock points, start bet
bets/decline         — decline a challenge, unlock creator's points
bets/counter         — counter-propose wager amount
bets/acceptCounter   — accept a counter-proposal
bets/cancel          — creator cancels a pending bet, unlock points
bets/rematch         — create a new bet with same terms and opponent from a resolved bet

users/updateProfile  — update name, username, avatar

notifications/markRead    — mark notification as read
notifications/markAllRead — mark all as read
```

### 4.2 Queries (Read Operations)

```
bets/getById         — single bet with full details
bets/listMyActive    — all active bets for current user
bets/listMyPending   — pending challenges (sent and received)
bets/listMyHistory   — resolved bets (paginated)

users/me             — current user profile with points, level, streak
users/getById        — public profile for another user
users/search         — search users by username

rivalries/get        — rivalry record between two users
rivalries/listMine   — all rivalries for current user (sorted by activity)

badges/listAll       — all available badges
badges/listMine      — badges earned by current user

notifications/list   — recent notifications (paginated)
notifications/unreadCount — count of unread notifications

tokens/search        — search tokens via DexScreener, filtered by liquidity threshold
tokens/getPrice      — current price for a token
```

### 4.3 Scheduled Functions (Background Jobs)

```
resolution/resolveSnapshotBets
  — Runs every minute
  — Queries all active bets where resolvesAt <= now
  — Fetches prices, determines winners, distributes points
  — Sends notifications

resolution/pollTouchBets
  — Runs every 30 seconds
  — Queries all active hit_price bets
  — Fetches current prices from DexScreener
  — If target hit → resolve immediately
  — Batches API calls to stay within 60 req/min limit

progression/weeklyTopup
  — Runs weekly (e.g., Monday 00:00 UTC)
  — Credits topup points to all active users

progression/checkStreaks
  — Runs daily
  — Resets streaks for users who didn't play yesterday
  — Awards streak bonuses for active users

progression/expirePendingBets
  — Runs every minute
  — Expires pending bets past their acceptance deadline
  — Unlocks creator points
```

---

## 5. Token Search & Price Resolution

### 5.1 Token Search

When a user searches for a token to bet on:
1. Call DexScreener `/latest/dex/search?q={query}`
2. Filter results by `liquidity.usd >= LIQUIDITY_THRESHOLD` (configurable, default $50K)
3. Return: symbol, name, chain, current price, 24h change, liquidity, pair address
4. Cache results in Convex for 60 seconds to reduce API calls

### 5.2 Price at Bet Creation

When a bet is created:
1. Fetch price from DexScreener `/tokens/v1/{chainId}/{tokenAddress}`
2. Store `priceAtCreation` on the bet record
3. Store `priceSource: "dexscreener"`
4. If DexScreener fails, fall back to GeckoTerminal

### 5.3 Price at Resolution

When resolving a bet:
1. Fetch price from same source used at creation (stored on bet)
2. If primary source fails, use fallback
3. If both fail, retry 3x over 5 minutes
4. If still failing, set status to `flagged` for manual review
5. If sources disagree by >5%, use the more conservative result (the one less favorable to either side — effectively a push toward "no change")

---

## 6. Points & Progression System

### 6.1 Points Flow

```
Registration     → +REGISTRATION_BONUS (default: 500)
Weekly topup     → +WEEKLY_TOPUP (default: 100)
Streak bonus     → +STREAK_BONUS per day (default: 10, scales with streak length)
Bet creation     → -wager (locked)
Bet cancelled    → +wager (unlocked)
Bet expired      → +wager (unlocked)
Bet won          → +opponent's wager
Bet lost         → (wager already deducted)
```

### 6.2 XP & Levels

- XP is earned by participating, win or lose:
  - Bet resolved (any outcome): +XP_PER_BET (default: 10)
  - Bet won: +XP_WIN_BONUS (default: 5)
  - Badge earned: +XP_BADGE_BONUS (default: 20)
- XP never decreases
- Level thresholds: configurable curve (e.g., level 2 = 50 XP, level 3 = 150 XP, etc.)

### 6.3 Badges (MVP Set)

| Badge | Trigger |
|---|---|
| First Blood | Win your first bet |
| On a Roll | Win 3 bets in a row |
| Hot Streak | Win 5 bets in a row |
| Comeback Kid | Win a bet after losing 3 in a row |
| Rivalry Started | Complete your first bet against a friend |
| Nemesis | Complete 10 bets against the same friend |
| Underdog | Win a bet where you wagered less than your opponent |
| Early Bird | Create a bet within 1 hour of a token being listed |
| Diversified | Bet on 10 different tokens |
| Dedicated | Maintain a 7-day activity streak |

---

## 7. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js |
| Backend | Convex |
| Auth | Better Auth (Convex plugin) |
| Database | Convex (built-in) |
| Price Data | DexScreener (primary) + GeckoTerminal (fallback) |
| Hosting | Vercel |
| Bet Resolution | Convex scheduled functions |
| Realtime | Convex subscriptions |
| Rating | openskill.js (Weng-Lin model) |

---

## 8. Pages & Navigation

### 8.1 Core Pages

| Page | Purpose |
|---|---|
| `/` | Landing / marketing page (logged out) or feed (logged in) |
| `/feed` | Live feed of active bets, recent resolutions, friend activity |
| `/create` | Create a new bet (token search → bet type → terms → challenge) |
| `/bet/[id]` | Single bet view — live status, price chart, result |
| `/profile` | Your stats, badges, level, point balance, bet history |
| `/profile/[username]` | Another user's public profile |
| `/rivals` | All rivalries (anyone you've bet against), sorted by activity |
| `/rivals/[userId]` | Head-to-head record with a specific user |
| `/notifications` | Notification center |
| `/settings` | Account settings |

### 8.2 Key Components

- **BetCard** — reusable card showing bet terms, status, participants, live price
- **TokenSearch** — search input with live DexScreener results, liquidity filter
- **RivalryCard** — win/loss record, streak, last bet, rematch button
- **LeaderboardTable** — sortable by points, win rate, streak
- **NotificationItem** — contextual notification with action button
- **PriceChart** — simple price display for a token (pulled from DexScreener data)

---

## 9. MVP Scope & Phasing

### Phase 1: Core Loop (MVP)
- Auth (Better Auth with Google/email)
- Token search with liquidity filter
- Create bet (up/down type only — simplest to build and resolve)
- Challenge by username (search any user, challenge directly)
- Challenge flow (send, accept, decline, counter)
- Snapshot resolution via scheduled function
- Points system (registration bonus, lock/unlock, win/loss)
- Basic profile (points, level, bet history)
- Rivalry tracking (auto-created from bet history, no friend requests)
- Notifications (in-app)

### Phase 2: Full Bet Types
- Hit price bets (touch resolution, polling)
- Token vs token bets
- Price display on bet cards

### Phase 3: Engagement Layer
- Badges system
- Streak tracking and bonuses
- Weekly topups
- XP and leveling
- Leaderboards

### Phase 4: Growth (Post-MVP)
- Open challenges (public bets)
- Public feed
- Shareable bet links / win cards
- Social media integration
- Push notifications (web push)
- Seasons with leaderboard resets

---

## 10. Configuration Constants

All tuning knobs in one place, adjustable without code changes:

```
REGISTRATION_BONUS = 500
WEEKLY_TOPUP = 100
STREAK_BONUS_BASE = 10
STREAK_BONUS_MULTIPLIER = 1.5   // bonus grows with streak length
MIN_WAGER = 10
MAX_WAGER = 500
MAX_ACTIVE_BETS = 5
LIQUIDITY_THRESHOLD = 50000     // $50K minimum DEX liquidity
CHALLENGE_EXPIRY_HOURS = 24
MAX_COUNTER_ROUNDS = 3
TOUCH_POLL_INTERVAL_SECONDS = 30
PRICE_DISAGREEMENT_THRESHOLD = 0.05  // 5%
XP_PER_BET = 10
XP_WIN_BONUS = 5
XP_BADGE_BONUS = 20
```

---

## 11. Rating & Leaderboards

### 11.1 Rating System (OpenSkill)

Uses the [openskill.js](https://github.com/philihp/openskill.js) library (Weng-Lin model).

- Every user starts with `mu: 25, sigma: 8.333` (default OpenSkill values)
- After each resolved bet, both players' ratings are updated via `rate([[winner], [loser]])`
- Ties: `rate([[playerA], [playerB]], { rank: [1, 1] })`
- `displayRating = mu - 3 * sigma` — the conservative estimate, always shown to users as their "Cheq Rating"
- New players have high sigma (uncertain), so their display rating is low — they have to prove themselves
- Sigma shrinks with more bets, so ratings stabilize over time
- Rating update happens in the same Convex mutation as bet resolution

### 11.2 Leaderboards (MVP)

| Leaderboard | Metric | Notes |
|---|---|---|
| **Top Rated** | displayRating (mu - 3*sigma) | The "who's the best" board — composite skill score |
| **Sharpest** | Win rate | Minimum 10 resolved bets to qualify |
| **On Fire** | Current win streak | Who's hot right now |

### 11.3 Leaderboard Queries

```
leaderboards/topRated    — users sorted by displayRating (top 50)
leaderboards/sharpest    — users sorted by win rate, min 10 bets (top 50)
leaderboards/onFire      — users sorted by current streak (top 50)
```

---

## 12. Resolved Questions

1. **Bet creator side selection:** Creator picks "up" or "down," opponent automatically gets the other side.

2. **Ties:** Push — both players get their points back.

3. **Max active bets:** 5 per user. Keeps resolution load manageable and prevents gaming.

4. **Token price caching:** 60 seconds.

5. **Rematch mechanic:** Two options from a resolved bet or rivalry page:
   - **Rematch (exact)** — one tap, creates the same bet with the same terms and opponent
   - **Rematch (edit)** — opens the create form pre-filled with the previous bet's terms, user can tweak before sending

6. **User discovery:** Username search is the baseline. Shareable challenge links (post-MVP) for cold start.
