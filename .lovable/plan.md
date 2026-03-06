

# Fix: Nombre d'éoliennes incohérent dans le résumé

## Diagnostic

Le "Nombre d'éoliennes" affiché dans `SummaryHeader.tsx` (ligne 140) lit `quote_settings.n_wtg` (valeur 8), alors que le Calculator utilise `calculator_data.global.nb_eol` (valeur 10). Ce sont deux champs distincts — le `n_wtg` dans la table `quote_settings` est un ancien champ qui n'est plus synchronisé avec le Calculator.

La variable `$nb_eol` (qui vaut 10) est la source de vérité.

## Correction

### `src/components/SummaryHeader.tsx`

- Remplacer la lecture de `data.quoteSettings?.n_wtg` par `data.quoteSettings?.calculator_data?.global?.nb_eol` comme source principale pour le nombre d'éoliennes (affichage et édition)
- Fallback sur `n_wtg` si `calculator_data` n'existe pas encore
- Appliquer la même logique dans `handleStartEdit` (ligne 26) et `handleSave` (ligne 42)

### `src/hooks/useSummaryData.ts`

- Aucun changement nécessaire — `calculator_data` est déjà fetché dans `quoteSettings`

| Fichier | Modification |
|---------|-------------|
| `src/components/SummaryHeader.tsx` | Lire `nb_eol` depuis `calculator_data.global` au lieu de `n_wtg` |

