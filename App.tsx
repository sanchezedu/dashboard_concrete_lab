import React, { useState, useEffect } from 'react';
import { processExcelFile } from './services/excelService';
import { saveSamples, loadSamples, clearSamples } from './services/storageService';
import { Dashboard } from './components/Dashboard';
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { ConcreteSample } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<ConcreteSample[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load persisted data on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const storedData = await loadSamples();
        if (storedData && storedData.length > 0) {
          setData(storedData);
        }
      } catch (e) {
        console.error("Failed to load stored data", e);
      } finally {
        setIsInitializing(false);
      }
    };
    initData();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const processedData = await processExcelFile(file);
      if (processedData.length === 0) {
        setError("No se encontraron datos válidos en el archivo. Verifique el formato.");
      } else {
        // Save to persistent storage immediately
        await saveSamples(processedData);
        setData(processedData);
      }
    } catch (err) {
      console.error(err);
      setError("Error al procesar el archivo. Asegúrese de que sea un Excel válido (.xlsx).");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    // Clear state and persistent storage
    await clearSamples();
    setData([]);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Cargando base de datos...</p>
        </div>
      </div>
    );
  }

  if (data.length > 0) {
    return <Dashboard data={data} onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-blue-600 p-8 text-center">
          <FileSpreadsheet className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">ConcreteLab Analytics</h1>
          <p className="text-blue-100">
            Plataforma de inteligencia de negocios para laboratorios de concreto.
          </p>
        </div>
        
        <div className="p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Cargar Base de Datos</h2>
            <p className="text-slate-500 text-sm">
              Sube el archivo "Base_Datos_Laboratorio_2025.xlsx". <br/>
              <span className="font-semibold text-blue-600">El archivo se guardará automáticamente en este navegador.</span>
            </p>
          </div>

          <div className="flex flex-col items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isLoading ? (
                  <>
                    <Loader2 className="w-10 h-10 mb-3 text-blue-500 animate-spin" />
                    <p className="text-sm text-slate-600">Procesando y guardando datos...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mb-3 text-blue-500" />
                    <p className="mb-2 text-sm text-slate-600">
                      <span className="font-semibold">Clic para subir</span>
                    </p>
                    <p className="text-xs text-slate-500">XLSX, XLS (Todas las hojas serán procesadas)</p>
                  </>
                )}
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".xlsx, .xls" 
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </label>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="mt-6 text-xs text-slate-400 text-center">
            <p>La IA unificará ENE, FEB, MAR... en un modelo estrella interno.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;