
# Gestion du point du pave numerique comme virgule decimale

## Probleme
En France, le separateur decimal est la virgule (`,`), mais le pave numerique produit un point (`.`). Actuellement, les champs numeriques de l'application ne gerent pas cette conversion, ce qui empeche la saisie fluide de valeurs decimales.

## Zones impactees
L'application comporte plusieurs types de champs numeriques :

1. **EditableCell** - Cellules editables pour prix unitaires, quantites (BPUTable, DraggableLine)
2. **QuantityFormulaInput** - Champ quantite avec support de formules et variables
3. **CalculatorDialog** - Tous les champs du calculateur (turbines, acces, cables HTA, fondation) - environ 20 champs `type="number"`
4. **LinkedCell** - Cellules liees aux variables
5. **Divers** - SectionDialog, ProjectDialog, SummaryHeader, BPUTableWithSections, TemplateEditorDialog

## Solution

### 1. Utilitaire centralise (`src/lib/numpadDecimal.ts`)

Creer un helper reutilisable qui intercepte la frappe du `.` du pave numerique et le remplace par `,` dans les champs texte, ou qui normalise la saisie pour les champs numeriques.

La strategie : pour les champs `type="number"`, le navigateur gere deja le `.` comme separateur valide. Le probleme est que pour la locale francaise, le `.` n'est pas reconnu. La solution est de **convertir les champs `type="number"` en `type="text"`** avec un pattern de validation, et d'intercepter le `.` pour le remplacer par `,` a la saisie.

Cependant, la solution la plus simple et la moins invasive est d'**ajouter un gestionnaire `onKeyDown` global** au niveau de l'application qui intercepte le `.` du pave numerique dans tous les inputs numeriques et le remplace par `,`.

### 2. Modifier le composant `Input` (`src/components/ui/input.tsx`)

Ajouter une logique dans le composant `Input` de base pour intercepter le `.` du pave numerique :
- Quand l'utilisateur appuie sur la touche `.` du pave numerique (code `NumpadDecimal` ou `Decimal`), empecher le comportement par defaut et inserer une `,` a la place
- Cela fonctionne pour les champs `type="text"` utilises dans EditableCell, QuantityFormulaInput, etc.

### 3. Convertir les champs numeriques du CalculatorDialog

Le CalculatorDialog utilise `type="number"` pour tous ses champs. Pour que la virgule fonctionne :
- Changer `type="number"` en `type="text"` avec `inputMode="decimal"` 
- Adapter les `onChange` pour normaliser les virgules en points avant le `parseFloat`
- Ajouter un `pattern` pour la validation visuelle

### 4. Appliquer aux autres composants mineurs

- **BPUTableWithSections** : champ multiplicateur de section
- **SectionDialog** : champ multiplicateur
- **ProjectDialog** : nombre d'eoliennes (entier, moins critique)
- **SummaryHeader** : nombre d'eoliennes
- **TemplateEditorDialog** : multiplicateur de section

## Details techniques

### Nouveau fichier : `src/lib/numpadDecimal.ts`

```text
- Fonction handleNumpadDecimal(e: KeyboardEvent) : intercepte NumpadDecimal, 
  preventDefault, insere "," a la position du curseur
- Fonction parseLocaleNumber(value: string): number : remplace "," par "." 
  puis parseFloat
- Constante NUMERIC_PATTERN = "[0-9]*[,.]?[0-9]*" pour les attributs pattern
```

### Modification : `src/components/ui/input.tsx`

Ajouter un onKeyDown conditionnel : quand le type est "text" ou "number" et que le code de la touche est "NumpadDecimal", remplacer le `.` par `,`.

### Modification : `src/components/CalculatorDialog.tsx`

- Remplacer tous les `type="number"` par `type="text"` + `inputMode="decimal"`
- Modifier tous les `parseFloat(e.target.value)` par `parseLocaleNumber(e.target.value)`
- Le champ `nb_eol` (nombre d'eoliennes) reste en `type="number"` car c'est un entier

### Modifications mineures dans les autres composants

- `BPUTableWithSections.tsx` : convertir le champ multiplicateur
- `SectionDialog.tsx` : convertir le champ multiplicateur  
- `SummaryHeader.tsx` : champ entier, peut rester tel quel
- `EditableCell.tsx` : deja en `type="text"`, ajuster le parse
- `QuantityFormulaInput.tsx` : deja en `type="text"`, deja gere

### Fichiers concernes

| Fichier | Modification |
|---------|-------------|
| `src/lib/numpadDecimal.ts` | Nouveau - utilitaires |
| `src/components/ui/input.tsx` | Intercepter NumpadDecimal |
| `src/components/CalculatorDialog.tsx` | Convertir ~20 champs number en text |
| `src/components/BPUTableWithSections.tsx` | Convertir champ multiplicateur |
| `src/components/SectionDialog.tsx` | Convertir champ multiplicateur |
| `src/components/LinkedCell.tsx` | Ajouter gestion du point |
| `src/components/EditableCell.tsx` | Verifier le parse |
| `src/components/QuantityFormulaInput.tsx` | Verifier le parse |
