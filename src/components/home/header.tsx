"use client";
import React from "react";
import Link from "next/link";

export function Header() {
  return (
    <div className="max-w-3xl w-full h-16 mx-auto bg-[#FAFAFA] flex items-center justify-between rounded-[14px] shadow-[0_0_0_1px_#00000014] px-6">
      <div className="w-20 h-8 bg-[#F5F5F5] flex items-center justify-between blur-md">
        <p>CHEQ</p>
      </div>

      <div className="flex items-center">
        <Link href="#">
          <p className="text-[#646464] text-caption leading-[100%] tracking-normal p-3 font-display">
            About
          </p>
        </Link>
        <Link href="#">
          <div className="px-3 py-2.5 bg-[#0B0B0B] rounded-[8px]">
            <p className="text-white text-caption font-medium leading-[100%] tracking-normal font-display">
              Join Waitlist
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
