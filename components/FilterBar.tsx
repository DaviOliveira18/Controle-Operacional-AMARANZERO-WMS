import React from 'react';
import { Filter, Calendar, User, X, Search, BarChart2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableUsers: string[];
  availableWaves: string[];
  onOpenRanking: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, availableUsers, availableWaves, onOpenRanking }) => {
  
  const handleChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    
    if (days === 0) {
      // Today
      const dateStr = end.toISOString().split('T')[0];
      setFilters(prev => ({ ...prev, startDate: dateStr, endDate: dateStr }));
    } else if (days === 1) {
      // Yesterday
      start.setDate(start.getDate() - 1);
      const startStr = start.toISOString().split('T')[0];
      const endStr = startStr;
      setFilters(prev => ({ ...prev, startDate: startStr, endDate: endStr }));
    } else {
      // Last N days
      start.setDate(start.getDate() - days);
      setFilters(prev => ({ 
        ...prev, 
        startDate: start.toISOString().split('T')[0], 
        endDate: end.toISOString().split('T')[0] 
      }));
    }
  };

  const clearFilters = () => {
    setFilters({ period: 'Hoje', startDate: '', endDate: '', selectedUser: 'All', selectedWave: 'All', searchTerm: '', status: 'All', priority: 'All' });
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.selectedUser !== 'All' || filters.selectedWave !== 'All' || filters.searchTerm || filters.status !== 'All' || filters.priority !== 'All' || filters.period !== 'Hoje';

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
      
      {/* Top Row: Title + Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
          <Filter className="w-5 h-5 text-amara-green" />
          <span>Filtros Operacionais</span>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Wave Selector (Quick Filter) */}
          <div className="flex items-center gap-2 mr-4 border-r pr-4 border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Onda:</span>
            <select 
              value={filters.selectedWave}
              onChange={(e) => handleChange('selectedWave', e.target.value)}
              className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-amara-green cursor-pointer"
            >
              <option value="All">Todas</option>
              {availableWaves.map(wave => (
                <option key={wave} value={wave}>{wave}</option>
              ))}
            </select>
          </div>

          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1 hidden md:block">Período:</span>
          <button 
            onClick={() => handleChange('period', 'Hoje')} 
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${filters.period === 'Hoje' ? 'bg-amara-green text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-amara-lime/10 hover:text-amara-dark'}`}
          >
            Hoje
          </button>
          <button 
            onClick={() => handleChange('period', 'Ontem')} 
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${filters.period === 'Ontem' ? 'bg-amara-green text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-amara-lime/10 hover:text-amara-dark'}`}
          >
            Ontem
          </button>
          <button 
            onClick={() => handleChange('period', '7 Dias')} 
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${filters.period === '7 Dias' ? 'bg-amara-green text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-amara-lime/10 hover:text-amara-dark'}`}
          >
            7 Dias
          </button>
          <button 
            onClick={() => handleChange('period', 'All')} 
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${filters.period === 'All' ? 'bg-amara-green text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-amara-lime/10 hover:text-amara-dark'}`}
          >
            Personalizado
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-100 w-full" />

      {/* Bottom Row: Detailed Filters */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-end xl:items-center">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 w-full xl:w-auto flex-1">
          
          {/* Search Input */}
          <div className="relative group w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-amara-green transition-colors" />
            <input 
              type="text" 
              placeholder="Busca (SKU, Tarefa, Documento)" 
              value={filters.searchTerm}
              onChange={(e) => handleChange('searchTerm', e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amara-green focus:bg-white transition-all"
            />
          </div>

          {/* Date Range Inputs (Only visible if period is 'All') */}
          <div className={`flex items-center gap-1 bg-gray-50 p-1.5 rounded-lg border border-gray-200 w-full transition-opacity ${filters.period !== 'All' ? 'opacity-50 pointer-events-none' : ''}`}>
            <Calendar className="w-4 h-4 text-gray-400 ml-1" />
            <input 
              type="date" 
              value={filters.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="bg-transparent text-xs sm:text-sm focus:outline-none text-gray-600 w-full px-1 min-w-0"
            />
            <span className="text-gray-300">|</span>
            <input 
              type="date" 
              value={filters.endDate}
              min={filters.startDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="bg-transparent text-xs sm:text-sm focus:outline-none text-gray-600 w-full px-1 min-w-0"
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full">
            <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <select 
              value={filters.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amara-green cursor-pointer appearance-none text-gray-700"
            >
              <option value="All">Status: Todos</option>
              <option value="Pending">Pendentes / Aguardando</option>
              <option value="InProgress">Em Andamento</option>
              <option value="Completed">Concluídos</option>
              <option value="Issue">Com Problema / Canc.</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="relative w-full">
            <AlertCircle className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <select 
              value={filters.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amara-green cursor-pointer appearance-none text-gray-700"
            >
              <option value="All">Prioridade: Todas</option>
              <option value="Alta">Alta Prioridade</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          {/* User Selector */}
          <div className="relative w-full">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <select 
              value={filters.selectedUser}
              onChange={(e) => handleChange('selectedUser', e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amara-green cursor-pointer appearance-none text-gray-700"
            >
              <option value="All">Operador: Todos</option>
              {availableUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto justify-end mt-2 xl:mt-0">
           {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
           )}

           <button 
              onClick={onOpenRanking}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-amara-green hover:bg-amara-dark text-white text-sm font-medium rounded-lg shadow-sm shadow-amara-green/20 transition-all active:scale-95 whitespace-nowrap"
           >
             <BarChart2 className="w-4 h-4" />
             Ranking Produtividade
           </button>
        </div>

      </div>
    </div>
  );
};

export default FilterBar;