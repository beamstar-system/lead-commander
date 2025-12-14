import React, { useState, useRef, useEffect } from 'react';
import { Lead } from '../types';
import { queryLeadDatabase } from '../services/geminiService';

interface MissionControlProps {
  leads: Lead[];
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MissionControl: React.FC<MissionControlProps> = ({ leads, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Mission Control Online. Uplink established. Ready for strategic analysis.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await queryLeadDatabase(leads, userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'ERR: Transmission Failed.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 w-96 bg-slate-900/95 backdrop-blur border-l border-brand-blue/30 shadow-2xl z-40 flex flex-col transform transition-transform duration-300">
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-black/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-mono font-bold text-white text-sm uppercase tracking-wider">Mission Control</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/30' 
                : 'bg-slate-800 text-slate-300 border border-slate-700 font-mono'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-slate-800 text-xs text-slate-500 border border-slate-700 p-2 rounded animate-pulse font-mono">
               Computing strategy...
             </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-slate-700 bg-black/20">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Query database..."
            className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue font-mono"
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="bg-brand-blue hover:bg-blue-600 text-white px-3 rounded transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MissionControl;