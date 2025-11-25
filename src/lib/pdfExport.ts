import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SummaryData } from "@/hooks/useSummaryData";
import { format } from "date-fns";

export const exportCapexToPDF = (data: SummaryData) => {
  const doc = new jsPDF();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("EXPORT CAPEX", 105, yPos, { align: "center" });
  yPos += 15;

  // Project Info Section
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const projectName = data.project?.name || "N/A";
  const nWtg = data.quoteSettings?.n_wtg || data.project?.n_wtg || 0;
  const version = data.quoteVersion?.version_label || "N/A";
  const lastUpdate = data.quoteVersion?.last_update
    ? format(new Date(data.quoteVersion.last_update), "dd/MM/yyyy")
    : "N/A";

  doc.text(`Projet: ${projectName}`, 15, yPos);
  doc.text(`Nombre d'éoliennes: ${nWtg}`, 15, yPos + 6);
  doc.text(`Version: ${version}`, 15, yPos + 12);
  doc.text(`Dernière modification: ${lastUpdate}`, 15, yPos + 18);

  // Reference Documents (right side)
  let refYPos = yPos;
  doc.text("Documents de référence:", 120, refYPos);
  refYPos += 6;
  data.referenceDocuments.forEach((doc_ref) => {
    const refText = `• ${doc_ref.label}: ${doc_ref.reference || "N/A"}`;
    doc.text(refText, 120, refYPos);
    refYPos += 6;
  });

  yPos = Math.max(yPos + 30, refYPos + 10);

  // Summary Table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RÉSUMÉ PAR LOT", 15, yPos);
  yPos += 8;

  const summaryRows = data.lots.map((lot) => [
    lot.label,
    `${lot.total.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
  ]);

  summaryRows.push([
    "TOTAL CAPEX",
    `${data.totalCapex.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
  ] as any);

  autoTable(doc, {
    startY: yPos,
    head: [["Lot", "Montant"]],
    body: summaryRows,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 10, cellWidth: 'wrap' },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: "right", cellWidth: 40 },
    },
    didParseCell: (data) => {
      if (data.row.index === summaryRows.length - 1 && data.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Calculator Summary Section
  if (data.quoteSettings?.calculator_data) {
    const calcData = data.quoteSettings.calculator_data;
    
    // Check if we need a new page
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RÉSUMÉ CALCULATOR", 15, yPos);
    yPos += 8;

    // Global Parameters
    if (calcData.global) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Paramètres globaux", 15, yPos);
      yPos += 6;

      const globalRows = [
        ["Nombre d'éoliennes", calcData.global.nb_eol?.toString() || "N/A"],
        ["Type d'éolienne", calcData.global.typ_eol || "N/A"],
      ];

      autoTable(doc, {
        startY: yPos,
        body: globalRows,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 'auto' },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // Design Parameters
    if (calcData.design) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Paramètres de conception", 15, yPos);
      yPos += 6;

      const designRows = [
        ["Diamètre fondation", calcData.design.diametre_fondation ? `${calcData.design.diametre_fondation} m` : "N/A"],
      ];

      autoTable(doc, {
        startY: yPos,
        body: designRows,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 'auto' },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // Turbines Summary
    if (calcData.turbines && calcData.turbines.length > 0) {
      if (yPos > 180) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Éoliennes", 15, yPos);
      yPos += 6;

      const turbineRows = calcData.turbines.map((t: any) => [
        t.name || "N/A",
        `${t.surf_PF || 0} m²`,
        `${t.acces_PF || 0} m`,
        `${t.m3_bouger || 0} m³`,
        t.fondation_type || "N/A",
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Éolienne", "Surface PF", "Accès PF", "Volume", "Type fond."]],
        body: turbineRows,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 1.5, cellWidth: 'wrap' },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 25, halign: 'right' },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 'auto' },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // Access Segments Summary
    if (calcData.access_segments && calcData.access_segments.length > 0) {
      if (yPos > 180) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Accès", 15, yPos);
      yPos += 6;

      const accessRows = calcData.access_segments.map((a: any) => [
        a.name || "N/A",
        `${a.longueur || 0} m`,
        `${a.surface || 0} m²`,
        a.renforcement || "N/A",
        a.gnt ? "Oui" : "Non",
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Segment", "Longueur", "Surface", "Renforcement", "GNT"]],
        body: accessRows,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 1.5, cellWidth: 'wrap' },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 25, halign: 'right' },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 30 },
          4: { cellWidth: 15, halign: 'center' },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    } else {
      yPos += 10;
    }
  }

  // Detailed breakdown by lot
  data.lots.forEach((lot) => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`LOT: ${lot.label.toUpperCase()}`, 15, yPos);
    yPos += 8;

    lot.sections.forEach((section) => {
      // Check if we need a new page
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const sectionTitle = section.is_multiple
        ? `Section: ${section.name} (x${section.multiplier})`
        : `Section: ${section.name}`;
      doc.text(sectionTitle, 15, yPos);
      yPos += 6;

      const lineRows = section.lines.map((line) => [
        line.designation,
        line.quantity.toString(),
        line.unit,
        `${line.unit_price.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`,
        `${line.total_price.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`,
      ]);

      lineRows.push([
        "Sous-total section",
        "",
        "",
        "",
        `${section.subtotal.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`,
      ] as any);

      autoTable(doc, {
        startY: yPos,
        head: [["Désignation", "Qté", "Unité", "P.U.", "Total"]],
        body: lineRows,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 9, cellWidth: 'wrap', overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { halign: "center", cellWidth: 15 },
          2: { halign: "center", cellWidth: 15 },
          3: { halign: "right", cellWidth: 25 },
          4: { halign: "right", cellWidth: 25 },
        },
        didParseCell: (data) => {
          if (data.row.index === lineRows.length - 1 && data.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
            if (data.column.index === 0) {
              data.cell.styles.halign = 'right';
            }
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    });

    // Lot total
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total Lot: ${lot.total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`,
      15,
      yPos
    );
    yPos += 12;
  });

  // Save the PDF
  const fileName = `CAPEX_${data.project?.name || "export"}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
};
