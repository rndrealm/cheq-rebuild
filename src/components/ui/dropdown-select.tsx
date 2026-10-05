"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface DropdownSelectOption {
  label: string;
  value: string;
  icon?: string;
  iconBg?: string;
  iconRotation?: string;
}

interface DropdownSelectProps {
  value: string;
  options: DropdownSelectOption[];
  onChange: (value: string) => void;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
}

export function DropdownSelect({
  value,
  options,
  onChange,
  align = "end",
  sideOffset = 8,
  triggerClassName,
  contentClassName,
  itemClassName,
}: DropdownSelectProps) {
  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-25 items-center justify-between rounded-[7px] bg-[#f3f3f3] py-1.75 pl-2.75 pr-2 text-xs font-medium text-[#111] shadow-[0_0_0_1px_rgba(0,0,0,0.06)] outline-none",
          triggerClassName,
        )}
      >
        {selectedLabel}
        <Image
          src="/media/chevron-down.svg"
          alt=""
          width={14}
          height={14}
          className="size-3.5"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "flex min-w-[162px] flex-col gap-1 rounded-[10px] bg-white p-2 shadow-[0_0_0_1px_#0000000A,0_4px_14px_0_#00000014]",
          contentClassName,
        )}
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-[30px] items-center gap-1.5 rounded-[10px] px-2 text-xs font-medium text-[#111]",
              option.value === value && "bg-[#f3f3f3]",
              itemClassName,
            )}
          >
            {option.icon && (
              <div
                className={cn(
                  "flex size-5 items-center justify-center overflow-clip rounded-[10px]",
                  option.iconBg,
                )}
              >
                <Image
                  src={option.icon}
                  alt=""
                  width={14}
                  height={14}
                  className={cn("size-3.5", option.iconRotation)}
                />
              </div>
            )}
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
