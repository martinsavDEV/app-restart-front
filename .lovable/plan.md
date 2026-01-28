
## Plan: Champ commentaire par ligne + Variable section multiple + Commentaire lot header

### Objectif
1. **Ajouter un champ commentaire libre sur chaque ligne de chiffrage** - visible/editable dans le tableau BPU
2. **Permettre d'utiliser une variable dans le multiplicateur de section multiple** - ex: `$nb_fondations`
3. **Ajouter un commentaire sur l'en-tete de chaque lot** - visible meme si non chiffre (ex: "Lot elec non chiffre")
4. **Inclure ces informations dans l'export CAPEX** (CSV et PDF)

---

### Partie 1 : Commentaire sur chaque ligne de chiffrage

La colonne `comment` existe deja dans la table `quote_lines` (base de donnees), mais elle n'est pas affichee dans l'interface d'edition.

**Fichier : `src/components/DraggableLine.tsx`**

Ajouter une colonne "Commentaire" dans le tableau avec un input editable :

| Modification | Detail |
|--------------|--------|
| Nouvelle colonne | Entre "Source prix" et "Actions" |
| Input | Textarea ou input text avec placeholder |
| Largeur | Largeur moyenne (~150px) |

**Fichier : `src/components/BPUTableWithSections.tsx`**

- Ajouter l'en-tete de colonne "Commentaire"
- Mettre a jour les props pour gerer la mise a jour du commentaire

---

### Partie 2 : Variable dans le multiplicateur de section

Le champ `linked_field` existe deja dans `quote_sections` mais ne supporte que les champs de `quote_settings` (ex: `n_wtg`). Il faut le modifier pour supporter les variables du Calculator (ex: `$nb_fondations`).

**Fichier : `src/components/SectionDialog.tsx`**

Ajouter une option pour lier le multiplicateur a une variable :

| Element | Detail |
|---------|--------|
| Select/Autocomplete | Choisir une variable du Calculator |
| Affichage | Variable selectionnee avec icone lien |
| Stockage | `linked_field` contiendra `$variable_name` |

**Fichier : `src/components/BPUTableWithSections.tsx`**

Modifier la resolution du multiplicateur :

```typescript
// Actuel: section.linked_field pointe vers quote_settings fields (n_wtg, etc.)
// Nouveau: supporter aussi les variables $xxx du Calculator
const resolveMultiplier = (section: QuoteSection) => {
  if (section.linked_field?.startsWith('$')) {
    // Resoudre via getVariableValue
    return getVariableValue(section.linked_field) ?? section.multiplier;
  }
  // Fallback: linked_field classique
  if (section.linked_field && quoteSettings) {
    return (quoteSettings as any)[section.linked_field] || section.multiplier;
  }
  return section.multiplier;
};
```

**Fichier : `src/hooks/useQuoteSections.ts`**

Modifier `updateSection` pour accepter `linked_field`:
- Ajouter `linked_field` aux updates possibles

---

### Partie 3 : Commentaire sur l'en-tete de lot

**Base de donnees : Ajouter colonne `header_comment`**

Migration SQL :
```sql
ALTER TABLE lots ADD COLUMN header_comment TEXT DEFAULT NULL;
```

**Fichier : `src/components/LotSection.tsx`**

Ajouter un champ commentaire sous le titre du lot :

| Element | Detail |
|---------|--------|
| Position | Sous CardDescription dans le header |
| Input | Textarea avec placeholder "Commentaire lot (ex: non chiffre, chiffre ailleurs...)" |
| Style | Texte italic, couleur muted |

**Fichier : `src/hooks/useQuotePricing.ts`**

- Ajouter une mutation pour mettre a jour `header_comment` du lot

**Fichier : `src/hooks/useSummaryData.ts`**

- Inclure `header_comment` dans la requete des lots

---

### Partie 4 : Integration dans l'export CAPEX

**Fichier : `src/lib/pdfExport.ts`**

- Afficher le commentaire de lot dans l'en-tete colore de chaque lot
- Afficher le commentaire de ligne dans la colonne "Designation" (entre parentheses ou sur ligne separee)

