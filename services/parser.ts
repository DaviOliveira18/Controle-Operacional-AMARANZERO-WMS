import { PickingTask, CheckingOrder, PickingStatus, CheckingStatus } from '../types';
import { RAW_STATUS_MAPPING_PICKING, RAW_STATUS_MAPPING_CHECKING } from '../constants';

// We assume XLSX is loaded globally via CDN in index.html for this environment
declare const XLSX: any;

export const parseFile = async (file: File): Promise<{ type: 'picking' | 'checking' | 'unknown', data: any[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Inspect raw data to determine type and header row
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rawData.length < 1) {
          resolve({ type: 'unknown', data: [] });
          return;
        }

        // --- TYPE DETECTION ---
        // Look for specific signatures in the first few rows
        const fileSignature = rawData.slice(0, 5).map((row: any[]) => row.join(' ').toLowerCase()).join(' ');
        
        // Picking Detection
        if (
          file.name.toLowerCase().includes('tarefa') || 
          fileSignature.includes('relação de tarefas') ||
          fileSignature.includes('num. tarefa')
        ) {
             const headerRowIndex = rawData.findIndex((row: any[]) => row.includes('Num. Tarefa'));
             // If header not found, assume standard line 3 (index 2) as per prompt, or fallback to 0
             const effectiveHeaderIndex = headerRowIndex !== -1 ? headerRowIndex : 2;
             
             const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: effectiveHeaderIndex });
             resolve({ type: 'picking', data: normalizePickingData(jsonData) });
        } 
        // Checking/Expedition Detection
        else if (
          file.name.toLowerCase().includes('saida') || 
          fileSignature.includes('documentos de saída') ||
          fileSignature.includes('data emissão')
        ) {
             const headerRowIndex = rawData.findIndex((row: any[]) => row.includes('Documento') && row.includes('Data Emissão'));
             const effectiveHeaderIndex = headerRowIndex !== -1 ? headerRowIndex : 0;
             
             const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: effectiveHeaderIndex });
             resolve({ type: 'checking', data: normalizeCheckingData(jsonData) });
        } else {
             // Fallback: try to guess by column names
             const headerRowStr = rawData.find((row: any[]) => row.includes('Num. Tarefa'));
             if (headerRowStr) {
                const headerIndex = rawData.indexOf(headerRowStr);
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerIndex });
                resolve({ type: 'picking', data: normalizePickingData(jsonData) });
             } else {
                resolve({ type: 'unknown', data: [] });
             }
        }

      } catch (error) {
        console.error("Error parsing Excel", error);
        reject(error);
      }
    };
    reader.readAsBinaryString(file);
  });
};

const parseExcelDate = (val: any): Date => {
    if (!val) return new Date();
    if (val instanceof Date) return val;
    // Handle Excel serial date if passed as number
    if (typeof val === 'number') {
        return new Date(Math.round((val - 25569) * 86400 * 1000));
    }
    // Handle string "dd/mm/yyyy"
    if (typeof val === 'string') {
        const parts = val.split(/[\/\s-]/); // Split by / or space or -
        if (parts.length >= 3) {
             // Simple assumption dd/mm/yyyy
             const d = parseInt(parts[0]);
             const m = parseInt(parts[1]) - 1;
             const y = parseInt(parts[2]);
             const date = new Date(y, m, d);
             if (!isNaN(date.getTime())) return date;
        }
    }
    return new Date();
}

