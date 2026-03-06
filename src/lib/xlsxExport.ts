import XLSX from "xlsx-js-style";
import { SummaryData } from "@/hooks/useSummaryData";

/* --- Color palette (from reference XLS) --- */
const XLS_COLORS = {
  lotTerrassement: "FFE67E22",
  lotFondations: "FF3498DB",
  lotElectricite: "FF9B59B6",
  lotRenforcement: "FF27AE60",
  lotTurbinier: "FF95A5A6",
  secTerrassement: "FFFDEBD0",
  secFondations: "FFD4E6F1",
  secElectricite: "FFE8DAEF",
  altTerrassement: "FFFDEBD0",
  altFondations: "FFEBF5FB",
  altElectricite: "FFF5EEF8",
  headerRow: "FFF8F9F9",
  subtotal: "FFE8F6F3",
  totalLot: "FFF39C12",
  white: "FFFFFFFF",
  dark: "FF2C3E50",
  grey: "FF7F8C8D",
  sectionBg: "FFEBF5FB",
  summaryTitle: "FF2C3E50",
  summarySubtitle: "FFF8F9F9",
};

interface StyleOpts {
  bold?: boolean;
  fontSize?: number;
  fontColor?: string;
  fill?: string;
  numFmt?: string;
  align?: string;
  wrap?: boolean;
  border?: boolean;
}

function makeStyle(opts: StyleOpts) {
  const s: any = {};
  if (opts.bold || opts.fontSize || opts.fontColor) {
    s.font = { name: "Calibri" };
    if (opts.bold) s.font.bold = true;
    if (opts.fontSize) s.font.sz = opts.fontSize;
    if (opts.fontColor)
      s.font.color = { rgb: opts.fontColor.replace("FF", "") };
  }
  if (opts.fill) {
    s.fill = {
      fgColor: { rgb: opts.fill.replace("FF", "") },
      patternType: "solid",
    };
  }
  if (opts.numFmt) s.numFmt = opts.numFmt;
  if (opts.align) {
    s.alignment = { horizontal: opts.align, vertical: "center" };
    if (opts.wrap) s.alignment.wrapText = true;
  } else {
    s.alignment = { vertical: "center" };
  }
  if (opts.border) {
    const b = { style: "thin", color: { rgb: "D5D8DC" } };
    s.border = { top: b, bottom: b, left: b, right: b };
  }
  return s;
}

