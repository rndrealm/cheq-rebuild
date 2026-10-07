import { Header } from "@/components/home/header";
import { Hero } from "@/components/home/hero";
import React from "react";

export default function Page() {
  return (
    <div className="w-full py-8">
      <Header />

      <div className="flex flex-col mt-32 gap-22">
        <div className="max-w-149.25 mx-auto w-full">
          <h1 className="font-geist font-medium text-display leading-16 tracking-[-2.4%] text-center text-[#161616]">
            Make predictions based on the market
          </h1>
        </div>
        <Hero />
      </div>
    </div>
  );
}
