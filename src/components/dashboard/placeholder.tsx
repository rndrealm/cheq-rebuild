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
        "flex items-center justify-center rounded-[20px] bg-gray-5",
        className,
      )}
    >
      <span className="text-caption font-semibold text-gray-11">{label}</span>
    </div>
  );
}
