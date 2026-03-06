

# Fix: `total_amount` sur les cartes de version ne reflète pas le vrai CAPEX

## Cause

La fonction `recalculateTotal` dans `useQuotePricing.ts` (ligne 83) calcule le total avec `line.quantity` brut depuis la base de données, **sans résoudre les variables ni les formules**. Ce total erroné est ensuite persisté dans `quote_versions.total_amount`, qui est affiché sur les `QuoteVersionCard`.

C'est exactement le même bug que celui corrigé précédemment dans `useSummaryData` et `PricingView.calculateLotTotal`, mais dans un troisième endroit.

## Correction

### Fichier : `src/hooks/useQuotePricing.ts`

Modifier `recalculateTotal` pour résoudre les variables et formules avant de calculer le total :

1. Ajouter le fetch de `quote_settings.calculator_data` pour la version en cours
2. Importer `computeCalculatorVariables` et `evaluateFormulaWithVariables`
3. Fetcher `linked_variable` et `quantity_formula` en plus de `quantity` et `unit_price` dans la requête des lignes
4. Pour chaque ligne, résoudre la quantité (même logique que `resolveLineQuantity` dans PricingView) avant de multiplier par `unit_price`

Le reste de la fonction (multiplicateurs de section, update en base) reste inchangé.

### Impact

- Le `total_amount` persisté dans `quote_versions` sera correct
- Les cartes de version (`QuoteVersionCard`), la vue `QuotesView`, et le `ProjectDetailPanel` afficheront le bon CAPEX
- Cohérence avec le résumé et les exports

