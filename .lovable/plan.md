

# Déplacer les commentaires sous la carte sélectionnée

## Problème
Les commentaires sont dans une section séparée en bas du panneau, déconnectés visuellement de la version de chiffrage à laquelle ils sont liés.

## Solution
Intégrer les commentaires directement dans la boucle `versions.map()`, en les affichant juste en dessous de la carte sélectionnée. Supprimer la section commentaires séparée en bas.

## Modification — `src/components/ProjectDetailPanel.tsx`

Dans la boucle `versions.map()` (lignes 116-128), après chaque `QuoteVersionCard`, afficher conditionnellement le bloc `QuoteComments` si cette version est sélectionnée :

```tsx
{versions.map((version) => (
  <div key={version.id}>
    <QuoteVersionCard ... />
    {version.id === selectedVersionId && (
      <div className="mt-2 ml-2 border-l-2 border-primary/30 pl-3">
        <div className="flex items-center gap-1.5 mb-2">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Commentaires</span>
        </div>
        <QuoteComments quoteVersionId={version.id} compact />
      </div>
    )}
  </div>
))}
```

Supprimer la section `Collapsible comments` (lignes 133-155).

| Fichier | Action |
|---------|--------|
| `src/components/ProjectDetailPanel.tsx` | Déplacer commentaires inline sous la carte sélectionnée |

