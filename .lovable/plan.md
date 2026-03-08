

# Indicateur de commentaires sur les QuoteVersionCards

## Objectif
Afficher un badge/indicateur du nombre de commentaires directement sur chaque carte de version, visible **avant** de la sélectionner. Si des commentaires existent, un bouton vert invite à cliquer pour les voir.

## Approche

### 1. Nouveau hook `useQuoteCommentCounts`
Créer un hook léger qui récupère le **count** de commentaires pour une liste de version IDs en une seule requête (éviter N requêtes individuelles).

```typescript
// src/hooks/useQuoteCommentCounts.ts
// Requête groupée : select quote_version_id, count(*) from quote_comments 
// where quote_version_id in (...ids) group by quote_version_id
// Retourne un Map<string, number>
```

### 2. `QuoteVersionCard` — nouveau prop `commentCount`
Ajouter un prop optionnel `commentCount?: number`. Dans la zone date (ligne 137-140), afficher à côté :
- Si `commentCount > 0` : un petit badge vert avec icone `MessageSquare` + nombre, cliquable (déclenche `onSelect`)
- Si `commentCount === 0` : rien (ou une icone grisée discrète)

Le badge vert sert de CTA visuel pour inviter l'utilisateur à sélectionner la carte et voir les commentaires.

### 3. `ProjectDetailPanel` — passer les counts
Utiliser le hook dans `ProjectDetailPanel`, passer le count à chaque `QuoteVersionCard`.

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `src/hooks/useQuoteCommentCounts.ts` | Nouveau — requête groupée des counts |
| `src/components/QuoteVersionCard.tsx` | Ajouter prop `commentCount` + badge vert avec `MessageSquare` |
| `src/components/ProjectDetailPanel.tsx` | Appeler le hook, passer `commentCount` à chaque card |

