# Bet System Issues

Issues found while reviewing how bets are created, priced and resolved (`convex/bets.ts`, `convex/betActions.ts`, `convex/resolution.ts`, `convex/resolutionHelpers.ts`, `convex/lib/prices.ts`, `convex/tokens.ts`). Open issues are ordered by severity, followed by notes for future review; fixed issues are at the bottom. Issue numbers are stable, so cross-references keep working.

## Open

### Critical

#### 3. Countering needs a full-stack review
**Status:** deferred. Countering has no UI today, but `bets.counter` is a public mutation, so it can still be called directly.

**What's wrong (backend):**
- **Points are created or destroyed.** `counter` sets **both** `creatorWager` and `opponentWager` to `newWager`, but only adjusts the creator's balance when the creator is the one countering ([convex/bets.ts](convex/bets.ts), `counter`).
  - Opponent counters **up** (creator locked 50, counter to 200): on cancel or expiry the creator is refunded 200 (+150 from nothing); on accept the pot pays 400 when only 250 was locked.
  - Opponent counters **down** (creator locked 200, counter to 50): on cancel the creator gets back only 50, so 150 points disappear.
  - The creator's balance isn't checked when the opponent raises the wager.
- **The counter-party never agrees.** `accept` only checks "not the creator, and the named opponent if set", so the opponent can accept their *own* counter-offer immediately. The creator can't accept a counter at all, because creators can't call `accept`.
- **The home balance is wrong too.** `bets.myBalance` counts `creatorWager` as held for open challenges, so after an opponent's counter the creator's Total Balance includes points that were never taken from them (or leaves out points that were).
- **Root cause:** the bet doesn't record who made the latest offer, or what each side has actually locked versus what's proposed.

**What the review should cover:**
- **Product:** who can counter (open challenges with no named opponent?), how many rounds (`MAX_COUNTER_ROUNDS = 3`), and whether a counter can change only the wager or also the terms (direction, target, duration).
- **Data model:** store the proposer (e.g. `lastProposedBy`) and keep `proposedWager` separate from the amounts actually locked.
- **Flow:** only the *other* side can accept a counter. On acceptance, settle the creator's lock difference (with a balance check), charge the opponent, and activate the bet. Define what cancel, decline and expiry refund after one or more counters.
- **UI:** there is no Counter action on the bet page ([src/components/bet-detail/bet-actions.tsx](src/components/bet-detail/bet-actions.tsx)) or the token card. It needs a counter input, a "countered by X: accept / counter / decline" state, and notifications that make sense.
- **Tests:** counter up and down from each side, then accept, cancel, decline or expire, with point totals conserved in every case.

**Interim option:** make `counter` internal (or delete it) until this is done, which closes the hole without any UI change.

### High

#### 8. Flagged bets have no recovery path
If fetching the price fails after all retries, the bet is set to `flagged` (`flagBet` in [convex/resolutionHelpers.ts](convex/resolutionHelpers.ts)). Nothing ever settles or refunds a flagged bet, so the wagers stay locked for good. The `"manual"` value for `resolvedVia` exists in the schema but is never used.

Until then, `bets.myBalance` counts both players' stakes in flagged bets as held, so they stay in each player's Total Balance rather than vanishing from it.

**Fix:** add an admin or internal function to settle or refund manually, and/or retry on a schedule.

#### 16. Public bet queries expose any user's bets
Four queries in [convex/bets.ts](convex/bets.ts) are raw `query` with no auth check. The ESLint rule only blocks raw `mutation` / `action`, so nothing flagged them.
- **`listByUser`** takes a `userId`: anyone, logged out included, can list any user's bets with wagers and terms, unbounded (`.collect()`). No callers.
- **`getById`**: any bet by ID. No callers.
- **`feed`**: the newest 50 bets of all users with both players' names. No callers.
- **`detail`**: any bet by ID with both players' names; used by the bet page ([src/app/(protected)/bet/[id]/page.tsx](src/app/(protected)/bet/[id]/page.tsx)).

**Fix:** delete `listByUser`, `getById` and `feed`. Decide who can see a bet in `detail`: the two players, plus anyone while it's an open challenge with no named opponent (so a shared link can still be accepted). Add `query` to the ESLint rule's blocked names so new public queries need an explicit opt-out.

