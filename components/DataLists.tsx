import React, { useState } from 'react';
import { PickingTask, CheckingOrder, PickingStatus, CheckingStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { Search } from 'lucide-react';

interface DataListsProps {
  pickingTasks: PickingTask[];
  checkingOrders: CheckingOrder[];
}

const DataLists: React.FC<DataListsProps> = ({ pickingTasks, checkingOrders }) => {
  const [activeTab, setActiveTab] = useState<'picking' | 'checking'>('picking');
  const [filter, setFilter] = useState('');

  const filteredPicking = pickingTasks.filter(t => 
    (t.id || '').toLowerCase().includes(filter.toLowerCase()) || 
    (t.user || '').toLowerCase().includes(filter.toLowerCase())
  );

  const filteredChecking = checkingOrders.filter(o => 
    (o.id || '').toLowerCase().includes(filter.toLowerCase()) || 
    (o.clientDesc || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
      {/* Header & Tabs */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('picking')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'picking' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Lista de Separação
            </button>
            <button
              onClick={() => setActiveTab('checking')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'checking' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Lista de Conferência
            </button>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'picking' ? "Buscar Tarefa, Usuário..." : "Buscar Pedido, Cliente..."}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
            {activeTab === 'picking' ? (
              <tr>
                <th className="px-6 py-3 font-medium">Onda</th>
                <th className="px-6 py-3 font-medium">Tarefa</th>
                <th className="px-6 py-3 font-medium">Produto</th>
                <th className="px-6 py-3 font-medium">Qtd (Sol/Sep)</th>
                <th className="px-6 py-3 font-medium">Operador</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Tempo</th>
              </tr>
            ) : (
              <tr>
                <th className="px-6 py-3 font-medium">Onda</th>
                <th className="px-6 py-3 font-medium">Documento</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Conferente</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            )}
          </thead>
          <tbody>
            {activeTab === 'picking' ? (
              filteredPicking.length > 0 ? filteredPicking.map((task) => (
                <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-amara-green">{task.wave || '-'}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{task.id}</td>
                  <td className="px-6 py-4 text-gray-600">{task.productCode}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="font-medium text-gray-900">{task.qtyPicked}</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span>{task.qtyRequested}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 flex items-center">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs mr-2 font-bold">
                        {task.user.charAt(0)}
                    </div>
                    {task.user}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[task.mappedStatus]}`}>
                      {task.mappedStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {task.startTime ? (
                       <div>
                         <div className="text-gray-900">{task.startTime}</div>
                         {task.endTime && <div className="text-gray-400">até {task.endTime}</div>}
                       </div>
                    ) : '-'}
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Nenhuma tarefa encontrada.</td>
                </tr>
              )
            ) : (
              filteredChecking.length > 0 ? filteredChecking.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-amara-green">{order.wave || '-'}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono">{order.clientDesc}</td>
                  <td className="px-6 py-4 text-gray-600 flex items-center">
                     <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-2 font-bold">
                        {order.user.charAt(0)}
                    </div>
                    {order.user}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.mappedStatus]}`}>
                      {order.mappedStatus}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Nenhum pedido encontrado.</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataLists;