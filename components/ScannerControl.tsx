import React, { useState } from 'react';
import { AppStatus } from '../types';

interface ScannerControlProps {
  status: AppStatus;
  onStart: (city: string, state: string) => void;
  onStop: () => void;
}

const ScannerControl: React.FC<ScannerControlProps> = ({ status, onStart, onStop }) => {
  const [city, setCity] = useState('Columbus');
  const [state, setState] = useState('OH');

  const isScanning = status === AppStatus.SCANNING || status === AppStatus.ANALYZING;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isScanning) {
      onStop();
    } else {
      onStart(city, state);
    }
  };

  return (
    <div className="bg-slate-900 border-r border-slate-700 w-80 p-6 flex flex-col gap-6 z-20 shadow-xl">
      <div>
        <h2 className="text-white font-bold text-lg mb-1">Target Parameters</h2>
        <p className="text-slate-400 text-xs">Define geospatial region for satellite analysis.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-1">
          <label className="text-xs font-mono uppercase text-slate-500">City</label>
          <input 
            type="text" 
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={isScanning}
            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-brand-blue disabled:opacity-50 font-mono"
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-mono uppercase text-slate-500">State Code</label>
          <input 
            type="text" 
            value={state}
            onChange={(e) => setState(e.target.value)}
            disabled={isScanning}
            maxLength={2}
            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-brand-blue disabled:opacity-50 font-mono uppercase"
          />
        </div>

        <div className="h-px bg-slate-700 my-2"></div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
             <span>Spectral Analysis</span>
             <span className="text-green-500">ENABLED</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
             <span>Granule Loss Det.</span>
             <span className="text-green-500">ENABLED</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
             <span>Historical Weather</span>
             <span className="text-green-500">ENABLED</span>
          </div>
        </div>

        <button 
          type="submit"
          className={`mt-4 w-full py-3 rounded font-bold tracking-wider uppercase text-sm transition-all shadow-lg ${
            isScanning 
            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
            : 'bg-brand-blue hover:bg-blue-600 text-white'
          }`}
        >
          {isScanning ? 'Abort Scan' : 'Initialize Scan'}
        </button>
      </form>

      {/* Mini Terminal Log */}
      <div className="flex-1 bg-black rounded p-3 font-mono text-xs text-green-500 overflow-y-auto mt-4 border border-slate-800 opacity-80">
        <div className="mb-1 opacity-50">System initialized...</div>
        <div className="mb-1 opacity-50">Connected to Sat-Network...</div>
        {isScanning && (
          <>
            <div className="mb-1">Acquiring target lock on {city}, {state}...</div>
            <div className="mb-1">Downloading tiles...</div>
            <div className="mb-1 text-brand-blue">Analyzing spectral signatures...</div>
            <div className="mb-1">Cross-referencing property records...</div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScannerControl;
