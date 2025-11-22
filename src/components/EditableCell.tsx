import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EditableCellProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  align?: "left" | "right";
  format?: (value: number) => string;
  parse?: (value: string) => number;
}

export const EditableCell = ({
  value,
  onChange,
  className,
  align = "left",
  format = (v) => v.toString(),
  parse = (v) => parseFloat(v.replace(/[^\d.,]/g, "").replace(",", ".")),
}: EditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setEditValue(value.toString());
    setIsEditing(true);
  };

  const handleBlur = () => {
    const parsedValue = parse(editValue);
    if (!isNaN(parsedValue) && parsedValue >= 0) {
      onChange(parsedValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn("h-8 text-xs", align === "right" && "text-right", className)}
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={cn(
        "cursor-pointer hover:bg-muted/50 px-2 py-1.5 rounded transition-colors min-h-[32px] flex items-center",
        align === "right" && "justify-end",
        className
      )}
      title="Double-cliquez pour modifier"
    >
      {format(value)}
    </div>
  );
};
