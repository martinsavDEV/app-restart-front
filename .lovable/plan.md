
# Fix: Resolve variables and formulas in export data

## Problem

The summary/export (`useSummaryData`) reads `quantity` directly from the database. But many lines have a `linked_variable` (e.g. `$nb_eol`) or a `quantity_formula` (e.g. `$nb_eol*2`) whose resolved value is only computed client-side in PricingView. The database often stores `quantity: 0` for these lines because the variable was linked after creation and the quantity was never persisted back.

Result: CSV and PDF exports show `qty = 0` for variable-linked lines, and totals are wrong.

## Solution

Add variable/formula resolution inside `useSummaryData` after fetching the data. The `calculator_data` is already fetched via `quote_settings`, so we can compute the same variables that `useCalculatorVariables` produces, then resolve each line's quantity.

## Changes

### File: `src/hooks/useSummaryData.ts`

1. Import `evaluateFormulaWithVariables` from `formulaUtils` and the calculator variable generation logic
2. After fetching `quote_settings`, compute the variables from `calculator_data` (extract the pure computation logic from `useCalculatorVariables` into a standalone function)
3. When transforming lines, for each line:
   - If `linked_variable` is set and matches a known variable, use that variable's value as `quantity`
   - Else if `quantity_formula` is set and contains `$variables`, evaluate it with `evaluateFormulaWithVariables`
   - Otherwise keep the DB `quantity` as-is
4. Recalculate `total_price = resolved_quantity * unit_price` for affected lines

### File: `src/hooks/useCalculatorVariables.ts`

Extract the variable computation into a standalone pure function `computeCalculatorVariables(calculatorData)` that can be used outside of React hooks (both by the existing hook and by `useSummaryData`).

### File: `src/lib/formulaUtils.ts`

No changes needed -- `evaluateFormulaWithVariables` already exists and handles resolution.

## Resulting behavior

- Export CSV/PDF will show the same quantities as displayed in PricingView
- Totals per section, per lot, and CAPEX total will all be correct
- No database schema changes required
