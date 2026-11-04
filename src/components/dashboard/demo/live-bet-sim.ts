// A simulated market for the live bet widget demo (/demo/live-bet).
//
// Bets run in real time but with short windows (a few minutes), so the
// widget's countdown, "2m ago" and chart all work unchanged. Prices are random
// walks with momentum (so they trend and swing rather than jitter), stepped
// once a second. Checkpoints come from the real `detectCheckpoints`, the same
// rules the server poller uses. Bets that end or hit their target restart.
import type { Id } from "../../../../convex/_generated/dataModel";
import { detectCheckpoints } from "../../../../convex/lib/checkpoints";
import { isTargetHit } from "../../../../convex/lib/touch";
import type { ChartPoint } from "@/hooks/use-bet-chart";
import type { BetChartData, BetEvent, LiveBet } from "./demo-live-bet-widget";

export const DEMO_VIEWER_ID = "demo_viewer" as Id<"users">;

const STEP_MS = 1000;
// Momentum: each step keeps this share of the previous step's move.
const MOMENTUM = 0.85;

type Template = {
  key: string;
  type: LiveBet["type"];
  symbol: string;
  symbolB?: string;
  startPrice: number;
  startPriceB?: number;
  betTerms: LiveBet["betTerms"];
  // Thresholds and buffers follow this duration's rules; the window itself is
  // `windowMs` so the demo moves quickly.
  duration: LiveBet["duration"];
  windowMs: number;
  // Share of the window already played when the demo opens or restarts.
  playedOnOpen: number;
  // Typical total move over the window (std of the random walk).
  swing: number;
  // Steady pull per step (hit_price: toward the target).
  drift?: number;
  // token_vs_token: how much the two tokens move together (0–1).
  correlation?: number;
  viewerIsCreator: boolean;
  rival: string;
  creatorWager: number;
  opponentWager: number;
};

const TEMPLATES: Template[] = [
  {
    key: "near",
    type: "up_down",
    symbol: "NEAR",
    startPrice: 2.4137,
    betTerms: { direction: "up" },
    duration: "1h",
    windowMs: 5 * 60_000,
    playedOnOpen: 0.4,
    swing: 0.006,
    viewerIsCreator: true,
    rival: "degenkate",
    creatorWager: 50,
    opponentWager: 50,
  },
  {
    key: "fet-render",
    type: "token_vs_token",
    symbol: "FET",
    symbolB: "RENDER",
    startPrice: 0.6214,
    startPriceB: 3.0841,
    betTerms: { creatorSide: "tokenB" },
    duration: "1h",
    windowMs: 6 * 60_000,
    playedOnOpen: 0.3,
    swing: 0.008,
    correlation: 0.6,
    viewerIsCreator: false,
    rival: "aiwhale",
    creatorWager: 75,
    opponentWager: 75,
  },
  {
    key: "inj",
    type: "hit_price",
    symbol: "INJ",
    startPrice: 9.842,
    // Target is set 5% above the start (HIT_TARGET_ABOVE_START).
    betTerms: { direction: "up" },
    duration: "1h",
    windowMs: 4 * 60_000,
    playedOnOpen: 0.25,
    swing: 0.012,
    drift: 0.0002,
    viewerIsCreator: true,
    rival: "shortsqueeze",
    creatorWager: 100,
    opponentWager: 100,
  },
];

// Far enough that "within 1% of target" is a real moment, not the start.
const HIT_TARGET_ABOVE_START = 0.05;

type Leg = { price: number; momentum: number; points: ChartPoint[] };

type SimBet = {
  template: Template;
  round: number;
  bet: LiveBet;
  legs: Leg[];
  events: BetEvent[]; // newest first
  lastStepAt: number;
  eventCount: number;
};

export type SimSnapshot = {
  bets: LiveBet[];
  events: Record<string, BetEvent[]>;
  charts: Record<string, BetChartData>;
};

// Standard normal sample (Box–Muller).
function gaussian(): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeBet(t: Template, round: number, startedAt: number): LiveBet {
  const id = `demo_${t.key}_${round}` as Id<"bets">;
  const rivalId = `demo_${t.rival}` as Id<"users">;
  const betTerms =
    t.type === "hit_price"
      ? {
          ...t.betTerms,
          targetPrice: +(t.startPrice * (1 + HIT_TARGET_ABOVE_START)).toFixed(3),
        }
      : t.betTerms;
  return {
    _id: id,
    _creationTime: startedAt,
    creatorId: t.viewerIsCreator ? DEMO_VIEWER_ID : rivalId,
    opponentId: t.viewerIsCreator ? rivalId : DEMO_VIEWER_ID,
    type: t.type,
    status: "active",
    token: { symbol: t.symbol },
    tokenB: t.symbolB ? { symbol: t.symbolB } : undefined,
    betTerms,
    creatorWager: t.creatorWager,
    opponentWager: t.opponentWager,
    priceAtCreation: t.startPrice,
    priceAtCreationB: t.startPriceB,
    priceAtStart: t.startPrice,
    priceAtStartB: t.startPriceB,
    startedAt,
    duration: t.duration,
    expiresAt: startedAt + t.windowMs,
    resolvesAt: startedAt + t.windowMs,
    counterCount: 0,
    updatedAt: startedAt,
    isCreator: t.viewerIsCreator,
    rival: { id: rivalId, name: t.rival, username: t.rival },
  };
}

