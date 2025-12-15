import React, { useMemo } from 'react';
import { ConcreteSample } from '../types';
import { 
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Area
} from 'recharts';
import { AlertOctagon } from 'lucide-react';

export const QualityControl: React.FC<{ data: ConcreteSample[] }> = ({ data }) => {
  // Only use samples with 28 days for standard quality control, or analyze all but mark standard
  // For this view, we sort by date
  const sortedData = useMemo(() => {
    return [...data].sort((a,b) => a.fechaEnsayo.getTime() - b.fechaEnsayo.getTime());
  }, [data]);

  const statistics = useMemo(() => {
    if (sortedData.length < 2) return null;
    
    const values = sortedData.map(d => d.fcRoturaKgCm2);
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  }, [sortedData]);

  const chartData = useMemo(() => {
    if (!statistics) return [];
    return sortedData.map((d, i) => ({
      index: i + 1,
      date: d.fechaEnsayo.toLocaleDateString(),
      value: d.fcRoturaKgCm2,
      design: d.fcDiseno,
      sample: d
    }));
  }, [sortedData, statistics]);

  const nonConformities = useMemo(() => {
    return sortedData.filter(d => d.fcRoturaKgCm2 < d.fcDiseno);
  }, [sortedData]);

  if (!statistics) return <div className="p-10 text-center text-slate-500">Datos insuficientes para realizar control estadístico. Seleccione filtros más amplios.</div>;

  const upperControlLimit = statistics.mean + (3 * statistics.stdDev);
  const lowerControlLimit = Math.max(0, statistics.mean - (3 * statistics.stdDev));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">Gráfico de Control (Todas las muestras filtradas)</h3>
          <div className="flex gap-4 text-xs text-slate-500">
             <span><span className="font-bold text-blue-600">μ (Promedio):</span> {statistics.mean.toFixed(1)}</span>
             <span><span className="font-bold text-slate-600">σ (Desv. Std):</span> {statistics.stdDev.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={false} label={{ value: 'Tiempo (Secuencia)', position: 'insideBottom', offset: -5 }} />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs">
                        <p className="font-bold mb-1">{d.date}</p>
                        <p className="text-blue-600 font-semibold">Rotura: {d.value} Kg/cm²</p>
                        <p className="text-slate-500">Diseño: {d.design} Kg/cm²</p>
                        <p className="text-slate-400 mt-1">Guía: {d.sample.guiaNo}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Mean Line */}
              <ReferenceLine y={statistics.mean} stroke="#2563eb" strokeDasharray="5 5" label="μ" />
              {/* Design Line (if only one design is selected this makes sense, otherwise it's noisy. We'll try to calculate average design if multiple) */}
              
              {/* Control Limits */}
              <ReferenceLine y={upperControlLimit} stroke="#94a3b8" strokeDasharray="3 3" label="+3σ" />
              <ReferenceLine y={lowerControlLimit} stroke="#94a3b8" strokeDasharray="3 3" label="-3σ" />

              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#0f172a" 
                strokeWidth={1.5} 
                dot={{ r: 2 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-slate-400 text-center">
            Las bandas grises representan ±3 desviaciones estándar de la media.
        </div>
      </div>

      {/* Non Conformity Report */}
      <div className="bg-red-50 rounded-xl border border-red-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-red-100 flex items-center gap-3">
           <div className="p-2 bg-red-100 rounded-full text-red-600">
             <AlertOctagon className="w-5 h-5" />
           </div>
           <div>
             <h3 className="text-lg font-bold text-red-900">Reporte de No Conformidades</h3>
             <p className="text-sm text-red-700">Muestras que no alcanzaron la resistencia de diseño ({nonConformities.length} casos detectados)</p>
           </div>
        </div>
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm text-left text-red-900">
            <thead className="text-xs text-red-800 uppercase bg-red-100 sticky top-0">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Guía</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Edad</th>
                <th className="px-6 py-3 text-right">f'c Diseño</th>
                <th className="px-6 py-3 text-right">f'c Rotura</th>
                <th className="px-6 py-3 text-right">Déficit</th>
              </tr>
            </thead>
            <tbody>
              {nonConformities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-green-600 bg-white">
                    ¡Excelente! No hay no conformidades en la selección actual.
                  </td>
                </tr>
              ) : (
                nonConformities.map((row) => {
                  const deficit = row.fcDiseno - row.fcRoturaKgCm2;
                  const deficitPct = (deficit / row.fcDiseno) * 100;
                  return (
                    <tr key={row.id} className="bg-white border-b border-red-100 hover:bg-red-50">
                      <td className="px-6 py-4">{row.fechaEnsayo.toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-mono text-xs">{row.guiaNo}</td>
                      <td className="px-6 py-4">{row.cliente}</td>
                      <td className="px-6 py-4">{row.edadEnsayo} días</td>
                      <td className="px-6 py-4 text-right font-medium">{row.fcDiseno}</td>
                      <td className="px-6 py-4 text-right font-bold text-red-600">{row.fcRoturaKgCm2}</td>
                      <td className="px-6 py-4 text-right text-red-600">
                        -{deficitPct.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};