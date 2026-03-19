

# Plan : Variables dynamiques + Drag & Drop dans l'éditeur de template

## Problème actuel
`TemplateEditorDialog.tsx` utilise une liste **hardcodée** de 9 variables (`GENERIC_TEMPLATE_VARIABLES`). Les variables "somme" et "globales" calculées dynamiquement dans `computeCalculatorVariables` (comme `$sum_GNT`, `$sum_vol_substitution`, etc.) ne sont pas disponibles.

## Approche

### 1. Remplacer la liste hardcodée par les variables structurelles du CAPEXator

Appeler `computeCalculatorVariables()` avec un `CalculatorData` minimal (vide) pour obtenir toutes les variables à noms fixes, puis les compléter avec la liste complète des variables "Totaux" et "Global" et "Fondation" extraites du code source.

Concrètement dans `TemplateEditorDialog.tsx` :
- Supprimer le tableau `GENERIC_TEMPLATE_VARIABLES`
- Créer une fonction utilitaire `getTemplateAvailableVariables()` dans `useCalculatorVariables.ts` qui retourne toutes les variables à nom fixe (catégories Global, Totaux, Fondation) avec valeur 0 — c'est-à-dire toutes les variables dont le nom ne dépend PAS d'une éolienne ou d'un tronçon spécifique
- Variables incluses : `$nb_eol`, `$sum_surf_PF`, `$sum_acces_PF`, `$sum_m3_bouger`, `$sum_bypass`, `$sum_vol_substitution`, `$nb_eol_en_eau`, `$nb_eol_sans_eau`, `$sum_surface_chemins`, `$sum_GNT`, `$sum_bicouche`, `$sum_enrobe`, `$sum_lineaire_hta`, tous les `$sum_alu*`, `$sum_cu*`, `$surface_fond_fouille`, `$volume_terrassement`, etc.
- Importer et utiliser cette fonction dans le `VariableAutocomplete` du template editor

### 2. Ajouter le Drag & Drop sur les lignes de chaque section

`@dnd-kit/core` et `@dnd-kit/sortable` sont déjà installés et utilisés dans `BPUTableWithSections.tsx` + `DraggableLine.tsx`.

Dans `TemplateEditorDialog.tsx` :
- Wrapper chaque table de section avec `DndContext` + `SortableContext`
- Rendre chaque ligne (`<tr>`) draggable via `useSortable` (même pattern que `DraggableLine.tsx`)
- Ajouter le handle `GripVertical` (déjà importé mais pas utilisé sur les lignes)
- Sur `onDragEnd`, réordonner le tableau `section.lines` avec `arrayMove`

## Fichiers modifiés
- `src/hooks/useCalculatorVariables.ts` — ajouter `getTemplateAvailableVariables()`
- `src/components/TemplateEditorDialog.tsx` — supprimer hardcoded vars, importer variables dynamiques, ajouter dnd-kit sur les lignes

