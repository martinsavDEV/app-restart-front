
# Fix : Lots et lignes manquants dans les exports CAPEX

## Causes identifiées (2 bugs distincts)

### Bug 1 — Lignes sans section ignorées dans l'export

Dans `useSummaryData`, les lignes sont récupérées via une requête Supabase imbriquée :

```
lots → quote_sections → quote_lines
```

Cette structure **ne peut pas retourner** les lignes qui ont `section_id = NULL` (lignes directement attachées au lot, sans section). En base, il existe **33 lignes** dans cet état, réparties dans plusieurs lots dont "Renforcement de sol".

Ces lignes sont visibles dans la vue Pricing (qui utilise `useQuotePricing` avec une requête plate), mais **complètement absentes** des exports PDF et CSV.

### Bug 2 — Lots vides (0 lignes, 0 sections) absents du PDF

Un lot comme "Renforcement de sol" dans le projet "51 - Francheville" a `line_count = 0` et `section_count = 0` : il est `is_enabled: true`, il est bien dans `useSummaryData`, mais comme il n'a ni section ni ligne, son total est 0 et il n'a rien à afficher dans la partie "Détail par lot" du PDF. Il **apparaît bien** dans le résumé des lots (tableau du haut), mais génère une page quasi-vide dans le détail.

La vraie question est : ces lots avec 0 lignes ont-ils du contenu en réalité stocké **sans section** ? La réponse de la DB sur Francheville : non, ce lot est genuinement vide. Mais d'autres versions comme "16 - FE de la Besse" ou "86 - Plaisance" ont bien des lignes dans `renforcement_sol` — et certaines sans `section_id`.

## Solution

### Fichier : `src/hooks/useSummaryData.ts`

**Remplacer la requête imbriquée par deux requêtes séparées** :

1. **Requête 1** : Récupérer les lots + sections (sans les lignes)
2. **Requête 2** : Récupérer toutes les lignes du devis en une fois (`WHERE lot_id IN (...)`)
3. **Assemblage côté client** : Grouper les lignes par section, et créer une "section virtuelle" sans nom pour les lignes orphelines (`section_id = NULL`)

Cela garantit qu'**aucune ligne n'est perdue**, quelle que soit sa structure.

```text
Avant (requête imbriquée, perd les lignes sans section) :
  lots → quote_sections → quote_lines  (lignes section_id=NULL ignorées)

Après (deux requêtes plates) :
  Requête A : lots + quote_sections
  Requête B : toutes quote_lines WHERE lot_id IN [...]
  → Assemblage : lignes avec section_id → dans leur section
                 lignes sans section_id → dans une section virtuelle "Sans section"
```

### Comportement des lignes sans section dans l'export

- **PDF** : affichées dans une section intitulée "(Sans section)" ou directement sous l'en-tête du lot
- **CSV** : idem, avec une ligne de section virtuelle

### Résumé des changements

| Fichier | Changement |
|---------|------------|
| `src/hooks/useSummaryData.ts` | Remplacer la requête imbriquée par 2 requêtes plates + assemblage côté client |

Aucun autre fichier n'est modifié : `pdfExport.ts` et `csvUtils.ts` consomment déjà les `sections` correctement — il suffit que les données arrivent complètes.
