

# Fix: Scroll horizontal du tableau éoliennes

## Diagnostic

Le scroll horizontal ne fonctionne pas à cause de la chaîne de conteneurs CSS qui ne contraint jamais la largeur :

1. `DialogContent` utilise `display: grid` (Radix) — les enfants grid s'étendent à la taille de leur contenu par défaut
2. Le `div.flex-1` (ligne 336) n'a pas de `min-w-0` ni `overflow-hidden` — en flex, un enfant ne rétrécit pas en-dessous de sa taille de contenu intrinsèque sans `min-w-0`
3. Le `div.overflow-x-auto` (ligne 430) ne peut donc jamais être en overflow car ses parents s'élargissent pour accommoder le contenu

Le résultat : la dialog pousse au-delà de l'écran plutôt que de déclencher le scroll interne.

## Solution

**Fichier** : `src/components/CalculatorDialog.tsx`

Ajouter `overflow-hidden` sur les conteneurs intermédiaires pour forcer le contenu à rester dans les limites du dialog :

| Ligne | Actuel | Nouveau |
|-------|--------|---------|
| 323 | `max-w-[95vw] max-h-[90vh]` | `max-w-[95vw] max-h-[90vh] overflow-hidden` |
| 334 | `flex gap-4 h-full` | `flex gap-4 h-full min-w-0 overflow-hidden` |
| 336 | `flex-1` | `flex-1 min-w-0 overflow-hidden` |
| 337 | `h-[70vh] overflow-y-auto pr-4` | `h-[70vh] overflow-y-auto overflow-x-hidden pr-4` |

Avec ces contraintes, le `div.overflow-x-auto` (ligne 430) autour du tableau deviendra enfin le point de débordement, et la scrollbar horizontale apparaîtra quand il y a beaucoup d'éoliennes.

La table reste en `border-collapse text-sm` sans largeur fixe — ses colonnes (`min-w-[180px]` + `min-w-[50px]` + N × `min-w-[100px]`) déclencheront naturellement l'overflow.

