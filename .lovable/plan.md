
## Plan: Section Fondation enrichie dans le Calculator

### Objectif
Enrichir la section "Design" du Calculator avec les paramètres de fondation complets :
- Paramètres d'entrée : diamètre, marge de sécurité, pente du talus, hauteur cage d'ancrage
- Calculs automatiques : surface fond de fouille, volume de terrassement (tronc de cône)
- Volume de substitution par éolienne + total
- Schéma en coupe SVG avec dimensions

---

### Partie 1 : Mise à jour des types

**Fichier : `src/types/bpu.ts`**

Étendre l'interface `CalculatorData.design` avec les nouveaux champs :

| Champ | Type | Défaut | Description |
|-------|------|--------|-------------|
| `diametre_fondation` | number | null | Diamètre de la fondation (m) |
| `marge_securite` | number | 1.0 | Marge autour du diamètre (1m ou 1.5m ou custom) |
| `pente_talus` | string | "1:1" | Ratio de pente ("1:1" ou "3:2" ou custom) |
| `hauteur_cage` | number | 3.5 | Hauteur cage d'ancrage (m) |

Structure mise à jour :
```typescript
design: {
  diametre_fondation: number | null;
  marge_securite: number;      // 1.0 ou 1.5 ou valeur custom
  pente_talus: string;         // "1:1" | "3:2" | ratio custom
  hauteur_cage: number;        // défaut 3.5m
}
```

---

### Partie 2 : Formules de calcul

**Formules à implémenter :**

1. **Rayon bas (R)** :
   ```
   R = (diametre_fondation + 2 × marge_securite) / 2
   ```

2. **Surface fond de fouille** :
   ```
   S = π × R²
   ```

3. **Coefficient de pente** :
   - "1:1" → pente = 1
   - "3:2" → pente = 1.5 (3 horizontal pour 2 vertical)
   - Custom: parsé comme ratio

4. **Rayon haut (r)** :
   ```
   r = R + (hauteur_cage × pente)
   ```

5. **Volume tronc de cône** (terrassement total) :
   ```
   V = π × (hauteur_cage / 3) × (R² + r² + R × r)
   ```

6. **Volume de substitution par éolienne** :
   ```
   V_sub = surface_fond_fouille × substitution_height
   ```

---

### Partie 3 : Nouveau composant schéma SVG

**Fichier : `src/components/FoundationDiagram.tsx` (Créer)**

Composant SVG affichant une vue en coupe de la fondation :

```
         ←──────── r (rayon haut) ────────→
        ╱                                 ╲
       ╱                                   ╲  ↑
      ╱        TALUS                        ╲ │ hauteur_cage
     ╱                                       ╲│
    ├───────────────────────────────────────────┤ ↓
    │←── R (rayon bas = (Ø + 2×marge)/2 ──→ │
```

Le schéma affichera :
- Le diamètre de la fondation (cercle central)
- La marge de sécurité de chaque côté
- Le talus avec l'angle correspondant à la pente
- La hauteur de la cage d'ancrage
- Les cotes dimensionnelles annotées

---

### Partie 4 : Mise à jour du CalculatorDialog

**Fichier : `src/components/CalculatorDialog.tsx`**

#### A. Initialisation des valeurs par défaut
Mettre à jour l'état initial :
```typescript
design: {
  diametre_fondation: null,
  marge_securite: 1.0,
  pente_talus: "1:1",
  hauteur_cage: 3.5,
}
```

#### B. Nouvelle section "Fondation" dans le formulaire
Remplacer la section Design actuelle par une section plus complète :

| Paramètre | Input | Options/Format |
|-----------|-------|----------------|
| Diamètre fondation | Input number | m |
| Marge de sécurité | Select + Input | 1m / 1.5m / Custom |
| Pente talus | Select + Input | 1:1 / 3:2 / Custom |
| Hauteur cage ancrage | Input number | 3.50m (précision 0.01m) |

#### C. Zone de résultats calculés
Affichage en temps réel (lecture seule) :
- Surface fond de fouille : `XXX m²`
- Volume terrassement : `XXX m³`

