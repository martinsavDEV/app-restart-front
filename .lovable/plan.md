

# Fix: Total de la carte de version ne correspond pas au CAPEX

## Diagnostic

Le `total_amount` stocke dans `quote_versions` vaut **4 731 097 €** alors que le CAPEX dynamique calcule **5 891 102,90 €**. Deux causes :

### Cause 1 — Total stocke jamais recalcule proactivement

`updateQuoteVersionTotal` ne s'execute qu'apres une mutation de ligne (ajout/modif/suppression). Le `total_amount` en base est donc **celui calcule par l'ancien code** (avant la correction des variables), ou les lignes liees a des variables avaient `quantity = 0`.

### Cause 2 — Multiplicateurs de section lies a des variables non resolus

Trois endroits utilisent `section.multiplier` brut au lieu de resoudre `linked_field` (ex: `$nb_fondations`) :
- `updateQuoteVersionTotal` dans `useQuotePricing.ts`
- `calculateLotTotal` dans `PricingView.tsx`
- le calcul de subtotal dans `useSummaryData.ts`

Seul `BPUTableWithSections.tsx` resout correctement `linked_field`.

### Cause 3 — `updateQuoteVersionTotal` n'exclut pas les lots desactives

Il inclut tous les lots (y compris `is_enabled = false`), contrairement a `useSummaryData` qui filtre `is_enabled = true`.

## Plan de correction

### 1. `src/hooks/useQuotePricing.ts` — `updateQuoteVersionTotal`

- Ajouter `.eq("is_enabled", true)` sur la requete des lots
- Fetcher `linked_field` en plus de `id, is_multiple, multiplier` pour les sections
- Resoudre le multiplicateur : si `linked_field` commence par `$`, chercher la valeur dans `calcVars`; sinon si `linked_field` existe et pointe vers un champ de `quote_settings`, le lire depuis `settingsResult`; sinon utiliser `section.multiplier`

### 2. `src/components/PricingView.tsx` — `calculateLotTotal`

- Dans la boucle `sections.forEach`, resoudre `section.linked_field` de la meme facon (via `variables` deja disponible et `quoteSettings`)
- Remplacer `section.is_multiple ? section.multiplier : 1` par la resolution complete

### 3. `src/hooks/useSummaryData.ts`

- Ajouter `linked_field` dans la requete sections : `quote_sections (id, name, multiplier, is_multiple, order_index, linked_field)`
- Lors du calcul du subtotal (ligne 177), resoudre `linked_field` via `calcVars` et `quoteSettings`

### 4. Recalcul proactif au chargement

- Dans `PricingView`, ajouter un `useEffect` qui appelle `updateQuoteVersionTotal` quand `lots` et `variables` sont charges, pour synchroniser le `total_amount` stocke avec le total calcule dynamiquement

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/hooks/useQuotePricing.ts` | Filtrer `is_enabled`, resoudre `linked_field`, exposer `updateQuoteVersionTotal` |
| `src/components/PricingView.tsx` | Resoudre `linked_field` dans `calculateLotTotal`, appeler recalcul au chargement |
| `src/hooks/useSummaryData.ts` | Fetcher et resoudre `linked_field` pour les multiplicateurs de section |

