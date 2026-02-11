import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SummaryData } from "@/hooks/useSummaryData";
import { format } from "date-fns";
import { getLotColorRGB } from "./lotColors";

// Helper to format currency
const formatCurrency = (value: number): string => {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
};

// Helper to format compact currency
const formatCompactCurrency = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + " M€";
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + " k€";
  }
  return formatCurrency(value);
};

export const exportCapexToPDF = (data: SummaryData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let yPos = 0;

  // Colors
  const primaryColor: [number, number, number] = [16, 185, 129]; // Emerald-500
  const darkText: [number, number, number] = [30, 41, 59]; // Slate-800
  const mutedText: [number, number, number] = [100, 116, 139]; // Slate-500
  const headerBg: [number, number, number] = [30, 41, 59]; // Slate-800

  // Project info
  const projectName = data.project?.name || "N/A";
  const nWtg = data.quoteSettings?.n_wtg || data.project?.n_wtg || 0;
  const version = data.quoteVersion?.version_label || "N/A";
  const lastUpdate = data.quoteVersion?.last_update
    ? format(new Date(data.quoteVersion.last_update), "dd/MM/yyyy HH:mm")
    : "N/A";

  // ============ HEADER ============
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 22, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CHIFFREUR CAPEX", margin, 14);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Exporté le ${format(new Date(), "dd/MM/yyyy à HH:mm")}`, pageWidth - margin, 14, { align: "right" });

  yPos = 32;

  // ============ PROJECT INFO BOX ============
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 28, 2, 2, "F");

  doc.setTextColor(...darkText);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(projectName, margin + 6, yPos + 10);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedText);

  const infoCol1X = margin + 6;
  const infoCol2X = margin + 70;
  const infoY = yPos + 18;

  doc.text(`Version: ${version}`, infoCol1X, infoY);
  doc.text(`Éoliennes: ${nWtg}`, infoCol1X, infoY + 5);
  const tensionHta = (data.quoteSettings as any)?.calculator_data?.global?.tension_hta || "";
  doc.text(`Dernière modification: ${lastUpdate}${tensionHta ? `  |  Tension HTA: ${tensionHta}` : ""}`, infoCol2X, infoY);
  
  // Total CAPEX in box
  doc.setFillColor(...primaryColor);
  doc.roundedRect(pageWidth - margin - 50, yPos + 4, 44, 18, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("TOTAL CAPEX", pageWidth - margin - 28, yPos + 11, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(formatCompactCurrency(data.totalCapex), pageWidth - margin - 28, yPos + 18, { align: "center" });

  yPos += 36;

  // ============ SUMMARY TABLE ============
  doc.setTextColor(...darkText);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("RÉSUMÉ PAR LOT", margin, yPos);
  yPos += 5;

  const summaryRows = data.lots.map((lot) => {
    const color = getLotColorRGB(lot.code);
    return {
      lotLabel: lot.label,
      total: formatCurrency(lot.total),
      color,
    };
  });

  autoTable(doc, {
    startY: yPos,
    head: [["Lot", "Montant"]],
    body: summaryRows.map((r) => [r.lotLabel, r.total]),
    foot: [["TOTAL CAPEX", formatCurrency(data.totalCapex)]],
    theme: "plain",
    headStyles: { 
      fillColor: headerBg, 
      textColor: 255, 
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 3,
    },
    footStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 9,
      fontStyle: "bold",
      cellPadding: 3,
    },
    styles: { 
      fontSize: 8, 
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 35 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const rowColor = summaryRows[data.row.index]?.color;
        if (rowColor) {
          data.cell.styles.fillColor = [...rowColor, 40] as any; // Light tint
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ============ REFERENCE DOCUMENTS ============
  if (data.referenceDocuments.length > 0) {
    doc.setTextColor(...darkText);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DOCUMENTS DE RÉFÉRENCE", margin, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Document", "Référence", "Commentaire"]],
      body: data.referenceDocuments.map((d) => [
        d.label,
        d.reference || "-",
        d.comment || "-",
      ]),
      theme: "plain",
      headStyles: { 
        fillColor: headerBg, 
        textColor: 255, 
        fontSize: 8,
        fontStyle: "bold",
        cellPadding: 3,
      },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 40 },
        2: { cellWidth: "auto" },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // ============ CALCULATOR SECTION ============
  if (data.quoteSettings?.calculator_data) {
    const calcData = data.quoteSettings.calculator_data;

    // New page for calculator if needed
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 15;
    }

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 8, 2, 2, "F");
    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DONNÉES CALCULATOR", margin + 4, yPos + 6);
    yPos += 14;

    // Global & Design Parameters (2 columns)
    if (calcData.global || calcData.design) {
      const leftParams: string[][] = [];
      const rightParams: string[][] = [];

      if (calcData.global) {
        leftParams.push(["Nb éoliennes", String(calcData.global.nb_eol || "-")]);
        leftParams.push(["Type éolienne", calcData.global.typ_eol || "-"]);
      }
      if (calcData.design) {
        rightParams.push(["Ø Fondation", calcData.design.diametre_fondation ? `${calcData.design.diametre_fondation} m` : "-"]);
      }

      const halfWidth = (pageWidth - margin * 3) / 2;

      if (leftParams.length > 0) {
        autoTable(doc, {
          startY: yPos,
          body: leftParams,
          theme: "plain",
          styles: { fontSize: 7, cellPadding: 1.5 },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 35, textColor: mutedText },
            1: { cellWidth: "auto" },
          },
          tableWidth: halfWidth,
          margin: { left: margin },
        });
      }

      if (rightParams.length > 0) {
        autoTable(doc, {
          startY: yPos,
          body: rightParams,
          theme: "plain",
          styles: { fontSize: 7, cellPadding: 1.5 },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 35, textColor: mutedText },
            1: { cellWidth: "auto" },
          },
          tableWidth: halfWidth,
          margin: { left: margin + halfWidth + margin },
        });
      }

      yPos = Math.max((doc as any).lastAutoTable?.finalY || yPos, yPos) + 6;
    }

    // Turbines Table
    if (calcData.turbines && calcData.turbines.length > 0) {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 15;
      }

      doc.setTextColor(...darkText);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Éoliennes", margin, yPos);
      yPos += 4;

      const turbineRows = calcData.turbines.map((t: any) => [
        t.name || "-",
        `${t.surf_PF || 0}`,
        `${t.acces_PF || 0}`,
        `${t.m3_bouger || 0}`,
        t.fondation_type || "-",
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Éolienne", "Surface PF (m²)", "Accès PF (m)", "Vol. (m³)", "Type fond."]],
        body: turbineRows,
        theme: "striped",
        headStyles: { fillColor: headerBg, textColor: 255, fontSize: 6.5, fontStyle: "bold", cellPadding: 2 },
        styles: { fontSize: 6.5, cellPadding: 1.5 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 28, halign: "right" },
          2: { cellWidth: 25, halign: "right" },
          3: { cellWidth: 20, halign: "right" },
          4: { cellWidth: "auto" },
        },
        margin: { left: margin, right: margin },
      });

      yPos = (doc as any).lastAutoTable.finalY + 6;
    }

    // Access Segments Table
    if (calcData.access_segments && calcData.access_segments.length > 0) {
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 15;
      }

      doc.setTextColor(...darkText);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Segments d'accès", margin, yPos);
      yPos += 4;

      const accessRows = calcData.access_segments.map((a: any) => [
        a.name || "-",
        `${a.surface || 0}`,
        a.renforcement || "-",
        a.gnt ? `${a.surface || 0}` : "-",
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Segment", "Surface (m²)", "Renforcement", "GNT (m²)"]],
        body: accessRows,
        theme: "striped",
        headStyles: { fillColor: headerBg, textColor: 255, fontSize: 6.5, fontStyle: "bold", cellPadding: 2 },
        styles: { fontSize: 6.5, cellPadding: 1.5 },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: 25, halign: "right" },
          2: { cellWidth: 28 },
          3: { cellWidth: 22, halign: "right" },
        },
        margin: { left: margin, right: margin },
      });

      yPos = (doc as any).lastAutoTable.finalY + 6;
    }

    // HTA Cables Table
    if (calcData.hta_cables && Object.keys(calcData.hta_cables).length > 0) {
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 15;
      }

      doc.setTextColor(...darkText);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Câbles HTA", margin, yPos);
      yPos += 4;

      const htaRows: string[][] = [];
      const cables = calcData.hta_cables;
      
      // Extract segment data
      if (cables.segments) {
        Object.entries(cables.segments).forEach(([segmentName, segmentData]: [string, any]) => {
          Object.entries(segmentData).forEach(([cableType, length]: [string, any]) => {
            if (typeof length === "number" && length > 0) {
              htaRows.push([segmentName, cableType, `${length} m`]);
            }
          });
        });
      }

      // Add totals if available
      if (cables.totals) {
        Object.entries(cables.totals).forEach(([cableType, total]: [string, any]) => {
          if (typeof total === "number" && total > 0) {
            htaRows.push(["TOTAL", cableType, `${total} m`]);
          }
        });
      }

      if (htaRows.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Segment", "Type câble", "Longueur"]],
          body: htaRows,
          theme: "striped",
          headStyles: { fillColor: headerBg, textColor: 255, fontSize: 6.5, fontStyle: "bold", cellPadding: 2 },
          styles: { fontSize: 6.5, cellPadding: 1.5 },
          columnStyles: {
            0: { cellWidth: "auto" },
            1: { cellWidth: 35 },
            2: { cellWidth: 30, halign: "right" },
          },
          didParseCell: (data) => {
            if (data.section === "body" && data.row.raw?.[0] === "TOTAL") {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.fillColor = [229, 231, 235]; // Gray-200
            }
          },
          margin: { left: margin, right: margin },
        });

        yPos = (doc as any).lastAutoTable.finalY + 8;
      }
    }
  }

  // ============ DETAILED LOT BREAKDOWN ============
  data.lots.forEach((lot, lotIndex) => {
    // New page for each lot (except first if space available)
    if (lotIndex > 0 || yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 15;
    }

    const lotColor = getLotColorRGB(lot.code);

    // Lot header with color
    doc.setFillColor(...lotColor);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, lot.header_comment ? 16 : 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`LOT: ${lot.label.toUpperCase()}`, margin + 4, yPos + 7);
    doc.setFontSize(9);
    doc.text(formatCurrency(lot.total), pageWidth - margin - 4, yPos + 7, { align: "right" });
    
    // Lot header comment if present
    if (lot.header_comment) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(`💬 ${lot.header_comment}`, margin + 4, yPos + 13);
      yPos += 22;
    } else {
      yPos += 16;
    }

    // Sections
    lot.sections.forEach((section) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 15;
      }

      // Section title
      doc.setTextColor(...darkText);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      const sectionTitle = section.is_multiple
        ? `${section.name} (×${section.multiplier})`
        : section.name;
      doc.text(sectionTitle, margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...mutedText);
      doc.text(formatCurrency(section.subtotal), pageWidth - margin, yPos, { align: "right" });
      yPos += 4;

      // Lines table - now includes comment column
      const lineRows = section.lines.map((line) => [
        line.designation.length > 45 ? line.designation.substring(0, 45) + "..." : line.designation,
        String(line.quantity),
        line.unit,
        formatCurrency(line.unit_price),
        formatCurrency(line.total_price),
        line.comment ? (line.comment.length > 25 ? line.comment.substring(0, 25) + "..." : line.comment) : "",
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Désignation", "Qté", "U", "P.U.", "Total", "Commentaire"]],
        body: lineRows,
        theme: "plain",
        headStyles: { 
          fillColor: [241, 245, 249], // Slate-100
          textColor: mutedText, 
          fontSize: 6, 
          fontStyle: "bold",
          cellPadding: 1.5,
        },
        styles: { 
          fontSize: 6, 
          cellPadding: 1.5,
          overflow: "ellipsize",
        },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { halign: "right", cellWidth: 12 },
          2: { halign: "center", cellWidth: 10 },
          3: { halign: "right", cellWidth: 20 },
          4: { halign: "right", cellWidth: 22 },
          5: { cellWidth: 30, fontStyle: "italic", textColor: mutedText },
        },
        margin: { left: margin, right: margin },
      });

      yPos = (doc as any).lastAutoTable.finalY + 5;
    });

    yPos += 3;
  });

  // ============ FOOTER ON EACH PAGE ============
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...mutedText);
    doc.text(
      `${projectName} - ${version} | Page ${i}/${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    );
  }

  // Save the PDF
  const fileName = `CAPEX_${projectName.replace(/[^a-zA-Z0-9]/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
};
