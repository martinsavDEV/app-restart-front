import { useState } from "react";

export const useLineSelection = () => {
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [copiedLine, setCopiedLine] = useState<any>(null);

  const toggleLineSelection = (lineId: string) => {
    setSelectedLines((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lineId)) {
        newSet.delete(lineId);
      } else {
        newSet.add(lineId);
      }
      return newSet;
    });
  };

  const selectAll = (lineIds: string[]) => {
    setSelectedLines(new Set(lineIds));
  };

  const clearSelection = () => {
    setSelectedLines(new Set());
  };

  const isSelected = (lineId: string) => {
    return selectedLines.has(lineId);
  };

  const copyLine = (line: any) => {
    setCopiedLine({
      designation: line.designation,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      priceSource: line.priceSource,
      section: line.section,
    });
  };

  return {
    selectedLines,
    toggleLineSelection,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount: selectedLines.size,
    copiedLine,
    copyLine,
  };
};
