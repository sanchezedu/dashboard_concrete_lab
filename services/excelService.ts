import * as XLSX from 'xlsx';
import { ConcreteSample } from '../types';

// Helper to convert Excel serial date to JS Date
const excelDateToJSDate = (serial: number | string): Date => {
  if (typeof serial === 'string') {
    // Attempt standard parse if string
    const d = new Date(serial);
    if (!isNaN(d.getTime())) return d;
    return new Date(); // Fallback
  }
  // Excel base date logic
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  return date_info;
};

// Helper to normalize strings (remove accents, trim)
const cleanString = (str: any): string => {
  if (!str) return '';
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const cleanHeader = (header: string): string => {
  return cleanString(header).replace(/\s+/g, '_');
};

export const processExcelFile = async (file: File): Promise<ConcreteSample[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        let allSamples: ConcreteSample[] = [];

        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          // Convert sheet to JSON with raw values first
          const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });

          if (jsonData.length === 0) return;

          // Process each row
          const sheetSamples = jsonData.map((row: any, index) => {
            // Mapping logic based on prompt structure. 
            // We need to be flexible with keys because of potential spaces/accents
            
            // Normalize keys for lookup
            const normalizedRow: Record<string, any> = {};
            Object.keys(row).forEach(key => {
              normalizedRow[cleanHeader(key)] = row[key];
            });

            // Skip empty rows (check required fields)
            if (!normalizedRow['Fecha_Toma'] && !normalizedRow['Cliente']) return null;

            // Date parsing
            const fechaToma = normalizedRow['Fecha_Toma'] instanceof Date 
                ? normalizedRow['Fecha_Toma'] 
                : excelDateToJSDate(normalizedRow['Fecha_Toma']);
            
            const fechaEnsayo = normalizedRow['Fecha_Ensayo'] instanceof Date 
                ? normalizedRow['Fecha_Ensayo'] 
                : excelDateToJSDate(normalizedRow['Fecha_Ensayo']);

            // Parse percentages
            let fcPct = normalizedRow['fc_%'];
            if (typeof fcPct === 'string' && fcPct.includes('%')) {
               fcPct = parseFloat(fcPct.replace(',', '.').replace('%', '')) / 100;
            } else {
               fcPct = parseFloat(fcPct) || 0;
               // If excel stored 95 instead of 0.95
               if (fcPct > 2) fcPct = fcPct / 100; 
            }

            const sample: ConcreteSample = {
              id: `${sheetName}-${index}-${Math.random().toString(36).substr(2, 9)}`,
              fechaToma: fechaToma,
              mes: fechaToma.toLocaleString('es-ES', { month: 'short' }).toUpperCase(),
              guiaNo: String(normalizedRow['Guia_No'] || ''),
              cliente: String(normalizedRow['Cliente'] || 'Desconocido'),
              elemento: String(normalizedRow['Elemento'] || 'Otros'),
              fcDiseno: parseFloat(normalizedRow['fc_Diseno_Kgcm2']) || 0,
              tipo: String(normalizedRow['Tipo'] || ''),
              fechaEnsayo: fechaEnsayo,
              edadActual: parseInt(normalizedRow['Edad_Actual']) || 0,
              edadEnsayo: parseInt(normalizedRow['Edad_A_Ensayo']) || 0,
              diametroMm: parseFloat(normalizedRow['Diametro_mm']) || 0,
              alturaMm: parseFloat(normalizedRow['Altura_mm']) || 0,
              areaCm2: parseFloat(normalizedRow['Area_cm2']) || 0,
              volumenCm3: parseFloat(normalizedRow['Volumen_cm3']) || 0,
              pesoKg: parseFloat(normalizedRow['Peso_Kg']) || 0,
              densidad: parseFloat(normalizedRow['Densidad_g_cm3']) || 0,
              cargaTon: parseFloat(normalizedRow['Carga_Ton']) || 0,
              fcRoturaKgCm2: parseFloat(normalizedRow['fc_Rotura_Kgcm2']) || 0,
              fcRoturaMPa: parseFloat(normalizedRow['fc_Rotura_MPa']) || 0,
              cementoKgM3: parseFloat(normalizedRow['Cemento_Kg_m3']) || 0,
              fcPorcentaje: fcPct,
              camionCodigo: String(normalizedRow['Camion_Codigo'] || ''),
            };

            return sample;
          }).filter((s): s is ConcreteSample => {
            if (s === null) return false;
            // FILTER: Remove aberrant data where Rupture is 0 or extremely close to 0
            if (s.fcRoturaKgCm2 <= 1) return false; 
            return true;
          });

          allSamples = [...allSamples, ...sheetSamples];
        });

        resolve(allSamples);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};