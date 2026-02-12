

# Correction : Template fondation invisible dans l'editeur

## Probleme

Deux templates "fondations" existent en base avec des codes differents :
- `fondation` (singulier) : "Fondations Standard" 
- `fondations` (pluriel) : "Fondations"

L'onglet de l'editeur de templates filtre sur `code === "fondation"` (singulier), donc le template avec le code `fondations` (pluriel) n'apparait pas.

Le dialog de chargement de template affiche tout sans filtre, donc les deux sont visibles.

## Solution

Corriger le code du template en base de donnees : mettre `fondation` (singulier) au lieu de `fondations` (pluriel) pour le template concerne (id: `7dc63fba-31d4-442a-b57b-2325aae10d40`).

C'est la correction la plus simple et coherente : un seul code canonique par lot.

## Details techniques

| Action | Detail |
|--------|--------|
| Migration SQL | `UPDATE lot_templates SET code = 'fondation' WHERE id = '7dc63fba-...'` |

Aucun fichier code n'est modifie.
