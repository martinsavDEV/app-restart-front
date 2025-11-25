import { useState, useEffect, useRef } from "react";
import { usePriceItems } from "@/hooks/usePriceItems";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PriceItemAutocompleteProps {
  value: string;
  lotCode?: string;
  onSelect: (item: {
    designation: string;
    unit: string;
    unitPrice: number;
    priceSource: string;
  }) => void;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const PriceItemAutocomplete = ({
  value,
  lotCode,
  onSelect,
  onChange,
  className = "",
  placeholder = "Désignation",
}: PriceItemAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const { priceItems, isLoading } = usePriceItems(lotCode);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const filteredItems = priceItems?.filter((item) =>
    item.item.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10);

  const handleSelect = (item: any) => {
    onSelect({
      designation: item.item,
      unit: item.unit,
      unitPrice: item.unit_price,
      priceSource: item.price_reference || "MSA 2025",
    });
    setSearch(item.item);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setSearch(newValue);
    onChange(newValue);
    if (newValue.length > 0 && !open) {
      setOpen(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false);
    }, 200);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (search.length > 0) setOpen(true);
            }}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`text-xs h-7 ${className}`}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Chargement...
              </div>
            ) : filteredItems && filteredItems.length > 0 ? (
              <CommandGroup>
                {filteredItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.item}
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer text-xs"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="font-medium">{item.item}</div>
                      <div className="text-muted-foreground flex gap-3">
                        <span>
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(item.unit_price)}
                          /{item.unit}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {item.price_reference || "MSA 2025"}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandEmpty className="py-6 text-xs">
                Aucun prix trouvé. Vous pouvez saisir manuellement.
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
