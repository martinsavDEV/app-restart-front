

# Export XLSX — Intégration du script CAPEXExporter

## Approche

Convertir le script `capex_to_xlsx.js` en module TypeScript, l'alimenter directement depuis l'objet `SummaryData` (sans passer par le CSV), et ajouter un bouton "Export XLSX" dans la page Résumé.

## Plan technique

### 1. Installer `xlsx-js-style`
- Ajouter la dépendance npm `xlsx-js-style` (fork de SheetJS avec support des styles)

### 2. Créer `src/lib/xlsxExport.ts`
- Reprendre la logique du script uploadé (styles, couleurs, `buildSummarySheet`, `buildDetailSheet`)
- Convertir en TypeScript avec `import XLSX from "xlsx-js-style"`
- Ajouter une fonction `convertSummaryDataToExportFormat(data: SummaryData)` qui transforme le `SummaryData` existant vers le format attendu par le script (`project`, `summary`, `lots` avec `sections[].items[]`)
- Exposer `exportCapexToXLSX(data: SummaryData)` qui fait la conversion puis appelle `buildSummarySheet` + `buildDetailSheet` + `XLSX.writeFile`

### 3. Modifier `src/components/SummaryView.tsx`
- Ajouter un troisième bouton "Export XLSX" entre CSV et PDF
- Icone `FileSpreadsheet` de lucide-react
- Appeler `exportCapexToXLSX(data)` au clic

### Mapping `SummaryData` → format script

```text
SummaryData                    →  Script format
─────────────────────────────────────────────
project.name                   →  project.name
quoteSettings.calculator_data  →  project.turbines (nb_eol)
  .global.nb_eol
quoteVersion.version_label     →  project.version
quoteVersion.last_update       →  project.lastModified
referenceDocuments[]           →  references { label: reference }
lots[] (label, total)          →  summary[] (lot, amount)
totalCapex                     →  totalCapex
lots[].sections[].lines[]      →  lots[].sections[].items[]
  (designation, quantity,          (designation, qty, unit,
   unit, unit_price, total_price)   unitPrice, total)
```

## Fichiers

| Fichier | Action |
|---------|--------|
| `src/lib/xlsxExport.ts` | Créer — logique d'export XLSX complète |
| `src/components/SummaryView.tsx` | Ajouter bouton Export XLSX |
| `package.json` | Ajouter `xlsx-js-style` |

