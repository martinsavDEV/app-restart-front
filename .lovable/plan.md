

# Corrections commentaires + formules avec variables

## Probleme 1 : Commentaires ecrases

Dans `PricingView.tsx` ligne 196, `handleLineUpdate` ecrase systematiquement le champ `comment` avec `updates.priceSource` a chaque mise a jour de ligne. La base de donnees a bien deux colonnes separees (`comment` et `price_source`), mais le code melange les deux.

**Correction** : Modifier `handleLineUpdate` pour :
- Sauvegarder `comment` uniquement quand `updates.comment` est fourni
- Sauvegarder `price_source` uniquement quand `updates.priceSource` est fourni
- Ne plus ecraser l'un avec l'autre

## Probleme 2 : Formules non memorisees + formules avec variables

Actuellement `quantity_formula` est stocke pour les formules simples, mais `handleLineUpdate` dans PricingView ne transmet pas `quantity_formula` a la mutation. De plus, les formules contenant des `$variables` (ex: `3*$sum_surf_PF`) ne sont pas supportees.

**Corrections** :

### a) Transmettre `quantity_formula` dans la sauvegarde

`handleLineUpdate` doit passer `quantity_formula` au mutation `updateLine`.

### b) Support des formules mixtes (nombres + variables)

Modifier `formulaUtils.ts` pour accepter les `$identifiants` dans les formules et ajouter une fonction `evaluateFormulaWithVariables(formula, variables)` qui remplace chaque `$variable` par sa valeur avant evaluation.

### c) Adapter QuantityFormulaInput

Modifier le `handleBlur` pour detecter les formules mixtes et les evaluer correctement. Stocker la formule brute dans `quantity_formula`.

## Details techniques

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/components/PricingView.tsx` | Corriger `handleLineUpdate` : separer `comment` et `price_source`, transmettre `quantity_formula` et `linked_variable` |
| `src/lib/formulaUtils.ts` | Etendre `FORMULA_REGEX` pour `$`, ajouter `evaluateFormulaWithVariables(formula, variables[])` |
| `src/components/QuantityFormulaInput.tsx` | Adapter `handleBlur` pour formules mixtes, stocker formule brute dans `quantity_formula` |
| `src/hooks/useQuotePricing.ts` | S'assurer que `updateLineMutation` transmet `quantity_formula` et `price_source` |

### Logique des formules avec variables

Exemples supportes :
- `3*$sum_surf_PF` : remplace la variable par sa valeur, evalue le produit
- `$surf_PF_E01 + $surf_PF_E02` : somme de deux variables
- `2*($nb_eol + 1)` : formule mixte

La formule brute est toujours conservee dans `quantity_formula`. Au clic sur la cellule, on affiche la formule. Au repos, on affiche le resultat calcule.

### Correction commentaire - detail

```text
Avant (ligne 196) :
  let newComment = updates.priceSource || "";
  -> ecrase le commentaire a chaque update

Apres :
  - Si updates.comment !== undefined -> comment = updates.comment
  - Si updates.priceSource !== undefined -> price_source = updates.priceSource
  - Sinon, ne pas toucher ces champs
```
