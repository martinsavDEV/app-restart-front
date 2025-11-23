import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EditableCellTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  align?: "left" | "right";
  maxLength?: number;
  placeholder?: string;
}

export const EditableCellText = ({
  value,
  onChange,
  className,
  align = "left",
  maxLength = 200,
  placeholder = "Cliquez pour modifier",
}: EditableCellTextProps) => {
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
    setEditValue(value);
    setIsEditing(true);
  };

  const handleBlur = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue.length > 0 && trimmedValue.length <= maxLength) {
      onChange(trimmedValue);
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
        maxLength={maxLength}
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
        !value && "text-muted-foreground italic",
        className
      )}
      title="Double-cliquez pour modifier"
    >
      {value || placeholder}
    </div>
  );
};