const S = {
  sumTitle: makeStyle({ bold: true, fontSize: 14, fontColor: XLS_COLORS.white, fill: XLS_COLORS.summaryTitle, align: "center" }),
  sumSubtitle: makeStyle({ bold: true, fontSize: 12, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.summarySubtitle, align: "center" }),
  sumSection: makeStyle({ bold: true, fontSize: 11, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.sectionBg, align: "left" }),
  sumLabel: makeStyle({ fontSize: 10, fontColor: XLS_COLORS.grey, align: "left" }),
  sumValue: makeStyle({ bold: true, fontSize: 10, fontColor: XLS_COLORS.dark, align: "left" }),
  sumTblHead: makeStyle({ bold: true, fontSize: 9, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.headerRow, align: "center", border: true }),
  sumLotName: makeStyle({ fontSize: 11, fontColor: XLS_COLORS.dark, align: "left", border: true }),
  sumAmount: makeStyle({ fontSize: 11, fontColor: XLS_COLORS.dark, align: "right", numFmt: '#,##0.00 "€"', border: true }),
  sumPct: makeStyle({ fontSize: 11, fontColor: XLS_COLORS.dark, align: "right", numFmt: "0.0%", border: true }),
  sumComment: makeStyle({ fontSize: 11, fontColor: XLS_COLORS.dark, align: "left", border: true, wrap: true }),
  sumConfidence: makeStyle({ fontSize: 11, fontColor: XLS_COLORS.dark, align: "center", border: true }),
  sumTotalLabel: makeStyle({ bold: true, fontSize: 11, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.totalLot, align: "left", border: true }),
  sumTotalAmt: makeStyle({ bold: true, fontSize: 11, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.totalLot, numFmt: '#,##0.00 "€"', align: "right", border: true }),
  sumTotalEmpty: makeStyle({ fill: XLS_COLORS.totalLot, border: true }),
  sumAvgLabel: makeStyle({ bold: true, fontSize: 10, fontColor: XLS_COLORS.dark, align: "left" }),
  sumAvgValue: makeStyle({ fontSize: 11, fontColor: XLS_COLORS.dark, numFmt: '#,##0.00 "€"', align: "right" }),

  dHeaderTerra: makeStyle({ bold: true, fontSize: 9, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.headerRow, align: "center", border: true }),
  dLotTerra: makeStyle({ bold: true, fontSize: 13, fontColor: XLS_COLORS.white, fill: XLS_COLORS.lotTerrassement, align: "left" }),
  dLotFond: makeStyle({ bold: true, fontSize: 13, fontColor: XLS_COLORS.white, fill: XLS_COLORS.lotFondations, align: "left" }),
  dLotElec: makeStyle({ bold: true, fontSize: 13, fontColor: XLS_COLORS.white, fill: XLS_COLORS.lotElectricite, align: "left" }),
  dLotRenf: makeStyle({ bold: true, fontSize: 13, fontColor: XLS_COLORS.white, fill: XLS_COLORS.lotRenforcement, align: "left" }),
  dLotTurb: makeStyle({ bold: true, fontSize: 13, fontColor: XLS_COLORS.white, fill: XLS_COLORS.lotTurbinier, align: "left" }),
  dSecTerra: makeStyle({ bold: true, fontSize: 10, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.secTerrassement, align: "left" }),
  dSecFond: makeStyle({ bold: true, fontSize: 10, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.secFondations, align: "left" }),
  dSecElec: makeStyle({ bold: true, fontSize: 10, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.secElectricite, align: "left" }),

  dDataWhite: makeStyle({ fontSize: 9, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.white, border: true }),
  dDataTerraAlt: makeStyle({ fontSize: 9, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.altTerrassement, border: true }),
  dDataFondAlt: makeStyle({ fontSize: 9, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.altFondations, border: true }),
  dDataElecAlt: makeStyle({ fontSize: 9, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.altElectricite, border: true }),

  dNumWhite: makeStyle({ fontSize: 9, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.white, align: "right", numFmt: "#,##0.00", border: true }),
  dEurWhite: makeStyle({ fontSize: 9, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.white, align: "right", numFmt: '#,##0.00 "€"', border: true }),
  dNumTerraAlt: makeStyle({ fontSize: 9, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.altTerrassement, align: "right", numFmt: "#,##0.00", border: true }),
  dEurTerraAlt: makeStyle({ fontSize: 9, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.altTerrassement, align: "right", numFmt: '#,##0.00 "€"', border: true }),
  dNumFondAlt: makeStyle({ fontSize: 9, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.altFondations, align: "right", numFmt: "#,##0.00", border: true }),
  dEurFondAlt: makeStyle({ fontSize: 9, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.altFondations, align: "right", numFmt: '#,##0.00 "€"', border: true }),
  dNumElecAlt: makeStyle({ fontSize: 9, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.altElectricite, align: "right", numFmt: "#,##0.00", border: true }),
  dEurElecAlt: makeStyle({ fontSize: 9, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.altElectricite, align: "right", numFmt: '#,##0.00 "€"', border: true }),

  dSubtotal: makeStyle({ bold: true, fontSize: 10, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.subtotal, align: "left", border: true }),
  dSubtotalEur: makeStyle({ bold: true, fontSize: 10, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.subtotal, align: "right", numFmt: '#,##0.00 "€"', border: true }),
  dSubtotalEmpty: makeStyle({ fill: XLS_COLORS.subtotal, border: true }),

  dTotalLot: makeStyle({ bold: true, fontSize: 11, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.totalLot, align: "left", border: true }),
  dTotalLotEur: makeStyle({ bold: true, fontSize: 11, fontColor: XLS_COLORS.dark, fill: XLS_COLORS.totalLot, align: "right", numFmt: '#,##0.00 "€"', border: true }),
  dTotalLotEmpty: makeStyle({ fill: XLS_COLORS.totalLot, border: true }),

  empty: makeStyle({}),
};

/* --- Helpers --- */
function setCell(ws: any, r: number, c: number, value: any, style: any) {
  const addr = XLSX.utils.encode_cell({ r, c });
  if (!ws[addr]) ws[addr] = {};
  if (value !== undefined && value !== null && value !== "") {
    ws[addr].v = value;
    ws[addr].t = typeof value === "number" ? "n" : "s";
  }
  if (style) ws[addr].s = style;
}

