import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalculatorVariable } from "@/types/bpu";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VariableAutocompleteProps {
  value: string | number;
  variables: CalculatorVariable[];
  onSelect: (variable: CalculatorVariable) => void;
  onChange: (value: string) => void;
  resolvedValue?: number;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const VariableAutocomplete = ({
  value,
  variables,
  onSelect,
  onChange,
  resolvedValue,
  className,
  placeholder = "Quantité ou $variable",
  disabled = false,
}: VariableAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const isLinkedVariable = String(value).startsWith("$");
  const linkedVariable = isLinkedVariable 
    ? variables.find(v => v.name === String(value))
    : null;

  useEffect(() => {
    // When editing, show the variable name, otherwise show the resolved value
    if (document.activeElement === inputRef.current) {
      setSearchValue(String(value));
    } else {
      // When not editing, show resolved value if it's a linked variable
      if (isLinkedVariable && resolvedValue !== undefined) {
        setSearchValue(String(resolvedValue));
      } else {
        setSearchValue(String(value));
      }
    }
  }, [value, isLinkedVariable, resolvedValue]);

  const handleInputChange = (newValue: string) => {
    setSearchValue(newValue);
    onChange(newValue);

    // Open dropdown when user types $
    if (newValue.includes("$")) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    const trimmedValue = searchValue.trim();
    
    // Check if it's supposed to be a variable
    if (trimmedValue.startsWith("$")) {
      const variableExists = variables.some(v => v.name === trimmedValue);
      
      if (!variableExists && variables.length > 0) {
        toast.error("Variable introuvable", {
          description: `La variable "${trimmedValue}" n'existe pas dans le calculateur.`,
        });
      }
    }
    
    // Update display to show resolved value when not editing
    if (isLinkedVariable && resolvedValue !== undefined) {
      setSearchValue(String(resolvedValue));
    }
    
    // Don't close immediately if focus moves to the popover
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('[role="dialog"]')) {
      setTimeout(() => {
        setOpen(false);
      }, 150);
    }
  };

  const handleFocus = () => {
    // When focusing, show the variable name or current value for editing
    setSearchValue(String(value));
  };

  const handleSelect = (variable: CalculatorVariable) => {
    setSearchValue(variable.name);
    onChange(variable.name);
    onSelect(variable);
    setOpen(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  // Filter variables based on search
  const filteredVariables = searchValue === "$" 
    ? variables  // Show ALL variables when only $ is typed
    : searchValue.startsWith("$") && searchValue.length > 1
      ? variables.filter(v => 
          v.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          v.label.toLowerCase().includes(searchValue.slice(1).toLowerCase())
        )
      : variables;

  // Group by category
  const groupedVariables = filteredVariables.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {} as Record<string, CalculatorVariable[]>);

  const inputClasses = cn(
    "h-9 px-2 text-sm border rounded-md",
    isLinkedVariable && "bg-muted text-orange-500 font-medium",
    !isLinkedVariable && "bg-background",
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  return (
    <div className="flex items-center gap-1 w-full relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              ref={inputRef}
              value={searchValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onClick={(e) => e.stopPropagation()}
              disabled={disabled}
              placeholder={placeholder}
              className={inputClasses}
              title={isLinkedVariable ? `Variable liée: ${value} = ${resolvedValue}` : undefined}
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
                  <CommandEmpty>Aucune variable trouvée pour "{searchValue}"</CommandEmpty>
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
      
      {isLinkedVariable && (
        <Lock className="h-3 w-3 text-orange-500 flex-shrink-0" />
      )}
    </div>
  );
};
