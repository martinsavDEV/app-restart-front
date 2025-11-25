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

  const handleKeyDownWrapper = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      handleBlur();
      // Find next cell
      const currentCell = e.currentTarget.closest('td');
      if (currentCell) {
        const nextCell = currentCell.nextElementSibling;
        if (nextCell?.querySelector('[data-editable-cell]')) {
          (nextCell.querySelector('[data-editable-cell]') as HTMLElement)?.focus();
        } else {
          // End of row, go to first cell of next row
          const currentRow = currentCell.closest('tr');
          const nextRow = currentRow?.nextElementSibling;
          if (nextRow) {
            const firstEditableCell = nextRow.querySelector('[data-editable-cell]') as HTMLElement;
            firstEditableCell?.focus();
          }
        }
      }
    } else {
      handleKeyDown(e);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDownWrapper}
        maxLength={maxLength}
        className={cn("h-8 text-xs px-2", align === "right" && "text-right", className)}
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      tabIndex={0}
      data-editable-cell
      onFocus={handleDoubleClick}
      className={cn(
        "cursor-pointer hover:bg-muted/50 px-2 rounded transition-colors h-8 flex items-center outline-none focus:ring-1 focus:ring-primary",
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
