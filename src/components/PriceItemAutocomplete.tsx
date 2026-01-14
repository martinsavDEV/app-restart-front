import { useState, useEffect, useRef, useMemo } from "react";
import { usePriceItems } from "@/hooks/usePriceItems";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const lotLabels: Record<string, string> = {
  "terrassement": "Terrassement",
  "renforcement_sol": "Renforcement de sol",
  "fondations": "Fondations",
  "fondation": "Fondations",
  "electricite": "Électricité",
  "turbinier": "Turbinier",
  "turbine": "Turbine",
  "renforcement": "Renforcement",
};

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
  const { priceItems, isLoading } = usePriceItems();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  // Count price variants per item name (normalized)
  const variantsCountMap = useMemo(() => {
    const map = new Map<string, number>();
    priceItems?.forEach((item) => {
      const key = item.item.toLowerCase().trim();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [priceItems]);

  const getVariantsCount = (itemName: string) => {
    return variantsCountMap.get(itemName.toLowerCase().trim()) || 0;
  };

  const filteredItems = priceItems
    ?.filter((item) => item.item.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // Prioritize items from the current lot
      const aIsCurrentLot = lotCode && a.lot_code === lotCode;
      const bIsCurrentLot = lotCode && b.lot_code === lotCode;
      if (aIsCurrentLot && !bIsCurrentLot) return -1;
      if (!aIsCurrentLot && bIsCurrentLot) return 1;
      return a.item.localeCompare(b.item);
    })
    .slice(0, 15);

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
    if (newValue.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && open && filteredItems && filteredItems.length > 0) {
      e.preventDefault();
      handleSelect(filteredItems[0]);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('[role="dialog"]')) {
      if (search !== value) {
        onChange(search);
      }
      setTimeout(() => {
        setOpen(false);
      }, 150);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`text-xs h-7 ${className}`}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[450px] p-0 z-50 bg-popover" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Chargement...
              </div>
            ) : filteredItems && filteredItems.length > 0 ? (
              <CommandGroup>
                {filteredItems.map((item) => {
                  const variantsCount = getVariantsCount(item.item);
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.item}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(item);
                      }}
                      className="cursor-pointer text-xs"
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.item}</span>
                          {variantsCount > 1 && (
                            <Badge 
                              variant="secondary" 
                              className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] px-1.5 py-0 h-4"
                            >
                              {variantsCount} prix
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground flex flex-wrap gap-2 text-xs items-center">
                          <span className="bg-accent/50 px-1.5 py-0.5 rounded text-accent-foreground font-medium">
                            {lotLabels[item.lot_code] || item.lot_code}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {item.price_reference || "MSA 2025"}
                          </span>
                          <span>
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            }).format(item.unit_price)}
                            /{item.unit}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
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
