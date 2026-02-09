import * as React from "react";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { parseLocaleNumber } from "@/lib/numpadDecimal";

interface NumericInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value: number;
  onValueChange: (value: number) => void;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onValueChange, onFocus, onBlur, onKeyDown, ...props }, ref) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState("");

    const commit = useCallback(() => {
      setIsEditing(false);
      const parsed = parseLocaleNumber(localValue);
      onValueChange(isNaN(parsed) ? 0 : parsed);
    }, [localValue, onValueChange]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsEditing(true);
      setLocalValue(value === 0 ? "" : String(value).replace(".", ","));
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      commit();
      onBlur?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        commit();
        e.currentTarget.blur();
      }
      onKeyDown?.(e);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={isEditing ? localValue : (value === 0 ? "0" : String(value).replace(".", ","))}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);
NumericInput.displayName = "NumericInput";

export { NumericInput };
