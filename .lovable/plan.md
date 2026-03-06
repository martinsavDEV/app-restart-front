

# Refonte UI/UX — Portefeuille Projets

## Changements demandes

1. **Supprimer la "Recherche intelligente"** dans la Topbar (lignes 96-103 de `Topbar.tsx`) — le champ de recherche non fonctionnel
2. **Retirer n_wtg et puissance du niveau Projet** — ces donnees appartiennent aux versions de chiffrage, pas au projet
3. **Reequilibrer les colonnes** — liste projets plus etroite (~350px), panneau detail plus large (flex-1)
4. **Enrichir les QuoteVersionCard** avec n_wtg, turbine_power, turbine_model depuis `quote_settings`
5. **Simplifier le ProjectDetailPanel** — retirer les KPIs Puissance/Eoliennes, garder uniquement le compteur de versions
6. **Afficher le dernier editeur et la date de MAJ** sur chaque version card

## Plan technique

### 1. `src/components/Topbar.tsx`
- Supprimer le bloc "Search" (lignes 96-103) — le `div` contenant l'input "Recherche intelligente"

### 2. `src/components/ProjectCard.tsx`
- Retirer l'affichage `n_wtg` / icone Wind de la carte projet
- Garder : nom, departement, nombre de versions, date derniere MAJ

### 3. `src/components/ProjectsView.tsx`
- Inverser les proportions : colonne liste = `w-[350px] shrink-0`, panneau detail = `flex-1`

### 4. `src/hooks/useProjects.ts` — `useQuoteVersions`
- Modifier la requete pour joindre `quote_settings` : `select("*, quote_settings(n_wtg, turbine_power, turbine_model)")`
- Ajouter les champs `n_wtg`, `turbine_power`, `turbine_model` au type `QuoteVersion` retourne (extraits de la jointure)

### 5. `src/components/ProjectDetailPanel.tsx`
- Supprimer la grille KPIs (Puissance, Eoliennes, Versions) — lignes 94-124
- Garder juste le header avec nom + departement + description + badge Actif
- Le compteur de versions peut etre affiche dans le titre de la section "Versions de chiffrage"

### 6. `src/components/QuoteVersionCard.tsx`
- Ajouter l'affichage de `n_wtg` eoliennes, `turbine_power` MW, `turbine_model` sous le label de version
- Afficher la date de derniere MAJ et, si disponible, le nom de l'editeur (via `last_update`)
- Enrichir l'interface `QuoteVersion` avec `n_wtg?`, `turbine_power?`, `turbine_model?`

### 7. `src/components/ProjectDialog.tsx`
- Verifier si le champ `n_wtg` est present dans le formulaire de creation de projet et le retirer (cette info est au niveau version/quote_settings)

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/components/Topbar.tsx` | Supprimer recherche intelligente |
| `src/components/ProjectCard.tsx` | Retirer n_wtg/Wind |
| `src/components/ProjectsView.tsx` | Inverser proportions colonnes |
| `src/hooks/useProjects.ts` | Joindre quote_settings dans useQuoteVersions |
| `src/components/ProjectDetailPanel.tsx` | Supprimer KPIs, simplifier header |
| `src/components/QuoteVersionCard.tsx` | Ajouter infos techniques par version |
| `src/components/ProjectDialog.tsx` | Retirer champ n_wtg si present |

