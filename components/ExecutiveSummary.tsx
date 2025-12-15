import React, { useMemo } from 'react';
import { ConcreteSample } from '../types';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Cell
} from 'recharts';
import { TrendingUp, CheckCircle2, FlaskConical, Activity } from 'lucide-react';

const getTargetAge = (tipo: string): number => {
  if (!tipo) return 28;
  const match = tipo.match(/(\d+)\s*[dD]/);
  return match ? parseInt(match[1]) : 28;
};

export const ExecutiveSummary: React.FC<{ data: ConcreteSample[] }> = ({ data }) => {
  
  const metrics = useMemo(() => {
    const total = data.length;
    if (total === 0) return { total: 0, compliance: 0, overStrength: 0, avgStrength: 0 };

    // 1. Filter for "Mature" samples (Age >= Target Age defined in Tipo)
    // Only these samples count towards compliance percentages
    const matureSamples = data.filter(d => {
       const target = getTargetAge(d.tipo);
       // Allow slight tolerance? Usually exactly equal or greater.
       return d.edadEnsayo >= target;
    });

    const compliantCount = matureSamples.filter(d => d.fcRoturaKgCm2 >= d.fcDiseno).length;
    
    // Compliance is calculated based on MATURE samples only, not total samples
    const compliance = matureSamples.length > 0 
        ? (compliantCount / matureSamples.length) * 100 
        : 0;

    const totalOverStrength = matureSamples.reduce((acc, curr) => {
      if (curr.fcDiseno > 0) {
        return acc + ((curr.fcRoturaKgCm2 - curr.fcDiseno) / curr.fcDiseno);
      }
      return acc;
    }, 0);

    const avgStrength = data.reduce((acc, curr) => acc + curr.fcRoturaKgCm2, 0) / total;

    return {
      total,
      matureCount: matureSamples.length,
      compliance,
      overStrength: matureSamples.length > 0 ? (totalOverStrength / matureSamples.length) * 100 : 0,
      avgStrength
    };
  }, [data]);

  // Monthly Evolution Data
  const monthlyData = useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
      const key = `${curr.fechaEnsayo.getFullYear()}-${curr.fechaEnsayo.getMonth()}`;
      if (!acc[key]) {
        acc[key] = { 
          name: curr.fechaEnsayo.toLocaleString('es-ES', { month: 'short', year: '2-digit' }), 
          sortDate: curr.fechaEnsayo.getTime(),
          designSum: 0, 
          ruptureSum: 0, 
          count: 0 
        };
      }
      acc[key].designSum += curr.fcDiseno;
      acc[key].ruptureSum += curr.fcRoturaKgCm2;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped)
      .sort((a: any, b: any) => a.sortDate - b.sortDate)
      .map((item: any) => ({
        name: item.name,
        'Prom. Diseño': Math.round(item.designSum / item.count),
        'Prom. Rotura': Math.round(item.ruptureSum / item.count)
      }));
  }, [data]);

  // Compliance by Design (Tipo)
  const designComplianceData = useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
      // Logic: Only count if mature
      const target = getTargetAge(curr.tipo);
      if (curr.edadEnsayo < target) return acc; // Skip immature samples for this metric

      const key = curr.tipo || 'N/A';
      if (!acc[key]) acc[key] = { name: key, total: 0, compliant: 0 };
      acc[key].total += 1;
      if (curr.fcRoturaKgCm2 >= curr.fcDiseno) acc[key].compliant += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped)
      .map((item: any) => ({
        name: item.name,
        compliance: parseFloat(((item.compliant / item.total) * 100).toFixed(1)),
        count: item.total
      }))
      .filter(i => i.count > 0) // Hide designs with no mature samples
      .sort((a: any, b: any) => b.compliance - a.compliance)
      .slice(0, 10); // Top 10 to avoid overcrowding
  }, [data]);

  const COLORS = {
    primary: '#2563eb', 
    success: '#16a34a', 
    warning: '#ca8a04', 
    danger: '#dc2626', 
    slate: '#64748b'
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard 
          title="Total Muestras" 
          value={metrics.total.toLocaleString()} 
          icon={FlaskConical} 
          color="blue"
        />
        <KPICard 
          title="% Cumplimiento (Maduras)" 
          value={`${metrics.compliance.toFixed(1)}%`} 
          icon={CheckCircle2} 
          color={metrics.compliance >= 95 ? "green" : "red"}
          subtext={`Base: ${metrics.matureCount} muestras`}
        />
        <KPICard 
          title="Sobre-resistencia Avg" 
          value={`${metrics.overStrength.toFixed(1)}%`} 
          icon={TrendingUp} 
          color="purple"
        />
        <KPICard 
          title="Prom. Rotura Global" 
          value={metrics.avgStrength.toFixed(0)} 
          icon={Activity} 
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Evolución General: Diseño vs. Rotura</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="Prom. Diseño" stroke={COLORS.slate} strokeDasharray="5 5" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Prom. Rotura" stroke={COLORS.primary} strokeWidth={3} dot={{r: 4, fill: COLORS.primary}} activeDot={{r: 6}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">% Cumplimiento (Top 10 Tipos)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={designComplianceData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="compliance" barSize={15} radius={[0, 4, 4, 0]}>
                  {designComplianceData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.compliance >= 95 ? COLORS.success : entry.compliance >= 85 ? COLORS.warning : COLORS.danger} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

       {/* Matrix Table */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-100">
           <h3 className="text-lg font-bold text-slate-800">Matriz: Cliente vs. Desempeño (Muestras Maduras)</h3>
         </div>
         <div className="overflow-x-auto">
           <ClientPerformanceTable data={data} />
         </div>
       </div>
    </div>
  );
};

const KPICard: React.FC<{ title: string; value: string; icon: any; color: string; subtext?: string }> = ({ title, value, icon: Icon, color, subtext }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colorClasses[color] || 'bg-slate-50'}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

const ClientPerformanceTable: React.FC<{ data: ConcreteSample[] }> = ({ data }) => {
  const clientStats = useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
       // Filter mature only
      const target = getTargetAge(curr.tipo);
      if (curr.edadEnsayo < target) return acc;

      if (!acc[curr.cliente]) {
        acc[curr.cliente] = { count: 0, compliant: 0, sumStrength: 0 };
      }
      acc[curr.cliente].count += 1;
      acc[curr.cliente].sumStrength += curr.fcRoturaKgCm2;
      if (curr.fcRoturaKgCm2 >= curr.fcDiseno) acc[curr.cliente].compliant += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(grouped)
      .map(([name, stats]: [string, any]) => ({
        name,
        count: stats.count,
        compliance: (stats.compliant / stats.count) * 100,
        avg: stats.sumStrength / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }, [data]);

  return (
    <table className="w-full text-sm text-left text-slate-600">
      <thead className="text-xs text-slate-700 uppercase bg-slate-50">
        <tr>
          <th className="px-6 py-3">Cliente</th>
          <th className="px-6 py-3 text-right">Muestras (Maduras)</th>
          <th className="px-6 py-3 text-right">% Cumplimiento</th>
          <th className="px-6 py-3 text-right">Prom. Rotura</th>
          <th className="px-6 py-3 text-center">Estado</th>
        </tr>
      </thead>
      <tbody>
        {clientStats.map((client) => (
          <tr key={client.name} className="bg-white border-b hover:bg-slate-50">
            <td className="px-6 py-4 font-medium text-slate-900">{client.name}</td>
            <td className="px-6 py-4 text-right">{client.count}</td>
            <td className="px-6 py-4 text-right">{client.compliance.toFixed(1)}%</td>
            <td className="px-6 py-4 text-right">{client.avg.toFixed(0)}</td>
            <td className="px-6 py-4 text-center">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                client.compliance >= 90 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {client.compliance >= 90 ? 'Excelente' : 'Revisar'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};