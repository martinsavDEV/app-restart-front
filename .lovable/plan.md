
## Plan: Amélioration du diagramme fondation + Panneau Variables dans la vue Chiffrage

### Objectif
1. **Refaire le diagramme de fondation** pour qu'il ressemble à l'image de référence (coupe transversale avec TN 0.00, fondation avec cage d'ancrage visible, talus en dégradé)
2. **Ajouter un panneau latéral "Variables & Calculator"** dans la vue PricingView pour consulter les variables et le capexator sans quitter l'édition
3. **Filtrer/rechercher les variables** par nom (avec ou sans `$`)
4. **Afficher la variable liée au survol** des champs dans le Calculator
5. **Corriger la variable `$sum_vol_substitution`** qui devrait toujours s'afficher (même si 0)

---

### Partie 1 : Refonte du diagramme fondation

**Fichier : `src/components/FoundationDiagram.tsx`**

Refaire le composant SVG pour reproduire le style de l'image de référence :

| Élément | Style |
|---------|-------|
| Ligne de sol (TN 0.00) | Ligne horizontale verte pointillée |
| Ciel / fond | Dégradé clair (beige/sable) au-dessus du sol |
| Talus | Trapèze orange/sable avec contour orange |
| Fondation | Forme grise avec la cage d'ancrage (forme caractéristique) |
| Annotations | Diamètre (ex: Ø39.40m), hauteur (3.50m), niveau TN 0.00 |
| Label | Badge "COUPE TRANSVERSALE" en haut à gauche |

Structure du SVG :
```text
┌──────────────────────────────────────────────────────────────────┐
│ [COUPE TRANSVERSALE]                                             │
│                         Ø39.40m                        TN 0.00   │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │ (ligne verte)
│             ╱▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔╲                            │
│            ╱                          ╲                     3.50m│
│           ╱   ┌──────────────────┐     ╲                        ↓│
│          ╱    │   FONDATION      │      ╲                        │
│─────────╱─────┴──────────────────┴───────╲───────────────────────│
└──────────────────────────────────────────────────────────────────┘
```

---

### Partie 2 : Panneau latéral Variables dans PricingView

**Fichier : `src/components/VariablesSidePanel.tsx` (Créer)**

Nouveau composant panneau rétractable :

| Fonctionnalité | Détail |
|----------------|--------|
| Toggle afficher/masquer | Bouton dans l'en-tête ou flottant à droite |
| Barre de recherche | Filtre les variables par nom (avec ou sans $) ou label |
| Liste groupée par catégorie | Affichage identique au Calculator |
| Bouton copier | Copie le nom de la variable dans le presse-papiers |
| Accès Calculator | Bouton pour ouvrir le CalculatorDialog |

Structure :
```text
┌─────────────────────────────┐
│ 🔍 [Rechercher variable...] │
│ ─────────────────────────── │
│ GLOBAL                      │
│  $nb_eol           4        │
│ FONDATION                   │
│  $surface_fond_fouille 452  │
│  $volume_terrassement  2845 │
│ TOTAUX                      │
│  $sum_vol_substitution 2941 │
│  ...                        │
│ ─────────────────────────── │
│ [⚙️ Ouvrir Calculator]      │
└─────────────────────────────┘
```

**Fichier : `src/components/PricingView.tsx`**

Modifications :
- Ajouter un état `showVariablesPanel` (toggle)
- Charger les `quoteSettings` pour récupérer `calculator_data`
- Intégrer le `VariablesSidePanel` à droite avec layout flex
- Ajouter un bouton toggle dans l'en-tête

**Fichier : `src/components/QuantityFormulaInput.tsx`**

Amélioration du filtre :
- Quand l'utilisateur tape du texte, filtrer les variables même sans le `$` initial
- Ex: taper "surf" affiche `$surface_fond_fouille`, `$sum_surf_PF`

---

### Partie 3 : Tooltip variable au survol dans Calculator

**Fichier : `src/components/CalculatorDialog.tsx`**

Pour chaque champ éditable du tableau (turbines, accès, câbles HTA) :
- Ajouter un attribut `title` ou `Tooltip` montrant le nom de variable correspondant
- Ex: survoler le champ "Plateforme + pan coupé" de E01 affiche: `$surf_PF_E01`

Pattern pour générer le nom de variable :
| Champ | Variable |
|-------|----------|
| surf_PF de turbine X | `$surf_PF_{turbine.name}` |
| acces_PF de turbine X | `$acces_PF_{turbine.name}` |
| longueur de tronçon Y | `$longueur_{segment.name}` |
| alu_95 de câble Z | `$alu95_{cable.name}` |

---

### Partie 4 : Correction variable $sum_vol_substitution

**Fichier : `src/hooks/useCalculatorVariables.ts`**

Modification ligne 111-119 :
```typescript
// Avant: condition if (foundationMetrics && sumVolSubstitution > 0)
// Après: toujours ajouter la variable (même si 0)
vars.push({
  name: "$sum_vol_substitution",
  value: foundationMetrics 
    ? Math.round(sumVolSubstitution * 100) / 100 
    : 0,
  label: "Total Vol. substitution (m³)",
  category: "Totaux",
});
```

---

### Résumé des fichiers

| Fichier | Action |
|---------|--------|
| `src/components/FoundationDiagram.tsx` | **Refaire** - Nouveau design SVG |
| `src/components/VariablesSidePanel.tsx` | **Créer** - Panneau latéral avec recherche |
| `src/components/PricingView.tsx` | **Modifier** - Intégrer panneau + toggle |
| `src/components/QuantityFormulaInput.tsx` | **Modifier** - Améliorer filtre (sans $) |
| `src/components/CalculatorDialog.tsx` | **Modifier** - Tooltips sur les inputs |
| `src/hooks/useCalculatorVariables.ts` | **Modifier** - Toujours exposer $sum_vol_substitution |

---

### Partie technique

#### Layout PricingView avec panneau
```
┌──────────────────────────────────────────────────────────────────────┐
│ [Tabs: LOT GC | LOT E | ...]                    [📊 Variables ▼]   │
├────────────────────────────────────────────────┬─────────────────────┤
│                                                │ Variables Panel    │
│  [Quote Summary Card]                          │ ┌─────────────────┐│
│                                                │ │🔍 Rechercher... ││
│  [LOT Section + BPU Table]                     │ │                 ││
│                                                │ │ GLOBAL          ││
│  ...                                           │ │  $nb_eol    4   ││
│                                                │ │ FONDATION       ││
│                                                │ │  $surface..452  ││
│                                                │ │                 ││
│                                                │ └─────────────────┘│
└────────────────────────────────────────────────┴─────────────────────┘
```

#### Tooltip Calculator Input
```typescript
<Input
  type="number"
  value={turbine.surf_PF}
  title={`Variable: $surf_PF_${turbine.name}`}
  ...
/>
```
