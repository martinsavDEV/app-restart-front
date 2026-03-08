

# Fix: Scroll horizontal du tableau éoliennes

## Problème

Le `ScrollArea` de Radix (qui gère le scroll vertical global du Calculator) a un viewport qui s'étend à la largeur du contenu. Le `div.overflow-x-auto` autour du tableau des éoliennes ne peut donc jamais déclencher de scroll horizontal car il n'est jamais en overflow — le viewport parent s'est déjà élargi pour tout contenir, puis le `!overflow-x-hidden` coupe le surplus.

## Solution

**Fichier** : `src/components/CalculatorDialog.tsx`

Remplacer le `ScrollArea` parent (ligne 337) par un simple `div` avec `overflow-y-auto h-[70vh]`. Les `ScrollArea` de Radix sont utiles pour les scrollbars stylées, mais ici elles empêchent le scroll horizontal imbriqué de fonctionner.

Avec un `div` natif :
- Le scroll vertical fonctionne via `overflow-y-auto`
- Les `div.overflow-x-auto` internes (éoliennes, accès, électricité) peuvent scrolller horizontalement indépendamment
- Les colonnes sticky restent figées

Retirer aussi le `style={{ minWidth: ... }}` sur la table et remettre simplement les colonnes à leur taille naturelle — le `overflow-x-auto` du wrapper fera le reste.

| Changement | Détail |
|------------|--------|
| Ligne 337 | `ScrollArea className="h-[70vh] ..."` → `div className="h-[70vh] overflow-y-auto pr-4"` |
| Ligne 1070 | `</ScrollArea>` → `</div>` |
| Ligne 431 | Retirer `style={{ minWidth: ... }}` de la table, garder `border-collapse text-sm` |

