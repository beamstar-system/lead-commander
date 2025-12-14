import React, { useEffect, useState } from 'react';
import { AppStatus, WeatherCondition } from '../types';

interface SatelliteVisualizerProps {
  status: AppStatus;
  weather?: WeatherCondition;
}

const SatelliteVisualizer: React.FC<SatelliteVisualizerProps> = ({ status, weather = 'CLEAR' }) => {
  const [scanLine, setScanLine] = useState(0);
  const [visionMode, setVisionMode] = useState<'optical' | 'thermal'>('optical');
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === AppStatus.SCANNING || status === AppStatus.ANALYZING) {
      interval = setInterval(() => {
        setScanLine(prev => (prev + 1) % 100);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [status]);

  if (status === AppStatus.IDLE) return null;

  return (
    <div className="h-48 bg-black border-b border-slate-700 relative overflow-hidden group">
      {/* Background Map Texture (Simulated) */}
      <div 
        className={`absolute inset-0 bg-[url('https://picsum.photos/1200/400?grayscale')] bg-cover bg-center transition-all duration-700 ${
          visionMode === 'thermal' 
          ? 'mix-blend-normal opacity-60 contrast-150 brightness-125 sepia hue-rotate-180 invert' 
          : 'mix-blend-luminosity opacity-40'
        } ${
          weather === 'HAIL' ? 'brightness-50 contrast-125' : ''
        }`}
      ></div>
      
      {/* Weather Overlay: Storm/Rain */}
      {weather === 'HAIL' && (
        <div className="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse"></div>
      )}
      {weather !== 'CLEAR' && (
         <div className="absolute inset-0 z-10 pointer-events-none opacity-20">
             {/* Simulated rain via CSS gradient animation could go here, for now using noise */}
             <div className="w-full h-full bg-slate-900 mix-blend-overlay animate-pulse"></div>
         </div>
      )}

      {/* Grid Overlay */}
      <div className="absolute inset-0" style={{ 
        backgroundImage: `linear-gradient(${visionMode === 'thermal' ? '#f97316' : '#00AEEF'} 1px, transparent 1px), linear-gradient(90deg, ${visionMode === 'thermal' ? '#f97316' : '#00AEEF'} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        opacity: 0.1
      }}></div>

      {/* Scanning Line */}
      {(status === AppStatus.SCANNING || status === AppStatus.ANALYZING) && (
        <div 
          className={`absolute left-0 right-0 h-1 z-10 shadow-[0_0_15px] transition-colors ${
             visionMode === 'thermal' ? 'bg-orange-500 shadow-orange-500/80' : 'bg-brand-blue shadow-[#00AEEF]/80'
          }`}
          style={{ top: `${scanLine}%` }}
        ></div>
      )}

      {/* Mode Toggle Switch */}
      <div className="absolute top-2 right-2 flex bg-slate-900/80 rounded border border-slate-700 p-0.5 z-20">
         <button 
           onClick={() => setVisionMode('optical')}
           className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded transition-colors ${
             visionMode === 'optical' ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-white'
           }`}
         >
           Optical
         </button>
         <button 
           onClick={() => setVisionMode('thermal')}
           className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded transition-colors ${
             visionMode === 'thermal' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
           }`}
         >
           Thermal
         </button>
      </div>

      {/* HUD Elements */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
         <span className={`text-[10px] font-mono px-1 border transition-colors ${
           visionMode === 'thermal' ? 'text-orange-500 border-orange-500/30 bg-black/60' : 'text-brand-blue border-brand-blue/30 bg-black/50'
         }`}>
            SAT-V4 {visionMode === 'thermal' ? 'INFRARED' : 'LIVE FEED'}
         </span>
         <span className="text-[10px] text-slate-400 font-mono">ZOOM: 14x | TILT: 45°</span>
      </div>

      <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1">
         {weather === 'HAIL' && (
            <span className="animate-pulse text-xs text-red-500 font-mono bg-black/80 px-2 py-1 border border-red-500/50 rounded uppercase">
                ⚠ INTERFERENCE DETECTED
            </span>
         )}
         <span className="animate-pulse text-xs text-red-500 font-mono bg-black/80 px-2 py-1 border border-red-500/50 rounded">
          {visionMode === 'thermal' ? 'HEAT LEAK DETECTION: ACTIVE' : 'DETECTING ANOMALIES'}
        </span>
      </div>

      {/* Target Reticle */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border rounded-full flex items-center justify-center transition-colors ${
          visionMode === 'thermal' ? 'border-orange-500/30' : 'border-brand-blue/30'
      }`}>
        <div className={`w-2 h-2 rounded-full ${visionMode === 'thermal' ? 'bg-orange-500' : 'bg-brand-blue'}`}></div>
        <div className={`absolute top-0 w-px h-4 ${visionMode === 'thermal' ? 'bg-orange-500' : 'bg-brand-blue'}`}></div>
        <div className={`absolute bottom-0 w-px h-4 ${visionMode === 'thermal' ? 'bg-orange-500' : 'bg-brand-blue'}`}></div>
        <div className={`absolute left-0 w-4 h-px ${visionMode === 'thermal' ? 'bg-orange-500' : 'bg-brand-blue'}`}></div>
        <div className={`absolute right-0 w-4 h-px ${visionMode === 'thermal' ? 'bg-orange-500' : 'bg-brand-blue'}`}></div>
      </div>
    </div>
  );
};

export default SatelliteVisualizer;