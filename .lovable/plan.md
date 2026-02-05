
## Plan: Rechargement automatique des prix + Ordre des onglets + Couleurs dynamiques des lots

### Objectif
1. **Rechargement automatique des prix au chargement d'un template** - Si un item du template existe dans la base de prix, utiliser le tarif a jour
2. **Corriger l'ordre des onglets Templates** - Terrassement, Renforcement de sol, Fondations, Electricite, Turbinier
3. **Ameliorations visuelles des lots** - Lot actif avec fond + bordure de couleur, lots inactifs avec bordure seule, sections colorees selon le lot

---

### Partie 1 : Rechargement automatique des prix

**Fichier : `src/components/TemplateLoaderDialog.tsx`**

Actuellement le code verifie deja les variantes de prix (`variantsMap`), mais il ne met pas a jour les prix des items qui n'ont qu'une seule variante.

| Modification | Detail |
|--------------|--------|
| Mise a jour automatique | Pour chaque ligne du template, chercher dans la base de prix |
| Si 1 variante trouvee | Appliquer automatiquement le nouveau prix |
| Si plusieurs variantes | Afficher le selecteur (comportement actuel) |
| Si aucune variante | Garder le prix du template |

**Logique modifiee dans `handleLoad()`** :
```typescript
const handleLoad = () => {
  if (!selectedTemplate) return;

  const templateData = selectedTemplate.template_lines as any;
  let sections: WorkSection[] = templateData.sections || [];

  // Lignes avec plusieurs variantes (afficher selecteur)
  const linesWithMultipleVariants: LineWithVariants[] = [];
  
  // Mettre a jour automatiquement les prix avec 1 seule variante
  sections = sections.map((section) => ({
    ...section,
    lines: section.lines?.map((line: BPULine) => {
      const variants = findVariants(line.designation);
      
      if (variants.length === 1) {
        // Une seule variante : mettre a jour automatiquement
        const priceItem = variants[0];
        return {
          ...line,
          unitPrice: priceItem.unit_price,
          priceSource: priceItem.price_reference || priceItem.item,
        };
      } else if (variants.length > 1) {
        // Plusieurs variantes : collecter pour le selecteur
        linesWithMultipleVariants.push({
          sectionId: section.id,
          sectionTitle: section.title,
          line,
          variants,
        });
      }
      // Aucune variante : garder le prix original
      return line;
    }),
  }));

  if (linesWithMultipleVariants.length > 0) {
    setPendingSections(sections);
    setLinesWithVariants(linesWithMultipleVariants);
    setShowVariantSelector(true);
  } else {
    onLoadTemplate(sections);
    onOpenChange(false);
    setSelectedTemplateId(null);
  }
};
```

**Feedback visuel dans l'apercu** :
- Items avec prix mis a jour automatiquement : badge vert "Prix MAJ"
- Items avec plusieurs variantes : badge ambre "X prix" (existant)
- Items sans correspondance : pas de badge

---

### Partie 2 : Corriger l'ordre des onglets Templates

**Fichier : `src/components/TemplatesView.tsx`**

Modifier le tableau `LOT_TABS` (ligne 21-27) :

**Avant** :
```typescript
const LOT_TABS = [
  { value: "fondation", label: "Fondations" },
  { value: "terrassement", label: "Terrassement" },
  { value: "renforcement", label: "Renforcement" },
  { value: "electricite", label: "Électricité" },
  { value: "turbine", label: "Turbine" },
];
```

**Apres** :
```typescript
const LOT_TABS = [
  { value: "terrassement", label: "Terrassement" },
  { value: "renforcement", label: "Renforcement de sol" },
  { value: "fondation", label: "Fondations" },
  { value: "electricite", label: "Électricité" },
  { value: "turbine", label: "Turbinier" },
];
```

**Mettre a jour aussi `activeTab` par defaut** :
```typescript
const [activeTab, setActiveTab] = useState("terrassement");
```

**Fichier : `src/components/TemplateEditorDialog.tsx`**

Modifier `LOT_OPTIONS` (ligne 42-48) pour correspondre au meme ordre :
```typescript
const LOT_OPTIONS = [
  { value: "terrassement", label: "Terrassement" },
  { value: "renforcement", label: "Renforcement de sol" },
  { value: "fondation", label: "Fondations" },
  { value: "electricite", label: "Électricité" },
  { value: "turbine", label: "Turbinier" },
];
```

---

### Partie 3 : Ameliorations visuelles des lots

#### A. Cards de lot actif avec fond + bordure coloree

**Fichier : `src/components/LotSection.tsx`**

Passer `lotCode` en prop et appliquer les couleurs aux Cards :

