import React from 'react';
import { AppStatus, WeatherCondition } from '../types';

interface HeaderProps {
  status: AppStatus;
  leadCount: number;
  pipelineValue: number;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onOpenDiagnostics: () => void;
  xp: number;
  activeTeamsCount: number;
  weather: WeatherCondition;
  isMuted: boolean;
  onToggleMute: () => void;
  commission: number;
}

const Header: React.FC<HeaderProps> = ({ 
  status, 
  leadCount, 
  pipelineValue, 
  onToggleChat, 
  isChatOpen, 
  onOpenDiagnostics, 
  xp, 
  activeTeamsCount, 
  weather,
  isMuted,
  onToggleMute,
  commission
}) => {
  
  // Rank Logic
  const ranks = [
    { name: 'ROOKIE', limit: 500 },
    { name: 'OPERATOR', limit: 1500 },
    { name: 'SPECIALIST', limit: 3000 },
    { name: 'COMMANDER', limit: Infinity },
  ];
  
  const currentRank = ranks.find(r => xp < r.limit) || ranks[ranks.length - 1];
  const prevLimit = ranks[ranks.indexOf(currentRank) - 1]?.limit || 0;
  const nextLimit = currentRank.limit === Infinity ? 10000 : currentRank.limit;
  const progress = Math.min(100, Math.max(0, ((xp - prevLimit) / (nextLimit - prevLimit)) * 100));

  return (
    <header className="bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-blue rounded flex items-center justify-center text-white font-bold shadow-[0_0_10px_rgba(0,174,239,0.5)]">R</div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            LEAD COMMANDER 
            <span className="text-xs font-normal text-slate-500 px-1 border border-slate-700 rounded bg-slate-800">v3.1.0</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{currentRank.name}</span>
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
               <div className="h-full bg-yellow-500" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-[10px] text-yellow-500 font-mono font-bold">{xp} XP</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Weather Widget */}
        <div className={`hidden lg:flex items-center gap-3 px-3 py-1 rounded border ${
            weather === 'HAIL' ? 'bg-red-900/30 border-red-500/50' : 
            weather === 'WIND' ? 'bg-orange-900/30 border-orange-500/50' : 
            'bg-slate-800 border-slate-600'
        }`}>
            <div className={`text-xs font-bold font-mono uppercase ${
                weather === 'HAIL' ? 'text-red-400 animate-pulse' : 
                weather === 'WIND' ? 'text-orange-400' : 
                'text-green-400'
            }`}>
                {weather === 'HAIL' ? '⚠ SEVERE HAIL' : weather === 'WIND' ? '⚠ HIGH WINDS' : 'METEO: CLEAR'}
            </div>
            <div className="h-4 w-px bg-slate-600"></div>
            <div className="text-[10px] text-slate-400 font-mono">
                {weather === 'HAIL' ? 'DRONES GROUNDED' : weather === 'WIND' ? 'ADVISORY' : 'VFR CONDITIONS'}
            </div>
        </div>

        <button
           onClick={onToggleMute}
           className={`p-2 rounded border transition-colors ${
               isMuted ? 'border-slate-600 text-slate-500 bg-slate-800' : 'border-brand-blue text-brand-blue bg-slate-800'
           }`}
           title={isMuted ? "Enable Voice Alerts" : "Mute Voice Alerts"}
        >
            {isMuted ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
            )}
        </button>

        <button 
           onClick={onOpenDiagnostics}
           className="hidden xl:flex items-center gap-2 px-3 py-2 rounded border border-slate-600 bg-slate-800 text-slate-300 hover:text-white hover:border-brand-blue hover:bg-slate-700 transition-all group"
        >
          <svg className="w-5 h-5 text-slate-400 group-hover:text-brand-blue transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xs font-bold uppercase">Diagnostics</span>
        </button>

        <button 
          onClick={onToggleChat}
          className={`hidden md:flex items-center gap-2 px-3 py-2 rounded border transition-all ${
            isChatOpen 
              ? 'bg-brand-blue text-white border-brand-blue shadow-[0_0_15px_rgba(0,174,239,0.3)]' 
              : 'bg-slate-800 text-slate-400 border-slate-600 hover:text-white hover:border-slate-500'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="text-xs font-bold uppercase">Mission Control</span>
        </button>

        <div className="h-8 w-px bg-slate-700 hidden md:block"></div>
        
        {/* Commission/Revenue Tracker */}
        <div className="flex flex-col items-end min-w-[80px]">
            <span className="text-xs text-slate-400 uppercase">Commission</span>
            <div className="text-white font-mono font-bold text-lg leading-none">
                ${commission.toLocaleString()}
            </div>
        </div>

        <div className="h-8 w-px bg-slate-700 hidden md:block"></div>

        {/* Strike Teams Status */}
        <div className="flex flex-col items-end min-w-[100px]">
          <span className="text-xs text-slate-400 uppercase">Strike Teams</span>
          <div className="flex items-center gap-2">
             <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i <= (3 - activeTeamsCount) ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'bg-slate-700'}`}></div>
                ))}
             </div>
             <span className="font-mono font-bold text-white text-sm">
                {3 - activeTeamsCount}/3 READY
             </span>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-700 hidden md:block"></div>

        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400 uppercase">System Status</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === AppStatus.SCANNING ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
            <span className={`font-mono font-bold ${status === AppStatus.SCANNING ? 'text-green-500' : 'text-yellow-500'}`}>
              {status}
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-slate-800 px-4 py-2 rounded border border-slate-700 text-right min-w-[120px]">
            <div className="text-xs text-slate-400 uppercase">Pipeline Value</div>
            <div className="text-2xl font-mono font-bold text-green-400">
              ${(pipelineValue / 1000000).toFixed(2)}M
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;