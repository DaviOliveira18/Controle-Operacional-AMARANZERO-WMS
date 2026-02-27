export enum PickingStatus {
  WAITING = "Aguardando Separação",
  IN_PROGRESS = "Separando",
  COMPLETED = "Separado",
  CANCELLED = "Cancelado"
}

export enum CheckingStatus {
  WAITING = "Aguardando Conferência",
  IN_PROGRESS = "Conferindo",
  COMPLETED = "Conferido",
  DIVERGENT = "Com Divergência"
}

export interface PickingTask {
  id: string; // Num. Tarefa
  document: string; // Documento
  productCode: string; // Cód. Produto
  productDesc: string; // Desc. Produto
  qtyRequested: number; // Qtde Solicitada
  qtyPicked: number; // Qtde Atendida
  originAddress: string; // Endereço Origem
  destinationAddress: string; // Endereço Destino
  destTypeDesc: string; // Desc. Tipo End. Destino
  transType: string; // Tipo Transação
  priority: string; // Prioridade
  user: string; // Usuário Exec.
  originalStatus: string;
  mappedStatus: PickingStatus;
  wave: string; // Onda Separação (from doc saida)
  startTime: string | null; // Data Hora Início
  endTime: string | null; // Data Hora Fim
  durationMinutes: number; // Tempo Minutos
  date: Date; // Data Geração
}

export interface CheckingOrder {
  id: string; // Documento
  clientCode: string; // Cód. Cliente
  clientDesc: string; // Desc. Cliente
  qtyTotal: number; // Quantidade
  wave: string; // Onda Separação
  user: string; // Usuário (derived if possible)
  originalStatus: string;
  mappedStatus: CheckingStatus;
  date: Date; // Data Emissão
}

export interface OperatorStats {
  name: string;
  tasksCompleted: number;
  itemsPicked: number;
  minutesWorked: number;
  productivityItemsPerHour: number;
}

export interface DashboardData {
  picking: PickingTask[];
  checking: CheckingOrder[];
  lastUpdated: Date;
}

export interface FilterState {
  period: 'Hoje' | 'Ontem' | '7 Dias' | 'All';
  startDate: string;
  endDate: string;
  selectedUser: string; // "All" or specific user
  selectedWave: string; // "All" or specific wave
  searchTerm: string; // Global text search
  status: string; // 'All' | 'Pending' | 'InProgress' | 'Completed' | 'Issue'
  priority: string; // 'All' | 'Alta' | 'Normal'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type ModalState = {
  isOpen: boolean;
  type: 'picking' | 'checking' | null;
  statusFilter: PickingStatus | CheckingStatus | null;
  title: string;
};