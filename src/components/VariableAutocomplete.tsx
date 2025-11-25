import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalculatorVariable } from "@/types/bpu";
import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariableAutocompleteProps {
  value: string | number;
  variables: CalculatorVariable[];
  onSelect: (variable: CalculatorVariable) => void;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const VariableAutocomplete = ({
  value,
  variables,
  onSelect,
  onChange,
  className,
  placeholder = "Quantité ou $variable",
  disabled = false,
}: VariableAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const isLinkedVariable = String(value).startsWith("$");

  useEffect(() => {
    setSearchValue(String(value));
  }, [value]);

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

  const handleSelect = (variable: CalculatorVariable) => {
    setSearchValue(variable.name);
    onChange(variable.name);
    onSelect(variable);
    setOpen(false);
  };

  // Filter variables based on search
  const filteredVariables = variables.filter((v) =>
    v.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    v.label.toLowerCase().includes(searchValue.toLowerCase())
  );

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

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Input
            ref={inputRef}
            value={searchValue}
            onChange={(e) => handleInputChange(e.target.value)}
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
        <Link2 className="h-3 w-3 text-orange-500 flex-shrink-0" />
      )}
    </div>
  );
};
