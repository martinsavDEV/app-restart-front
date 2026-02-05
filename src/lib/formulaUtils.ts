/**
 * Utility functions for evaluating quantity formulas
 * Supports: +, -, *, /, x, ×, parentheses, brackets
 * 
 * SECURITY: Uses mathjs for safe expression evaluation instead of new Function()
 */

import { create, all, MathJsInstance } from 'mathjs';

// Create a mathjs instance with limited functionality for security
const math: MathJsInstance = create(all);

// Disable dangerous functions that could be exploited
const dangerousFunctions = [
  'import', 'createUnit', 'evaluate', 'parse', 'compile',
  'help', 'config', 'print', 'format', 'derivative',
  'simplify', 'rationalize', 'parser'
];

dangerousFunctions.forEach(fn => {
  math.import({
    [fn]: function () { throw new Error('Function not allowed'); }
  }, { override: true });
});

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
 * Safely evaluate a formula string using mathjs
 * Returns null if invalid or result is not a valid positive number
 */
export const evaluateFormula = (formula: string): number | null => {
  if (!formula || !FORMULA_REGEX.test(formula)) return null;
  
  try {
    const normalized = normalizeFormula(formula);
    
    // Use mathjs for safe evaluation - no code execution possible
    const result = math.evaluate(normalized);
    
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
