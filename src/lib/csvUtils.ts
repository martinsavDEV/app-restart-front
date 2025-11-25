export const exportToCSV = (data: any[], filename: string, columns: string[]) => {
  // Create CSV header
  const header = columns.join(',');
  
  // Create CSV rows
  const rows = data.map(item => 
    columns.map(col => {
      const value = item[col];
      // Handle null/undefined
      if (value === null || value === undefined) return '';
      // Escape commas and quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );
  
  // Combine header and rows
  const csv = [header, ...rows].join('\n');
  
  // Create download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadTemplate = (columns: string[], filename: string) => {
  const csv = columns.join(',');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_template.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('Fichier CSV vide'));
          return;
        }
        
        // Parse header
        const header = lines[0].split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        
        // Parse rows
        const data = lines.slice(1).map((line, index) => {
          const values = parseCSVLine(line);
          
          if (values.length !== header.length) {
            console.warn(`Ligne ${index + 2}: nombre de colonnes incorrect`);
          }
          
          const row: any = {};
          header.forEach((col, i) => {
            const value = values[i]?.trim().replace(/^"|"$/g, '') || '';
            row[col] = value === '' ? null : value;
          });
          
          return row;
        });
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsText(file);
  });
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};

export const exportCapexToCSV = (data: any) => {
  let csvContent = "";
  
  // Header with project info
  csvContent += `EXPORT CAPEX\n`;
  csvContent += `Projet,${data.project?.name || "N/A"}\n`;
  csvContent += `Nombre d'éoliennes,${data.quoteSettings?.n_wtg || data.project?.n_wtg || 0}\n`;
  csvContent += `Version,${data.quoteVersion?.version_label || "N/A"}\n`;
  csvContent += `Dernière modification,${data.quoteVersion?.last_update || "N/A"}\n`;
  csvContent += `\n`;
  
  // Reference documents
  csvContent += `Documents de référence\n`;
  data.referenceDocuments.forEach((doc: any) => {
    csvContent += `${doc.label},${doc.reference || "N/A"},${doc.comment || ""}\n`;
  });
  csvContent += `\n`;
  
  // Summary
  csvContent += `RÉSUMÉ PAR LOT\n`;
  csvContent += `Lot,Montant\n`;
  data.lots.forEach((lot: any) => {
    csvContent += `${lot.label},${lot.total.toFixed(2)}\n`;
  });
  csvContent += `TOTAL CAPEX,${data.totalCapex.toFixed(2)}\n`;
  csvContent += `\n`;
  
  // Detailed breakdown
  data.lots.forEach((lot: any) => {
    csvContent += `\nLOT: ${lot.label}\n`;
    
    lot.sections.forEach((section: any) => {
      const sectionTitle = section.is_multiple
        ? `Section: ${section.name} (x${section.multiplier})`
        : `Section: ${section.name}`;
      csvContent += `${sectionTitle}\n`;
      csvContent += `Désignation,Qté,Unité,P.U.,Total\n`;
      
      section.lines.forEach((line: any) => {
        csvContent += `${line.designation},${line.quantity},${line.unit},${line.unit_price.toFixed(2)},${line.total_price.toFixed(2)}\n`;
      });
      
      csvContent += `Sous-total section,,,${section.subtotal.toFixed(2)}\n`;
      csvContent += `\n`;
    });
    
    csvContent += `Total Lot,,,${lot.total.toFixed(2)}\n`;
    csvContent += `\n`;
  });
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `CAPEX_${data.project?.name || "export"}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const validateData = (data: any[], requiredColumns: string[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (data.length === 0) {
    errors.push('Aucune donnée à importer');
    return { valid: false, errors };
  }
  
  // Check if all required columns are present
  const firstRow = data[0];
  const missingColumns = requiredColumns.filter(col => !(col in firstRow));
  
  if (missingColumns.length > 0) {
    errors.push(`Colonnes manquantes: ${missingColumns.join(', ')}`);
  }
  
  // Validate each row
  data.forEach((row, index) => {
    requiredColumns.forEach(col => {
      if (!row[col]) {
        errors.push(`Ligne ${index + 2}: ${col} est obligatoire`);
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};
