import React from 'react';
import { FilterState } from '../types';
import { Filter, Calendar } from 'lucide-react';

interface HeaderProps {
  title: string;
  filterOptions: {
    clients: string[];
    designs: string[];
    elements: string[];
  };
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  count: number;
}

export const Header: React.FC<HeaderProps> = ({ title, filterOptions, filters, onFilterChange, count }) => {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 sticky top-0 z-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500">Mostrando {count} muestras analizadas</p>
        </div>
      </div>
      
      {/* Global Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 text-slate-500 mr-2">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Filtros</span>
        </div>

        {/* Client Filter */}
        <select 
          className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none max-w-[200px]"
          value={filters.cliente}
          onChange={(e) => onFilterChange({...filters, cliente: e.target.value})}
        >
          <option value="All">Todos los Clientes</option>
          {filterOptions.clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Design Filter (Now matches Tipo column exactly) */}
        <select 
          className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none max-w-[250px]"
          value={filters.diseno}
          onChange={(e) => onFilterChange({...filters, diseno: e.target.value})}
        >
          <option value="All">Todos los Diseños (Tipos)</option>
          {filterOptions.designs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

         {/* Element Filter */}
         <select 
          className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none max-w-[200px]"
          value={filters.elemento}
          onChange={(e) => onFilterChange({...filters, elemento: e.target.value})}
        >
          <option value="All">Todos los Elementos</option>
          {filterOptions.elements.map(e => <option key={e} value={e}>{e}</option>)}
        </select>

        {/* Date Placeholder */}
        <div className="ml-auto flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-400 text-sm cursor-not-allowed hidden md:flex" title="Filtro de fecha no implementado en demo">
          <Calendar className="w-4 h-4" />
          <span>Rango de Fechas</span>
        </div>
      </div>
    </header>
  );
};