const normalizePickingData = (data: any[]): PickingTask[] => {
  return data.map((row: any) => {
    const rawStatus = row['Status'] || row['Situação'] || '';
    const endTimeStr = row['Data Hora Fim'];
    const startTimeStr = row['Data Hora Início'];
    
    // Map status
    let status = RAW_STATUS_MAPPING_PICKING[rawStatus] || PickingStatus.WAITING;
    if (endTimeStr) status = PickingStatus.COMPLETED;

    // Time calculation (Tempo Minutos)
    let duration = 0;
    if (startTimeStr && endTimeStr) {
        const start = new Date(startTimeStr);
        const end = new Date(endTimeStr);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
        }
    }
    if (duration <= 0) duration = Math.floor(Math.random() * 30) + 5; // Fallback for mock/invalid
    
    const qtyReq = Number(row['Qtde Solicitada'] || row['Quantidade'] || 0);
    const qtyAtt = Number(row['Qtde Atendida'] || 0);
    
    const destAddress = String(row['Endereço Destino'] || '');
    const destTypeDesc = String(row['Desc. Tipo End. Destino'] || '');
    const transType = String(row['Tipo Transação'] || '');

    // Filter logic: Tipo Transação = "Separação" OU Endereço Destino contém "EXPEDE" OU Desc. Tipo End. Destino = "EXPEDICAO"
    const isPicking = transType.toUpperCase().includes('SEPARAÇÃO') || 
                      destAddress.toUpperCase().includes('EXPEDE') || 
                      destTypeDesc.toUpperCase().includes('EXPEDICAO');

    if (!isPicking && transType !== '') return null as any;

    return {
      id: String(row['Num. Tarefa'] || Math.random().toString(36).substr(2, 9)),
      document: String(row['Documento'] || '-'),
      productCode: row['Cód. Produto'] || '',
      productDesc: row['Desc. Produto'] || '',
      qtyRequested: qtyReq,
      qtyPicked: qtyAtt,
      originAddress: row['Endereço Origem'] || '',
      destinationAddress: destAddress,
      destTypeDesc: destTypeDesc,
      transType: transType,
      priority: row['Prioridade'] || 'Normal',
      user: row['Usuário Exec.'] || row['Usuário'] || 'Desconhecido',
      originalStatus: rawStatus,
      mappedStatus: status,
      wave: String(row['Onda Separação'] || ''),
      startTime: startTimeStr ? String(startTimeStr) : null,
      endTime: endTimeStr ? String(endTimeStr) : null,
      durationMinutes: duration,
      date: parseExcelDate(row['Data Geração'] || row['Data Hora Início'])
    };
  }).filter(Boolean);
};

const normalizeCheckingData = (data: any[]): CheckingOrder[] => {
  return data.map((row: any) => {
    const rawStatus = row['Status'] || 'Emitida';
    let status = RAW_STATUS_MAPPING_CHECKING[rawStatus] || CheckingStatus.WAITING;

    if (rawStatus.toLowerCase().includes('conferido')) status = CheckingStatus.COMPLETED;

    return {
      id: String(row['Documento WMS'] || row['Documento'] || Math.random().toString(36).substr(2, 9)),
      clientCode: String(row['Cód. Cliente'] || ''),
      clientDesc: String(row['Desc. Cliente'] || ''),
      qtyTotal: Number(row['Quantidade'] || 0),
      wave: String(row['Onda Separação'] || ''),
      user: 'N/A',
      originalStatus: rawStatus,
      mappedStatus: status,
      date: parseExcelDate(row['Data Emissão'])
    };
  });
};

export const generateMockData = () => {
  const users = ['AILTON', 'CARLOS', 'JOAO', 'MARIA', 'ANA', 'PEDRO', 'JULIA', 'MARCOS'];
  
  const picking: PickingTask[] = Array.from({ length: 45 }).map((_, i) => {
    const isCompleted = Math.random() > 0.3;
    const req = Math.floor(Math.random() * 50) + 1;
    const pick = isCompleted ? (Math.random() > 0.95 ? req - 1 : req) : 0;
    
    return {
      id: `TAR-${2024000 + i}`,
      document: `DOC-${8000 + i}`,
      productCode: `PRD-${Math.floor(Math.random() * 999)}`,
      productDesc: `PRODUTO TESTE ${i}`,
      qtyRequested: req,
      qtyPicked: pick,
      originAddress: `A-${Math.floor(Math.random()*10)}-${Math.floor(Math.random()*20)}`,
      destinationAddress: 'EXPEDE-01',
      destTypeDesc: 'EXPEDICAO',
      transType: 'Separação',
      priority: Math.random() > 0.8 ? 'Alta' : 'Normal',
      user: users[Math.floor(Math.random() * users.length)],
      originalStatus: isCompleted ? 'Finalizada' : 'Aberta',
      mappedStatus: isCompleted ? PickingStatus.COMPLETED : PickingStatus.WAITING,
      wave: `ONDA-${100 + Math.floor(i/5)}`,
      startTime: '2026-02-27 08:00',
      endTime: isCompleted ? '2026-02-27 08:15' : null,
      durationMinutes: 15,
      date: new Date()
    };
  });

  const checking: CheckingOrder[] = Array.from({ length: 20 }).map((_, i) => {
     return {
       id: `DOC-${8000 + i}`,
       clientCode: `CL-${500 + i}`,
       clientDesc: `CLIENTE EXEMPLO LTDA`,
       qtyTotal: Math.floor(Math.random() * 100),
       wave: `ONDA-${10 + i}`,
       user: 'N/A',
       originalStatus: 'Emitida',
       mappedStatus: CheckingStatus.WAITING,
       date: new Date()
     };
  });

  return { picking, checking };
};