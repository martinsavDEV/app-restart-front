
## Plan: Corrections commentaires lignes + Compteur versions + Améliorations base de prix

### Objectif
1. **Corriger le champ commentaire des lignes de chiffrage** - Le problème est que chaque frappe déclenche une sauvegarde et une re-fetch des données, ce qui écrase le texte en cours de saisie
2. **Déplacer le champ commentaire** entre "Désignation" et "Quantité"
3. **Réparer le compteur de versions** sur la vue d'ensemble et afficher la date de dernière MAJ
4. **Améliorer la base de prix** avec recherche, multi-sélection et filtre par date

---

### Partie 1 : Correction du champ commentaire (lignes de chiffrage)

**Problème identifié** :
Le composant `DraggableLine.tsx` déclenche une mise à jour à chaque frappe (`onChange`). Cette mise à jour :
1. Sauvegarde en base de données
2. Invalide le cache React Query
3. Re-fetch les données → les nouvelles données écrasent l'input avant que la sauvegarde soit terminée

**Solution : Gérer le commentaire avec un état local + sauvegarde au blur**

**Fichier : `src/components/DraggableLine.tsx`**

| Modification | Détail |
|--------------|--------|
| Ajouter un état local | `const [localComment, setLocalComment] = useState(line.comment)` |
| Synchroniser avec les props | `useEffect` pour mettre à jour quand `line.comment` change |
| onChange | Met à jour l'état local uniquement |
| onBlur | Sauvegarde en base si la valeur a changé |

```typescript
// Ajouter un état local pour le commentaire
const [localComment, setLocalComment] = useState(line.comment || "");

// Synchroniser quand line.comment change (après une save réussie)
useEffect(() => {
  setLocalComment(line.comment || "");
}, [line.comment]);

// Input avec état local
<input
  type="text"
  value={localComment}
  onChange={(e) => setLocalComment(e.target.value)}
  onBlur={() => {
    if (localComment !== (line.comment || "")) {
      onLineUpdate(line.id, { comment: localComment });
    }
  }}
  placeholder="Commentaire..."
/>
```

**Déplacer la colonne commentaire** :
- Actuellement : après "Source prix"
- Cible : entre "Désignation" et "Quantité"

**Fichier : `src/components/BPUTableWithSections.tsx`**

Réorganiser les en-têtes de colonnes :
```text
| Sél | Désignation | Commentaire | Qté | Unité | PU | Total | Source | Actions |
```

---

### Partie 2 : Réparer le compteur de versions + date MAJ

**Problème identifié** :
Dans `ProjectCard.tsx`, le code utilise `project.quote_versions?.length` alors que cette propriété est supprimée du projet dans `useProjects.ts` (ligne 60). Les valeurs calculées `quote_count` et `latest_update` existent mais ne sont pas affichées.

**Fichier : `src/components/ProjectCard.tsx`**

| Modification | Détail |
|--------------|--------|
| Ajouter props | `quote_count?: number` et `latest_update?: string` |
| Afficher le compteur | Utiliser `quote_count` au lieu de `quote_versions.length` |
| Afficher la date MAJ | Remplacer l'affichage du montant par la date de dernière modification |

Interface mise à jour :
```typescript
interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  quoteCount?: number;       // Nouveau
  latestUpdate?: string;     // Nouveau
}
```

Affichage modifié :
```text
┌───────────────────────────────────────────────────┐
│ [PM] Parc Montagne du Vent                        │
│      Auvergne • 🌀 4 éoliennes                    │
│                                   3 versions      │
│                                   Modifié: 15/01  │
└───────────────────────────────────────────────────┘
```

**Fichier : `src/components/ProjectsView.tsx`**

Passer les nouvelles props au `ProjectCard` :
```typescript
<ProjectCard
  ...
  quoteCount={project.quote_count}
  latestUpdate={project.latest_update}
/>
```

---

### Partie 3 : Améliorations de la base de prix

**Fichier : `src/components/PriceDBView.tsx`**

#### A. Barre de recherche pour filtrer les désignations

Ajouter un champ de recherche au-dessus du tableau :

```typescript
const [searchQuery, setSearchQuery] = useState("");

const filteredPriceItems = priceItems.filter(item =>
  item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
  item.price_reference?.toLowerCase().includes(searchQuery.toLowerCase())
);
```

