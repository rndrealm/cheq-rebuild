import { Header } from "@/components/home/header";
import { Hero } from "@/components/home/hero";
import { LandingThemeScript } from "@/components/home/landing-theme";
import { LANDING_ID } from "@/lib/constants/landing";
import Section1 from "@/components/home/section1";
import React from "react";

export default function Page() {
  return (
    // .landing scopes the page's palette; the theme script may add .dark before
    // hydration, hence suppressHydrationWarning
    <div
      id={LANDING_ID}
      className="landing min-h-screen w-full py-8 bg-(--landing-bg)"
      suppressHydrationWarning
    >
      <LandingThemeScript />
      <Header />

      <div className="flex flex-col mt-32 ">
        <div className="max-w-149.25 mx-auto w-full">
          <h1 className="font-geist font-medium text-display leading-16 tracking-[-2.4%] text-center text-(--landing-heading)">
            Make predictions based on the market
          </h1>
        </div>
        <Hero />
        <Section1 />
      </div>
    </div>
  );
}
