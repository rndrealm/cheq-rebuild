"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DemoLiveBetWidget } from "./demo-live-bet-widget";
import { DEMO_VIEWER_ID, LiveBetSim } from "./live-bet-sim";

/**
 * The demo copy of the live bet widget running on a simulated market. Client-only (uses
 * the clock and randomness), so load it with `dynamic(..., { ssr: false })`.
 * Press H to hide the controls for recording.
 */
export function LiveBetDemo() {
  const [sim, setSim] = useState(() => new LiveBetSim(Date.now()));
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const pausedAt = useRef<number | null>(null);

  // One price step per second while playing.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => sim.tick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [sim, paused]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "h" || e.key === "H") setShowControls((v) => !v);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function togglePause() {
    if (paused) {
      // Slide the bets' clocks forward by the pause so nothing jumps.
      if (pausedAt.current !== null) sim.shift(Date.now() - pausedAt.current);
      pausedAt.current = null;
      setPaused(false);
    } else {
      pausedAt.current = Date.now();
      setPaused(true);
    }
  }

  function restart() {
    pausedAt.current = null;
    setPaused(false);
    setSim(new LiveBetSim(Date.now()));
  }

  return (
    <div className="flex min-h-dvh flex-col items-center bg-[#f6f6f6] px-4 py-12">
      <div className="w-full max-w-100">
        {/* Keyed so a restart starts the widget fresh (back to bet 1). */}
        <SimWidget key={sim.id} sim={sim} />
      </div>

      {showControls && (
        <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-card p-1 shadow-[0_0_0_1px_var(--border),0px_4px_20px_0px_#00000014]">
          <button
            type="button"
            onClick={togglePause}
            className="h-9 cursor-pointer rounded-full px-4 text-caption font-semibold text-fg-base hover:bg-bg-300"
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={restart}
            className="h-9 cursor-pointer rounded-full px-4 text-caption font-semibold text-fg-base hover:bg-bg-300"
          >
            Restart
          </button>
          <span className="px-3 text-xs text-fg-300">H to hide</span>
        </div>
      )}
    </div>
  );
}

function SimWidget({ sim }: { sim: LiveBetSim }) {
  const snapshot = useSyncExternalStore(
    sim.subscribe,
    sim.getSnapshot,
    sim.getSnapshot,
  );

  return (
    <DemoLiveBetWidget
      bets={snapshot.bets}
      viewerId={DEMO_VIEWER_ID}
      events={snapshot.events}
      charts={snapshot.charts}
    />
  );
}
