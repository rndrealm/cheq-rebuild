"use client";

import dynamic from "next/dynamic";

// Agentation: click any element in dev to annotate it and send structured feedback to an agent.
// Dev-only and client-only; never shipped to production bundles.
const Agentation = dynamic(
  () => import("agentation").then((m) => m.Agentation),
  { ssr: false },
);

export function DevTools() {
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <Agentation
      appName="Cheq"
      endpoint={process.env.NEXT_PUBLIC_AGENTATION_ENDPOINT || undefined}
    />
  );
}
