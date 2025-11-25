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
    styles: { fontSize: 10 },
    columnStyles: {
      1: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.row.index === summaryRows.length - 1 && data.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

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
        styles: { fontSize: 9 },
        columnStyles: {
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
