

# Plan : Stocker les formules et afficher en bleu dans le Calculator

## Contexte

Actuellement, `NumericInput` évalue les formules mais ne les conserve pas — seul le résultat numérique est stocké. L'utilisateur veut le même comportement que `QuantityFormulaInput` dans les métrés : formule persistée, texte bleu quand une formule est active, et formule restituée à l'édition.

## Approche

### 1. Ajouter un stockage de formules dans `CalculatorData` (types/bpu.ts)

Ajouter un champ optionnel `formulas` de type `Record<string, string>` sur `TurbineData`, `AccessSegment`, `HTACableSegment` et `design`. Ce champ stocke les formules par nom de champ :

```typescript
export interface TurbineData {
  // ... existing fields
  formulas?: Record<string, string>; // e.g. { surf_PF: "1500+200" }
}
// Idem pour AccessSegment, HTACableSegment, et CalculatorData.design
```

Étant donné que `calculator_data` est stocké en JSON dans la base, aucune migration n'est nécessaire — le champ optionnel sera simplement inclus dans le JSON.

### 2. Enrichir `NumericInput` (ui/numeric-input.tsx)

Ajouter des props optionnelles `formula` et `onFormulaChange` :

- **À l'affichage** : si `formula` est définie, afficher le résultat en bleu (`text-blue-600`)
- **Au focus** : restaurer la formule brute (au lieu du nombre)
- **Au commit** : si l'input est une formule, appeler `onFormulaChange(formula)` en plus de `onValueChange(result)`. Si c'est un nombre simple, appeler `onFormulaChange(null)` pour effacer la formule.

### 3. Mettre à jour `CalculatorDialog` (CalculatorDialog.tsx)

Pour chaque `NumericInput`, passer `formula` et `onFormulaChange` en lisant/écrivant dans le champ `formulas` de l'objet correspondant (turbine, segment, câble, design).

Créer des helpers génériques :
```typescript
const getFormula = (obj: { formulas?: Record<string,string> }, field: string) => 
  obj?.formulas?.[field] ?? null;

const setFormula = (obj: any, field: string, formula: string | null) => ({
  ...obj,
  formulas: { ...(obj.formulas || {}), [field]: formula ?? undefined }
});
```

## Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/types/bpu.ts` | Ajouter `formulas?: Record<string, string>` sur TurbineData, AccessSegment, HTACableSegment, et design |
| `src/components/ui/numeric-input.tsx` | Ajouter props `formula`/`onFormulaChange`, style bleu, restauration formule au focus |
| `src/components/CalculatorDialog.tsx` | Brancher formula/onFormulaChange sur chaque NumericInput |

