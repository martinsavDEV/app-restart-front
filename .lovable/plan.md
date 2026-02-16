
# Reparation : formules, variables et affichage

## Problemes identifies

### 1. `math.evaluate` est desactive (bug critique)
Dans `formulaUtils.ts`, la ligne 16 remplace `math.evaluate` par une fonction qui lance une erreur. Ensuite, la ligne 77 appelle `math.evaluate(normalized)` qui echoue systematiquement. La reference `limitedEvaluate` (ligne 11) qui sauvegardait l'original n'est jamais utilisee.

Resultat : **aucune formule ne peut etre evaluee** (ni `1+1`, ni `3*150`, rien).

### 2. `normalizeFormula` corrompt les noms de variables
Le remplacement `/[x×]/gi` transforme toutes les lettres `x` en `*`, y compris celles dans les noms de variables (`$max_val` devient `$ma*_val`).

### 3. `hasVariables` alterne vrai/faux
Le regex `VARIABLE_REGEX` est defini avec le flag `/g` (global). Quand on appelle `.test()` sur un regex global, le `lastIndex` est mis a jour et le prochain appel recommence depuis cette position. Cela cause un comportement aleatoire.

### 4. Les formules avec variables ne s'affichent pas en orange
Le composant `QuantityFormulaInput` affiche en orange uniquement quand `isLinkedVariable` est vrai (variable pure sans operateur). Une formule comme `3*$var` n'est pas coloree en orange.

## Corrections prevues

### Fichier `src/lib/formulaUtils.ts`

| Correction | Detail |
|------------|--------|
| Utiliser `limitedEvaluate` | Remplacer `math.evaluate(normalized)` par `limitedEvaluate(normalized)` dans `evaluateFormula` |
| Corriger `normalizeFormula` | Remplacer le regex `/[x×]/gi` par un pattern qui ne remplace `x` que quand il est entre deux nombres ou apres un `)`, pas dans les identifiants. Exemple : `/(?<=[\d\)])[\s]*[x×][\s]*(?=[\d\($])/gi` |
| Corriger `hasVariables` | Utiliser un nouveau regex sans flag `/g` pour `.test()`, ou recreer le regex a chaque appel |

### Fichier `src/components/QuantityFormulaInput.tsx`

| Correction | Detail |
|------------|--------|
| Affichage orange pour formules avec variables | Ajouter une condition : si `formula` contient des `$variables`, afficher le resultat en orange (meme logique que `isLinkedVariable`) |
| Icone adaptee | Formule avec variable = icone Lock orange. Formule pure = icone Calculator bleue |

### Logique d'affichage resumee

```text
Etat                           | Couleur  | Icone      | Au clic: affiche
-------------------------------|----------|------------|------------------
Valeur simple (ex: 450)        | Normal   | Aucune     | "450"
Variable pure ($nb_eol)        | Orange   | Lock       | "$nb_eol"
Formule pure (3*150)           | Bleu     | Calculator | "3*150"
Formule + variable (3*$nb_eol) | Orange   | Calculator | "3*$nb_eol"
```

### Detail technique de la correction `normalizeFormula`

Le `x` doit etre remplace par `*` uniquement dans un contexte multiplicatif :
- `3x150` -> `3*150`
- `2x$var` -> `2*$var`
- `$max_height` -> reste intact

Approche : remplacer `x` seulement quand il est precede d'un chiffre ou `)` et suivi d'un chiffre, `(` ou `$`.
