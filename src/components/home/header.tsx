"use client";
import React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/home/landing-theme";

export function Header() {
  return (
    <div className="max-w-3xl w-full h-16 mx-auto bg-(--landing-surface) flex items-center justify-between rounded-[14px] shadow-[0_0_0_1px_var(--landing-surface-ring)] px-6">
      <div className="w-20 h-8 bg-(--landing-placeholder) text-(--landing-heading) flex items-center justify-between blur-md">
        <p>CHEQ</p>
      </div>

      <div className="flex items-center">
        <ThemeToggle />
        <Link href="#">
          <p className="text-(--landing-muted) text-caption leading-[100%] tracking-normal p-3 font-display">
            About
          </p>
        </Link>
        <Link href="#">
          <div className="px-3 py-2.5 bg-(--landing-cta) rounded-[8px]">
            <p className="text-(--landing-cta-fg) text-caption font-medium leading-[100%] tracking-normal font-display">
              Join Waitlist
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
