/**
 * Utility functions for evaluating quantity formulas
 * Supports: +, -, *, /, x, ×, parentheses, brackets, $variables
 */

import { create, all } from "mathjs";

const math = create(all, {});

// Save reference to evaluate BEFORE disabling it
const limitedEvaluate = math.evaluate.bind(math);

// Disable dangerous functions
math.import!(
  {
    import: function () { throw new Error("Function import is disabled"); },
    createUnit: function () { throw new Error("Function createUnit is disabled"); },
    evaluate: function () { throw new Error("Function evaluate is disabled"); },
    parse: function () { throw new Error("Function parse is disabled"); },
    simplify: function () { throw new Error("Function simplify is disabled"); },
    derivative: function () { throw new Error("Function derivative is disabled"); },
  },
  { override: true }
);

// Allowed characters: digits, operators, spaces, commas/dots, parentheses, $identifiers
const FORMULA_REGEX = /^[\d\s+\-*/x×(),.\[\]$a-zA-Z_]+$/i;

/**
 * Normalize a formula for evaluation:
 * - Replace x/× with * ONLY when used as multiplication operator
 *   (preceded by digit or ) and followed by digit, ( or $)
 * - Replace commas with dots
 * - Replace brackets with parentheses
 */
export const normalizeFormula = (formula: string): string => {
  return formula
    .replace(/(?<=[\d)])[\s]*[x×][\s]*(?=[\d($])/gi, '*')
    .replace(/×/g, '*')
    .replace(/,/g, '.')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')');
};

/**
 * Check if a string is a formula (contains an operator or a $variable)
 */
export const isFormula = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;
  // A pure variable reference ($var_name) is NOT a formula
  // A formula must contain at least one arithmetic operator
  const hasOperator = /[+\-*/×]/.test(value) || /(?<=[\d)])\s*x\s*(?=[\d($])/i.test(value);
  return hasOperator && FORMULA_REGEX.test(value);
};

/**
 * Check if a formula contains $variable references
 * Uses a fresh regex each time to avoid lastIndex issues
 */
export const hasVariables = (formula: string): boolean => {
  return /\$[a-zA-Z_][a-zA-Z0-9_]*/.test(formula);
};

/**
 * Extract variable names from a formula (without the $ prefix)
 */
export const extractVariableNames = (formula: string): string[] => {
  const matches = [...formula.matchAll(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g)];
  return matches.map(m => m[1]);
};

/**
 * Safely evaluate a formula string (without variables)
 * Returns null if invalid or result is not a valid number
 */
export const evaluateFormula = (formula: string): number | null => {
  if (!formula || !FORMULA_REGEX.test(formula)) return null;
  
  try {
    const normalized = normalizeFormula(formula);
    const result = limitedEvaluate(normalized);
    
    if (typeof result !== 'number' || !isFinite(result)) {
      return null;
    }
    return Math.round(result * 1000) / 1000;
  } catch {
    return null;
  }
};

/**
 * Evaluate a formula that may contain $variable references
 */
export const evaluateFormulaWithVariables = (
  formula: string,
  variables: { name: string; value: number }[]
): number | null => {
  if (!formula || !FORMULA_REGEX.test(formula)) return null;

  try {
    let resolved = formula;
    const varNames = extractVariableNames(formula);
    
    for (const varName of varNames) {
      const variable = variables.find(v => v.name === `$${varName}`);
      if (!variable) return null;
      resolved = resolved.replace(new RegExp(`\\$${varName}`, 'g'), String(variable.value));
    }

    return evaluateFormula(resolved);
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