function startRound(t: Template, round: number, now: number): SimBet {
  const startedAt = now - Math.round(t.windowMs * t.playedOnOpen);
  const bet = makeBet(t, round, startedAt);
  const legs: Leg[] = [
    { price: t.startPrice, momentum: 0, points: [{ t: startedAt, v: t.startPrice }] },
  ];
  if (t.startPriceB !== undefined) {
    legs.push({
      price: t.startPriceB,
      momentum: 0,
      points: [{ t: startedAt, v: t.startPriceB }],
    });
  }
  const sim: SimBet = {
    template: t,
    round,
    bet,
    legs,
    events: [],
    lastStepAt: startedAt,
    eventCount: 0,
  };
  // Play the history up to now so the chart and updates aren't empty.
  advance(sim, now);
  return sim;
}

// One price step for every leg.
function stepPrices(sim: SimBet) {
  const t = sim.template;
  const steps = t.windowMs / STEP_MS;
  // Per-step noise so the walk's total std over the window ≈ `swing`
  // (momentum amplifies noise by ~1/(1 − MOMENTUM)).
  const noise = (t.swing * (1 - MOMENTUM)) / Math.sqrt(steps);
  const shared = gaussian();
  const corr = t.correlation ?? 0;

  for (const leg of sim.legs) {
    const shock =
      sim.legs.length > 1
        ? Math.sqrt(corr) * shared + Math.sqrt(1 - corr) * gaussian()
        : shared;
    leg.momentum = MOMENTUM * leg.momentum + noise * shock;
    leg.price *= 1 + leg.momentum + (t.drift ?? 0);
  }
}

// Steps prices from the last step up to `now`, recording checkpoints along the
// way. Returns false once the bet has ended (or hit its target).
function advance(sim: SimBet, now: number): boolean {
  const { bet } = sim;
  while (sim.lastStepAt + STEP_MS <= now) {
    const at = sim.lastStepAt + STEP_MS;
    if (at >= bet.resolvesAt) return false;
    sim.lastStepAt = at;

    stepPrices(sim);
    const [a, b] = sim.legs;
    a.points.push({ t: at, v: a.price });
    b?.points.push({ t: at, v: b.price });

    if (bet.type === "hit_price" && isTargetHit(bet.betTerms, a.price)) {
      return false;
    }

    const found = detectCheckpoints({
      bet,
      priceA: a.price,
      priceB: b?.price,
      now: at,
      fired: sim.events,
    });
    for (const checkpoint of found) {
      sim.eventCount++;
      sim.events = [
        {
          _id: `${bet._id}_e${sim.eventCount}` as Id<"betEvents">,
          _creationTime: at,
          betId: bet._id,
          at,
          price: a.price,
          priceB: b?.price,
          ...checkpoint,
        },
        ...sim.events,
      ];
    }
  }
  return true;
}

/**
 * The running simulation. Subscribe with `useSyncExternalStore`; the snapshot
 * object is replaced on every tick and stable in between.
 */
let nextSimId = 1;

export class LiveBetSim {
  readonly id = nextSimId++;
  private bets: SimBet[];
  private listeners = new Set<() => void>();
  private snapshot: SimSnapshot;

  constructor(now: number) {
    this.bets = TEMPLATES.map((t) => startRound(t, 0, now));
    this.snapshot = this.buildSnapshot();
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  tick(now: number) {
    this.bets = this.bets.map((sim) =>
      advance(sim, now) ? sim : startRound(sim.template, sim.round + 1, now),
    );
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) listener();
  }

  // After a pause: move every bet's clock forward so the windows, points and
  // events line up with real time again.
  shift(ms: number) {
    for (const sim of this.bets) {
      sim.bet = {
        ...sim.bet,
        startedAt: (sim.bet.startedAt ?? 0) + ms,
        resolvesAt: sim.bet.resolvesAt + ms,
        expiresAt: sim.bet.expiresAt + ms,
      };
      sim.lastStepAt += ms;
      for (const leg of sim.legs) {
        leg.points = leg.points.map((p) => ({ t: p.t + ms, v: p.v }));
      }
      sim.events = sim.events.map((e) => ({ ...e, at: e.at + ms }));
    }
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) listener();
  }

  private buildSnapshot(): SimSnapshot {
    const events: SimSnapshot["events"] = {};
    const charts: SimSnapshot["charts"] = {};
    for (const sim of this.bets) {
      events[sim.bet._id] = sim.events;
      const [a, b] = sim.legs;
      charts[sim.bet._id] = {
        a: { points: [...a.points], latest: a.price },
        b: b ? { points: [...b.points], latest: b.price } : null,
      };
    }
    return { bets: this.bets.map((s) => s.bet), events, charts };
  }
}
