# Cheq

A play-money prediction game for memecoins. Wager virtual points on token price movements, challenge friends head-to-head, and climb the leaderboard -- all the fun of degen trading with none of the downside.

## What is Cheq?

Cheq lets you prove your crypto prediction skills against friends without real money. Search for any memecoin, pick a direction or target price, set your wager, and challenge an opponent. The app handles resolution automatically using live price data from DexScreener.

No wallets. No real money. Just bragging rights.

## Features

- **Three bet types** -- Up/Down (price direction), Hit Price (touch target before deadline), Token vs Token (percentage gain comparison)
- **Challenge system** -- Challenge friends by username, accept/decline/counter-propose wagers (up to 3 rounds)
- **Automatic resolution** -- Scheduled functions resolve bets at deadline; hit-price bets poll every 30 seconds for instant wins
- **Skill ratings** -- Bayesian ranking via OpenSkill so the leaderboard reflects actual prediction skill, not just volume
- **Rivalries** -- Every head-to-head matchup is tracked with win/loss records and streaks
- **Leaderboards** -- Top Rated, Sharpest (win rate), and On Fire (current streak)
- **Progression** -- XP, levels (21 tiers), and 7 earnable badges (First Blood, Hot Streak, Underdog, etc.)
- **Notifications** -- In-app alerts for challenges, results, badges, and streaks

## Points Economy

| Event | Points |
|---|---|
| Registration bonus | +500 |
| Weekly top-up (active users) | +100 |
| Daily streak bonus | +10 base, 1.5x/day (cap 10 days) |
| Wager range | 10 -- 500 per bet |
| Win | Full pot (your wager + opponent's) |
| Lose | Wager already deducted |
| Tie | Both wagers returned |

Max 5 active/pending bets per user. Challenges expire after 24 hours.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, TanStack Form
- **Backend:** Convex (database, serverless functions, scheduled jobs, real-time subscriptions)
- **Auth:** Better Auth via Convex (Google/email)
- **Ratings:** OpenSkill (Weng-Lin Bayesian model)
- **Price Data:** DexScreener API (fallback: GeckoTerminal)
- **Testing:** Vitest, convex-test

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/)

### Install

```bash
pnpm install
```

### Environment

Copy `.env.local.example` to `.env.local` and fill in the required values (Convex deployment URL, auth secrets, etc.).

### Development

```bash
pnpm dev
```

Starts the Next.js dev server and Convex dev server together via Portless.

### Testing

```bash
pnpm test        # watch mode
pnpm test:run    # single run
```

## Deployment

### Convex (backend)

```bash
npx convex deploy
```

This targets your project's production deployment when `CONVEX_DEPLOYMENT` is set in `.env.local`, or uses `CONVEX_DEPLOY_KEY` in CI.

Set production environment variables:

```bash
npx convex env set VARIABLE_NAME value
```

### Full deploy (Convex + Next.js)

```bash
npx convex deploy --cmd 'pnpm build'
```

## Project Structure

```
src/
  app/
    (auth)/          # Sign in / sign up pages
    (protected)/     # Main app (feed, create bet, bet detail)
    api/auth/        # Better Auth API route
  components/        # UI components
  hooks/             # Custom React hooks
  lib/               # Utilities (cn, etc.)

convex/
  schema.ts          # Database schema
  bets.ts            # Bet queries and mutations
  betActions.ts      # Bet creation action (price fetching)
  resolution.ts      # Bet resolution logic
  points.ts          # Points management
  progression.ts     # XP and leveling
  badges.ts          # Badge checks and awards
  rivalries.ts       # Head-to-head tracking
  leaderboards.ts    # Leaderboard queries
  notifications.ts   # In-app notifications
  crons.ts           # Scheduled jobs (polling, top-ups, expiry)
  lib/
    constants.ts     # All tunable game parameters
    rating.ts        # OpenSkill rating helpers
    prices.ts        # DexScreener/GeckoTerminal price fetching
```
