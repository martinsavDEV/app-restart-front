
# Fix: Total en-tete du lot different du total en bas

## Cause

Deux calculs de total differents sont utilises :

| Endroit | Fichier | Calcul | Resultat |
|---------|---------|--------|----------|
| En-tete du lot | `PricingView.tsx` ligne 119 | `line.quantity * line.unit_price` (valeur brute DB) | Faux (qty = 0 pour les variables) |
| Bas du lot | `BPUTableWithSections.tsx` ligne 152-157 | `resolveQuantity(line.quantity, line.linkedVariable)` | Correct |

La fonction `calculateLotTotal` dans `PricingView.tsx` ne resout ni les variables liees (`linked_variable`) ni les formules (`quantity_formula`). Elle prend `line.quantity` tel quel depuis la base de donnees, qui vaut souvent 0 pour les lignes liees a une variable.

## Correction

### Fichier `src/components/PricingView.tsx`

Modifier `calculateLotTotal` pour resoudre les variables et formules avant de calculer le total :

1. Acceder aux `calculatorVariables` (deja disponibles via le hook `useCalculatorVariables` ou via `computeCalculatorVariables`)
2. Pour chaque ligne :
   - Si `linked_variable` est defini, utiliser `getVariableValue(linked_variable)`
   - Sinon si `quantity_formula` contient des `$variables`, evaluer avec `evaluateFormulaWithVariables`
   - Sinon utiliser `line.quantity` tel quel
3. Multiplier la quantite resolue par `unit_price`

Le calcul des multiplicateurs de section reste inchange (il fonctionne deja correctement).

### Impact

- Le total dans l'en-tete du lot correspondra au total en bas du lot
- Aucun changement sur le total en bas (deja correct)
- Le CAPEXSummaryCard sera aussi corrige car il utilise la meme fonction `calculateLotTotal`
