import { Input } from "@/components/ui/input";
import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkedCellProps {
  value: number | string;
  isLinked?: boolean;
  isInput?: boolean;
  onChange?: (value: string) => void;
  disabled?: boolean;
  type?: "text" | "number";
  min?: number;
  className?: string;
}

export const LinkedCell = ({
  value,
  isLinked = false,
  isInput = false,
  onChange,
  disabled = false,
  type = "text",
  min,
  className,
}: LinkedCellProps) => {
  // Linked cells: gray background, orange text, with link icon
  // Input cells: light yellow background
  // Regular cells: default styling

  const cellClasses = cn(
    "h-7 px-2 text-xs border rounded-md",
    isLinked && "bg-muted text-orange-500 font-medium",
    isInput && !isLinked && "bg-amber-50 dark:bg-amber-950/30",
    !isLinked && !isInput && "bg-background",
    className
  );

  return (
    <div className="flex items-center gap-1">
      <Input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled || isLinked}
        className={cellClasses}
      />
      {isLinked && (
        <Link2 className="h-3 w-3 text-orange-500 flex-shrink-0" />
      )}
    </div>
  );
};