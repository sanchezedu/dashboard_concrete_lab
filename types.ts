export interface ConcreteSample {
  id: string; // Unique ID (generated)
  fechaToma: Date;
  mes: string;
  guiaNo: string;
  cliente: string;
  elemento: string;
  fcDiseno: number; // fc_Diseno_Kgcm2
  tipo: string;
  fechaEnsayo: Date;
  edadActual: number;
  edadEnsayo: number;
  diametroMm: number;
  alturaMm: number;
  areaCm2: number;
  volumenCm3: number;
  pesoKg: number;
  densidad: number;
  cargaTon: number;
  fcRoturaKgCm2: number;
  fcRoturaMPa: number;
  cementoKgM3: number;
  fcPorcentaje: number; // Decimal (e.g., 0.95 for 95%)
  camionCodigo: string;
}

export interface FilterState {
  dateRange: [Date | null, Date | null];
  cliente: string | 'All';
  diseno: string | 'All';
  elemento: string | 'All';
}

export enum Page {
  EXECUTIVE = 'Resumen Ejecutivo',
  DESIGN = 'Análisis por Diseño',
  QUALITY = 'Control de Calidad'
}