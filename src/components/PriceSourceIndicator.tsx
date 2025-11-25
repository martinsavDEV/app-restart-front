import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { usePriceItems } from "@/hooks/usePriceItems";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";

interface PriceSourceIndicatorProps {
  designation: string;
  currentUnitPrice: number;
  priceSource: string;
  lotCode?: string;
  onUpdate: (newPrice: number, newSource: string) => void;
  onChange: (value: string) => void;
}

export const PriceSourceIndicator = ({
  designation,
  currentUnitPrice,
  priceSource,
  lotCode,
  onUpdate,
  onChange,
}: PriceSourceIndicatorProps) => {
  const { priceItems } = usePriceItems(lotCode);
  const [dbPrice, setDbPrice] = useState<number | null>(null);
  const [dbSource, setDbSource] = useState<string>("");

  useEffect(() => {
    if (!priceItems || priceItems.length === 0 || !designation) {
      setDbPrice(null);
      return;
    }

    // Chercher le prix dans la BDD par designation (item)
    const matchingItem = priceItems.find(
      (item) => item.item.toLowerCase() === designation.toLowerCase()
    );

    if (matchingItem) {
      setDbPrice(matchingItem.unit_price);
      setDbSource(matchingItem.price_reference || "BDD");
    } else {
      setDbPrice(null);
    }
  }, [priceItems, designation]);

  const priceDiff = dbPrice !== null ? dbPrice - currentUnitPrice : 0;
  const hasDifference = dbPrice !== null && Math.abs(priceDiff) > 0.01;
  const percentDiff = currentUnitPrice > 0 
    ? ((priceDiff / currentUnitPrice) * 100).toFixed(1)
    : "0";

  const handleUpdate = () => {
    if (dbPrice !== null) {
      onUpdate(dbPrice, dbSource);
    }
  };

  if (!hasDifference) {
    return (
      <input
        type="text"
        value={priceSource}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-none focus:outline-none text-sm"
      />
    );
  }

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer">
          <input
            type="text"
            value={priceSource}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm"
          />
          {priceDiff > 0 ? (
            <ArrowUp className="w-4 h-4 text-green-600 flex-shrink-0" />
          ) : (
            <ArrowDown className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prix actuel:</span>
              <span className="font-medium">
                {currentUnitPrice.toLocaleString("fr-FR")} €
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prix BDD:</span>
              <span className="font-medium">
                {dbPrice?.toLocaleString("fr-FR")} €
                <span
                  className={`ml-2 ${
                    priceDiff > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ({priceDiff > 0 ? "+" : ""}
                  {percentDiff}%)
                </span>
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleUpdate}
              size="sm"
              className="flex-1"
            >
              Mettre à jour
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                // Just close the hover card
              }}
            >
              Ignorer
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
