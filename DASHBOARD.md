# Dashboard

Notes for the logged-in dashboard. It replaces the feed at `/`; the feed moves to its own page and the dashboard keeps a feed section.

Wireframes (low-fi): [Dashboard Wireframes canvas](https://claude.ai/artifact/PYyT5hqS4jsw3gCXG2eYAu). The current direction is board **D3 · Wide leaderboard + feed carousel**. The other boards (A, B, C, D1, D2, Mobile) are earlier explorations.

## Direction

- Gamified, but focused: a few sections, each doing one job.
- 3-column grid on desktop.

## Layout (D3)

```
┌──────────────┬──────────────────────────────┐
│ Player card  │ Leaderboard (table)          │
│ (col 1,      ├──────────────────────────────┤
│  alone,      │ Feed carousel (TokenCards)   │
│  own height) │                              │
└──────────────┴──────────────────────────────┘
```

### Column 1: player card
- Alone in column 1, and only as tall as its content (it does not stretch to the column's full height).
- Styled like the TokenCard: avatar, name, @username, rating tier in the status pill, points as the big number, streak, and an XP bar to the next level.
- Flip side: a points-over-time chart with interval tabs, the same way the TokenCard flips to its price chart.
- Below that: record and win rate, points locked in bets with active slots (`x / MAX_ACTIVE_BETS`), a summary of live bets, and a row of badges.

### Columns 2–3: leaderboard
- Spans both columns. No podium.
- Section heading and tabs have no border. The table itself has a rounded border.
- Tabs: Rated · Sharpest · On fire · This week.
- Columns: rank, player, tier, record, win %, streak, Challenge button.
- The user's own row is pinned at the bottom with rank movement (e.g. "▲3 this week").
- "Full leaderboard →" link.

### Columns 2–3: feed carousel
- Sits under the leaderboard, in columns 2–3 only.
- Uses the existing `TokenCard` component unchanged (flip to chart, drag to bet).
- Filter chips: All · Open challenges · Live · Results. Prev/next arrows, snap scrolling, the last card cut off at the edge to show there's more.
- "Open feed →" goes to the feed page.

## Open items

### Layout
1. **Incoming challenges have no home.** They're the most time-sensitive thing a user has (they expire after `CHALLENGE_EXPIRY_MS`) and today they only show in alerts. Proposal: pin them as the first cards in the carousel, tagged "For you", with Accept / Decline. They only appear when there's something waiting.
2. **The user's own live bets are thin.** The card only gives a one-line summary. Options: a short live bets list in the player card, or a **Mine** filter in the carousel so they show as full TokenCards with charts.
3. **Carousel order.** People rarely swipe past the first few cards. Default order should put actionable items first: the user's bets, then open challenges they can take, then results. Not just newest first.

### New-user / empty states
4. **Sharpest needs 10 resolved bets to qualify** (`leaderboards.sharpest`). Pin a row like "You: 7 more bets to qualify" instead of leaving the user off the table.
5. A new user's player card has no record, no badges and a flat points chart. It needs a designed zero state that points toward the first bet.

### Mobile
6. Proposed stacking order: player card → feed carousel (swipes naturally on a phone) → leaderboard.

## Backend needed

- **"My rank" query.** The leaderboard queries only return the top 50 (`topRated`, `onFire`) or a filtered top-200 slice (`sharpest`), so a user outside that has no rank to show.
- **Weekly leaderboard.** "This week" needs points or wins tracked per week. Nothing records that today.
- **Points history.** A points-over-time query for the player card's flip side, built as a running sum of `pointTransactions`.
- **Auth.** Queries for the user's own data should use `authedQuery` / `optionalAuthQuery` instead of taking a `userId` (see AGENTS.md).
- **Fix the XP path first.** Win rate, record and win streak on the player card come from `totalWins`, `totalBetsResolved` and `currentWinStreak`, which are written in the XP step. See "XP / progression (deferred #10)" in [BET_ISSUES.md](BET_ISSUES.md).

## Out of scope for now

- Rivalries. The section is on the D3 wireframe but deferred.
- High-fidelity design. Stay low-fi until the structure is locked.
