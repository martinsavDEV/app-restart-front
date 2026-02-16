import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalculatorVariable } from "@/types/bpu";
import { Lock, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { isFormula, evaluateFormula, hasVariables, evaluateFormulaWithVariables } from "@/lib/formulaUtils";

interface QuantityFormulaInputProps {
  value: number;
  formula?: string | null;
  linkedVariable?: string | null;
  variables: CalculatorVariable[];
  onUpdate: (updates: { 
    quantity: number; 
    quantity_formula?: string | null;
    linkedVariable?: string | null;
  }) => void;
  resolvedValue?: number;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

// Extract the $variable token under the cursor
const getCurrentVariableToken = (input: string, cursorPos: number): { token: string; startIndex: number; endIndex: number } | null => {
  // Search backwards from cursor for a '$'
  let start = -1;
  for (let i = cursorPos - 1; i >= 0; i--) {
    const ch = input[i];
    if (ch === '$') { start = i; break; }
    if (!/[a-zA-Z0-9_]/.test(ch)) break;
  }
  if (start === -1) return null;
  // Everything from '$' to cursor must be valid variable chars
  const token = input.substring(start, cursorPos);
  if (!/^\$[a-zA-Z0-9_]*$/.test(token)) return null;
  return { token, startIndex: start, endIndex: cursorPos };
};

export const QuantityFormulaInput = ({
  value,
  formula,
  linkedVariable,
  variables,
  onUpdate,
  resolvedValue,
  className,
  placeholder = "Quantité, formule ou $variable",
  disabled = false,
}: QuantityFormulaInputProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [activeToken, setActiveToken] = useState<{ token: string; startIndex: number; endIndex: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLinkedVariable = !!linkedVariable && /^\$[a-zA-Z_][a-zA-Z0-9_]*$/.test(linkedVariable);
  const hasFormulaStored = !!formula && formula.length > 0;
  const formulaHasVariables = hasFormulaStored && formula ? hasVariables(formula) : false;
  
  // Find the linked variable for display
  const linkedVar = isLinkedVariable 
    ? variables.find(v => v.name === linkedVariable)
    : null;

  // Determine the display value
  const displayValue = isLinkedVariable 
    ? (resolvedValue ?? linkedVar?.value ?? value)
    : value;

  // Update input value when not editing
  useEffect(() => {
    if (!isEditing) {
      // When not editing, show the numeric result
      setInputValue(formatDisplayNumber(displayValue));
    }
  }, [displayValue, isEditing]);

  const formatDisplayNumber = (num: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleFocus = () => {
    setIsEditing(true);
    // When focusing, show the raw formula/variable for editing
    if (isLinkedVariable && linkedVariable) {
      setInputValue(linkedVariable);
    } else if (hasFormulaStored && formula) {
      setInputValue(formula);
    } else {
      setInputValue(String(value));
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't close immediately if focus moves to the popover
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.closest('[role="dialog"]')) {
      return;
    }

    setTimeout(() => {
      setIsEditing(false);
      setOpen(false);
      
      const trimmedValue = inputValue.trim();
      
      // Handle empty input
      if (!trimmedValue) {
        onUpdate({ 
          quantity: 0, 
          quantity_formula: null, 
          linkedVariable: null 
        });
        return;
      }

      // Handle pure variable reference (just "$var_name" with no operators)
      if (trimmedValue.startsWith("$") && !isFormula(trimmedValue)) {
        const matchingVar = variables.find(v => v.name === trimmedValue);
        if (matchingVar) {
          onUpdate({
            quantity: matchingVar.value,
            quantity_formula: null,
            linkedVariable: trimmedValue,
          });
        } else if (variables.length > 0) {
          toast.error("Variable introuvable", {
            description: `La variable "${trimmedValue}" n'existe pas dans le calculateur.`,
          });
        }
        return;
      }

      // Handle formula (may contain $variables)
      if (isFormula(trimmedValue)) {
        let result: number | null;
        if (hasVariables(trimmedValue)) {
          result = evaluateFormulaWithVariables(trimmedValue, variables);
        } else {
          result = evaluateFormula(trimmedValue);
        }
        if (result !== null) {
          onUpdate({
            quantity: result,
            quantity_formula: trimmedValue,
            linkedVariable: null,
          });
        } else {
          toast.error("Formule invalide", {
            description: `Impossible d'évaluer "${trimmedValue}"`,
          });
        }
        return;
      }

      // Handle simple number
      const numValue = parseFloat(trimmedValue.replace(/[^\d.,\-]/g, "").replace(",", "."));
      if (!isNaN(numValue)) {
        onUpdate({
          quantity: numValue,
          quantity_formula: null,
          linkedVariable: null,
        });
      }
    }, 150);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);

    // Detect variable token at cursor position
    const cursorPos = inputRef.current?.selectionStart ?? newValue.length;
    const token = getCurrentVariableToken(newValue, cursorPos);
    setActiveToken(token);

    if (token) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleSelect = (variable: CalculatorVariable) => {
    if (activeToken) {
      // Replace only the active token in the input
      const before = inputValue.substring(0, activeToken.startIndex);
      const after = inputValue.substring(activeToken.endIndex);
      const newValue = before + variable.name + after;
      setInputValue(newValue);
      
      // Place cursor right after the inserted variable name
      const newCursorPos = before.length + variable.name.length;
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    } else {
      setInputValue(variable.name);
    }
    setActiveToken(null);
    setOpen(false);
    // Do NOT blur or call onUpdate - user may continue typing
  };

  // Filter variables based on the active token under cursor
  const getFilteredVariables = () => {
    if (!activeToken) return variables;
    
    const query = activeToken.token.replace(/^\$/, "").toLowerCase();
    if (query.length === 0) return variables;
    
    return variables.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.name.toLowerCase().includes(`$${query}`) ||
        v.label.toLowerCase().includes(query)
    );
  };
  
  const filteredVariables = getFilteredVariables();

  // Group by category
  const groupedVariables = filteredVariables.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {} as Record<string, CalculatorVariable[]>);

  // Build tooltip content
  const getTooltipContent = () => {
    if (isLinkedVariable) {
      return `Variable: ${linkedVariable} = ${formatDisplayNumber(displayValue)}`;
    }
    if (hasFormulaStored) {
      return `Formule: ${formula} = ${formatDisplayNumber(displayValue)}`;
    }
    return null;
  };

  const tooltipContent = getTooltipContent();

  const inputClasses = cn(
    "h-9 px-2 text-sm border rounded-md text-right tabular-nums",
    (isLinkedVariable || formulaHasVariables) && "bg-muted text-orange-500 font-medium",
    hasFormulaStored && !isLinkedVariable && !formulaHasVariables && "bg-blue-50 text-blue-600 font-medium dark:bg-blue-950 dark:text-blue-400",
    !isLinkedVariable && !hasFormulaStored && !formulaHasVariables && "bg-background",
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  const renderInput = () => (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
            disabled={disabled}
            placeholder={placeholder}
            className={inputClasses}
          />
        </div>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0 z-[100] bg-popover border shadow-lg" 
        align="start"
        sideOffset={5}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {variables.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <p>Aucune variable disponible</p>
                <p className="text-xs mt-1">Configurez le Calculateur pour créer des variables</p>
              </div>
            ) : (
              <>
                <CommandEmpty>Aucune variable trouvée pour "{inputValue}"</CommandEmpty>
                {Object.entries(groupedVariables).map(([category, vars]) => (
                  <CommandGroup key={category} heading={`${category} (${vars.length})`}>
                    {vars.map((variable) => (
                      <CommandItem
                        key={variable.name}
                        value={variable.name}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelect(variable);
                        }}
                        className="flex justify-between cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-mono text-orange-500">{variable.name}</span>
                          <span className="text-xs text-muted-foreground">{variable.label}</span>
                        </div>
                        <span className="text-sm font-medium">{variable.value}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="flex items-center gap-1 w-full relative">
      {tooltipContent ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {renderInput()}
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{tooltipContent}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        renderInput()
      )}
      
      {isLinkedVariable && (
        <Lock className="h-3 w-3 text-orange-500 flex-shrink-0" />
      )}
      {hasFormulaStored && !isLinkedVariable && (
        <Calculator className="h-3 w-3 flex-shrink-0" style={{ color: formulaHasVariables ? 'rgb(249, 115, 22)' : 'rgb(59, 130, 246)' }} />
      )}
    </div>
  );
};
