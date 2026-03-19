

# Fix : Variables Calculator désynchronisées des lignes de prix

## Diagnostic

Le bug est un **problème de cache React Query** — une erreur classique d'invalidation.

Quand le Calculator sauvegarde (dans `CalculatorDialog.tsx` ligne 162), il invalide les queries avec la clé :
```
["quote-settings"]
```

React Query invalide toutes les queries dont la clé **commence** par ce préfixe. Cela couvre bien :
- `["quote-settings", selectedVersionId]` dans `PricingView.tsx` ✅

**Mais** le composant `BPUTableWithSections.tsx` (qui affiche les lignes de prix et résout les variables) utilise une clé **complètement différente** :
```
["quote-settings-for-sections", lines[0]?.lot_id]
```

`"quote-settings-for-sections"` ne commence PAS par `"quote-settings"` — c'est une chaîne distincte. Résultat : **les lignes de prix gardent les anciennes données calculator_data en cache** et ne voient jamais les nouvelles valeurs des variables.

## Solution

**Fichier** : `src/components/CalculatorDialog.tsx`

Ajouter l'invalidation de la clé manquante dans le `onSuccess` de la mutation save (ligne 162) :

```typescript
queryClient.invalidateQueries({ queryKey: ["quote-settings-for-sections"] });
```

C'est un ajout d'une seule ligne à côté des invalidations existantes. Aucune autre modification nécessaire — le reste de la chaîne (useCalculatorVariables, resolveQuantity, evaluateFormulaWithVariables) fonctionne correctement une fois que les données fraîches arrivent.

