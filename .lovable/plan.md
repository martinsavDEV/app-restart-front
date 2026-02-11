
# Evolutions du Calculator : Tension, Sections HTA, Acces

## 1. Choix de tension 20kV / 30kV

Ajouter un parametre global `tension_hta` dans `CalculatorData.global` avec choix 20kV ou 30kV (Select). Ce parametre apparaitra dans le Summary et le PDF export.

**Fichiers concernes :**
- `src/types/bpu.ts` : ajouter `tension_hta: string` dans `CalculatorData.global`
- `src/components/CalculatorDialog.tsx` : ajouter un Select 20kV/30kV dans les parametres globaux
- `src/hooks/useCalculatorVariables.ts` : exposer `$tension_hta` comme variable
- `src/components/SummaryHeader.tsx` : afficher la tension
- `src/lib/pdfExport.ts` : inclure la tension dans l'export PDF

## 2. Sections de cables HTA : 95, 150, 240, 300, 400 + custom

Actuellement le type `HTACableSegment` a des champs fixes (alu_95, alu_150, alu_240, alu_400, cu_95, cu_150, cu_240). Il faut ajouter les sections manquantes (300) et permettre des sections custom (500, 600, etc.).

**Approche :** Passer d'un modele a champs fixes a un modele avec un dictionnaire de sections. Cependant, pour limiter le risque de regression, on va plutot :
- Ajouter les champs `alu_300`, `cu_300` aux champs existants dans `HTACableSegment`
- Ajouter un tableau `custom_cables` optionnel pour les sections non standard (500, 600, etc.)

**Type mis a jour :**
```text
HTACableSegment {
  name: string;
  alu_95, alu_150, alu_240, alu_300, alu_400: number;
  cu_95, cu_150, cu_240, cu_300, cu_400: number;  // ajout cu_400
  custom_cables?: Array<{ section: string; material: string; length: number }>;
}
```

**Fichiers concernes :**
- `src/types/bpu.ts` : ajouter `alu_300`, `cu_300`, `cu_400`, `custom_cables`
- `src/components/CalculatorDialog.tsx` : ajouter colonnes 300 alu/cu et 400 cu dans le tableau HTA + bouton "Ajouter section custom" par troncon
- `src/hooks/useCalculatorVariables.ts` : generer les variables pour les nouvelles sections + customs

## 3. Sommes HTA sous le tableau

Ajouter sous le tableau HTA existant (qui a deja une ligne "Somme" en haut) :
- **Somme par section** (deja presente en ligne de tete, la garder)
- **Somme du lineaire total** : total de tous les ml de cable confondus
- Variables dediees : `$sum_lineaire_hta` (total ml), `$sum_alu300`, `$sum_cu300`, `$sum_cu400`, plus les customs

**Fichiers concernes :**
- `src/components/CalculatorDialog.tsx` : ajouter ligne "Total lineaire" dans le footer du tableau HTA
- `src/hooks/useCalculatorVariables.ts` : ajouter `$sum_lineaire_hta`, `$sum_alu300`, `$sum_cu300`, `$sum_cu400`

## 4. Acces : Remplacer "Longueur chemin" par "Surface chemin" + GNT auto

**Changement :** 
- Renommer "Longueur chemin" en "Surface chemin" (m²) - c'est en fait le champ `surface` existant qui est deja la. Le champ `longueur` sera supprime du type.
- Quand GNT est coche pour un troncon, la colonne GNT affiche automatiquement la valeur de "Surface chemin" de ce troncon (m²) au lieu d'etre un simple checkbox
- La ligne "Total" GNT montre la somme des surfaces des troncons ou GNT est coche

**Changement du type AccessSegment :**
```text
AccessSegment {
  name: string;
  surface: number;        // Surface chemin en m² (remplace longueur)
  renforcement: string;
  gnt: boolean;           // si coche, surface GNT = surface chemin
  bicouche: number;
  enrobe: number;
}
// Suppression du champ 'longueur'
```

**Fichiers concernes :**
- `src/types/bpu.ts` : supprimer `longueur` de `AccessSegment`
- `src/components/CalculatorDialog.tsx` : 
  - Supprimer la ligne "Longueur chemin"
  - Transformer la ligne GNT : afficher la surface associee (read-only) quand coche, sinon "-"
  - Ajouter une ligne "Total GNT" calculee
- `src/hooks/useCalculatorVariables.ts` :
  - Supprimer `$longueur_*` et `$sum_longueur_chemins`
  - Garder `$sum_GNT` (somme des surfaces des troncons avec GNT coche)
  - Ajouter `$gnt_<segment>` par troncon

## Details techniques

### Modifications du type `CalculatorData` (src/types/bpu.ts)

| Changement | Detail |
|-----------|--------|
| `global.tension_hta` | Nouveau champ `string`, defaut `"20kV"` |
| `AccessSegment.longueur` | Supprime |
| `HTACableSegment.alu_300` | Nouveau, defaut 0 |
| `HTACableSegment.cu_300` | Nouveau, defaut 0 |
| `HTACableSegment.cu_400` | Nouveau, defaut 0 |
| `HTACableSegment.custom_cables` | Nouveau, optionnel, tableau `{section, material, length}` |

### Variables ajoutees (useCalculatorVariables.ts)

| Variable | Description |
|----------|-------------|
| `$tension_hta` | Pas numerique, info textuelle (20/30) |
| `$sum_alu300` | Total 300² alu (ml) |
| `$sum_cu300` | Total 300² cuivre (ml) |
| `$sum_cu400` | Total 400² cuivre (ml) |
| `$sum_lineaire_hta` | Total lineaire tous cables confondus |
| `$gnt_<segment>` | Surface GNT par troncon (= surface si coche, 0 sinon) |
| Custom vars | `$custom_<section>_<material>_<segment>` |

### Initialisation retrocompatible

Le `useEffect` qui charge `settings.calculator_data` devra gerer les donnees existantes qui n'ont pas les nouveaux champs :
- `tension_hta` defaut `"20kV"` si absent
- `alu_300`, `cu_300`, `cu_400` defaut `0` si absents  
- `longueur` ignore si present (migration douce)

### Fichiers impactes (resume)

| Fichier | Changements |
|---------|------------|
| `src/types/bpu.ts` | Types mis a jour |
| `src/components/CalculatorDialog.tsx` | UI tension, colonnes HTA, acces GNT, total lineaire |
| `src/hooks/useCalculatorVariables.ts` | Nouvelles variables |
| `src/components/SummaryHeader.tsx` | Affichage tension |
| `src/lib/pdfExport.ts` | Tension dans export |
