"use client";

import dynamic from "next/dynamic";

// The demo runs on the clock and randomness, so it renders on the client only.
const LiveBetDemo = dynamic(
  () =>
    import("@/components/dashboard/demo/live-bet-demo").then(
      (m) => m.LiveBetDemo,
    ),
  { ssr: false },
);

export default function LiveBetDemoPage() {
  return <LiveBetDemo />;
}
