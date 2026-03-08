

# Persister la sélection du projet entre les vues

## Problème
`selectedProjectId` est un état local dans `ProjectsView`. À chaque changement de vue, le composant se remonte et l'auto-sélection reprend le premier projet (trié par `created_at DESC`), soit toujours "86 Adrien".

## Solution
Remonter `selectedProjectId` dans `Index.tsx` (où il existe déjà partiellement) et le passer en prop à `ProjectsView`, pour que la sélection survive aux changements de vue.

## Modification — `src/pages/Index.tsx`
Passer `selectedProjectId` en prop à `ProjectsView` :
```tsx
<ProjectsView
  selectedProjectId={selectedProjectId}
  onOpenPricing={handleOpenPricing}
  onProjectSelect={(id, name) => { ... }}
/>
```

## Modification — `src/components/ProjectsView.tsx`
- Accepter un nouveau prop `selectedProjectId` (optionnel, venant du parent)
- Initialiser l'état local avec cette valeur : `useState(props.selectedProjectId || null)`
- L'auto-sélection ne se déclenche que si aucun projet n'est pré-sélectionné

| Fichier | Action |
|---------|--------|
| `src/pages/Index.tsx` | Passer `selectedProjectId` à `ProjectsView` |
| `src/components/ProjectsView.tsx` | Accepter le prop et l'utiliser comme valeur initiale |

