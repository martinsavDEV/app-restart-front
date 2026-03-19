import * as React from "react";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { parseLocaleNumber } from "@/lib/numpadDecimal";
import { evaluateFormula, isFormula } from "@/lib/formulaUtils";
import { cn } from "@/lib/utils";

interface NumericInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value: number;
  onValueChange: (value: number, formula?: string | null) => void;
  formula?: string | null;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onValueChange, formula, onFocus, onBlur, onKeyDown, className, ...props }, ref) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState("");

    const hasFormula = !!formula && formula.length > 0;

    const commit = useCallback(() => {
      setIsEditing(false);
      const trimmed = localValue.trim();
      
      // Try formula evaluation first (e.g. "1500+200", "3*(45+12)")
      if (isFormula(trimmed)) {
        const result = evaluateFormula(trimmed);
        if (result !== null) {
          onValueChange(result);
          onFormulaChange?.(trimmed);
          return;
        }
      }
      
      // Fallback: simple number parse — clear any stored formula
      const parsed = parseLocaleNumber(localValue);
      onValueChange(isNaN(parsed) ? 0 : parsed);
      onFormulaChange?.(null);
    }, [localValue, onValueChange, onFormulaChange]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsEditing(true);
      // Restore raw formula if one exists, otherwise show the number
      if (hasFormula) {
        setLocalValue(formula!);
      } else {
        setLocalValue(value === 0 ? "" : String(value).replace(".", ","));
      }
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
        className={cn(
          hasFormula && !isEditing && "text-blue-600 dark:text-blue-400 font-medium",
          className
        )}
        {...props}
      />
    );
  }
);
NumericInput.displayName = "NumericInput";

export { NumericInput };