### Medium

#### 17. `bets.mine` reads every bet the user has ever made
`bets.mine` (Feed, and prefetched by the Home layout so Feed opens instantly) uses `.collect()` on both sides with no limit and looks up each player one at a time. It grows with the user's whole history and re-runs on every change to any of their bets. Home also runs `bets.myBalance` separately, so Home now does both.

**Fix:** paginate or limit Feed (e.g. live and open bets plus the most recent finished ones), then decide whether the Home layout should keep prefetching it.

### Suggested fix order
3 (or its interim option) first (point balances), then 16 (data exposure), then 8, then 17.

## Future review

#### Bets start on acceptance (follow-up to #4)
#4 was fixed the simple way: the start price and the clock are set when the bet is accepted. Things to review later:

- **Price tolerance (main open question).** The creator no longer controls when the bet starts. They pick "BTC UP" at $77k, but it may start at $74k if accepted 20h later. Consider rejecting acceptance when the price has moved more than X% from `priceAtCreation`, like exchange slippage limits. Decide whether X is a fixed default (e.g. 2%) or set by the creator.
- **Acceptor still picks the start moment.** No hindsight any more, but the acceptor can still time the start, for example right after a dump or just before a scheduled event (inflation report, rate decision). The tolerance above limits this; otherwise accept it as part of the game.
- **Accepting can fail on the price API.** `acceptBet` is an action that fetches a live price, so a Binance outage or an unlisted token (#9) makes accepting fail where it used to always work. The bet page shows the thrown error; consider a friendlier message and a retry.
- **Bets can end later than the creator expected.** A 1w bet accepted 23h after creation ends 8 days after it was made, so the creator's points and active-bet slot (#12) stay locked longer. Show "runs 1w from acceptance" when creating, and consider notifying the creator when the bet starts (the existing "challenge accepted" notification could say so).
- **UI copy for pending bets.** The bet page shows "Market Price" (the creation price) until the bet starts, then "Start Price". The feed and token card don't show either yet. Pending challenges could say "starts at the price when accepted".
- **Old bets.** Bets accepted before this change have no `priceAtStart`; settlement falls back to `priceAtCreation`. The fallback can be removed once no such bets are still active.
- **Over/under at acceptance.** Accepting is rejected if the start price has already reached the target (`"Target price already reached"`). The creator isn't told; consider notifying them or auto-cancelling with a refund.

#### XP / progression (deferred #10)
**Status:** deferred. The XP feature isn't really in use yet; fix this before relying on it.

`resolveSnapshot` ([convex/resolution.ts](convex/resolution.ts)), used by up/down and token-vs-token bets, settles the bet in `settleSnapshot` and then awards XP in a **separate** mutation (`awardBetXp` / `awardTieXp`). Payout, ratings, rivalry and notifications are safe in one transaction; only progression is exposed:
- **Lost XP:** if the action stops between the two steps (crash, timeout, deploy restart), XP, level, `totalWins`, `totalBetsResolved`, `currentWinStreak` and badges are never awarded, and scheduled actions aren't retried. This makes the `sharpest` / `onFire` leaderboards drift.
- **Double XP (unlikely today):** if `resolveSnapshot` ever ran twice at once for a bet (a future retry, re-run or backfill), the second run would award XP again, because the XP step only checks that the bet is resolved.

**Fix (~20 lines, no schema or UI change):** add `applyTieXp()` next to `applyBetXp()` in [convex/progression.ts](convex/progression.ts), call them inside `settleSnapshot`, and remove the XP step from `resolveSnapshot`. That's the same pattern `hit_price` settlement already uses. Keep `awardBetXp` / `awardTieXp` as wrappers for the progression tests. Add tests for XP and stats after a win and a tie, and that a second `settleSnapshot` changes nothing.

#### Bet settings defined in several places
Durations and bet types are spelled out separately in many files, so adding or changing one means several edits that are easy to miss:
- **Durations** (`1h` … `1w`): `DURATION_MS` ([convex/lib/constants.ts](convex/lib/constants.ts)), the validators in `convex/bets.ts` and `convex/betActions.ts`, `convex/schema.ts`, `DURATIONS` ([src/lib/constants/bets.ts](src/lib/constants/bets.ts)), the zod enum on the create-bet page, and `DURATION_LABELS` ([src/lib/helpers/bets.ts](src/lib/helpers/bets.ts)).
- **Bet types:** the validators in `convex/bets.ts`, `convex/betActions.ts` and `convex/schema.ts`, `BET_TYPES` ([src/lib/constants/bets.ts](src/lib/constants/bets.ts)), the create-bet page's zod enum and options, and the token-card dialog's options.

**Tidy-up:** a shared `convex/lib/validators.ts` for the backend, with the frontend lists built from shared constants (as already done for wager limits and supported tokens). Not a bug, just drift-prone.

#### Auth identity key
`users.authId` is matched against `identity.subject` (the Better Auth user id). That's fine with a single auth provider, but the Convex guidelines prefer `identity.tokenIdentifier`; revisit if a second provider is added.

## Fixed

#### 1. No authentication on bet functions
**Was:** `createBet`, `accept`, `decline`, `counter`, `cancel` and `rematch` took `userId` / `creatorId` from the client and never checked `ctx.auth`, so any caller could act as any user.

**Fix:** auth middleware in [convex/lib/functions.ts](convex/lib/functions.ts) (`authedQuery` / `authedMutation` / `authedAction`, built with `convex-helpers` custom functions). All bet functions get the caller from the session as `ctx.user` and no longer take user IDs. The same fix covers `users.updateProfile`, `notifications.markRead` / `markAllRead` (now owner-only), and `users.create` / `seed.seedBets` (now internal; a public `users.create` let anyone mint sign-up bonus points). An ESLint rule blocks new raw `mutation` / `action` imports in `convex/`. Leftovers are tracked in #15.

#### 2. `hit_price` bets never settled if the target wasn't reached
**Was:** `accept` never scheduled a resolution for `hit_price`, and the poller only settled on a hit, so a missed target left the bet `active` forever with both wagers locked. The poller also ignored `resolvesAt`, so late hits counted.

**Fix:** `accept` schedules `resolutionHelpers.settleTouchDeadline` at `resolvesAt`; if the bet is still active, the opponent wins (`resolvedVia: "deadline"`). The poller only reads bets still inside their window, and `settleTouch` re-checks the hit and the deadline. Bets accepted before the fix are handled by the one-off `resolutionHelpers:backfillTouchDeadlines`, which refunds overdue bets and schedules deadlines for the rest.

**Deploy step:** after deploying, run `npx convex run resolutionHelpers:backfillTouchDeadlines --prod`.

**Known limit:** the poller checks every 30s, so a spike that crosses the target and reverses between polls is missed.

#### 4. Opponents could accept after seeing the price move
**Was:** the start price and `resolvesAt` were fixed when the bet was created, so the opponent could wait up to 24h, accept only bets already moving their way, and also get a shorter bet (a 1h bet accepted at minute 59 ended a minute later).

**Fix:** the bet starts on acceptance. Accepting goes through the new `betActions.acceptBet` action, which fetches the start price(s); the now-internal `bets.accept` stores `priceAtStart` / `priceAtStartB` / `startedAt` and sets `resolvesAt` = acceptance time + duration. Settlement measures from `priceAtStart` (falling back to `priceAtCreation` for older bets). Over/under bets whose target is already reached can't be accepted. Open questions are in [Future review](#bets-start-on-acceptance-follow-up-to-4).

#### 5. Rematch reused the old start price
**Fix (with #4):** `rematch` still copies `priceAtCreation` as a preview, but settlement uses the start price captured when the rematch is accepted.

#### 6. Anyone could decline an open challenge
**Was:** `decline` checked the caller only when the bet had a named opponent, so any user could decline (cancel) an open challenge.

**Fix (with #1):** only the named opponent can decline, and the bet page shows Decline only to them.

#### 7. `hit_price` only supported "over"
**Was:** the create-bet page offered "Goes Under" but didn't send `direction`, and the resolver only checked `price >= targetPrice`.

**Fix (with #2):** settlement uses `isTargetHit()` ([convex/lib/touch.ts](convex/lib/touch.ts)), so `direction: "down"` hits at or below the target. Both create forms send `direction`.

#### 9. Supported tokens that Binance.US doesn't list (or barely trades)
**Was:** 9 of the 50 supported tokens had no pair on Binance.US (TON, STX, MKR, FTM, SEI, RUNE, FLOW, ENS, AXS), so on prod they couldn't be bet on and had no charts. Another ~17 traded under ~$5k/day on Binance.US (some under $100), which makes the price stale or easy to move, a problem for settlement. Local dev (binance.com) listed all 50, so the gap only showed on prod.

**Fix:** the bettable list is down to 24 liquid tokens, defined once as `SUPPORTED_TOKENS` in [convex/lib/constants.ts](convex/lib/constants.ts) and used by the backend and the frontend token picker, so dev and prod match. `createBet` now rejects unsupported tokens. Display metadata (names, images) is kept for every token, so older bets on removed tokens still render. The host split is handled by `BINANCE_API_BASE` (binance.us on prod, binance.com in dev).

Checked Nov 2026 via CoinGecko's list of Binance.US pairs (Binance.US blocks non-US requests). **Re-check occasionally:** volumes change and pairs get delisted. A minimum-volume check at bet creation would make this self-maintaining.

#### 11. The touch poller read the whole bets table
**Fix (with #2):** `getActiveTouchBets` uses the `by_status_resolvesAt` index.

#### 12. The active-bet limit missed some bets
**Was:** `MAX_ACTIVE_BETS` (5) only counted the creator's own `pending` + `active` bets. It ignored `countered` bets and bets where the user was the opponent, and `accept` didn't check the limit at all, so a user could hold any number of bets by accepting other people's challenges.

**Fix:** one helper, `assertUnderBetLimit` ([convex/bets.ts](convex/bets.ts)), used by `create`, `rematch` and `accept`. It counts every bet the user has points locked in: challenges they created that are still open (`pending` / `countered`) plus `active` bets on either side. Incoming challenges they haven't accepted don't count, so other users can't fill someone's slots by challenging them.

#### 13. Duplicate wager limits on the create-bet page
**Was:** [src/app/(protected)/create-bet/page.tsx](src/app/(protected)/create-bet/page.tsx) had its own `MIN_WAGER = 10` / `MAX_WAGER = 500`, which would silently drift from the server's limits.

**Fix:** it imports `MIN_WAGER` / `MAX_WAGER` from `convex/lib/constants.ts`, like the token-card dialog. The stake field also checks the user's balance ("Not enough points") instead of waiting for the server to reject it. The wider duplication of durations and bet types is noted in Future review.

#### 14. The token card's quick-create offered "Goes Under" that settled as "Over"
**Fix (with #2):** the quick-create form already sent `direction`; settlement now respects it.

#### 15. Notification and points history were readable by anyone
**Was:** `notifications.listByUser` / `listUnread` / `unreadCount` and `points.listByUser` took a `userId`, so anyone could read anyone's notifications and point history.

**Fix:** they're now `notifications.list` / `unread` / `unreadCount` and `points.list`, with no `userId` argument. They use the new `optionalAuthQuery` builder ([convex/lib/functions.ts](convex/lib/functions.ts)) and return the caller's own data, or an empty result when logged out (so live queries don't error during sign-out). Nothing in the frontend called them yet.

#### 18. Anyone could read any user's bets through `bets.feedForUser`
**Was:** `feedForUser` was a raw `query` taking a `userId`, so any caller could list another user's bets. It powered Feed, the Home layout's prefetch and the Home balance. The balance's locking rules were also copied on the client (`getLockedPoints`), which counted flagged stakes as 0.

**Fix:** replaced by `bets.mine` (`optionalAuthQuery`, no arguments, the caller's own bets, `[]` when logged out). The Home balance uses the new `bets.myBalance`, which sums held points on the server from the status indexes; `getLockedPoints` is removed. Both have tests for the logged-out and other-user cases.

#### `hit_price` XP awarded outside the settlement transaction (part of #10)
**Fix (with #2):** `settleTouch` / `settleTouchDeadline` award XP in the same transaction via `applyBetXp()`, so overlapping poller runs can't double-award. Snapshot settlement is deferred; see Future review.
