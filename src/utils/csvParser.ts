export interface ParsedCSVRow {
  [key: string]: string;
}

export const parseCSV = async (file: File): Promise<ParsedCSVRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }

        // Parse headers
        const headers = parseCSVLine(lines[0]);
        
        // Parse data rows
        const rows: ParsedCSVRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length === 0) continue;
          
          const row: ParsedCSVRow = {};
          headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || '';
          });
          rows.push(row);
        }
        
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
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
        i++;
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

export const validateRequiredColumns = (row: ParsedCSVRow, requiredColumns: string[]): string | null => {
  for (const column of requiredColumns) {
    if (!row[column] || row[column].trim() === '') {
      return `Missing required field: ${column}`;
    }
  }
  return null;
};

export const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  // Try multiple date formats
  const formats = [
    // DD Mon YYYY (e.g., "13 Oct 2025")
    /(\d{1,2})\s+(\w+)\s+(\d{4})/,
    // YYYY-MM-DD
    /(\d{4})-(\d{2})-(\d{2})/,
    // MM/DD/YYYY
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  ];

  const monthMap: { [key: string]: number } = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  // Try DD Mon YYYY format
  const ddMmmYyyy = dateString.match(formats[0]);
  if (ddMmmYyyy) {
    const day = parseInt(ddMmmYyyy[1]);
    const month = monthMap[ddMmmYyyy[2].toLowerCase()];
    const year = parseInt(ddMmmYyyy[3]);
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }

  // Try YYYY-MM-DD format
  const yyyyMmDd = dateString.match(formats[1]);
  if (yyyyMmDd) {
    return new Date(parseInt(yyyyMmDd[1]), parseInt(yyyyMmDd[2]) - 1, parseInt(yyyyMmDd[3]));
  }

  // Try MM/DD/YYYY format
  const mmDdYyyy = dateString.match(formats[2]);
  if (mmDdYyyy) {
    return new Date(parseInt(mmDdYyyy[3]), parseInt(mmDdYyyy[1]) - 1, parseInt(mmDdYyyy[2]));
  }

  // Fallback to Date constructor
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

export const parseNumber = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};
