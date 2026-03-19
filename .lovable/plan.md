

# Plan : Support des formules dans les cellules du Calculator

## Problème

Le composant `NumericInput` (utilisé pour les champs turbines, segments d'accès, câbles HTA dans le Calculator) ne fait qu'un `parseFloat` basique via `parseLocaleNumber`. Taper `1+1` donne `1` car `parseFloat("1+1")` = `1`.

## Solution

Modifier `src/components/ui/numeric-input.tsx` pour tenter une évaluation de formule avant le parse simple, exactement comme on l'a fait pour `EditableCell`.

**Fichier** : `src/components/ui/numeric-input.tsx`

Dans la fonction `commit`, avant le `parseLocaleNumber` :

```typescript
import { evaluateFormula, isFormula } from "@/lib/formulaUtils";

const commit = useCallback(() => {
  setIsEditing(false);
  const trimmed = localValue.trim();
  
  // Try formula evaluation first (e.g. "1500+200", "3*(45+12)")
  if (isFormula(trimmed)) {
    const result = evaluateFormula(trimmed);
    if (result !== null) {
      onValueChange(result);
      return;
    }
  }
  
  // Fallback: simple number parse
  const parsed = parseLocaleNumber(localValue);
  onValueChange(isNaN(parsed) ? 0 : parsed);
}, [localValue, onValueChange]);
```

Un seul fichier modifié, ~8 lignes ajoutées. Toutes les cellules numériques du Calculator (turbines, accès, HTA, substitution, design) bénéficient automatiquement du support formules.