function addMerge(ws: any, r1: number, c1: number, r2: number, c2: number) {
  if (!ws["!merges"]) ws["!merges"] = [];
  ws["!merges"].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}

/* --- Convert SummaryData to script format --- */
interface ExportData {
  project: { name: string; turbines: number; version: string; lastModified: string };
  references: Record<string, string>;
  summary: Array<{ lot: string; amount: number; comment: string; confidence: number | null }>;
  totalCapex: number;
  lots: Array<{
    name: string;
    comment: string;
    total: number;
    sections: Array<{
      name: string;
      nameRaw: string;
      multiplier: number | null;
      items: Array<{ designation: string; qty: number | null; unit: string; unitPrice: number | null; total: number | null; comment: string }>;
      subtotal: number;
      subtotalMultiplied: number | null;
    }>;
  }>;
}

function convertSummaryDataToExportFormat(data: SummaryData): ExportData {
  const calcData = data.quoteSettings?.calculator_data as any;
  const nbEol = calcData?.global?.nb_eol ?? data.quoteSettings?.n_wtg ?? 0;

  const references: Record<string, string> = {};
  (data.referenceDocuments || []).forEach((doc) => {
    references[doc.label] = doc.reference || "";
  });

  const summary = data.lots.map((lot) => ({
    lot: lot.label,
    amount: lot.total,
    comment: lot.header_comment || "",
    confidence: null,
  }));

  const lots = data.lots.map((lot) => ({
    name: lot.label,
    comment: lot.header_comment || "",
    total: lot.total,
    sections: lot.sections.map((sec) => {
      const rawSubtotal = sec.lines.reduce((s, l) => s + l.total_price, 0);
      const isMultiplied = sec.is_multiple && sec.multiplier > 1;
      return {
        name: sec.name,
        nameRaw: isMultiplied ? `${sec.name} (x${sec.multiplier})` : sec.name,
        multiplier: isMultiplied ? sec.multiplier : null,
        items: sec.lines.map((line) => ({
          designation: line.designation,
          qty: line.quantity,
          unit: line.unit,
          unitPrice: line.unit_price,
          total: line.total_price,
          comment: line.comment || "",
        })),
        subtotal: rawSubtotal,
        subtotalMultiplied: isMultiplied ? sec.subtotal : null,
      };
    }),
  }));

  return {
    project: {
      name: data.project?.name || "",
      turbines: nbEol,
      version: data.quoteVersion?.version_label || "",
      lastModified: data.quoteVersion?.last_update || "",
    },
    references,
    summary,
    totalCapex: data.totalCapex,
    lots,
  };
}

