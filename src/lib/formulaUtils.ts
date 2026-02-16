/**
 * Utility functions for evaluating quantity formulas
 * Supports: +, -, *, /, x, ×, parentheses, brackets, $variables
 */

import { create, all } from "mathjs";

const math = create(all, {});

// Disable dangerous functions
const limitedEvaluate = math.evaluate;
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

// Match $variable_name tokens
const VARIABLE_REGEX = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;

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
 * Check if a string is a formula (contains an operator or a $variable)
 */
export const isFormula = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;
  // Contains at least one math operator or a $variable reference
  return (/[+\-*/x×]/.test(value) || /\$[a-zA-Z_]/.test(value)) && FORMULA_REGEX.test(value);
};

/**
 * Check if a formula contains $variable references
 */
export const hasVariables = (formula: string): boolean => {
  return VARIABLE_REGEX.test(formula);
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
 * Returns null if invalid or result is not a valid positive number
 */
export const evaluateFormula = (formula: string): number | null => {
  if (!formula || !FORMULA_REGEX.test(formula)) return null;
  
  try {
    const normalized = normalizeFormula(formula);
    const result = math.evaluate(normalized);
    
    if (typeof result !== 'number' || !isFinite(result) || result < 0) {
      return null;
    }
    return Math.round(result * 1000) / 1000;
  } catch {
    return null;
  }
};

/**
 * Evaluate a formula that may contain $variable references
 * Replaces each $variable with its numeric value before evaluation
 */
export const evaluateFormulaWithVariables = (
  formula: string,
  variables: { name: string; value: number }[]
): number | null => {
  if (!formula || !FORMULA_REGEX.test(formula)) return null;

  try {
    // Replace each $variable with its value
    let resolved = formula;
    const varNames = extractVariableNames(formula);
    
    for (const varName of varNames) {
      const fullName = `$${varName}`;
      const variable = variables.find(v => v.name === fullName);
      if (!variable) return null; // Unknown variable
      resolved = resolved.replace(new RegExp(`\\$${varName}`, 'g'), String(variable.value));
    }

    // Now evaluate the purely numeric formula
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
