import { get, set, del } from 'idb-keyval';
import { ConcreteSample } from '../types';

const DB_KEY = 'concrete_lab_data_v1';

export const saveSamples = async (samples: ConcreteSample[]): Promise<void> => {
  try {
    // IndexedDB allows storing large objects like our samples array
    await set(DB_KEY, samples);
    console.log('Datos guardados exitosamente en almacenamiento local');
  } catch (error) {
    console.error('Error al guardar en almacenamiento:', error);
  }
};

export const loadSamples = async (): Promise<ConcreteSample[] | null> => {
  try {
    const data = await get<ConcreteSample[]>(DB_KEY);
    if (!data) return null;
    
    // Although structured cloning usually preserves Date objects,
    // we ensure they are properly instantiated just in case serialization occurred.
    return data.map(d => ({
      ...d,
      fechaToma: d.fechaToma instanceof Date ? d.fechaToma : new Date(d.fechaToma),
      fechaEnsayo: d.fechaEnsayo instanceof Date ? d.fechaEnsayo : new Date(d.fechaEnsayo)
    }));
  } catch (error) {
    console.error('Error al cargar datos del almacenamiento:', error);
    return null;
  }
};

export const clearSamples = async (): Promise<void> => {
  try {
    await del(DB_KEY);
    console.log('Datos eliminados del almacenamiento local');
  } catch (error) {
    console.error('Error al limpiar almacenamiento:', error);
  }
};