**Fichier : `src/lib/csvUtils.ts`**

- Ajouter une colonne "Commentaire" dans le detail des lignes
- Ajouter le commentaire de lot apres le titre du lot

**Fichier : `src/components/SummaryLotDetail.tsx`**

- Afficher `header_comment` sous le titre du lot
- Le commentaire de ligne est deja affiche (existe dans le code)

---

### Resume des fichiers

| Fichier | Action |
|---------|--------|
| **Migration SQL** | Ajouter `header_comment` a la table `lots` |
| `src/components/DraggableLine.tsx` | Ajouter colonne commentaire editable |
| `src/components/BPUTableWithSections.tsx` | Ajouter en-tete colonne + resolution variable multiplicateur |
| `src/components/SectionDialog.tsx` | Option lier multiplicateur a variable |
| `src/components/LotSection.tsx` | Champ commentaire en-tete lot |
| `src/hooks/useQuoteSections.ts` | Support `linked_field` avec variable |
| `src/hooks/useQuotePricing.ts` | Mutation update lot comment |
| `src/hooks/useSummaryData.ts` | Inclure `header_comment` |
| `src/lib/pdfExport.ts` | Afficher commentaires dans PDF |
| `src/lib/csvUtils.ts` | Inclure commentaires dans CSV |
| `src/components/SummaryLotDetail.tsx` | Afficher commentaire lot |

---

### Apercu interface

#### Ligne de chiffrage avec commentaire
```text
┌──────┬────────────────────┬──────┬──────┬──────────┬──────────┬────────────┬──────────────────────┬─────────┐
│  ☐   │ Designation        │ Qte  │ Unit │    PU    │  Total   │ Source     │ Commentaire          │ Actions │
├──────┼────────────────────┼──────┼──────┼──────────┼──────────┼────────────┼──────────────────────┼─────────┤
│  ☑   │ Beton C35/45       │  450 │  m3  │ 185,00 € │ 83 250 € │ MSA 2025   │ [Voir detail G2]     │  📋 🗑  │
└──────┴────────────────────┴──────┴──────┴──────────┴──────────┴────────────┴──────────────────────┴─────────┘
```

#### Section avec variable
```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ✨ Fondations           Nombre: [4] 🔗 ($nb_fondations)                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### En-tete lot avec commentaire
```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ LOT: ELECTRICITE                                                             │
│ Installation electrique du parc                                              │
│ 💬 [Lot non chiffre - forfait turbinier                          ] (editable)│
│                                                         Total: 0,00 €        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Export PDF enrichi

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ LOT: ELECTRICITE                                              0,00 €         │
│ ⚠️ Lot non chiffre - forfait turbinier                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Logique de resolution variable multiplicateur

```typescript
// Dans BPUTableWithSections
const getResolvedMultiplier = (section: QuoteSection): number => {
  if (!section.is_multiple) return 1;
  
  // Si lien vers variable Calculator ($xxx)
  if (section.linked_field?.startsWith('$')) {
    return getVariableValue(section.linked_field) ?? section.multiplier;
  }
  
  // Si lien vers champ quote_settings (n_wtg, n_foundations)
  if (section.linked_field && quoteSettings) {
    return (quoteSettings as any)[section.linked_field] ?? section.multiplier;
  }
  
  // Valeur statique
  return section.multiplier;
};
```

---

### Dialog creation section enrichi

```text
┌────────────────────────────────────────────────────────────────┐
│ Creer une section                                              │
├────────────────────────────────────────────────────────────────┤
│ Nom de la section: [Fondations________________________]        │
│                                                                │
│ Type de section:                                               │
│   ○ Section unique (total simple)                              │
│   ● Section multiple (avec multiplicateur)                     │
│                                                                │
│ Multiplicateur:                                                │
│   ○ Valeur fixe: [4_____]                                      │
│   ● Lie a une variable:                                        │
│     [$nb_fondations________________ ▼]                         │
│     💡 La valeur sera resolue automatiquement                  │
│                                                                │
│                               [Annuler]  [Creer]               │
└────────────────────────────────────────────────────────────────┘
```
