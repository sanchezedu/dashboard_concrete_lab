import React, { useState, useMemo } from 'react';
import { ConcreteSample, FilterState, Page } from '../types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ExecutiveSummary } from './ExecutiveSummary';
import { DesignAnalysis } from './DesignAnalysis';
import { QualityControl } from './QualityControl';

interface DashboardProps {
  data: ConcreteSample[];
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onReset }) => {
  const [activePage, setActivePage] = useState<Page>(Page.EXECUTIVE);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: [null, null],
    cliente: 'All',
    diseno: 'All',
    elemento: 'All'
  });

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const clients = Array.from(new Set(data.map(d => d.cliente))).sort();
    // Sort designs by the numeric part first for cleaner list, then alpha
    const designs = Array.from(new Set(data.map(d => d.tipo || 'Sin Especificar'))).sort((a: string, b: string) => {
      const getNum = (str: string) => parseInt(str.match(/\d+/)?.[0] || '0');
      const numA = getNum(a);
      const numB = getNum(b);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
    const elements = Array.from(new Set(data.map(d => d.elemento))).sort();
    return { clients, designs, elements };
  }, [data]);

  // Global Filter Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Date Range Filter
      if (filters.dateRange[0] && item.fechaEnsayo < filters.dateRange[0]) return false;
      if (filters.dateRange[1] && item.fechaEnsayo > filters.dateRange[1]) return false;
      
      // Categorical Filters
      if (filters.cliente !== 'All' && item.cliente !== filters.cliente) return false;
      // Filter by 'tipo' string now
      if (filters.diseno !== 'All' && (item.tipo || 'Sin Especificar') !== filters.diseno) return false;
      if (filters.elemento !== 'All' && item.elemento !== filters.elemento) return false;

      return true;
    });
  }, [data, filters]);

  const renderContent = () => {
    switch (activePage) {
      case Page.EXECUTIVE:
        return <ExecutiveSummary data={filteredData} />;
      case Page.DESIGN:
        return <DesignAnalysis data={filteredData} fullData={data} />;
      case Page.QUALITY:
        return <QualityControl data={filteredData} />;
      default:
        return <ExecutiveSummary data={filteredData} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        onReset={onReset} 
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          title={activePage} 
          filterOptions={filterOptions} 
          filters={filters} 
          onFilterChange={setFilters} 
          count={filteredData.length}
        />
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};