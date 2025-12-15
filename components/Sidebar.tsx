import React from 'react';
import { Page } from '../types';
import { LayoutDashboard, Microscope, ShieldCheck, LogOut, Activity } from 'lucide-react';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onReset: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onReset }) => {
  const menuItems = [
    { id: Page.EXECUTIVE, icon: LayoutDashboard, label: 'Resumen Ejecutivo' },
    { id: Page.DESIGN, icon: Microscope, label: 'Análisis por Diseño' },
    { id: Page.QUALITY, icon: ShieldCheck, label: 'Control de Calidad' },
  ];

  const handleResetClick = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar el archivo?\n\nEsto eliminará los datos guardados de este navegador y tendrás que volver a cargar el archivo Excel.')) {
      onReset();
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-2xl z-10 hidden md:flex">
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <div className="p-2 bg-blue-600 rounded-lg">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">ConcreteLab</h1>
          <p className="text-xs text-slate-400">Analytics Pro</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleResetClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 rounded-lg text-slate-400 text-sm hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 transition-colors"
          title="Eliminar datos guardados y cargar nuevo archivo"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Archivo
        </button>
      </div>
    </aside>
  );
};