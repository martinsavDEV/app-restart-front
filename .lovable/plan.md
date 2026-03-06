

# Refonte layout Portefeuille Projets

## Changements

### 1. Layout 50/50 (`ProjectsView.tsx`)
- Remplacer `w-[350px]` par `w-1/2` pour la colonne projets
- La colonne detail reste `flex-1` (= l'autre moitie)

### 2. Highlight dynamique des cards (`QuoteVersionCard.tsx`)
- Supprimer la distinction `isActive` / pas active pour le style visuel et les boutons
- Le style highlight (fond, bordure accent, bouton "Ouvrir") est pilote uniquement par `isSelected`
- Toutes les cards non selectionnees ont le meme style neutre
- Le bouton "Ouvrir" avec CTA accent apparait sur la card selectionnee ; les autres affichent juste le montant sans bouton "Consulter"

### 3. Commentaires collapsed sous les cards (`ProjectDetailPanel.tsx`)
- Utiliser `Collapsible` de Radix pour la section commentaires
- Les commentaires sont expanded uniquement quand une version est selectionnee (controlled par `selectedVersionId`)
- Afficher le titre "Commentaires - V1" comme trigger collapsible
- Le contenu (`QuoteComments`) est dans `CollapsibleContent`

### 4. Supprimer `activeVersionId` (`ProjectsView.tsx` + `ProjectDetailPanel.tsx`)
- Retirer le prop `activeVersionId` et la notion de "version active = premiere version"
- Le `selectedVersionId` dans `ProjectDetailPanel` gere tout : highlight, CTA, commentaires

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/components/ProjectsView.tsx` | `w-1/2`, retirer `activeVersionId` prop |
| `src/components/ProjectDetailPanel.tsx` | Retirer `activeVersionId`, commentaires collapsibles |
| `src/components/QuoteVersionCard.tsx` | Highlight et CTA bases sur `isSelected` uniquement, retirer `isActive` |