/* --- Build Summary Sheet --- */
function buildSummarySheet(DATA: ExportData) {
  const ws: any = {};
  let r = 0;

  setCell(ws, r, 0, DATA.project.name, S.sumTitle);
  for (let c = 1; c <= 4; c++) setCell(ws, r, c, "", S.sumTitle);
  addMerge(ws, r, 0, r, 4);
  r++;

  setCell(ws, r, 0, "ESTIMATION CAPEX", S.sumSubtitle);
  for (let c = 1; c <= 4; c++) setCell(ws, r, c, "", S.sumSubtitle);
  addMerge(ws, r, 0, r, 4);
  r++;
  r++;

  setCell(ws, r, 0, "INFORMATIONS PROJET", S.sumSection);
  for (let c = 1; c <= 4; c++) setCell(ws, r, c, "", S.sumSection);
  addMerge(ws, r, 0, r, 4);
  r++;

  const infoRows: [string, string | number][] = [
    ["Projet", DATA.project.name],
    ["Nombre d'éoliennes", DATA.project.turbines],
    ["Version", DATA.project.version],
    ["Dernière modification", DATA.project.lastModified],
  ];
  infoRows.forEach(([label, val]) => {
    setCell(ws, r, 0, label, S.sumLabel);
    setCell(ws, r, 1, val, S.sumValue);
    r++;
  });
  r++;

  setCell(ws, r, 0, "DOCUMENTS DE RÉFÉRENCE", S.sumSection);
  for (let c = 1; c <= 4; c++) setCell(ws, r, c, "", S.sumSection);
  addMerge(ws, r, 0, r, 4);
  r++;

  Object.entries(DATA.references).forEach(([k, v]) => {
    setCell(ws, r, 0, k, S.sumLabel);
    setCell(ws, r, 1, v, S.sumValue);
    r++;
  });
  r++;

  setCell(ws, r, 0, "RÉSUMÉ PAR LOT", S.sumSection);
  for (let c = 1; c <= 4; c++) setCell(ws, r, c, "", S.sumSection);
  addMerge(ws, r, 0, r, 4);
  r++;

  const thLabels = ["Lot", "Montant (€)", "% Total", "Commentaire", "Indice de confiance"];
  thLabels.forEach((lbl, c) => setCell(ws, r, c, lbl, S.sumTblHead));
  r++;

  DATA.summary.forEach((s) => {
    const pct = DATA.totalCapex > 0 ? s.amount / DATA.totalCapex : 0;
    const confStr = s.confidence ? "★".repeat(s.confidence) + "☆".repeat(5 - s.confidence) : "";
    setCell(ws, r, 0, s.lot, S.sumLotName);
    setCell(ws, r, 1, s.amount, S.sumAmount);
    setCell(ws, r, 2, pct, S.sumPct);
    setCell(ws, r, 3, s.comment, S.sumComment);
    setCell(ws, r, 4, confStr, S.sumConfidence);
    r++;
  });

  setCell(ws, r, 0, "TOTAL CAPEX", S.sumTotalLabel);
  setCell(ws, r, 1, DATA.totalCapex, S.sumTotalAmt);
  for (let c = 2; c <= 4; c++) setCell(ws, r, c, "", S.sumTotalEmpty);
  r++;
  r++;

  setCell(ws, r, 0, "TOTAL CAPEX", S.sumTotalLabel);
  setCell(ws, r, 1, DATA.totalCapex, S.sumTotalAmt);
  for (let c = 2; c <= 4; c++) setCell(ws, r, c, "", S.sumTotalEmpty);
  r++;

  const cpt = DATA.totalCapex / (DATA.project.turbines || 1);
  setCell(ws, r, 0, "Coût moyen / éolienne", S.sumAvgLabel);
  setCell(ws, r, 1, cpt, S.sumAvgValue);
  r++;

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r - 1, c: 4 } });
  ws["!cols"] = [{ wch: 28 }, { wch: 22 }, { wch: 10 }, { wch: 45 }, { wch: 22 }];
  ws["!rows"] = [];
  ws["!rows"][0] = { hpt: 30 };
  ws["!rows"][1] = { hpt: 24 };

  return ws;
}

