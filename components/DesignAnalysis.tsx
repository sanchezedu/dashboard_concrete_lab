import React, { useState, useMemo } from 'react';
import { ConcreteSample } from '../types';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie, Legend 
} from 'recharts';

interface DesignAnalysisProps {
  data: ConcreteSample[];
  fullData: ConcreteSample[];
}

// Helper to extract target days from string like "280-Y13 7D"
const getTargetAge = (tipo: string): number => {
  if (!tipo) return 28;
  const match = tipo.match(/(\d+)\s*[dD]/); // Looks for "7D", "7 D", "7d"
  if (match) {
    return parseInt(match[1]);
  }
  return 28;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export const DesignAnalysis: React.FC<DesignAnalysisProps> = ({ data, fullData }) => {
  const [selectedDesign, setSelectedDesign] = useState<string>('');

  // 1. Get unique designs based on "Tipo"
  const designs = useMemo(() => {
    const unique = Array.from(new Set(fullData.map(d => d.tipo || 'Sin Especificar')));
    return unique.sort((a: string, b: string) => {
       const getNum = (str: string) => parseInt(str.match(/\d+/)?.[0] || '0');
       return getNum(a) - getNum(b);
    });
  }, [fullData]);

  if (!selectedDesign && designs.length > 0) {
    setSelectedDesign(designs[0]);
  }

  // 2. Filter data for the selected Tipo
  const designData = useMemo(() => {
    return data.filter(d => (d.tipo || 'Sin Especificar') === selectedDesign);
  }, [data, selectedDesign]);

  // 3. Determine Target Age and Strength
  const targetAge = getTargetAge(selectedDesign);
  const targetStrength = designData.length > 0 ? designData[0].fcDiseno : 0;

  // 4. Calculate Stats specific to Target Age
  const targetAgeSamples = useMemo(() => {
    return designData.filter(d => d.edadEnsayo === targetAge);
  }, [designData, targetAge]);

  const stats = useMemo(() => {
    if (targetAgeSamples.length === 0) return { avg: 0, compliance: 0, count: 0 };
    const avg = targetAgeSamples.reduce((a,b) => a + b.fcRoturaKgCm2, 0) / targetAgeSamples.length;
    const compliantCount = targetAgeSamples.filter(d => d.fcRoturaKgCm2 >= targetStrength).length;
    return {
      avg,
      compliance: (compliantCount / targetAgeSamples.length) * 100,
      count: targetAgeSamples.length
    };
  }, [targetAgeSamples, targetStrength]);

  // 5. Element Distribution
  const elementStats = useMemo(() => {
    const counts: Record<string, number> = {};
    designData.forEach(d => {
      const el = d.elemento || 'Otros';
      counts[el] = (counts[el] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value); // Descending
  }, [designData]);

  // 6. Evolution Data (Group by Age)
  const evolutionData = useMemo(() => {
    const buckets: Record<number, number[]> = {};
    
    designData.forEach(d => {
      const age = d.edadEnsayo;
      if (!buckets[age]) buckets[age] = [];
      buckets[age].push(d.fcRoturaKgCm2);
    });

    return Object.keys(buckets)
      .map(ageStr => {
        const age = parseInt(ageStr);
        const vals = buckets[age];
        const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
        return { 
          age, 
          name: `${age} Días`, 
          avgStrength: Math.round(avg),
          count: vals.length,
          isTarget: age === targetAge
        };
      })
      .sort((a, b) => a.age - b.age);
  }, [designData, targetAge]);

  // Scatter plot data
  const scatterData = useMemo(() => {
    return designData.map(d => ({
      x: d.fechaEnsayo.getTime(),
      y: d.fcRoturaKgCm2,
      age: d.edadEnsayo,
      fullDate: d.fechaEnsayo.toLocaleDateString(),
      sampleId: d.guiaNo
    }));
  }, [designData]);

  return (
    <div className="space-y-6">
      {/* Design Selector Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <label className="block text-sm font-medium text-slate-700 mb-2">Seleccionar Diseño (Tipo):</label>
        <select 
          className="w-full md:w-auto min-w-[300px] bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
          value={selectedDesign}
          onChange={(e) => setSelectedDesign(e.target.value)}
        >
          {designs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="mt-2 text-xs text-slate-500 flex gap-4">
           <span>Edad Objetivo: <span className="font-bold">{targetAge} días</span></span>
           <span>Resistencia Diseño: <span className="font-bold">{targetStrength} Kg/cm²</span></span>
           <span>Total Muestras: <span className="font-bold">{designData.length}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* KPI Column */}
        <div className="md:col-span-1 space-y-4">
           <div className={`p-6 rounded-xl border border-slate-200 shadow-sm ${stats.compliance >= 90 ? 'bg-green-50' : 'bg-white'}`}>
              <h4 className="text-sm font-medium text-slate-500">Cumplimiento ({targetAge} Días)</h4>
              <p className={`text-3xl font-bold ${stats.compliance >= 95 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.compliance.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Base: {stats.count} muestras maduras</p>
           </div>
           
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-sm font-medium text-slate-500">Promedio ({targetAge} Días)</h4>
              <p className="text-3xl font-bold text-blue-600">{stats.avg.toFixed(0)} <span className="text-sm text-slate-400">Kg/cm²</span></p>
              <p className="text-xs text-slate-400 mt-1">
                vs Diseño: {targetStrength}
              </p>
           </div>
        </div>

        {/* Elements Pie Chart */}
        <div className="md:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
           <h3 className="text-sm font-bold text-slate-800 mb-2">Elementos Fundidos</h3>
           <div className="flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={elementStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {elementStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{fontSize: '12px'}} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '10px'}}/>
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Evolution Chart */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Evolución de Resistencia por Edad</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolutionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border border-slate-200 shadow-lg rounded text-xs">
                          <p className="font-bold">{d.name}</p>
                          <p>Promedio: {d.avgStrength} Kg/cm²</p>
                          <p>Muestras: {d.count}</p>
                          {d.isTarget && <p className="text-blue-600 font-bold mt-1">★ Edad Objetivo</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={targetStrength} label="Diseño" stroke="red" strokeDasharray="3 3" />
                <Bar dataKey="avgStrength" name="Promedio" radius={[4, 4, 0, 0]}>
                   {evolutionData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.isTarget ? '#2563eb' : '#94a3b8'} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table (Expanded) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
           <h3 className="text-lg font-bold text-slate-800">Detalle Completo de Muestras</h3>
           <span className="text-xs text-slate-500 italic">Mostrando hasta 200 registros recientes</span>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 min-w-[100px]">Fecha</th>
                <th className="px-6 py-3 min-w-[100px]">Guía</th>
                <th className="px-6 py-3 min-w-[120px]">Elemento</th>
                <th className="px-6 py-3 min-w-[80px]">Camión</th>
                <th className="px-6 py-3 text-center">Edad</th>
                <th className="px-6 py-3 text-right">f'c Diseño</th>
                <th className="px-6 py-3 text-right">f'c Rotura</th>
                <th className="px-6 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {designData
                .sort((a,b) => b.fechaEnsayo.getTime() - a.fechaEnsayo.getTime())
                .slice(0, 200)
                .map((row) => {
                  const isMature = row.edadEnsayo >= targetAge;
                  const passed = row.fcRoturaKgCm2 >= row.fcDiseno;
                  const pct = (row.fcRoturaKgCm2 / row.fcDiseno) * 100;
                  
                  return (
                    <tr key={row.id} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">{row.fechaEnsayo.toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-mono text-xs">{row.guiaNo}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{row.elemento}</td>
                      <td className="px-6 py-4 font-mono text-xs">{row.camionCodigo || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${row.edadEnsayo === targetAge ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-slate-100 text-slate-600'}`}>
                           {row.edadEnsayo}d
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">{row.fcDiseno}</td>
                      <td className={`px-6 py-4 text-right font-medium ${row.fcRoturaKgCm2 < row.fcDiseno ? 'text-red-600' : 'text-slate-900'}`}>
                        {row.fcRoturaKgCm2}
                        <div className="text-[10px] text-slate-400">{pct.toFixed(0)}%</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!isMature ? (
                          <span className="text-slate-400 text-xs italic">Progreso</span>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {passed ? 'OK' : 'FALLO'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};