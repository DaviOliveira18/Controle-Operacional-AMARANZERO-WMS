import { PickingStatus, CheckingStatus } from './types';

export const STATUS_COLORS = {
  [PickingStatus.WAITING]: "bg-gray-100 text-gray-800 border-gray-200",
  [PickingStatus.IN_PROGRESS]: "bg-yellow-50 text-yellow-700 border-yellow-200",
  [PickingStatus.COMPLETED]: "bg-green-50 text-green-700 border-green-200",
  [PickingStatus.CANCELLED]: "bg-red-50 text-red-700 border-red-200",
  
  [CheckingStatus.WAITING]: "bg-gray-100 text-gray-800 border-gray-200",
  [CheckingStatus.IN_PROGRESS]: "bg-blue-50 text-blue-700 border-blue-200",
  [CheckingStatus.COMPLETED]: "bg-green-50 text-green-700 border-green-200",
  [CheckingStatus.DIVERGENT]: "bg-red-50 text-red-700 border-red-200",
};

export const STATUS_LABELS = {
  ...PickingStatus,
  ...CheckingStatus
};

// Simulate backend mapping logic
export const RAW_STATUS_MAPPING_PICKING: Record<string, PickingStatus> = {
  "Aberta": PickingStatus.WAITING,
  "Em Execução": PickingStatus.IN_PROGRESS,
  "Finalizada": PickingStatus.COMPLETED,
  "Cancelada": PickingStatus.CANCELLED
};

export const RAW_STATUS_MAPPING_CHECKING: Record<string, CheckingStatus> = {
  "Pendente": PickingStatus.WAITING as unknown as CheckingStatus, // Re-using waiting logic or separate
  "Aguardando": CheckingStatus.WAITING,
  "Em Conferência": CheckingStatus.IN_PROGRESS,
  "Conferido": CheckingStatus.COMPLETED,
  "Divergente": CheckingStatus.DIVERGENT
};