#### D. Intégration du schéma
Le composant `FoundationDiagram` s'affiche sous les inputs, montrant visuellement les dimensions saisies.

#### E. Tableau éoliennes - Ligne volume substitution
Ajouter une ligne calculée (non éditable) sous "Substitution" :

| Paramètre | Unité | E01 | E02 | ... | Total |
|-----------|-------|-----|-----|-----|-------|
| Substitution (hauteur) | m | 2.0 | 1.5 | ... | - |
| **Vol. substitution** | m³ | 200 | 150 | ... | **850** |

Formule : `surface_fond_fouille × substitution`

---

### Partie 5 : Variables exposées

**Fichier : `src/hooks/useCalculatorVariables.ts`**

Nouvelles variables calculées à exposer :

| Variable | Label | Catégorie |
|----------|-------|-----------|
| `$surface_fond_fouille` | Surface fond de fouille (m²) | Design |
| `$volume_terrassement` | Volume terrassement (m³) | Design |
| `$vol_sub_E01` | Volume substitution E01 (m³) | Éoliennes |
| `$sum_vol_substitution` | Total volume substitution (m³) | Totaux |

---

### Partie 6 : Logique métier

**Calculs centralisés dans le composant :**

```typescript
// Parse pente ratio
const parsePente = (pente: string): number => {
  if (pente === "1:1") return 1;
  if (pente === "3:2") return 1.5;
  const parts = pente.split(":");
  return parts.length === 2 ? parseFloat(parts[0]) / parseFloat(parts[1]) : 1;
};

// Calculations
const R = (diametre + 2 * marge) / 2;
const surfaceFondFouille = Math.PI * R * R;
const pente = parsePente(penteTalus);
const r = R + hauteurCage * pente;
const volumeTerrassement = (Math.PI * hauteurCage / 3) * (R*R + r*r + R*r);

// Per-turbine substitution volume
turbines.map(t => surfaceFondFouille * t.substitution);
```

---

### Résumé des fichiers

| Fichier | Action |
|---------|--------|
| `src/types/bpu.ts` | **Modifier** - Étendre `design` avec marge, pente, hauteur |
| `src/components/FoundationDiagram.tsx` | **Créer** - Schéma SVG en coupe |
| `src/components/CalculatorDialog.tsx` | **Modifier** - Section Fondation complète + calculs |
| `src/hooks/useCalculatorVariables.ts` | **Modifier** - Ajouter variables fondation |

---

### Aperçu de l'interface

```text
┌─────────────────────────────────────────────────────────────┐
│ FONDATION                                                   │
├─────────────────────────────────────────────────────────────┤
│ Diamètre fondation     [____22____] m                       │
│ Marge de sécurité      [1m ▼] ou [____1.2___] m            │
│ Pente talus            [1:1 ▼] ou [___:___]                 │
│ Hauteur cage ancrage   [___3.50___] m                       │
├─────────────────────────────────────────────────────────────┤
│ RÉSULTATS CALCULÉS                                          │
│ Surface fond de fouille : 452.4 m²                          │
│ Volume terrassement     : 2,845.6 m³                        │
├─────────────────────────────────────────────────────────────┤
│                    ┌─ 15.5m ─┐                              │
│                   ╱           ╲                             │
│   3.5m           ╱  TALUS 1:1  ╲                            │
│                 ╱               ╲                           │
│                └───────────────────┘                        │
│                    ←─ 12m ─→                                │
│                 (Ø22 + 2×1m marge)                          │
└─────────────────────────────────────────────────────────────┘
```

---

### Tableau éoliennes enrichi

```text
┌──────────────────┬──────┬───────┬───────┬───────┬─────────┐
│ Paramètre        │ Unit │  E01  │  E02  │  E03  │  Total  │
├──────────────────┼──────┼───────┼───────┼───────┼─────────┤
│ ...              │      │       │       │       │         │
│ Substitution     │  m   │  2.0  │  1.5  │  3.0  │    -    │
│ Vol. substitution│  m³  │  905  │  679  │ 1,357 │  2,941  │  ← Calculé
└──────────────────┴──────┴───────┴───────┴───────┴─────────┘
```