```typescript
interface LotSectionProps {
  lot: any;
  // ... autres props
}

export const LotSection = ({ lot, ... }: LotSectionProps) => {
  const colors = getLotColors(lot.code);
  
  return (
    <>
      {/* Card principale du lot - bordure + fond colore */}
      <Card className={cn("border-2", colors.border, colors.bg)}>
        <CardHeader className="pb-3">
          ...
        </CardHeader>
      </Card>

      {/* Card des lignes de chiffrage - bordure coloree */}
      <Card className={cn("border-2", colors.border)}>
        ...
      </Card>
    </>
  );
};
```

#### B. Sections colorees selon le lot

**Fichier : `src/components/BPUTableWithSections.tsx`**

Remplacer les couleurs emerald fixes par les couleurs dynamiques du lot :

**Avant** (ligne 415) :
```typescript
<div className="bg-emerald-500/20 px-3 py-2 mb-2 rounded-md flex items-center justify-between border border-emerald-500/30">
  <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{section.name}</h3>
```

**Apres** :
```typescript
// Recevoir lotCode en prop et utiliser getLotColors
const colors = getLotColors(lotCode || '');

// Dans le rendu des sections
<div className={cn(
  "px-3 py-2 mb-2 rounded-md flex items-center justify-between border-2",
  colors.bg,
  colors.border
)}>
  <h3 className={cn("text-sm font-semibold", colors.text)}>{section.name}</h3>
```

**Ajouter l'import** :
```typescript
import { getLotColors } from "@/lib/lotColors";
import { cn } from "@/lib/utils";
```

**Stocker les couleurs dans le composant** :
```typescript
export const BPUTableWithSections = ({ 
  lines, 
  sections,
  ...,
  lotCode, // deja present
}: BPUTableWithSectionsProps) => {
  
  const lotColors = getLotColors(lotCode || '');
  
  // Utiliser lotColors dans le rendu
```

---

### Resume des fichiers a modifier

| Fichier | Modifications |
|---------|---------------|
| `src/components/TemplateLoaderDialog.tsx` | Mise a jour auto des prix si 1 variante |
| `src/components/TemplatesView.tsx` | Ordre des onglets + activeTab par defaut |
| `src/components/TemplateEditorDialog.tsx` | Ordre des LOT_OPTIONS |
| `src/components/LotSection.tsx` | Couleurs sur les Cards |
| `src/components/BPUTableWithSections.tsx` | Couleurs dynamiques des sections |

---

### Apercu visuel - Lot Fondations (jaune) actif

```text
┌─ FOND JAUNE + BORDURE JAUNE ─────────────────────────────────────────────────┐
│ Fondations                                                                    │
│ Travaux de fondation pour eoliennes                                          │
│                                           [Charger template]  Total: 450,000€│
└──────────────────────────────────────────────────────────────────────────────┘

┌─ BORDURE JAUNE ──────────────────────────────────────────────────────────────┐
│ Lignes de chiffrage                      [Creer section] [Ajouter une ligne] │
│                                                                               │
│ ┌─ FOND JAUNE CLAIR + BORDURE JAUNE ──────────────────────────────────────┐  │
│ │ Cage d'ancrage                                      Nombre: 4 [$nb_eol]  │  │
│ └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  □  | Designation              | Comment | Qte | Unite | PU      | Total     │
│ ────┼──────────────────────────┼─────────┼─────┼───────┼─────────┼───────────│
│  ☐  | Beton C35/45             |         | 450 | m³    | 185,00€ | 83,250€   │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Apercu visuel - Onglets Templates (nouvel ordre)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Templates                                            [+ Nouveau template]    │
│ Modeles de chiffrage reutilisables                                           │
│                                                                               │
│ [TERRASSEMENT] [RENF. SOL] [FONDATIONS] [ELECTRICITE] [TURBINIER]           │
│    (orange)      (rose)     (jaune)      (bleu ciel)   (bleu fonce)         │
│                                                                               │
│   Onglet actif = fond colore + texte blanc                                   │
│   Onglets inactifs = fond pastel + bordure coloree + texte colore            │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Details techniques - Couleurs par lot

| Lot | Code | Fond pastel | Fond actif | Bordure | Texte |
|-----|------|-------------|------------|---------|-------|
| Terrassement | `terrassement` | `bg-orange-100` | `bg-orange-500` | `border-orange-400` | `text-orange-700` |
| Renforcement | `renforcement` | `bg-pink-100` | `bg-pink-500` | `border-pink-400` | `text-pink-700` |
| Fondations | `fondation` | `bg-yellow-100` | `bg-yellow-500` | `border-yellow-400` | `text-yellow-700` |
| Electricite | `electricite` | `bg-sky-100` | `bg-sky-500` | `border-sky-400` | `text-sky-700` |
| Turbinier | `turbine` | `bg-blue-100` | `bg-blue-600` | `border-blue-500` | `text-blue-700` |