/* --- Build Detail Sheet --- */
function buildDetailSheet(DATA: ExportData) {
  const ws: any = {};

  const blockDefs = [
    {
      colStart: 0,
      lotNames: ["Terrassement", "Renforcement de sol", "Turbinier"],
      secStyle: S.dSecTerra,
      altData: S.dDataTerraAlt,
      altNum: S.dNumTerraAlt,
      altEur: S.dEurTerraAlt,
      lotStyles: {
        Terrassement: S.dLotTerra,
        "Renforcement de sol": S.dLotRenf,
        Turbinier: S.dLotTurb,
      } as Record<string, any>,
    },
    {
      colStart: 8,
      lotNames: ["Fondations"],
      secStyle: S.dSecFond,
      altData: S.dDataFondAlt,
      altNum: S.dNumFondAlt,
      altEur: S.dEurFondAlt,
      lotStyles: { Fondations: S.dLotFond } as Record<string, any>,
    },
    {
      colStart: 16,
      lotNames: ["Électricité"],
      secStyle: S.dSecElec,
      altData: S.dDataElecAlt,
      altNum: S.dNumElecAlt,
      altEur: S.dEurElecAlt,
      lotStyles: { Électricité: S.dLotElec } as Record<string, any>,
    },
  ];

  let maxRow = 0;

  blockDefs.forEach((block) => {
    const C = block.colStart;
    let r = 0;

    block.lotNames.forEach((lotName) => {
      const lot = DATA.lots.find((l) => l.name === lotName);
      if (!lot) return;

      const thisLotStyle = block.lotStyles[lotName] || S.dLotTerra;
      setCell(ws, r, C, lot.name, thisLotStyle);
      for (let c = 1; c < 6; c++) setCell(ws, r, C + c, "", thisLotStyle);
      addMerge(ws, r, C, r, C + 5);
      r++;

      if (lot.sections.length === 0) {
        if (lot.comment) {
          setCell(ws, r, C, lot.comment, S.dDataWhite);
          r++;
        }
        setCell(ws, r, C, "TOTAL " + lot.name, S.dSubtotal);
        for (let c = 1; c < 4; c++) setCell(ws, r, C + c, "", S.dSubtotalEmpty);
        setCell(ws, r, C + 4, lot.total, S.dSubtotalEur);
        setCell(ws, r, C + 5, "", S.dSubtotalEmpty);
        r++;
        return;
      }

      r++;

      lot.sections.forEach((sec) => {
        setCell(ws, r, C, " " + (sec.nameRaw || sec.name), block.secStyle);
        for (let c = 1; c < 6; c++) setCell(ws, r, C + c, "", block.secStyle);
        addMerge(ws, r, C, r, C + 5);
        r++;

        const hdrs = ["Désignation", "Qté", "Unité", "P.U. (€)", "Total (€)", "Commentaire"];
        hdrs.forEach((h, ci) => setCell(ws, r, C + ci, h, S.dHeaderTerra));
        r++;

        let itemIdx = 0;
        sec.items.forEach((item) => {
          if (!item.designation && item.qty === null && (item.total === null || item.total === 0)) return;
          const isAlt = itemIdx % 2 === 1;
          const sText = isAlt ? block.altData : S.dDataWhite;
          const sNum = isAlt ? block.altNum : S.dNumWhite;
          const sEur = isAlt ? block.altEur : S.dEurWhite;

          setCell(ws, r, C + 0, item.designation, sText);
          setCell(ws, r, C + 1, item.qty, sNum);
          setCell(ws, r, C + 2, item.unit, sText);
          setCell(ws, r, C + 3, item.unitPrice, sNum);
          setCell(ws, r, C + 4, item.total, sEur);
          setCell(ws, r, C + 5, item.comment, sText);
          itemIdx++;
          r++;
        });

        setCell(ws, r, C, "Sous-total section", S.dSubtotal);
        for (let c = 1; c < 4; c++) setCell(ws, r, C + c, "", S.dSubtotalEmpty);
        setCell(ws, r, C + 4, sec.subtotal, S.dSubtotalEur);
        setCell(ws, r, C + 5, "", S.dSubtotalEmpty);
        r++;

        if (sec.subtotalMultiplied != null) {
          setCell(ws, r, C, "(x" + sec.multiplier + ")", S.dSubtotal);
          for (let c = 1; c < 4; c++) setCell(ws, r, C + c, "", S.dSubtotalEmpty);
          setCell(ws, r, C + 4, sec.subtotalMultiplied, S.dSubtotalEur);
          setCell(ws, r, C + 5, "", S.dSubtotalEmpty);
          r++;
        }

        r++;
      });

      setCell(ws, r, C, "TOTAL " + lot.name, S.dTotalLot);
      for (let c = 1; c < 4; c++) setCell(ws, r, C + c, "", S.dTotalLotEmpty);
      setCell(ws, r, C + 4, lot.total, S.dTotalLotEur);
      setCell(ws, r, C + 5, "", S.dTotalLotEmpty);
      r++;
      r++;
    });

    if (r > maxRow) maxRow = r;
  });

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow - 1, c: 21 } });
  ws["!cols"] = [
    { wch: 38 }, { wch: 10 }, { wch: 7 }, { wch: 12 }, { wch: 16 }, { wch: 28 },
    { wch: 2 }, { wch: 2 },
    { wch: 32 }, { wch: 10 }, { wch: 7 }, { wch: 12 }, { wch: 16 }, { wch: 28 },
    { wch: 2 }, { wch: 2 },
    { wch: 42 }, { wch: 10 }, { wch: 7 }, { wch: 12 }, { wch: 16 }, { wch: 28 },
  ];

  return ws;
}

/* --- Main export function --- */
export function exportCapexToXLSX(data: SummaryData) {
  const DATA = convertSummaryDataToExportFormat(data);

  const wb = XLSX.utils.book_new();
  const ws1 = buildSummarySheet(DATA);
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");
  const ws2 = buildDetailSheet(DATA);
  XLSX.utils.book_append_sheet(wb, ws2, "Détail CAPEX");

  const filename = "CEP_" + (DATA.project.name || "export").replace(/\s+/g, "_") + ".xlsx";
  XLSX.writeFile(wb, filename, { bookType: "xlsx", type: "binary", cellStyles: true });
}
