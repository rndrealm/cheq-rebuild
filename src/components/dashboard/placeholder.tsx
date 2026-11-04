import { cn } from "@/lib/utils";

// Grey stand-in for a dashboard section that hasn't been designed yet.
export function Placeholder({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-[20px] bg-fg-base/10",
        className,
      )}
    >
      <span className="text-caption font-semibold text-fg-300">{label}</span>
    </div>
  );
}
