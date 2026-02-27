import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { 
  ClipboardList, CheckCircle2, AlertOctagon, 
  Package, TrendingUp, Activity, Boxes, Search
} from 'lucide-react';
import { DashboardData, PickingStatus, CheckingStatus } from '../types';
import StatCard from './StatCard';
import { STATUS_COLORS } from '../constants';

interface DashboardProps {
  data: DashboardData;
  onCardClick: (type: 'picking' | 'checking', status: PickingStatus | CheckingStatus) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white p-4 rounded-lg shadow-xl border border-slate-700 text-sm">
        <p className="font-bold text-base mb-2 border-b border-slate-600 pb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((p: any, i: number) => (
            <p key={i} className="flex justify-between gap-4">
              <span style={{ color: p.color }}>{p.name}:</span>
              <span className="font-mono font-bold">{p.value}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ data, onCardClick }) => {
  
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isToday = (d: any) => {
      if (!d || !(d instanceof Date) || isNaN(d.getTime())) return false;
      const itemDate = new Date(d);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === today.getTime();
    };

    // Blend Logic: Join Picking with Checking (Doc Saída)
    const docSaidaMap = new Map(data.checking.map(c => [c.id, c]));

    // 1. Filtro automático de Separação
    const pickingTasks = data.picking.filter(t => 
      (t.transType || '').toUpperCase().includes('SEPARAÇÃO') || 
      (t.destinationAddress || '').toUpperCase().includes('EXPEDE') || 
      (t.destTypeDesc || '').toUpperCase().includes('EXPEDICAO')
    );

    // 2. Calculated Fields
    const completedToday = pickingTasks.filter(t => t.mappedStatus === PickingStatus.COMPLETED && isToday(t.date));
    
    // Volume Separado Hoje
    const volumeSeparadoHoje = completedToday.reduce((acc, t) => acc + t.qtyPicked, 0);
    
    // Tarefas Finalizadas Hoje
    const tarefasFinalizadasHoje = completedToday.length;
    
    // Tarefas Pendentes
    const tarefasPendentes = pickingTasks.filter(t => t.mappedStatus !== PickingStatus.COMPLETED).length;

    // Tempo Minutos & Produtividade
    const totalTempoMinutos = completedToday.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
    const produtividadeMedia = totalTempoMinutos > 0 ? Math.round(volumeSeparadoHoje / (totalTempoMinutos / 60)) : 0;

    // Divergência (por documento) - Usando o Blend
    const docQuantities: Record<string, { picked: number, requested: number }> = {};
    pickingTasks.forEach(t => {
      if (t.mappedStatus === PickingStatus.COMPLETED) {
        if (!docQuantities[t.document]) {
          docQuantities[t.document] = { picked: 0, requested: 0 };
        }
        docQuantities[t.document].picked += t.qtyPicked;
        docQuantities[t.document].requested += t.qtyRequested;
      }
    });

    const docsComDivergencia = Object.entries(docQuantities).filter(([docId, qty]) => {
      return qty.picked !== qty.requested;
    }).map(([docId]) => docId);

    // Docs Saída Hoje
    const docsSaidaHoje = data.checking.filter(d => isToday(d.date)).length;

    // Ondas Ativas Hoje
    const ondasAtivasHoje = new Set(pickingTasks.filter(t => isToday(t.date)).map(t => t.wave)).size;

    return {
      tarefasPendentes,
      tarefasFinalizadasHoje,
      volumeSeparadoHoje,
      docsSaidaHoje,
      divergenciasHoje: docsComDivergencia.length,
      produtividadeMedia,
      ondasAtivasHoje,
      priorityStats: {
        Alta: pickingTasks.filter(t => t.priority === 'Alta' && t.mappedStatus !== PickingStatus.COMPLETED).length,
        Media: pickingTasks.filter(t => t.priority === 'Média' && t.mappedStatus !== PickingStatus.COMPLETED).length,
        Baixa: pickingTasks.filter(t => t.priority === 'Baixa' && t.mappedStatus !== PickingStatus.COMPLETED).length,
      }
    };
  }, [data]);

  const productivityTrend = useMemo(() => {
    const buckets: Record<string, { picking: number; checking: number }> = {};

    data.picking.forEach(t => {
      if (t.mappedStatus !== PickingStatus.COMPLETED || !t.endTime) return;
      const timeStr = String(t.endTime);
      const parts = timeStr.split(' ');
      const timePart = parts.length > 1 ? parts[1] : parts[0];
      if (!timePart) return;
      const hourPart = timePart.split(':')[0];
      if (!hourPart) return;
      const hour = hourPart + ':00';
      if (!buckets[hour]) buckets[hour] = { picking: 0, checking: 0 };
      buckets[hour].picking += 1;
    });

    data.checking.forEach(c => {
      if (c.mappedStatus !== CheckingStatus.COMPLETED) return;
      const hour = c.date.getHours().toString().padStart(2, '0') + ':00';
      if (!buckets[hour]) buckets[hour] = { picking: 0, checking: 0 };
      buckets[hour].checking += 1;
    });

    return Object.entries(buckets)
      .map(([time, val]) => ({
        time,
        picking: val.picking,
        checking: val.checking
      }))
      .sort((a, b) => parseInt(a.time) - parseInt(b.time));
  }, [data]);

  const recentPicking = [...data.picking]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 15);

  const priorityData = [
    { name: 'Alta', value: stats.priorityStats.Alta, color: '#ef4444' },
    { name: 'Média', value: stats.priorityStats.Media, color: '#f59e0b' },
    { name: 'Baixa', value: stats.priorityStats.Baixa, color: '#10b981' },
  ];

  const [activeTab, setActiveTab] = React.useState<'separacao' | 'conferencia'>('separacao');

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard 
          title="Tarefas Pendentes" 
          count={stats.tarefasPendentes} 
          icon={Boxes} 
          colorClass="bg-amber-500 text-amber-500"
          onClick={() => onCardClick('picking', PickingStatus.WAITING)}
        />
        <StatCard 
          title="Finalizadas Hoje" 
          count={stats.tarefasFinalizadasHoje} 
          icon={CheckCircle2} 
          colorClass="bg-emerald-600 text-emerald-600"
          onClick={() => onCardClick('picking', PickingStatus.COMPLETED)}
        />
        <StatCard 
          title="Vol. Separado Hoje" 
          count={stats.volumeSeparadoHoje} 
          icon={Package} 
          colorClass="bg-blue-500 text-blue-500"
        />
        <StatCard 
          title="Ondas Ativas Hoje" 
          count={stats.ondasAtivasHoje} 
          icon={Activity} 
          colorClass="bg-indigo-500 text-indigo-500"
        />
        <StatCard 
          title="Docs. Saída Hoje" 
          count={stats.docsSaidaHoje} 
          icon={ClipboardList} 
          colorClass="bg-indigo-600 text-indigo-600"
          onClick={() => onCardClick('checking', CheckingStatus.WAITING)}
        />
        <StatCard 
          title="Divergências" 
          count={stats.divergenciasHoje} 
          icon={AlertOctagon} 
          colorClass="bg-rose-500 text-rose-500"
        />
        <StatCard 
          title="Produtividade Média" 
          count={stats.produtividadeMedia} 
          icon={TrendingUp} 
          colorClass="bg-violet-600 text-violet-600"
          trend="Itens/Hora"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* MAIN CHART: PICKING VS CHECKING */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[450px]">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amara-green" />
              Evolução Produtividade (Hora a Hora)
            </h3>
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>Separação</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span>Conferência</span>
              </div>
            </div>
          </div>
          <div className="flex-1 p-4">
            {productivityTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productivityTrend}>
                  <defs>
                    <linearGradient id="colorPicking" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorChecking" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    name="Separação"
                    type="monotone" 
                    dataKey="picking" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPicking)" 
                  />
                  <Area 
                    name="Conferência"
                    type="monotone" 
                    dataKey="checking" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorChecking)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Aguardando dados para gerar o gráfico...
              </div>
            )}
          </div>
        </div>

        {/* PRIORITY BREAKDOWN */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[450px]">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-500" />
              Pendências por Prioridade
            </h3>
          </div>
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} layout="vertical" margin={{ left: -20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
              {priorityData.map((p) => (
                <div key={p.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                    <span className="text-sm font-medium text-slate-600">{p.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TABS & LISTS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100">
          <div className="flex">
            <button 
              onClick={() => setActiveTab('separacao')}
              className={`px-6 py-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'separacao' ? 'border-amara-green text-amara-green bg-amara-lime/5' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Lista de Separação (por Onda)
            </button>
            <button 
              onClick={() => setActiveTab('conferencia')}
              className={`px-6 py-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'conferencia' ? 'border-amara-green text-amara-green bg-amara-lime/5' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Lista de Conferência
            </button>
          </div>
        </div>

        <div className="p-0">
          {activeTab === 'separacao' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-4">ONDA</th>
                    <th className="px-6 py-4">TAREFA</th>
                    <th className="px-6 py-4">PRODUTO</th>
                    <th className="px-6 py-4 text-center">SOLIC.</th>
                    <th className="px-6 py-4 text-center">ATEND.</th>
                    <th className="px-6 py-4">STATUS</th>
                    <th className="px-6 py-4">USUÁRIO</th>
                    <th className="px-6 py-4 text-right">TEMPO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const grouped: Record<string, typeof recentPicking> = {};
                    recentPicking.forEach(t => {
                      const w = t.wave || 'Sem Onda';
                      if (!grouped[w]) grouped[w] = [];
                      grouped[w].push(t);
                    });

                    return Object.entries(grouped).map(([wave, tasks]) => (
                      <React.Fragment key={wave}>
                        <tr className="bg-slate-50/50">
                          <td colSpan={8} className="px-6 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-y border-slate-100">
                            ONDA: {wave} ({tasks.length} tarefas)
                          </td>
                        </tr>
                        {tasks.map((task) => {
                          const isDivergent = task.mappedStatus === PickingStatus.COMPLETED && task.qtyPicked !== task.qtyRequested;
                          return (
                            <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-amara-green">{task.wave || '-'}</td>
                              <td className="px-6 py-4 font-mono font-bold text-slate-900">{task.id}</td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-800 truncate max-w-[200px]">{task.productDesc}</span>
                                  <span className="text-[10px] text-slate-400">{task.productCode}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center font-medium">{task.qtyRequested}</td>
                              <td className={`px-6 py-4 text-center font-bold ${isDivergent ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {task.qtyPicked}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_COLORS[task.mappedStatus]}`}>
                                  {task.mappedStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600 font-medium">{task.user}</td>
                              <td className="px-6 py-4 text-right text-slate-500 font-mono">{task.durationMinutes || 0}m</td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-4">DOCUMENTO</th>
                    <th className="px-6 py-4">CLIENTE</th>
                    <th className="px-6 py-4 text-center">QUANTIDADE</th>
                    <th className="px-6 py-4">ONDA</th>
                    <th className="px-6 py-4">STATUS</th>
                    <th className="px-6 py-4 text-right">DATA EMISSÃO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.checking.slice(0, 15).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{order.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 truncate max-w-[200px]">{order.clientDesc}</span>
                          <span className="text-[10px] text-slate-400">{order.clientCode}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium">{order.qtyTotal}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{order.wave}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_COLORS[order.mappedStatus]}`}>
                          {order.mappedStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 font-mono">
                        {order.date.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
