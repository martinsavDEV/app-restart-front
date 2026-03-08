

# Scroll horizontal éoliennes + filtre alu/cuivre + variable $sum_m3_bouger

## 1. Scroll horizontal pour le tableau des éoliennes

Le tableau des éoliennes a actuellement un `overflow-x-auto` mais les colonnes "Paramètre" et "Unité" scrollent aussi. Il faut figer ces deux premières colonnes à gauche pendant que les colonnes éoliennes + total défilent horizontalement.

**Fichier** : `src/components/CalculatorDialog.tsx`

Approche : utiliser `sticky left-0` sur les deux premières colonnes (`<td>` et `<th>`) du tableau éoliennes :
- Colonne "Paramètre" : `sticky left-0 z-10 bg-white`
- Colonne "Unité" : `sticky left-[180px] z-10 bg-white` (180px = min-w de la colonne Paramètre)
- Appliquer le même traitement sur toutes les lignes `<tr>` du `<thead>` et `<tbody>`

Même traitement pour le tableau Accès (colonnes "Tronçon" et "Unité" figées).

## 2. Filtre alu / cuivre dans la section Électricité

Ajouter un state `cableMaterialFilter` : `"all" | "alu" | "cu"` (défaut `"all"`).

Dans l'en-tête de la section Électricité (ligne ~766), ajouter deux Switch ou ToggleGroup :
- ☑ Aluminium  ☑ Cuivre (activés par défaut)
- Filtrer `htaFields` pour n'afficher que les colonnes du matériau activé
- Le calcul des totaux reste sur toutes les colonnes (inchangé), seul l'affichage est filtré

**State** : `showAlu` (boolean, default true) + `showCu` (boolean, default true)

`htaFields` filtré :
```typescript
const visibleHtaFields = htaFields.filter(f => 
  (showAlu && f.startsWith("alu")) || (showCu && f.startsWith("cu"))
);
```

Utiliser `visibleHtaFields` au lieu de `htaFields` pour le rendu des colonnes headers, data rows et sum row.

## 3. Variable $sum_m3_bouger

Déjà implémentée dans `useCalculatorVariables.ts` (ligne 86-92) — la variable `$sum_m3_bouger` existe et est calculée. Le total s'affiche aussi dans le tableau (ligne 498-499). Rien à faire ici.

---

| Fichier | Changement |
|---------|------------|
| `src/components/CalculatorDialog.tsx` | Sticky columns pour tableaux éoliennes/accès + toggles alu/cuivre dans section électricité |

