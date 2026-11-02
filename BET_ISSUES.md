# Bet System Issues

Issues found while reviewing how bets are created, priced and resolved (`convex/bets.ts`, `convex/betActions.ts`, `convex/resolution.ts`, `convex/resolutionHelpers.ts`, `convex/lib/prices.ts`, `convex/tokens.ts`). Ordered by severity. Nothing here has been run or reproduced yet; it comes from reading the code.

## Critical

### 1. No authentication on bet functions
`createBet`, `accept`, `decline`, `counter`, `cancel` and `rematch` take `userId` / `creatorId` as arguments from the client and never call `ctx.auth`. Any caller can act as any user: create bets that spend someone else's points, accept, decline or cancel on their behalf, and so on.

- [convex/betActions.ts:27](convex/betActions.ts#L27)
- [convex/bets.ts:274](convex/bets.ts#L274), [:338](convex/bets.ts#L338), [:386](convex/bets.ts#L386), [:460](convex/bets.ts#L460), [:499](convex/bets.ts#L499)

**Fix:** work out the user from the auth session on the server and drop the user ID arguments.

### 2. `hit_price` bets never settle if the target isn't reached
`accept` only schedules `resolveSnapshot` for types other than `hit_price` ([convex/bets.ts:326](convex/bets.ts#L326)). `pollTouchBets` only settles when the price hits the target, and `determineSnapshotWinner` returns `null` for `hit_price`. A bet that misses its target stays `active` forever: both wagers stay locked and the bet keeps counting toward the active-bet limit.

`pollTouchBets` also never checks `resolvesAt`, so a bet can still "hit" after its duration has ended ([convex/resolution.ts:71](convex/resolution.ts#L71)).

**Fix:** schedule a resolution at `resolvesAt` for `hit_price` too (the opponent wins if the target wasn't hit), and have the poller skip bets past `resolvesAt`.

### 3. Counter-offers create points out of nothing
`counter` sets **both** `creatorWager` and `opponentWager` to `newWager`, but only adjusts the creator's balance when the creator is the one countering ([convex/bets.ts:417-443](convex/bets.ts#L417-L443)).

Example: the creator locks 50 and the opponent counters to 200. `creatorWager` becomes 200, but the creator still only has 50 locked.
- On cancel or expiry, the creator is refunded 200 (+150 created from nothing).
- On accept, the pot is 400, but only 250 was ever locked.

**Fix:** when the opponent counters, either take the difference from the creator or don't change `creatorWager` until the creator agrees (for example, store a separate proposed wager).

## High

### 4. Opponents can bet after seeing the price move
`priceAtCreation` is captured when the bet is created, but the opponent can accept up to `expiresAt` (up to 24h later). They can wait for the price to move their way and then accept. `resolvesAt` is also fixed at creation, so a 1h bet accepted at minute 59 settles a minute later.

**Fix:** capture the start price and set `resolvesAt` when the bet is accepted (accept would then need to be an action, or call one, to fetch the price).

### 5. Rematch reuses the old start price
`rematch` copies `priceAtCreation` / `priceAtCreationB` from the original bet ([convex/bets.ts:567-568](convex/bets.ts#L567-L568)), so the new bet is judged against a stale price.

### 6. Anyone can decline an open challenge
`decline` only checks the caller when the bet has a named opponent ([convex/bets.ts:350](convex/bets.ts#L350)). For an open challenge (no `opponentId`), any user can decline it, which cancels the creator's bet.

### 7. `hit_price` only supports "over"
The UI offers "Goes Over" / "Goes Under" for `hit_price` ([src/app/(protected)/create-bet/page.tsx:67](src/app/(protected)/create-bet/page.tsx#L67)), but the submit handler never sends `direction` for that type ([:135](src/app/(protected)/create-bet/page.tsx#L135)), and the resolver only checks `price >= targetPrice` ([convex/resolution.ts:86](convex/resolution.ts#L86)).

### 8. Flagged bets have no recovery path
If fetching the price fails after all retries, the bet is set to `flagged` ([convex/resolutionHelpers.ts:29](convex/resolutionHelpers.ts#L29)). Nothing ever settles or refunds a flagged bet, so the wagers stay locked for good. The `"manual"` value for `resolvedVia` exists in the schema but is never used.

**Fix:** add an admin or internal function to settle or refund manually, and/or retry on a schedule.

### 14. The token card's quick-create form offers "Goes Under" for Over/Under
Same root cause as [#7](#7-hit_price-only-supports-over). The quick-create form on the token card ([src/components/token-card/bet-dialog.tsx](src/components/token-card/bet-dialog.tsx)) lets users pick "Goes Over" or "Goes Under" and sends `betTerms.direction` with the target price. The resolver ignores `direction` for `hit_price` and only checks `price >= targetPrice`. Until #7 is fixed, a "Goes Under" bet is settled as if it were "Goes Over".

**Fix:** resolve on `direction` in `pollTouchBets` (`<=` for `"down"`), and settle the opponent as the winner at `resolvesAt` (see #2).

## Medium

### 9. Binance.US may not list every supported token
**Fixed:** every Binance call now goes through `binanceApiUrl()` ([convex/lib/tokens.ts](convex/lib/tokens.ts)), which reads the `BINANCE_API_BASE` env variable (defaults to `https://api.binance.us`; local dev sets it to `https://api.binance.com`). Before this, settlement used binance.us and the UI used binance.com.

**Still open:** Binance.US has less trading volume and may not list every token in `SUPPORTED_SYMBOLS`. On prod, a missing pair makes `createBet` fail and charts come back empty. **To verify:** which of the 50 symbols exist on Binance.US.

### 10. XP is awarded outside the settlement transaction
`awardBetXp` / `awardTieXp` run as a separate mutation after settlement ([convex/resolution.ts:45-65](convex/resolution.ts#L45-L65), [:94-100](convex/resolution.ts#L94-L100)). If the action fails between the two steps, XP is never awarded. In `pollTouchBets`, XP is awarded even when `settleTouch` did nothing because the bet was already settled, so it could be awarded twice if two polling runs overlap.

**Fix:** award XP inside `settleSnapshot` / `settleTouch`, or have settlement return whether it actually settled the bet.

## Low

### 11. The touch poller reads the whole bets table
`getActiveTouchBets` uses `withIndex("by_creatorId_status")` without a range and then filters, so it reads the entire `bets` table every 30s ([convex/resolutionHelpers.ts:13](convex/resolutionHelpers.ts#L13)). Use `by_status_resolvesAt` with `status = "active"` (or a `by_type_status` index).

### 12. The active-bet limit misses some bets
`MAX_ACTIVE_BETS` only counts the creator's `pending` + `active` bets ([convex/bets.ts:199-213](convex/bets.ts#L199-L213)). It ignores `countered` bets and bets where the user is the opponent. `accept` doesn't check the limit at all.

### 13. Duplicate validation constants on the client
`MIN_WAGER` / `MAX_WAGER` are redefined in [src/app/(protected)/create-bet/page.tsx:42-43](src/app/(protected)/create-bet/page.tsx#L42-L43) instead of being shared with `convex/lib/constants.ts`.

## Suggested fix order
1, 3 and 2 first (security and point balances), then 4–8, then the rest.
