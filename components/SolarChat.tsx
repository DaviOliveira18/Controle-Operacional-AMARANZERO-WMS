import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Leaf, Bell } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DashboardData, PickingStatus, CheckingStatus } from '../types';

// URL do Mascote (Sol 3D)
const MASCOT_URL = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Sun%20with%20Face.png";

interface SolarChatProps {
  data: DashboardData;
}

export const SolarChat: React.FC<SolarChatProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  
  // Histórico inicial de mensagens
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou o Solar. ☀️ Como posso iluminar o seu dia hoje? Posso analisar os dados de separação e conferência para você!' }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevDataRef = useRef<{pickingCount: number, checkingCount: number, lastUpdated: number} | null>(null);

  // Auto-scroll para o fim do chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Proactive Analysis on Data Update
  useEffect(() => {
    if (!prevDataRef.current) {
      prevDataRef.current = { 
        pickingCount: data.picking.length, 
        checkingCount: data.checking.length,
        lastUpdated: data.lastUpdated.getTime()
      };
      return;
    }

    if (data.lastUpdated.getTime() === prevDataRef.current.lastUpdated) return;

    const prev = prevDataRef.current;
    const currentPickingCount = data.picking.length;
    const currentCheckingCount = data.checking.length;
    
    const newPicking = currentPickingCount - prev.pickingCount;
    const newChecking = currentCheckingCount - prev.checkingCount;

    prevDataRef.current = {
      pickingCount: currentPickingCount,
      checkingCount: currentCheckingCount,
      lastUpdated: data.lastUpdated.getTime()
    };

    if (newPicking > 0 || newChecking > 0) {
        setHasUnread(true);
        let updateContext = "";
        if (newPicking > 0) updateContext += `${newPicking} novas tarefas de separação. `;
        if (newChecking > 0) updateContext += `${newChecking} novos documentos de conferência. `;
        
        const systemPrompt = `O usuário carregou novos dados: ${updateContext}. Faça uma análise rápida e brilhe como o Sol!`;
        generateResponse(systemPrompt, true);
    }
  }, [data.lastUpdated]);

  const generateResponse = async (userPrompt: string, isAutomated = false) => {
    if (!isAutomated) {
        setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
    }
    
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Stats for AI Context
      const pendingPicking = data.picking.filter(t => t.mappedStatus !== PickingStatus.COMPLETED && t.mappedStatus !== PickingStatus.CANCELLED).length;
      const completedPicking = data.picking.filter(t => t.mappedStatus === PickingStatus.COMPLETED).length;
      const divergences = data.picking.filter(t => t.mappedStatus === PickingStatus.COMPLETED && t.qtyPicked !== t.qtyRequested).length;
      const pendingChecking = data.checking.filter(c => c.mappedStatus !== CheckingStatus.COMPLETED).length;

      const context = `
        Você é o "Solar", o mascote da Amaranzero CD Solar FSA. 
        Seu tom é alegre, iluminado, prestativo e focado em eficiência logística.
        Você usa muitos emojis de sol ☀️, brilho ✨ e natureza 🌿.
        
        DADOS ATUAIS DO WMS:
        - Separação (Picking): ${data.picking.length} total, ${pendingPicking} pendentes, ${completedPicking} finalizados.
        - Divergências na Separação: ${divergences} casos.
        - Conferência (Checking): ${data.checking.length} total, ${pendingChecking} pendentes.
        
        Instruções:
        - Responda em Português do Brasil.
        - Seja proativo em sugerir melhorias se vir muitas divergências ou pendências.
        - Se for uma atualização automática, seja breve e motivador.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userPrompt,
        config: {
          systemInstruction: context
        }
      });

      const text = response.text || "Tive um pequeno eclipse aqui, mas já voltei! ☀️";
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);

    } catch (error) {
      console.error("Solar AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Ops! Minha energia solar oscilou. Mas os dados estão seguros no dashboard! ☀️" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    generateResponse(text);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setHasUnread(false);
  };

  return (
    <>
      {/* --- BOTÃO FLUTUANTE (Mascote) --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
        {/* Balão de Notificação */}
        {!isOpen && (
          <div 
            onClick={toggleOpen}
            className="mr-4 mb-2 bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tr-none shadow-xl border border-amara-lime/30 cursor-pointer pointer-events-auto transform hover:scale-105 transition-transform"
          >
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
               {hasUnread && (
                 <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amara-lime opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amara-green"></span>
                 </span>
               )}
               <span>Posso ajudar? ☀️</span>
            </p>
          </div>
        )}

        {/* O Botão do Sol */}
        <button
          onClick={toggleOpen}
          className={`pointer-events-auto relative w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-300 via-orange-400 to-yellow-500 shadow-[0_10px_40px_-10px_rgba(251,191,36,0.6)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        >
          {/* Anéis de Energia (Animação CSS) */}
          <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-spin-slow"></div>
          <div className="absolute -inset-1 rounded-full border border-white/20 animate-ping-slow"></div>
          
          {/* Imagem */}
          <img 
            src={MASCOT_URL} 
            alt="Solar" 
            className="w-16 h-16 object-contain drop-shadow-lg transform transition-transform group-hover:rotate-12 group-hover:scale-110" 
          />

          {/* Badge Vermelho */}
          {hasUnread && (
            <div className="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center animate-bounce z-10">
              <Bell size={10} className="text-white fill-white" />
            </div>
          )}
        </button>
      </div>

      {/* --- JANELA DO CHAT --- */}
      <div 
        className={`fixed bottom-6 right-6 z-[60] w-[380px] max-w-[calc(100vw-40px)] h-[600px] max-h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-amara-lime/20 flex flex-col overflow-hidden transition-all duration-500 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}`}
      >
        {/* Header com Gradiente */}
        <div className="relative bg-gradient-to-br from-amara-dark via-amara-green to-solar-orange p-6 pb-8 text-white">
           <button 
            onClick={toggleOpen}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm z-20"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col items-center relative z-10">
             {/* Avatar Grande no Header */}
             <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/40 shadow-xl mb-3 relative group">
                <img src={MASCOT_URL} className="w-20 h-20 object-contain drop-shadow-2xl transition-transform group-hover:scale-110" />
                <div className="absolute bottom-0 right-1 w-7 h-7 bg-amara-lime rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                    <Leaf size={14} className="text-amara-dark fill-amara-dark" />
                </div>
             </div>
             <h3 className="text-xl font-black tracking-tight drop-shadow-sm">Solar NZero</h3>
             <p className="text-xs text-white/80 font-medium">Assistente Virtual Inteligente</p>
          </div>

          {/* Efeitos de Fundo (Bolhas) */}
          <div className="absolute top-[-20%] left-[-20%] w-48 h-48 bg-amara-lime/30 rounded-full blur-3xl animate-pulse"></div>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
            >
              <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amara-lime/20 to-amara-green/20 border border-amara-lime/30 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={MASCOT_URL} className="w-6 h-6 object-contain" />
                  </div>
                )}
                
                <div className={`p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-amara-green text-white rounded-tr-sm font-medium' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-sm border border-slate-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex gap-1 items-center ml-10">
                 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              className="flex-1 pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white border focus:border-amara-green rounded-xl text-sm transition-all outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className={`absolute right-1 top-1 w-10 h-10 rounded-lg flex items-center justify-center text-white transition-all ${!input.trim() ? 'bg-slate-300' : 'bg-gradient-to-br from-amara-green to-amara-lime shadow-md hover:scale-105'}`}
            >
              <Send size={18} />
            </button>
          </div>
          <div className="text-center mt-2 flex items-center justify-center gap-1.5 opacity-60">
            <Sparkles size={10} className="text-amara-lime" />
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              Solar AI
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
