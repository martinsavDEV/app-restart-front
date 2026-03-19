

# Fix : Noms de variables avec caractères spéciaux

## Problème

`computeCalculatorVariables` génère des noms de variables à partir des noms de segments/turbines/câbles en ne remplaçant que les espaces par `_` (ligne 113). Si un segment s'appelle `"PCE2 + PCE2.2"`, la variable devient `$surface_PCE2_+_PCE2.2` qui contient `+` et `.` — caractères invalides pour un identifiant.

Le regex d'extraction de variables (`\$[a-zA-Z_][a-zA-Z0-9_]*`) ne peut pas parser ces noms, donc la formule échoue.

## Solution

Créer une fonction `sanitizeVarName` qui nettoie tous les caractères non-alphanumériques (pas seulement les espaces) et l'utiliser partout où un nom utilisateur est injecté dans un nom de variable.

**Fichier** : `src/hooks/useCalculatorVariables.ts`

```typescript
/** Sanitize a user-provided name into a valid variable identifier segment */
const sanitizeVarName = (name: string): string =>
  name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-zA-Z0-9]+/g, "_")                   // non-alphanum → _
    .replace(/^_+|_+$/g, "");                          // trim leading/trailing _
```

Appliquer à :
- **Segments d'accès** (ligne 113) : `segment.name.replace(/\s+/g, "_")` → `sanitizeVarName(segment.name)`
- **Turbines** (lignes ~70-80) : `turbine.name` est déjà propre (E01, E02…) mais on applique par sécurité
- **Câbles HTA** (lignes ~140+) : `cable.name.replace(/\s+/g, "_")` → `sanitizeVarName(cable.name)`

Ainsi `"PCE2 + PCE2.2"` deviendra `PCE2_PCE2_2` et la variable sera `$surface_PCE2_PCE2_2` — un identifiant valide que le parser de formules peut résoudre.

## Impact

Les variables existantes déjà référencées dans des formules enregistrées en base risquent de ne plus matcher (ancien nom `$surface_PCE2_+_PCE2.2` vs nouveau `$surface_PCE2_PCE2_2`). C'est un one-time fix ; les formules cassées devront être ressaisies, mais c'est inévitable car les anciennes ne fonctionnaient de toute façon pas.

## Fichiers modifiés
- `src/hooks/useCalculatorVariables.ts` — ajouter `sanitizeVarName`, l'appliquer aux 3 endroits de génération de noms

