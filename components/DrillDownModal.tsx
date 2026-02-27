import React, { useState, useEffect } from 'react';
import { X, Filter } from 'lucide-react';
import { PickingTask, CheckingOrder, ModalState, PickingStatus, CheckingStatus } from '../types';
import { STATUS_COLORS } from '../constants';

interface DrillDownModalProps {
  state: ModalState;
  onClose: () => void;
  pickingData: PickingTask[];
  checkingData: CheckingOrder[];
}

const DrillDownModal: React.FC<DrillDownModalProps> = ({ state, onClose, pickingData, checkingData }) => {
  // Local state to allow changing the filter inside the modal
  const [internalFilter, setInternalFilter] = useState<string | null>(state.statusFilter);

  // Sync internal filter when the modal opens with a new pre-selected status
  useEffect(() => {
    setInternalFilter(state.statusFilter);
  }, [state.statusFilter, state.isOpen]);

  if (!state.isOpen) return null;

  const isPicking = state.type === 'picking';

  // Filter data based on the internal selection
  const filteredPicking = isPicking && internalFilter
    ? pickingData.filter(t => t.mappedStatus === internalFilter)
    : [];

  const filteredChecking = !isPicking && internalFilter
    ? checkingData.filter(c => c.mappedStatus === internalFilter)
    : [];

  // Get available status options based on the type
  const statusOptions = isPicking ? Object.values(PickingStatus) : Object.values(CheckingStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-gray-100 gap-4">
          <div>
             <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
               {isPicking ? 'Detalhamento de Separação' : 'Detalhamento de Conferência'}
             </h2>
             <p className="text-sm text-gray-500 mt-1">
               {isPicking ? `${filteredPicking.length} tarefas encontradas` : `${filteredChecking.length} documentos encontrados`}
             </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Status Filter Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={internalFilter || ''}
                onChange={(e) => setInternalFilter(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 appearance-none cursor-pointer text-gray-700 font-medium"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-auto sm:ml-0"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto p-0 flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              {isPicking ? (
                <tr>
                  <th className="px-6 py-3 font-medium">Tarefa</th>
                  <th className="px-6 py-3 font-medium">Prioridade</th>
                  <th className="px-6 py-3 font-medium">Endereço Origem</th>
                  <th className="px-6 py-3 font-medium">Produto</th>
                  <th className="px-6 py-3 font-medium text-center">Qtd (Sol/Ate)</th>
                  <th className="px-6 py-3 font-medium">Operador</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-3 font-medium">Documento</th>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Onda</th>
                  <th className="px-6 py-3 font-medium">Qtd Total</th>
                  <th className="px-6 py-3 font-medium">Status Orig.</th>
                </tr>
              )}
            </thead>
            <tbody>
              {isPicking ? (
                filteredPicking.length > 0 ? filteredPicking.map((task) => (
                  <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{task.id}</td>
                    <td className="px-6 py-4 text-gray-600">
                        <span className={`px-2 py-0.5 rounded text-xs ${(task.priority || '').toLowerCase().includes('alta') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                            {task.priority}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{task.originAddress}</td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]" title={task.productDesc}>{task.productDesc || task.productCode}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-gray-900">{task.qtyPicked}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      {task.qtyRequested}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{task.user}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                        {task.date instanceof Date && !isNaN(task.date.getTime()) 
                          ? task.date.toLocaleDateString() 
                          : '-'}
                    </td>
                  </tr>
                )) : (
                   <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 bg-gray-50/50">Nenhuma tarefa encontrada com o status "{internalFilter}".</td></tr>
                )
              ) : (
                filteredChecking.length > 0 ? filteredChecking.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                    <td className="px-6 py-4 text-gray-600">{order.clientDesc}</td>
                    <td className="px-6 py-4 text-gray-600">{order.wave}</td>
                    <td className="px-6 py-4 font-bold">{order.qtyTotal}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs border ${STATUS_COLORS[order.mappedStatus]}`}>
                            {order.originalStatus}
                        </span>
                    </td>
                  </tr>
                )) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 bg-gray-50/50">Nenhum documento encontrado com o status "{internalFilter}".</td></tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
           <button 
             onClick={onClose}
             className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
           >
             Fechar
           </button>
        </div>
      </div>
    </div>
  );
};

export default DrillDownModal;