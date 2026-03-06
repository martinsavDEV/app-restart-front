/* ============================================================
   capex_to_xlsx.js
   ============================================================
   Module autonome : CSV CAPEX → XLSX formaté
   
   DÉPENDANCE : xlsx-js-style
   <script src="https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js"></script>
   
   USAGE (navigateur) :
   
     // Option A — depuis du texte CSV brut
     CAPEXExporter.fromCSV(csvString);
     
     // Option B — depuis l'objet DATA déjà parsé par votre app
     CAPEXExporter.fromData(dataObject);
     
     // Option C — parser seulement (retourne l'objet JS)
     var data = CAPEXExporter.parse(csvString);
   
   USAGE (Node.js) :
   
     const XLSX = require("xlsx-js-style");
     const CAPEXExporter = require("./capex_to_xlsx.js");
     // puis mêmes appels

   ============================================================ */

var CAPEXExporter = (function() {
  "use strict";

  /* ============================================================
     1. CSV PARSER
     ============================================================ */
/* ============================================================
   capex_parser.js — CSV Parser & Data Model
   ============================================================ */
let DATA = null;

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const data = {
    project: {},
    references: {},
    summary: [],
    totalCapex: 0,
    lots: []
  };

  let i = 0;
  const line = (idx) => idx < lines.length ? lines[idx].trim() : '';
  const fields = (idx) => parseCSVLine(line(idx));

  // Bloc A — Header
  while (i < lines.length && !line(i).startsWith('Projet')) i++;
  if (i < lines.length) { data.project.name = fields(i)[1] || ''; i++; }
  if (line(i).startsWith('Nombre')) { data.project.turbines = parseInt(fields(i)[1]) || 0; i++; }
  if (line(i).startsWith('Version')) { data.project.version = fields(i)[1] || ''; i++; }
  if (line(i).match(/Derni/i)) { data.project.lastModified = fields(i)[1] || ''; i++; }

  // Bloc B — References
  while (i < lines.length && !line(i).startsWith('Documents de')) i++;
  i++;
  while (i < lines.length && line(i) && !line(i).match(/^RÉSUMÉ|^R.SUM/i)) {
    const f = fields(i);
    if (f[0]) data.references[f[0]] = f[1] || '';
    i++;
  }

  // Bloc C — Summary
  while (i < lines.length && !line(i).match(/^Lot,/)) i++;
  i++;
  while (i < lines.length && line(i) && !line(i).startsWith('TOTAL CAPEX')) {
    const f = fields(i);
    if (f[0]) {
      data.summary.push({
        lot: f[0],
        amount: parseFloat(f[1]) || 0,
        comment: f[2] || '',
        confidence: null
      });
    }
    i++;
  }
  if (line(i).startsWith('TOTAL CAPEX')) {
    data.totalCapex = parseFloat(fields(i)[1]) || 0;
    i++;
  }

  // Bloc D — Detail lots
  while (i < lines.length) {
    while (i < lines.length && !line(i).startsWith('LOT:')) i++;
    if (i >= lines.length) break;

    const lotName = line(i).replace('LOT:', '').trim();
    const lot = { name: lotName, sections: [], total: 0, comment: '' };
    i++;

    if (i < lines.length && line(i).startsWith('Commentaire:')) {
      lot.comment = fields(i)[1] || '';
      i++;
    }

    while (i < lines.length && !line(i).startsWith('Total Lot') && !line(i).startsWith('LOT:')) {
      if (line(i).startsWith('Section:')) {
        const sectionRaw = line(i).replace('Section:', '').trim();
        const multMatch = sectionRaw.match(/\(x(\d+)\)/);
        const multiplier = multMatch ? parseInt(multMatch[1]) : null;
        const sectionName = sectionRaw.replace(/\(x\d+\)/, '').trim();
        const section = {
          name: sectionName,
          nameRaw: sectionRaw,
          multiplier: multiplier,
          items: [],
          subtotal: 0,
          subtotalMultiplied: null
        };
        i++;

        if (i < lines.length && line(i).startsWith('Désignation')) i++;

        while (i < lines.length) {
          const cl = line(i);
          if (!cl || cl.startsWith('Section:') || cl.startsWith('Total Lot') || cl.startsWith('LOT:')) break;

          if (cl.startsWith('Sous-total section')) {
            const f = fields(i);
            section.subtotal = parseFloat(f[4]) || 0;
            i++;
            if (i < lines.length && line(i).match(/^\(x\d+\)/)) {
              const mf = fields(i);
              section.subtotalMultiplied = parseFloat(mf[4]) || 0;
              i++;
            }
            break;
          }

          const f = fields(i);
          if (f.length >= 5) {
            section.items.push({
              designation: f[0],
              qty: f[1] !== '' ? parseFloat(f[1]) : null,
              unit: f[2] || '',
              unitPrice: f[3] !== '' ? parseFloat(f[3]) : null,
              total: f[4] !== '' ? parseFloat(f[4]) : null,
              comment: f[5] || ''
            });
          }
          i++;
        }
        lot.sections.push(section);
      } else {
        i++;
      }
    }

    if (i < lines.length && line(i).startsWith('Total Lot')) {
      lot.total = parseFloat(fields(i)[4]) || 0;
      i++;
    }

    data.lots.push(lot);
  }

  return data;
}


  /* ============================================================
     2. XLSX EXPORT ENGINE
     ============================================================ */
/* ============================================================
   capex_export.js — XLSX Export with full formatting
   Reproduces exact style from CEP reference workbook
   ============================================================ */

/* --- Color palette (from reference XLS) --- */
const XLS_COLORS = {
  // Lot title backgrounds
  lotTerrassement:  'FFE67E22',
  lotFondations:    'FF3498DB',
  lotElectricite:   'FF9B59B6',
  lotRenforcement:  'FF27AE60',
  lotTurbinier:     'FF95A5A6',

  // Section title backgrounds (light tint per block)
  secTerrassement:  'FFFDEBD0',
  secFondations:    'FFD4E6F1',
  secElectricite:   'FFE8DAEF',

  // Alternating data row (even rows)
  altTerrassement:  'FFFDEBD0',
  altFondations:    'FFEBF5FB',
  altElectricite:   'FFF5EEF8',

  // Common
  headerRow:        'FFF8F9F9',
  subtotal:         'FFE8F6F3',
  totalLot:         'FFF39C12',
  white:            'FFFFFFFF',
  dark:             'FF2C3E50',
  grey:             'FF7F8C8D',
  sectionBg:        'FFEBF5FB',  // summary section headers

  // Summary specific
  summaryTitle:     'FF2C3E50',
  summarySubtitle:  'FFF8F9F9',
};

/* --- Helper: create cell style object (xlsx-js-style compatible via s property) --- */
function makeStyle(opts) {
  const s = {};
  if (opts.bold || opts.fontSize || opts.fontColor) {
    s.font = {};
    if (opts.bold) s.font.bold = true;
    if (opts.fontSize) s.font.sz = opts.fontSize;
    if (opts.fontColor) s.font.color = { rgb: opts.fontColor.replace('FF','') };
    s.font.name = 'Calibri';
  }
  if (opts.fill) {
    s.fill = { fgColor: { rgb: opts.fill.replace('FF','') }, patternType: 'solid' };
  }
  if (opts.numFmt) {
    s.numFmt = opts.numFmt;
  }
  if (opts.align) {
    s.alignment = {};
    if (opts.align) s.alignment.horizontal = opts.align;
    s.alignment.vertical = 'center';
    if (opts.wrap) s.alignment.wrapText = true;
  } else {
    s.alignment = { vertical: 'center' };
  }
  if (opts.border) {
    const b = { style: 'thin', color: { rgb: 'D5D8DC' } };
    s.border = { top: b, bottom: b, left: b, right: b };
  }
  return s;
}

/* Shorthand styles */
const S = {
  // Summary
  sumTitle:     makeStyle({ bold:true, fontSize:14, fontColor:XLS_COLORS.white, fill:XLS_COLORS.summaryTitle, align:'center' }),
  sumSubtitle:  makeStyle({ bold:true, fontSize:12, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.summarySubtitle, align:'center' }),
  sumSection:   makeStyle({ bold:true, fontSize:11, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.sectionBg, align:'left' }),
  sumLabel:     makeStyle({ fontSize:10, fontColor:XLS_COLORS.grey, align:'left' }),
  sumValue:     makeStyle({ bold:true, fontSize:10, fontColor:XLS_COLORS.dark, align:'left' }),
  sumTblHead:   makeStyle({ bold:true, fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.headerRow, align:'center', border:true }),
  sumLotName:   makeStyle({ fontSize:11, fontColor:XLS_COLORS.dark, align:'left', border:true }),
  sumAmount:    makeStyle({ fontSize:11, fontColor:XLS_COLORS.dark, align:'right', numFmt:'#,##0.00 "€"', border:true }),
  sumPct:       makeStyle({ fontSize:11, fontColor:XLS_COLORS.dark, align:'right', numFmt:'0.0%', border:true }),
  sumComment:   makeStyle({ fontSize:11, fontColor:XLS_COLORS.dark, align:'left', border:true, wrap:true }),
  sumConfidence:makeStyle({ fontSize:11, fontColor:XLS_COLORS.dark, align:'center', border:true }),
  sumTotalLabel:makeStyle({ bold:true, fontSize:11, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.totalLot, align:'left', border:true }),
  sumTotalAmt:  makeStyle({ bold:true, fontSize:11, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.totalLot, numFmt:'#,##0.00 "€"', align:'right', border:true }),
  sumTotalEmpty:makeStyle({ fill:XLS_COLORS.totalLot, border:true }),
  sumAvgLabel:  makeStyle({ bold:true, fontSize:10, fontColor:XLS_COLORS.dark, align:'left' }),
  sumAvgValue:  makeStyle({ fontSize:11, fontColor:XLS_COLORS.dark, numFmt:'#,##0.00 "€"', align:'right' }),

  // Detail — headers
  dHeaderTerra: makeStyle({ bold:true, fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.headerRow, align:'center', border:true }),
  dHeaderFond:  makeStyle({ bold:true, fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.headerRow, align:'center', border:true }),
  dHeaderElec:  makeStyle({ bold:true, fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.headerRow, align:'center', border:true }),

  // Detail — lot titles
  dLotTerra:    makeStyle({ bold:true, fontSize:13, fontColor:XLS_COLORS.white, fill:XLS_COLORS.lotTerrassement, align:'left' }),
  dLotFond:     makeStyle({ bold:true, fontSize:13, fontColor:XLS_COLORS.white, fill:XLS_COLORS.lotFondations, align:'left' }),
  dLotElec:     makeStyle({ bold:true, fontSize:13, fontColor:XLS_COLORS.white, fill:XLS_COLORS.lotElectricite, align:'left' }),
  dLotRenf:     makeStyle({ bold:true, fontSize:13, fontColor:XLS_COLORS.white, fill:XLS_COLORS.lotRenforcement, align:'left' }),
  dLotTurb:     makeStyle({ bold:true, fontSize:13, fontColor:XLS_COLORS.white, fill:XLS_COLORS.lotTurbinier, align:'left' }),

  // Detail — section titles
  dSecTerra:    makeStyle({ bold:true, fontSize:10, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.secTerrassement, align:'left' }),
  dSecFond:     makeStyle({ bold:true, fontSize:10, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.secFondations, align:'left' }),
  dSecElec:     makeStyle({ bold:true, fontSize:10, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.secElectricite, align:'left' }),

  // Detail — data rows (normal = white, alt = tinted)
  dDataWhite:   makeStyle({ fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.white, border:true }),
  dDataTerraAlt:makeStyle({ fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.altTerrassement, border:true }),
  dDataFondAlt: makeStyle({ fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.altFondations, border:true }),
  dDataElecAlt: makeStyle({ fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.altElectricite, border:true }),

  // Numeric variants
  dNumWhite:    makeStyle({ fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.white, align:'right', numFmt:'#,##0.00', border:true }),
  dEurWhite:    makeStyle({ fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.white, align:'right', numFmt:'#,##0.00 "€"', border:true }),
  dNumTerraAlt: makeStyle({ fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.altTerrassement, align:'right', numFmt:'#,##0.00', border:true }),
  dEurTerraAlt: makeStyle({ fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.altTerrassement, align:'right', numFmt:'#,##0.00 "€"', border:true }),
  dNumFondAlt:  makeStyle({ fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.altFondations, align:'right', numFmt:'#,##0.00', border:true }),
  dEurFondAlt:  makeStyle({ fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.altFondations, align:'right', numFmt:'#,##0.00 "€"', border:true }),
  dNumElecAlt:  makeStyle({ fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.altElectricite, align:'right', numFmt:'#,##0.00', border:true }),
  dEurElecAlt:  makeStyle({ fontSize:9, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.altElectricite, align:'right', numFmt:'#,##0.00 "€"', border:true }),

  // Subtotal
  dSubtotal:    makeStyle({ bold:true, fontSize:10, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.subtotal, align:'left', border:true }),
  dSubtotalEur: makeStyle({ bold:true, fontSize:10, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.subtotal, align:'right', numFmt:'#,##0.00 "€"', border:true }),
  dSubtotalEmpty:makeStyle({ fill:XLS_COLORS.subtotal, border:true }),

  // Total lot
  dTotalLot:    makeStyle({ bold:true, fontSize:11, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.totalLot, align:'left', border:true }),
  dTotalLotEur: makeStyle({ bold:true, fontSize:11, fontColor:XLS_COLORS.dark, fill:XLS_COLORS.totalLot, align:'right', numFmt:'#,##0.00 "€"', border:true }),
  dTotalLotEmpty:makeStyle({ fill:XLS_COLORS.totalLot, border:true }),

  // Empty / spacer
  empty:        makeStyle({}),
};

/* --- Apply style to a cell --- */
function setCell(ws, r, c, value, style) {
  const addr = XLSX.utils.encode_cell({ r, c });
  if (!ws[addr]) ws[addr] = {};
  if (value !== undefined && value !== null && value !== '') {
    ws[addr].v = value;
    ws[addr].t = typeof value === 'number' ? 'n' : 's';
  }
  if (style) ws[addr].s = style;
}

/* --- Merge helper --- */
function addMerge(ws, r1, c1, r2, c2) {
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}

/* ============================================================
   BUILD SUMMARY SHEET
   ============================================================ */
function buildSummarySheet() {
  const ws = {};
  let r = 0;

  // Row 0 — Project name (merged A-E)
  setCell(ws, r, 0, DATA.project.name, S.sumTitle);
  for (let c=1;c<=4;c++) setCell(ws, r, c, '', S.sumTitle);
  addMerge(ws, r, 0, r, 4);
  r++;

  // Row 1 — ESTIMATION CAPEX
  setCell(ws, r, 0, 'ESTIMATION CAPEX', S.sumSubtitle);
  for (let c=1;c<=4;c++) setCell(ws, r, c, '', S.sumSubtitle);
  addMerge(ws, r, 0, r, 4);
  r++;

  // Row 2 — blank
  r++;

  // Row 3 — INFORMATIONS PROJET
  setCell(ws, r, 0, 'INFORMATIONS PROJET', S.sumSection);
  for (let c=1;c<=4;c++) setCell(ws, r, c, '', S.sumSection);
  addMerge(ws, r, 0, r, 4);
  r++;

  // Rows 4-7 — Project info
  const infoRows = [
    ['Projet', DATA.project.name],
    ["Nombre d'éoliennes", DATA.project.turbines],
    ['Version', DATA.project.version],
    ['Dernière modification', DATA.project.lastModified]
  ];
  infoRows.forEach(([label, val]) => {
    setCell(ws, r, 0, label, S.sumLabel);
    setCell(ws, r, 1, val, S.sumValue);
    r++;
  });

  // Row 8 — blank
  r++;

  // Row 9 — DOCUMENTS DE RÉFÉRENCE
  setCell(ws, r, 0, 'DOCUMENTS DE RÉFÉRENCE', S.sumSection);
  for (let c=1;c<=4;c++) setCell(ws, r, c, '', S.sumSection);
  addMerge(ws, r, 0, r, 4);
  r++;

  // References
  Object.entries(DATA.references).forEach(([k, v]) => {
    setCell(ws, r, 0, k, S.sumLabel);
    setCell(ws, r, 1, v, S.sumValue);
    r++;
  });

  // Blank
  r++;

  // RÉSUMÉ PAR LOT header
  setCell(ws, r, 0, 'RÉSUMÉ PAR LOT', S.sumSection);
  for (let c=1;c<=4;c++) setCell(ws, r, c, '', S.sumSection);
  addMerge(ws, r, 0, r, 4);
  r++;

  // Table header
  const thLabels = ['Lot', 'Montant (€)', '% Total', 'Commentaire', 'Indice de confiance'];
  thLabels.forEach((lbl, c) => setCell(ws, r, c, lbl, S.sumTblHead));
  r++;

  // Lot rows
  DATA.summary.forEach(s => {
    const pct = DATA.totalCapex > 0 ? s.amount / DATA.totalCapex : 0;
    const confStr = s.confidence ? '★'.repeat(s.confidence) + '☆'.repeat(5 - s.confidence) : '';
    setCell(ws, r, 0, s.lot, S.sumLotName);
    setCell(ws, r, 1, s.amount, S.sumAmount);
    setCell(ws, r, 2, pct, S.sumPct);
    setCell(ws, r, 3, s.comment, S.sumComment);
    setCell(ws, r, 4, confStr, S.sumConfidence);
    r++;
  });

  // TOTAL CAPEX (with yellow bar)
  setCell(ws, r, 0, 'TOTAL CAPEX', S.sumTotalLabel);
  setCell(ws, r, 1, DATA.totalCapex, S.sumTotalAmt);
  for (let c=2;c<=4;c++) setCell(ws, r, c, '', S.sumTotalEmpty);
  r++;

  // Blank
  r++;

  // TOTAL CAPEX repeated (yellow bar)
  setCell(ws, r, 0, 'TOTAL CAPEX', S.sumTotalLabel);
  setCell(ws, r, 1, DATA.totalCapex, S.sumTotalAmt);
  for (let c=2;c<=4;c++) setCell(ws, r, c, '', S.sumTotalEmpty);
  r++;

  // Coût moyen / éolienne
  const cpt = DATA.totalCapex / (DATA.project.turbines || 1);
  setCell(ws, r, 0, 'Coût moyen / éolienne', S.sumAvgLabel);
  setCell(ws, r, 1, cpt, S.sumAvgValue);
  r++;

  // Sheet ref
  ws['!ref'] = XLSX.utils.encode_range({ s: { r:0, c:0 }, e: { r: r-1, c: 4 } });
  ws['!cols'] = [{ wch:28 }, { wch:22 }, { wch:10 }, { wch:45 }, { wch:22 }];

  // Row heights
  ws['!rows'] = [];
  ws['!rows'][0] = { hpt: 30 };
  ws['!rows'][1] = { hpt: 24 };

  return ws;
}

/* ============================================================
   BUILD DETAIL SHEET
   ============================================================ */
function buildDetailSheet() {
  const ws = {};

  // Block definitions: which lots go in which column block
  // Block 0 (cols 0-5): Terrassement + Renforcement + Turbinier
  // Block 1 (cols 8-13): Fondations
  // Block 2 (cols 16-21): Électricité
  const blockDefs = [
    { colStart: 0,  lotNames: ['Terrassement','Renforcement de sol','Turbinier'],
      lotStyle: S.dLotTerra, secStyle: S.dSecTerra,
      altData: S.dDataTerraAlt, altNum: S.dNumTerraAlt, altEur: S.dEurTerraAlt,
      lotStyles: {
        'Terrassement': S.dLotTerra,
        'Renforcement de sol': S.dLotRenf,
        'Turbinier': S.dLotTurb
      }
    },
    { colStart: 8,  lotNames: ['Fondations'],
      lotStyle: S.dLotFond, secStyle: S.dSecFond,
      altData: S.dDataFondAlt, altNum: S.dNumFondAlt, altEur: S.dEurFondAlt,
      lotStyles: { 'Fondations': S.dLotFond }
    },
    { colStart: 16, lotNames: ['Électricité'],
      lotStyle: S.dLotElec, secStyle: S.dSecElec,
      altData: S.dDataElecAlt, altNum: S.dNumElecAlt, altEur: S.dEurElecAlt,
      lotStyles: { 'Électricité': S.dLotElec }
    }
  ];

  let maxRow = 0;

  blockDefs.forEach(block => {
    const C = block.colStart;
    let r = 0;

    block.lotNames.forEach(lotName => {
      const lot = DATA.lots.find(l => l.name === lotName);
      if (!lot) return;

      // Lot title row (merged across 6 cols)
      const thisLotStyle = block.lotStyles[lotName] || block.lotStyle;
      setCell(ws, r, C, lot.name, thisLotStyle);
      for (let c = 1; c < 6; c++) setCell(ws, r, C+c, '', thisLotStyle);
      addMerge(ws, r, C, r, C+5);
      r++;

      // Lot-level comment (no sections)
      if (lot.comment && lot.sections.length === 0) {
        setCell(ws, r, C, lot.comment, S.dDataWhite);
        r++;
        // TOTAL line
        setCell(ws, r, C, 'TOTAL ' + lot.name, S.dSubtotal);
        for (let c=1;c<4;c++) setCell(ws, r, C+c, '', S.dSubtotalEmpty);
        setCell(ws, r, C+4, lot.total, S.dSubtotalEur);
        setCell(ws, r, C+5, '', S.dSubtotalEmpty);
        r++;
        return;
      }

      if (lot.sections.length === 0) {
        // TOTAL line
        setCell(ws, r, C, 'TOTAL ' + lot.name, S.dSubtotal);
        for (let c=1;c<4;c++) setCell(ws, r, C+c, '', S.dSubtotalEmpty);
        setCell(ws, r, C+4, lot.total, S.dSubtotalEur);
        setCell(ws, r, C+5, '', S.dSubtotalEmpty);
        r++;
        return;
      }

      // Blank row after lot title
      r++;

      // Sections
      lot.sections.forEach(sec => {
        // Section title (merged)
        setCell(ws, r, C, ' ' + (sec.nameRaw || sec.name), block.secStyle);
        for (let c=1;c<6;c++) setCell(ws, r, C+c, '', block.secStyle);
        addMerge(ws, r, C, r, C+5);
        r++;

        // Column headers
        const hdrs = ['Désignation','Qté','Unité','P.U. (€)','Total (€)','Commentaire'];
        hdrs.forEach((h, ci) => setCell(ws, r, C+ci, h, S.dHeaderTerra));
        r++;

        // Data items
        let itemIdx = 0;
        sec.items.forEach(item => {
          if (!item.designation && item.qty === null && (item.total === null || item.total === 0)) return;
          const isAlt = (itemIdx % 2 === 1);
          const sText = isAlt ? block.altData : S.dDataWhite;
          const sNum  = isAlt ? block.altNum  : S.dNumWhite;
          const sEur  = isAlt ? block.altEur  : S.dEurWhite;

          setCell(ws, r, C+0, item.designation, sText);
          setCell(ws, r, C+1, item.qty, sNum);
          setCell(ws, r, C+2, item.unit, sText);
          setCell(ws, r, C+3, item.unitPrice, sNum);
          setCell(ws, r, C+4, item.total, sEur);
          setCell(ws, r, C+5, item.comment, sText);
          itemIdx++;
          r++;
        });

        // Subtotal
        setCell(ws, r, C, 'Sous-total section', S.dSubtotal);
        for (let c=1;c<4;c++) setCell(ws, r, C+c, '', S.dSubtotalEmpty);
        setCell(ws, r, C+4, sec.subtotal, S.dSubtotalEur);
        setCell(ws, r, C+5, '', S.dSubtotalEmpty);
        r++;

        // Multiplier row
        if (sec.subtotalMultiplied != null) {
          setCell(ws, r, C, '(x' + sec.multiplier + ')', S.dSubtotal);
          for (let c=1;c<4;c++) setCell(ws, r, C+c, '', S.dSubtotalEmpty);
          setCell(ws, r, C+4, sec.subtotalMultiplied, S.dSubtotalEur);
          setCell(ws, r, C+5, '', S.dSubtotalEmpty);
          r++;
        }

        // Blank after section
        r++;
      });

      // TOTAL LOT
      setCell(ws, r, C, 'TOTAL ' + lot.name, S.dTotalLot);
      for (let c=1;c<4;c++) setCell(ws, r, C+c, '', S.dTotalLotEmpty);
      setCell(ws, r, C+4, lot.total, S.dTotalLotEur);
      setCell(ws, r, C+5, '', S.dTotalLotEmpty);
      r++;
      r++; // spacer between lots
    });

    if (r > maxRow) maxRow = r;
  });

  // Sheet range
  ws['!ref'] = XLSX.utils.encode_range({ s:{r:0,c:0}, e:{r:maxRow-1, c:21} });

  // Column widths
  ws['!cols'] = [
    {wch:38},{wch:10},{wch:7},{wch:12},{wch:16},{wch:28},
    {wch:2},{wch:2},
    {wch:32},{wch:10},{wch:7},{wch:12},{wch:16},{wch:28},
    {wch:2},{wch:2},
    {wch:42},{wch:10},{wch:7},{wch:12},{wch:16},{wch:28}
  ];

  return ws;
}

/* ============================================================
   MAIN EXPORT FUNCTION
   ============================================================ */
function exportXLSX() {
  const wb = XLSX.utils.book_new();

  const ws1 = buildSummarySheet();
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

  const ws2 = buildDetailSheet();
  XLSX.utils.book_append_sheet(wb, ws2, 'Détail CAPEX');

  const filename = 'CEP_' + DATA.project.name.replace(/\s+/g, '_') + '.xlsx';
  XLSX.writeFile(wb, filename);
}


  /* ============================================================
     3. PUBLIC API
     ============================================================ */

  /**
   * Parse un texte CSV CAPEX et retourne l'objet structuré.
   * @param {string} csvText - contenu brut du fichier CSV
   * @returns {object} data - objet structuré (project, summary, lots, etc.)
   */
  function parse(csvText) {
    return parseCSV(csvText);
  }

  /**
   * Génère et télécharge le XLSX à partir de texte CSV.
   * @param {string} csvText - contenu brut du fichier CSV
   * @param {object} [options] - options facultatives
   * @param {string} [options.filename] - nom du fichier (auto-généré si absent)
   * @param {Array}  [options.confidence] - indices de confiance [1-5] par lot, dans l'ordre
   * @param {Array}  [options.comments] - commentaires par lot (écrase ceux du CSV)
   */
  function fromCSV(csvText, options) {
    DATA = parseCSV(csvText);
    applyOptions(options);
    doExport(options);
  }

  /**
   * Génère et télécharge le XLSX à partir d'un objet DATA déjà construit.
   * @param {object} dataObject - structure identique à celle retournée par parse()
   * @param {object} [options] - idem fromCSV
   */
  function fromData(dataObject, options) {
    DATA = dataObject;
    applyOptions(options);
    doExport(options);
  }

  /**
   * Génère le XLSX et retourne le workbook (sans télécharger).
   * Utile pour Node.js ou pour envoyer le fichier via une API.
   * @param {string} csvText
   * @param {object} [options]
   * @returns {object} XLSX workbook
   */
  function toWorkbook(csvText, options) {
    DATA = parseCSV(csvText);
    applyOptions(options);
    var ws2 = buildDetailSheet();
    var ws1 = buildSummarySheet();
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    XLSX.utils.book_append_sheet(wb, ws2, "Détail CAPEX");
    return wb;
  }

  /**
   * Génère le XLSX et retourne un ArrayBuffer (pour envoi HTTP, stockage, etc.)
   * @param {string} csvText
   * @param {object} [options]
   * @returns {ArrayBuffer}
   */
  function toBuffer(csvText, options) {
    var wb = toWorkbook(csvText, options);
    return XLSX.write(wb, {bookType:"xlsx", type:"array", cellStyles:true});
  }

  /* --- Internals --- */

  function applyOptions(options) {
    if (!options) return;
    if (options.confidence && Array.isArray(options.confidence)) {
      options.confidence.forEach(function(val, i) {
        if (i < DATA.summary.length && val >= 1 && val <= 5) {
          DATA.summary[i].confidence = val;
        }
      });
    }
    if (options.comments && Array.isArray(options.comments)) {
      options.comments.forEach(function(val, i) {
        if (i < DATA.summary.length && val !== undefined && val !== null) {
          DATA.summary[i].comment = val;
        }
      });
    }
  }

  function doExport(options) {
    if (typeof XLSX === "undefined") {
      throw new Error("XLSX library not loaded. Include xlsx-js-style before this script.");
    }
    var ws2 = buildDetailSheet();
    var ws1 = buildSummarySheet();
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    XLSX.utils.book_append_sheet(wb, ws2, "Détail CAPEX");

    var filename = "CEP_" + DATA.project.name.replace(/\s+/g, "_") + ".xlsx";
    if (options && options.filename) filename = options.filename;

    XLSX.writeFile(wb, filename, {bookType:"xlsx", type:"binary", cellStyles:true});
  }

  /* --- Expose public API --- */
  return {
    parse:      parse,
    fromCSV:    fromCSV,
    fromData:   fromData,
    toWorkbook: toWorkbook,
    toBuffer:   toBuffer
  };

})();

/* Node.js compatibility */
if (typeof module !== "undefined" && module.exports) {
  module.exports = CAPEXExporter;
}
