

# Plan : Support des formules dans EditableCell

## Contexte

`EditableCell` est le composant générique pour les cellules numériques (prix unitaire, etc.). Actuellement il ne fait que parser un nombre brut. L'utilisateur veut pouvoir taper des expressions comme `150+230`, `3*(45+12)`, `1200-50` et obtenir le résultat calculé.

La bibliothèque `evaluateFormula` de `src/lib/formulaUtils.ts` (basée sur mathjs sécurisé) existe déjà et gère exactement cela : `+`, `-`, `*`, `/`, parenthèses, virgules.

## Modification

**Fichier unique** : `src/components/EditableCell.tsx`

Dans `handleBlur`, avant le parse classique, tenter d'évaluer l'input comme une formule :

```typescript
import { evaluateFormula, isFormula } from "@/lib/formulaUtils";

const handleBlur = () => {
  const trimmed = editValue.trim();
  
  // Try formula evaluation first (e.g. "150+230", "3*(45+12)")
  if (isFormula(trimmed)) {
    const result = evaluateFormula(trimmed);
    if (result !== null && result >= 0) {
      onChange(result);
      setIsEditing(false);
      return;
    }
  }
  
  // Fallback: parse as simple number (existing behavior)
  const parsedValue = parse(editValue);
  if (!isNaN(parsedValue) && parsedValue >= 0) {
    onChange(parsedValue);
  }
  setIsEditing(false);
};
```

Aucun changement d'interface, aucune nouvelle prop. Toutes les `EditableCell` existantes (prix unitaire dans BPUTable, TemplateEditorDialog, PriceDBView) bénéficient automatiquement du support formules.

