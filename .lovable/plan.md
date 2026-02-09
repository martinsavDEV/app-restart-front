
# Fix: Saisie decimale dans le Calculator

## Probleme identifie

Tous les champs numeriques du Calculator utilisent ce pattern defectueux :

```text
value={turbine.surf_PF}           // valeur numerique (ex: 0)
onChange={(e) => updateTurbine(
  idx, "surf_PF", 
  parseLocaleNumber(e.target.value) || 0   // parse immediatement en nombre
)}
```

Quand l'utilisateur tape "1,", `parseLocaleNumber("1,")` retourne `1`, et la virgule disparait immediatement avant que l'utilisateur puisse taper le chiffre suivant. Meme probleme avec le point.

Le composant `EditableCell` fonctionne correctement car il utilise un **etat string intermediaire** (`editValue`) et ne parse en nombre que sur le `blur`.

## Solution

Creer un composant reutilisable `NumericInput` qui encapsule cette logique :
- Maintient un etat string interne pendant l'edition
- Affiche la valeur numerique formatee quand le champ n'est pas en cours d'edition
- Parse et transmet la valeur numerique uniquement au `blur` ou sur `Enter`
- Accepte indifferemment le point et la virgule comme separateur decimal

## Details techniques

### Nouveau composant : `src/components/ui/numeric-input.tsx`

Un wrapper autour de `Input` qui :
- Prend `value: number` et `onValueChange: (n: number) => void` en props
- Gere un `localValue: string` interne via `useState`
- Sur `onFocus` : copie la valeur numerique dans le string local
- Sur `onChange` : met a jour uniquement le string local (pas de parse)
- Sur `onBlur` / `Enter` : parse avec `parseLocaleNumber`, appelle `onValueChange`
- Propage les autres props (`className`, `inputMode`, `title`, etc.)

### Modification : `src/components/CalculatorDialog.tsx`

Remplacer tous les patterns `<Input type="text" inputMode="decimal" value={...} onChange={... parseLocaleNumber ...}>` par le nouveau `<NumericInput value={...} onValueChange={...}>`.

Cela concerne environ 20+ champs repartis dans :
- Section Eoliennes : surf_PF, acces_PF, m3_bouger, bypass, substitution (x nb turbines)
- Section Acces : longueur, surface, bicouche, enrobe (x nb segments)
- Section HTA : alu_95, alu_150, alu_240, alu_400, cu_95, cu_150, cu_240 (x nb troncons)
- Section Fondation : diametre_fondation, marge_securite (custom), hauteur_cage

### Fichiers concernes

| Fichier | Modification |
|---------|-------------|
| `src/components/ui/numeric-input.tsx` | Nouveau composant |
| `src/components/CalculatorDialog.tsx` | Remplacer ~20+ `<Input>` par `<NumericInput>` |

Aucun autre fichier n'est impacte car `EditableCell`, `QuantityFormulaInput` et `VariableAutocomplete` gerent deja correctement la saisie avec des etats string intermediaires.
