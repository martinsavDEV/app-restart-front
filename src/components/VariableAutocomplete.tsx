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
    setSearchValue(String(value));
  }, [value]);

  const handleInputChange = (newValue: string) => {
    setSearchValue(newValue);
    onChange(newValue);

    // Open dropdown ONLY when user types $
    if (newValue.includes("$")) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Open dropdown when user types $
    if (e.key === "$" || (e.key === "4" && e.shiftKey)) {
      setOpen(true);
    }
  };

  const handleBlur = () => {
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
  };

  const handleSelect = (variable: CalculatorVariable) => {
    setSearchValue(variable.name);
    onChange(variable.name);
    onSelect(variable);
    setOpen(false);
  };

  // Filter variables based on search
  const searchTerm = searchValue.startsWith("$") ? searchValue : `$${searchValue}`;
  const filteredVariables = searchValue.length > 0
    ? variables.filter((v) =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.label.toLowerCase().includes(searchValue.replace("$", "").toLowerCase())
      )
    : variables;

  // Group by category
  const groupedVariables = filteredVariables.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {} as Record<string, CalculatorVariable[]>);

  const cellClasses = cn(
    "h-9 px-2 text-sm border rounded-md",
    isLinkedVariable && "bg-muted text-orange-500 font-medium",
    !isLinkedVariable && "bg-background",
    className
  );

  // Display value for linked variables: $name = value 🔒
  const displayValue = isLinkedVariable && linkedVariable && resolvedValue !== undefined
    ? `${linkedVariable.name} = ${resolvedValue}`
    : searchValue;

  return (
    <div className="flex items-center gap-1 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Input
            ref={inputRef}
            value={displayValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={cellClasses}
          />
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>Aucune variable trouvée</CommandEmpty>
              {Object.entries(groupedVariables).map(([category, vars]) => (
                <CommandGroup key={category} heading={category}>
                  {vars.map((variable) => (
                    <CommandItem
                      key={variable.name}
                      value={variable.name}
                      onSelect={() => handleSelect(variable)}
                      className="flex justify-between"
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
