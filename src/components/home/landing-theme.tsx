"use client";

import {
  LANDING_ID,
  LANDING_THEME_KEY as STORAGE_KEY,
} from "@/lib/constants/landing";
import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect } from "react";

// Dark mode for the landing page only: .dark goes on the page's wrapper, whose
// .landing palette in globals.css switches with it. Follows the system setting until
// the visitor picks one with the toggle, which is remembered.
const DARK_QUERY = "(prefers-color-scheme: dark)";

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const setDark = (dark: boolean) =>
  document.getElementById(LANDING_ID)?.classList.toggle("dark", dark);

/**
 * Applies the theme while the HTML is still parsing, so a dark visitor never sees a
 * light first paint. Render it as the wrapper's first child. On the server it's a
 * live script; on the client (soft navigations) it's inert text, and ThemeToggle
 * applies the theme instead.
 */
export const LandingThemeScript = () => (
  <script
    type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
    suppressHydrationWarning
    dangerouslySetInnerHTML={{
      __html: `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");var d=t?t==="dark":matchMedia("${DARK_QUERY}").matches;if(d)document.getElementById("${LANDING_ID}").classList.add("dark")}catch(e){}})()`,
    }}
  />
);

export const ThemeToggle = () => {
  useEffect(() => {
    // Covers client-side navigations, where the inline script doesn't run
    const media = matchMedia(DARK_QUERY);
    const stored = readStored();
    setDark(stored ? stored === "dark" : media.matches);

    // Track the system setting until the visitor has chosen
    const handleChange = (e: MediaQueryListEvent) => {
      if (!readStored()) setDark(e.matches);
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const toggle = () => {
    const dark = !document.getElementById(LANDING_ID)?.classList.contains("dark");
    setDark(dark);
    try {
      localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      className="cursor-pointer rounded-[8px] p-3 text-(--landing-muted) outline-none focus-visible:ring-2 focus-visible:ring-(--landing-muted)/40"
      onClick={toggle}
    >
      {/* Picked by CSS, so it's right from the first paint and never mismatches */}
      <MoonIcon size={16} className="dark:hidden" />
      <SunIcon size={16} className="hidden dark:block" />
    </button>
  );
};