UI :
```text
┌─────────────────────────────────────────────────────────────┐
│ 🔍 [Rechercher par désignation, référence...             ]  │
│ Filtre date: [Toutes ▼] [Récentes ▼] [Anciennes ▼]          │
└─────────────────────────────────────────────────────────────┘
```

#### B. Multi-sélection avec checkboxes

| Élément | Détail |
|---------|--------|
| État | `selectedItems: Set<string>` |
| Checkbox header | Sélectionner/désélectionner tout |
| Checkbox par ligne | Ajouter/retirer de la sélection |
| Bouton action | "Supprimer X sélectionnés" (affiché si sélection > 0) |

```typescript
const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

const toggleSelection = (id: string) => {
  const newSet = new Set(selectedItems);
  if (newSet.has(id)) {
    newSet.delete(id);
  } else {
    newSet.add(id);
  }
  setSelectedItems(newSet);
};

const handleBulkDelete = () => {
  // Supprimer tous les items sélectionnés
};
```

#### C. Filtre par date de modification

Options de filtre :
- "Toutes" (pas de filtre)
- "Récentes" (modifiées dans les 30 derniers jours)
- "Anciennes" (modifiées il y a plus de 30 jours)

```typescript
const [dateFilter, setDateFilter] = useState<"all" | "recent" | "old">("all");

const filterByDate = (items: PriceItem[]) => {
  if (dateFilter === "all") return items;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return items.filter(item => {
    const modifDate = item.date_modif ? new Date(item.date_modif) : null;
    if (!modifDate) return dateFilter === "old";
    return dateFilter === "recent" 
      ? modifDate >= thirtyDaysAgo 
      : modifDate < thirtyDaysAgo;
  });
};
```

---

### Résumé des fichiers à modifier

| Fichier | Action |
|---------|--------|
| `src/components/DraggableLine.tsx` | État local pour commentaire + déplacer colonne |
| `src/components/BPUTableWithSections.tsx` | Réorganiser colonnes (Commentaire après Désignation) |
| `src/components/ProjectCard.tsx` | Utiliser `quoteCount` et `latestUpdate` props |
| `src/components/ProjectsView.tsx` | Passer les nouvelles props |
| `src/components/PriceDBView.tsx` | Recherche + Multi-sélection + Filtre date |

---

### Aperçu interface - Base de prix améliorée

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Base de prix - Fondations                                                        │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 🔍 [Rechercher par désignation...                    ]   Date: [Récentes ▼]     │
│                                                                                  │
│ [2 sélectionnés]  [🗑 Supprimer la sélection]                                    │
├──────┬────────────────────────────────────────┬──────┬──────────┬────────┬──────┤
│  ☐   │ Désignation                            │ Unité│  PU      │ Réf.   │ Date │
├──────┼────────────────────────────────────────┼──────┼──────────┼────────┼──────┤
│  ☑   │ Béton C35/45                           │  m³  │ 185,00 € │ MSA 25 │12/01 │
│  ☑   │ Armatures HA                           │  kg  │   1,80 € │ MSA 25 │12/01 │
│  ☐   │ Coffrage soigné                        │  m²  │  45,00 € │ MSA 25 │10/01 │
└──────┴────────────────────────────────────────┴──────┴──────────┴────────┴──────┘
```

---

### Aperçu interface - Carte projet avec date MAJ

```text
┌─────────────────────────────────────────────────────────────────┐
│ [PM] Parc de la Montagne                                        │
│      Auvergne-Rhône-Alpes • 🌀 4 éoliennes                      │
│                                                                  │
│                                           3 versions            │
│                                           MAJ: 28/01/2026       │
└─────────────────────────────────────────────────────────────────┘
```

---

### Logique technique du commentaire avec debounce/blur

```typescript
// Dans DraggableLine.tsx
const [localComment, setLocalComment] = useState(line.comment || "");

useEffect(() => {
  setLocalComment(line.comment || "");
}, [line.comment]);

// L'input utilise l'état local
<input
  type="text"
  value={localComment}
  onChange={(e) => setLocalComment(e.target.value)}
  onBlur={() => {
    // Sauvegarder seulement si la valeur a changé
    if (localComment !== (line.comment || "")) {
      onLineUpdate(line.id, { comment: localComment });
    }
  }}
  onKeyDown={(e) => {
    // Sauvegarder aussi sur Entrée
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }}
  placeholder="Commentaire..."
/>
```
