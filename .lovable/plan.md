

# Fix : Erreur "variable introuvable" lors de la sélection dans l'éditeur de template

## Diagnostic

Le bug est une **race condition React** dans `VariableAutocomplete.tsx`.

Quand l'utilisateur tape `$nb` puis clique sur `$nb_eol` dans le dropdown :

1. `onMouseDown` → `e.preventDefault()` (empêche le blur natif)
2. `handleSelect` exécute **dans le même tick** :
   - `setSearchValue("$nb_eol")` — planifié, pas encore appliqué
   - `onChange("$nb_eol")` / `onSelect(variable)`
   - `inputRef.current.blur()` — déclenche `handleBlur` **immédiatement**
3. `handleBlur` lit `searchValue` — qui est encore **`$nb`** (l'ancien état)
4. `variables.some(v => v.name === "$nb")` → **FALSE** → toast d'erreur

Le `setSearchValue` dans `handleSelect` est un update React batché qui ne prend effet qu'au prochain rendu. Mais le `blur()` est synchrone et fire le handler avant que React ne commite la mise à jour. Donc `handleBlur` valide toujours la **valeur partielle** tapée, pas la variable sélectionnée.

## Solution

**Fichier** : `src/components/VariableAutocomplete.tsx`

Ajouter un `useRef` pour tracker qu'une sélection vient d'avoir lieu, et court-circuiter la validation dans `handleBlur` :

```typescript
const justSelectedRef = useRef(false);
```

Dans `handleSelect` :
```typescript
justSelectedRef.current = true;
```

Dans `handleBlur`, avant la vérification de variable :
```typescript
if (justSelectedRef.current) {
  justSelectedRef.current = false;
  return; // skip validation — selection already handled
}
```

C'est un changement de ~5 lignes dans un seul fichier. Le même bug n'affecte pas `QuantityFormulaInput` car il utilise un mécanisme différent (token-based) sans validation on-blur.

