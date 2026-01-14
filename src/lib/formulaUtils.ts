/**
 * Utility functions for evaluating quantity formulas
 * Supports: +, -, *, /, x, ×, parentheses, brackets
 */

// Allowed characters: digits, operators, spaces, commas/dots, parentheses
const FORMULA_REGEX = /^[\d\s+\-*/x×(),.\[\]]+$/i;

/**
 * Normalize a formula for evaluation:
 * - Replace x/× with *
 * - Replace commas with dots
 * - Replace brackets with parentheses
 */
export const normalizeFormula = (formula: string): string => {
  return formula
    .replace(/[x×]/gi, '*')
    .replace(/,/g, '.')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')');
};

/**
 * Check if a string is a formula (contains an operator)
 */
export const isFormula = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;
  // Contains at least one math operator
  return /[+\-*/x×]/.test(value) && FORMULA_REGEX.test(value);
};

/**
 * Safely evaluate a formula string
 * Returns null if invalid or result is not a valid positive number
 */
export const evaluateFormula = (formula: string): number | null => {
  if (!formula || !FORMULA_REGEX.test(formula)) return null;
  
  try {
    const normalized = normalizeFormula(formula);
    // Use Function() instead of eval() for isolated scope
    const result = new Function(`return ${normalized}`)();
    
    if (typeof result !== 'number' || !isFinite(result) || result < 0) {
      return null;
    }
    return Math.round(result * 1000) / 1000; // Round to 3 decimals
  } catch {
    return null;
  }
};

/**
 * Format a formula for display (returns the calculated result)
 */
export const formatFormulaDisplay = (formula: string): string => {
  const result = evaluateFormula(formula);
  return result !== null ? result.toString() : formula;
};

/**
 * Check if a string is a simple number (no formula)
 */
export const isSimpleNumber = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;
  const normalized = value.replace(/,/g, '.').trim();
  return !isNaN(parseFloat(normalized)) && !isFormula(value);
};
