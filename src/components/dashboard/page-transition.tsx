"use client";

import { useLayoutEffect, useRef, ViewTransition } from "react";

// React renders browser back/forward (popstate) synchronously, so no view
// transition starts for them. Those navigations play the page's entrance
// here instead, with the same motion as globals.css.
const TRAVERSAL_WINDOW_MS = 1000;
let traversedAt = 0;

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    traversedAt = performance.now();
  });
}

const justTraversed = () =>
  performance.now() - traversedAt < TRAVERSAL_WINDOW_MS;

const EASE_OUT = "cubic-bezier(0, 0, 0.2, 1)";
// Where Feed's main carousel card sits; matches globals.css.
const PAGE_ORIGIN = "50% 245px";

function playEntrance(element: HTMLElement, page: "home" | "feed") {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  if (page === "home") {
    element.style.transformOrigin = PAGE_ORIGIN;
    element.animate(
      [
        { opacity: 0, transform: "scale(0.92)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      { id: "page-entrance", duration: 210, easing: EASE_OUT },
    );
  } else {
    element.animate([{ opacity: 0 }, { opacity: 1 }], {
      id: "page-entrance",
      duration: 180,
      easing: "ease-out",
    });
  }
}

/**
 * Home <-> Feed content transition. Each page knows its own direction, so it
 * plays however you get there. Wraps the content only; headers crossfade with
 * HeaderTransition.
 */
export function PageTransition({
  page,
  className,
  children,
}: {
  page: "home" | "feed";
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const home = page === "home";

  useLayoutEffect(() => {
    if (!justTraversed()) return;
    if (ref.current) playEntrance(ref.current, page);
  }, [page]);

  return (
    <ViewTransition
      enter={home ? "expand-in" : "collapse-in"}
      exit={home ? "collapse-out" : "expand-out"}
      default="none"
    >
      <div ref={ref} className={className}>
        {children}
      </div>
    </ViewTransition>
  );
}

/** A page header: crossfades with the other page's, with no movement. */
export function HeaderTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!justTraversed() || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 180,
      easing: "ease-out",
    });
  }, []);

  return (
    <ViewTransition enter="header-in" exit="header-out" default="none">
      <div ref={ref}>{children}</div>
    </ViewTransition>
  );
}
