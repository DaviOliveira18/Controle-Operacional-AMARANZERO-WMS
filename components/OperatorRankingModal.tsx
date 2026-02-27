import React, { useMemo, useState } from 'react';
import { X, Trophy, TrendingDown, ArrowUpDown } from 'lucide-react';
import { PickingTask, PickingStatus, OperatorStats } from '../types';

interface OperatorRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: PickingTask[];
}

const OperatorRankingModal: React.FC<OperatorRankingModalProps> = ({ isOpen, onClose, tasks }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof OperatorStats; direction: 'asc' | 'desc' }>({
    key: 'productivityItemsPerHour',
    direction: 'desc',
  });

  const stats = useMemo(() => {
    const opMap: Record<string, OperatorStats> = {};

    tasks.forEach(t => {
      // Only count completed tasks for productivity
      if (t.mappedStatus !== PickingStatus.COMPLETED) return;
      
      const user = t.user || 'Desconhecido';
      if (!opMap[user]) {
        opMap[user] = {
          name: user,
          tasksCompleted: 0,
          itemsPicked: 0,
          minutesWorked: 0,
          productivityItemsPerHour: 0
        };
      }

      opMap[user].tasksCompleted += 1;
      opMap[user].itemsPicked += t.qtyPicked;
      opMap[user].minutesWorked += (t.durationMinutes || 0);
    });

    const result = Object.values(opMap).map(op => ({
      ...op,
      productivityItemsPerHour: op.minutesWorked > 0 
        ? Math.round((op.itemsPicked / op.minutesWorked) * 60) 
        : 0
    }));

    return result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, sortConfig]);

  const handleSort = (key: keyof OperatorStats) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Ranking de Produtividade Detalhado
            </h2>
            <p className="text-sm text-gray-500 mt-1">Análise completa de performance por operador</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 w-16 text-center">#</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Operador <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="px-6 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('tasksCompleted')}>
                    <div className="flex items-center justify-center gap-1">Tarefas <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="px-6 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('itemsPicked')}>
                     <div className="flex items-center justify-center gap-1">Volume (Itens) <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="px-6 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('minutesWorked')}>
                     <div className="flex items-center justify-center gap-1">Tempo Total (min) <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 transition-colors bg-indigo-50" onClick={() => handleSort('productivityItemsPerHour')}>
                     <div className="flex items-center justify-end gap-1 text-indigo-700">Produtividade (It/h) <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.length > 0 ? stats.map((op, index) => {
                  const rank = sortConfig.direction === 'desc' && sortConfig.key === 'productivityItemsPerHour' ? index + 1 : '-';
                  const isTop3 = typeof rank === 'number' && rank <= 3;
                  const isBottom3 = stats.length > 3 && index >= stats.length - 3 && sortConfig.key === 'productivityItemsPerHour' && sortConfig.direction === 'desc';

                  return (
                    <tr key={op.name} className={`hover:bg-gray-50 transition-colors ${isTop3 ? 'bg-yellow-50/30' : ''}`}>
                      <td className="px-6 py-4 text-center font-bold text-gray-400">
                        {isTop3 ? <span className="text-yellow-500">#{rank}</span> : rank}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                        {op.name}
                        {/* Fix: Wrapped icon in span to avoid TS error with title prop on Lucide icon */}
                        {isBottom3 && <span title="Baixo Desempenho"><TrendingDown className="w-4 h-4 text-red-400" /></span>}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">{op.tasksCompleted}</td>
                      <td className="px-6 py-4 text-center font-mono text-gray-700">{op.itemsPicked}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{op.minutesWorked}</td>
                      <td className="px-6 py-4 text-right font-bold text-indigo-600 bg-indigo-50/50">
                        {op.productivityItemsPerHour}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Nenhum dado de produtividade disponível.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorRankingModal;