import React from 'react';
import { Lead } from '../types';

interface SystemDiagnosticsProps {
  leads: Lead[];
  onClose: () => void;
}

const SystemDiagnostics: React.FC<SystemDiagnosticsProps> = ({ leads, onClose }) => {
  const totalValue = leads.reduce((acc, l) => acc + l.estimatedValue, 0);
  const criticalCount = leads.filter(l => l.condition === 'Critical').length;
  const poorCount = leads.filter(l => l.condition === 'Poor').length;
  const fairCount = leads.filter(l => l.condition === 'Fair').length;
  const avgAge = leads.length > 0 ? (leads.reduce((acc, l) => acc + l.roofAge, 0) / leads.length).toFixed(1) : '0';
  
  const droneDeploys = leads.filter(l => l.inspectionType === 'Drone').length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-5xl overflow-hidden relative animate-fade-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-brand-blue animate-pulse rounded-sm"></div>
                <h2 className="text-white font-bold font-mono text-lg tracking-widest uppercase">System Diagnostics // Global Overview</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Dashboard Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* KPI Cards */}
            <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded">
                    <div className="text-xs text-slate-500 uppercase font-mono mb-1">Total Pipeline Value</div>
                    <div className="text-2xl text-green-400 font-bold font-mono">${(totalValue / 1000000).toFixed(2)}M</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded">
                    <div className="text-xs text-slate-500 uppercase font-mono mb-1">Total Assets Scanned</div>
                    <div className="text-2xl text-white font-bold font-mono">{leads.length}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded">
                    <div className="text-xs text-slate-500 uppercase font-mono mb-1">Avg Asset Age</div>
                    <div className="text-2xl text-yellow-400 font-bold font-mono">{avgAge} Yrs</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded">
                    <div className="text-xs text-slate-500 uppercase font-mono mb-1">Drone Sorties</div>
                    <div className="text-2xl text-brand-blue font-bold font-mono">{droneDeploys}</div>
                </div>
            </div>

            {/* Condition Chart */}
            <div className="md:col-span-2 bg-black/40 border border-slate-700 rounded p-6">
                <h3 className="text-xs text-slate-400 uppercase font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                    Condition Distribution
                </h3>
                <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-300">
                            <span>CRITICAL ({criticalCount})</span>
                            <span>{leads.length ? Math.round((criticalCount / leads.length) * 100) : 0}%</span>
                        </div>
                        <div className="h-4 bg-slate-800 rounded overflow-hidden">
                            <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${leads.length ? (criticalCount / leads.length) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-300">
                            <span>POOR ({poorCount})</span>
                            <span>{leads.length ? Math.round((poorCount / leads.length) * 100) : 0}%</span>
                        </div>
                        <div className="h-4 bg-slate-800 rounded overflow-hidden">
                            <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${leads.length ? (poorCount / leads.length) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-300">
                            <span>FAIR ({fairCount})</span>
                            <span>{leads.length ? Math.round((fairCount / leads.length) * 100) : 0}%</span>
                        </div>
                        <div className="h-4 bg-slate-800 rounded overflow-hidden">
                            <div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: `${leads.length ? (fairCount / leads.length) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Network Health */}
            <div className="md:col-span-2 bg-black/40 border border-slate-700 rounded p-6 flex flex-col">
                <h3 className="text-xs text-slate-400 uppercase font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Network Latency (Live)
                </h3>
                <div className="flex-1 flex items-end gap-1 h-32 border-b border-slate-700 pb-1">
                    {Array.from({ length: 40 }).map((_, i) => {
                        const height = 20 + Math.random() * 60;
                        const isSpike = Math.random() > 0.95;
                        return (
                            <div 
                                key={i} 
                                className={`flex-1 rounded-t-sm transition-all duration-500 ${isSpike ? 'bg-red-500' : 'bg-brand-blue/50'}`}
                                style={{ height: `${height}%` }}
                            ></div>
                        );
                    })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                    <span>-60s</span>
                    <span>NOW</span>
                </div>
            </div>

            {/* Console Output */}
            <div className="md:col-span-4 bg-black border border-slate-700 rounded p-4 h-32 overflow-y-auto font-mono text-xs">
                <div className="text-slate-500 border-b border-slate-800 pb-2 mb-2 sticky top-0 bg-black">SYSTEM LOG</div>
                <div className="flex flex-col gap-1 text-slate-400">
                    <span className="text-green-500">[{new Date().toLocaleTimeString()}] System integrity check complete. All systems nominal.</span>
                    <span>[{new Date(Date.now() - 5000).toLocaleTimeString()}] Analyzing sector 7 spectral data...</span>
                    <span>[{new Date(Date.now() - 12000).toLocaleTimeString()}] Connected to orbital asset Sat-V4.</span>
                    {leads.slice(-3).map(l => (
                         <span key={l.id} className="text-brand-blue">[{new Date().toLocaleTimeString()}] New target acquired: {l.address} (ID: {l.id})</span>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default SystemDiagnostics;