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
