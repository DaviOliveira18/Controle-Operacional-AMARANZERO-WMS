import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  UploadCloud, LayoutDashboard, List, Settings, 
  Menu, RefreshCw, Trash2
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import DataLists from './components/DataLists';
import FilterBar from './components/FilterBar';
import DrillDownModal from './components/DrillDownModal';
import OperatorRankingModal from './components/OperatorRankingModal';
import { SolarChat } from './components/SolarChat';
import { DashboardData, PickingTask, CheckingOrder, FilterState, ModalState, PickingStatus, CheckingStatus } from './types';
import { parseFile, generateMockData } from './services/parser';

const App: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    picking: [],
    checking: [],
    lastUpdated: new Date()
  });
  
  const [filters, setFilters] = useState<FilterState>({
    period: 'Hoje',
    startDate: '',
    endDate: '',
    selectedUser: 'All',
    selectedWave: 'All',
    searchTerm: '',
    status: 'All',
    priority: 'All'
  });

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
    statusFilter: null,
    title: ''
  });

  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);

  const [activeView, setActiveView] = useState<'dashboard' | 'lists'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- Persistence & Initialization Logic ---
  useEffect(() => {
    const loadData = () => {
      try {
        const savedData = localStorage.getItem('inovatech-wms-data');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          
          if (parsed && Array.isArray(parsed.picking) && Array.isArray(parsed.checking)) {
            // Revive Dates (JSON stores them as strings)
            const picking = parsed.picking.map((t: any) => ({
              ...t,
              date: t.date ? new Date(t.date) : new Date()
            })).filter((t: any) => !isNaN(t.date.getTime()));

            const checking = parsed.checking.map((c: any) => ({
              ...c,
              date: c.date ? new Date(c.date) : new Date()
            })).filter((c: any) => !isNaN(c.date.getTime()));

            const lastUpdated = parsed.lastUpdated ? new Date(parsed.lastUpdated) : new Date();

            setData({ picking, checking, lastUpdated });
          } else {
            const mocks = generateMockData();
            setData({ ...mocks, lastUpdated: new Date() });
          }
        } else {
          // If no data, load Mock Data for the Website experience
          const mocks = generateMockData();
          setData({ ...mocks, lastUpdated: new Date() });
        }
      } catch (e) {
        console.error("Error loading data", e);
        // Fallback to mock
        const mocks = generateMockData();
        setData({ ...mocks, lastUpdated: new Date() });
      } finally {
        setIsInitialized(true);
      }
    };

    loadData();
  }, []);

  // Save to LocalStorage whenever data changes
  useEffect(() => {
    if (isInitialized && data.picking.length > 0) {
      localStorage.setItem('inovatech-wms-data', JSON.stringify(data));
    }
  }, [data, isInitialized]);

  const handleResetData = () => {
    if (window.confirm("Deseja limpar todos os dados importados e restaurar os dados de demonstração?")) {
      localStorage.removeItem('inovatech-wms-data');
      const mocks = generateMockData();
      setData({ ...mocks, lastUpdated: new Date() });
      window.location.reload(); // Ensure clean state
    }
  };


  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const checkDate = (d: Date) => {
      const itemDate = new Date(d);
      itemDate.setHours(0, 0, 0, 0);

      if (filters.period === 'Hoje') {
        return itemDate.getTime() === today.getTime();
      }
      if (filters.period === 'Ontem') {
        return itemDate.getTime() === yesterday.getTime();
      }
      if (filters.period === '7 Dias') {
        return itemDate.getTime() >= sevenDaysAgo.getTime();
      }
      
      const start = filters.startDate ? new Date(filters.startDate) : null;
      const end = filters.endDate ? new Date(filters.endDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      if (!start && !end) return true;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    };

    const checkUser = (user: string) => {
      if (filters.selectedUser === 'All') return true;
      return user === filters.selectedUser;
    };

    const checkWave = (wave: string) => {
      if (filters.selectedWave === 'All') return true;
      return wave === filters.selectedWave;
    };

    const checkStatus = (item: PickingTask | CheckingOrder) => {
      if (filters.status === 'All') return true;
      const s = item.mappedStatus;
      
      if (filters.status === 'Pending') 
        return s === PickingStatus.WAITING || s === CheckingStatus.WAITING;
      
      if (filters.status === 'InProgress') 
        return s === PickingStatus.IN_PROGRESS || s === CheckingStatus.IN_PROGRESS;
      
      if (filters.status === 'Completed') 
        return s === PickingStatus.COMPLETED || s === CheckingStatus.COMPLETED;
      
      if (filters.status === 'Issue') 
        return s === PickingStatus.CANCELLED || s === CheckingStatus.DIVERGENT;
        
      return true;
    };

    const checkPriority = (item: PickingTask | CheckingOrder) => {
      if (filters.priority === 'All') return true;
      
      if ('priority' in item) {
        return (item as PickingTask).priority === filters.priority;
      }
      return false; 
    };

    const checkSearch = (item: PickingTask | CheckingOrder) => {
        if (!filters.searchTerm) return true;
        const term = filters.searchTerm.toLowerCase();
        
        // Common fields
        if (item.id && item.id.toLowerCase().includes(term)) return true;
        if (item.user && item.user.toLowerCase().includes(term)) return true;
        
        // Picking specific
        if ('productCode' in item) {
            const p = item as PickingTask;
            if (p.productCode && p.productCode.toLowerCase().includes(term)) return true;
            if (p.productDesc && p.productDesc.toLowerCase().includes(term)) return true;
            if (p.originAddress && p.originAddress.toLowerCase().includes(term)) return true;
        }

        // Checking specific
        if ('clientDesc' in item) {
            const c = item as CheckingOrder;
            if (c.clientDesc && c.clientDesc.toLowerCase().includes(term)) return true;
            if (c.clientCode && c.clientCode.toLowerCase().includes(term)) return true;
        }

        return false;
    };

    return {
      picking: data.picking.filter(t => checkDate(t.date) && checkUser(t.user) && checkWave(t.wave) && checkStatus(t) && checkPriority(t) && checkSearch(t)),
      checking: data.checking.filter(c => checkDate(c.date) && checkUser(c.user) && checkWave(c.wave) && checkStatus(c) && checkPriority(c) && checkSearch(c)),
      lastUpdated: data.lastUpdated
    };
  }, [data, filters]);

  const uniqueUsers = useMemo(() => {
    const users = new Set<string>();
    data.picking.forEach(p => users.add(p.user));
    data.checking.forEach(c => users.add(c.user));
    return Array.from(users).filter(u => u && u !== 'Desconhecido');
  }, [data]);

  const uniqueWaves = useMemo(() => {
    const waves = new Set<string>();
    data.picking.forEach(p => p.wave && waves.add(p.wave));
    data.checking.forEach(c => c.wave && waves.add(c.wave));
    return Array.from(waves).sort();
  }, [data]);

  // --- Handlers ---

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLoading(true);

    const newPickingMap = new Map<string, PickingTask>(data.picking.map(p => [p.id, p]));
    const newCheckingMap = new Map<string, CheckingOrder>(data.checking.map(c => [c.id, c]));

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await parseFile(files[i]);
        if (result.type === 'picking') {
          (result.data as PickingTask[]).forEach(task => newPickingMap.set(task.id, task));
        } else if (result.type === 'checking') {
          (result.data as CheckingOrder[]).forEach(order => newCheckingMap.set(order.id, order));
        }
      } catch (err) {
        console.error("Failed to parse file", files[i].name, err);
        alert(`Erro ao ler o arquivo ${files[i].name}. Verifique se o formato está correto (Excel/CSV).`);
      }
    }



    setData({
      picking: Array.from(newPickingMap.values()).map(task => {
        if (!task.wave || task.wave === '-' || task.wave === '') {
          const matchingChecking = newCheckingMap.get(task.document);
          if (matchingChecking && matchingChecking.wave) {
            return { ...task, wave: matchingChecking.wave };
          }
        }
        return task;
      }),
      checking: Array.from(newCheckingMap.values()),
      lastUpdated: new Date()
    });
    setLoading(false);
  }, [data]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleCardClick = (type: 'picking' | 'checking', status: PickingStatus | CheckingStatus) => {
    setModalState({
      isOpen: true,
      type,
      statusFilter: status,
      title: `Detalhes: ${status}`
    });
  };

  if (!isInitialized) return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-indigo-600">Carregando portal...</div>;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-center h-16 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-amara-green rounded-lg flex items-center justify-center shadow-lg shadow-amara-green/30">
              <span className="font-bold text-lg text-white">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Amaranzero</span>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button 
            onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-amara-green text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </button>
          <button 
             onClick={() => { setActiveView('lists'); setIsSidebarOpen(false); }}
             className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${activeView === 'lists' ? 'bg-amara-green text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <List className="w-5 h-5 mr-3" />
            Relatórios
          </button>
          
          <div className="pt-4 mt-4 border-t border-slate-800">
            <button 
              onClick={handleResetData}
              className="flex items-center w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-5 h-5 mr-3" />
              Resetar Dados
            </button>
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center text-slate-500 text-xs">
            <Settings className="w-3 h-3 mr-2" />
            <span>Controle Operacional v3.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
              Controle Operacional Avançado
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-amara-lime/20 text-amara-dark font-bold border border-amara-lime/30">
              LIVE
            </span>
          </div>

          <div className="flex items-center space-x-4">
             <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400">Última sincronização</p>
                <p className="text-sm font-medium text-gray-700">
                  {data.lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
             </div>
             <button 
               onClick={() => {
                 setLoading(true);
                 setTimeout(() => {
                   setData(prev => ({...prev, lastUpdated: new Date()})); 
                   setLoading(false);
                 }, 600);
               }}
               className="p-2 text-gray-500 hover:text-amara-green transition-colors bg-gray-50 hover:bg-amara-lime/10 rounded-full"
               title="Sincronizar Agora"
             >
               <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </header>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 bg-slate-50/50">
          
          {/* Upload Drop Zone - Conditionally smaller if data exists to look more like a site header */}
          <div 
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={() => setIsDragOver(false)}
            className={`
              mb-6 border-2 border-dashed rounded-xl transition-all duration-200 text-center
              flex flex-col items-center justify-center cursor-pointer relative group
              ${data.picking.length > 0 ? 'p-4 border-gray-200 bg-white/50 hover:border-indigo-300' : 'p-10 border-indigo-300 bg-indigo-50/30'}
              ${isDragOver ? 'border-indigo-500 bg-indigo-50' : ''}
            `}
          >
            <input 
              type="file" 
              multiple 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <div className={`flex items-center ${data.picking.length > 0 ? 'space-x-3' : 'flex-col space-y-2'}`}>
              <div className={`rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center ${data.picking.length > 0 ? 'p-2' : 'p-4 mb-2'}`}>
                <UploadCloud className={`${data.picking.length > 0 ? 'w-5 h-5' : 'w-8 h-8'}`} />
              </div>
              <div className={`${data.picking.length > 0 ? 'text-left' : 'text-center'}`}>
                <h3 className={`font-medium text-gray-900 ${data.picking.length > 0 ? 'text-sm' : 'text-lg'}`}>
                  {data.picking.length > 0 ? 'Importar Novos Arquivos' : 'Carregar Relatórios Operacionais'}
                </h3>
                <p className="text-xs text-gray-500">
                  {data.picking.length > 0 ? 'Arraste para atualizar os dados' : 'Arraste arquivos Excel/CSV para começar a análise'}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <FilterBar 
            filters={filters} 
            setFilters={setFilters} 
            availableUsers={uniqueUsers} 
            availableWaves={uniqueWaves}
            onOpenRanking={() => setIsRankingModalOpen(true)}
          />

          {/* Dynamic View */}
          {activeView === 'dashboard' ? (
            <Dashboard 
              data={filteredData} 
              onCardClick={handleCardClick}
            />
          ) : (
            <DataLists 
              pickingTasks={filteredData.picking} 
              checkingOrders={filteredData.checking} 
            />
          )}

        </div>
      </main>

      {/* Drill Down Modal (Tasks) */}
      <DrillDownModal 
        state={modalState} 
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        pickingData={filteredData.picking}
        checkingData={filteredData.checking}
      />

      {/* Ranking Modal (Productivity) */}
      <OperatorRankingModal 
        isOpen={isRankingModalOpen}
        onClose={() => setIsRankingModalOpen(false)}
        tasks={filteredData.picking}
      />

      {/* AI Assistant */}
      <SolarChat data={filteredData} />

      {/* Watermark */}
      <div className="fixed bottom-4 left-4 z-0 pointer-events-none opacity-10 select-none">
        <p className="text-xs font-bold tracking-widest text-slate-900 uppercase">
          DEV DAVI OLIVEIRA DOS SANTOS
        </p>
      </div>
    </div>
  );
};

export default App;