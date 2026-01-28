import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalculatorVariable } from "@/types/bpu";
import { Lock, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { isFormula, evaluateFormula } from "@/lib/formulaUtils";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const isLinkedVariable = !!linkedVariable && linkedVariable.startsWith("$");
  const hasFormula = !!formula && isFormula(formula);
  
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
    // When focusing, show the raw value for editing
    if (isLinkedVariable && linkedVariable) {
      setInputValue(linkedVariable);
    } else if (hasFormula && formula) {
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

      // Handle variable reference
      if (trimmedValue.startsWith("$")) {
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

      // Handle formula
      if (isFormula(trimmedValue)) {
        const result = evaluateFormula(trimmedValue);
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

    // Open dropdown when user types $ OR when typing text that could be variable search
    // (starts with letter or underscore)
    if (newValue.includes("$") || /^[a-zA-Z_]/.test(newValue.trim())) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleSelect = (variable: CalculatorVariable) => {
    setInputValue(variable.name);
    onUpdate({
      quantity: variable.value,
      quantity_formula: null,
      linkedVariable: variable.name,
    });
    setOpen(false);
    setIsEditing(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  // Filter variables based on search - now works with or without $
  const getFilteredVariables = () => {
    const trimmed = inputValue.trim();
    
    // Show all variables when typing just $
    if (trimmed === "$") return variables;
    
    // If input contains $ or is text that could be a variable search
    if (trimmed.startsWith("$") || /^[a-zA-Z_]/.test(trimmed)) {
      const query = trimmed.replace(/^\$/, "").toLowerCase();
      if (query.length === 0) return variables;
      
      return variables.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.name.toLowerCase().includes(`$${query}`) ||
          v.label.toLowerCase().includes(query)
      );
    }
    
    return variables;
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
    if (hasFormula) {
      return `Formule: ${formula} = ${formatDisplayNumber(displayValue)}`;
    }
    return null;
  };

  const tooltipContent = getTooltipContent();

  const inputClasses = cn(
    "h-9 px-2 text-sm border rounded-md text-right tabular-nums",
    isLinkedVariable && "bg-muted text-orange-500 font-medium",
    hasFormula && !isLinkedVariable && "bg-blue-50 text-blue-600 font-medium dark:bg-blue-950 dark:text-blue-400",
    !isLinkedVariable && !hasFormula && "bg-background",
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
      {hasFormula && !isLinkedVariable && (
        <Calculator className="h-3 w-3 text-blue-500 flex-shrink-0" />
      )}
    </div>
  );
};
