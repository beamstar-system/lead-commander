import React from 'react';

const NewsTicker = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-brand-dark/95 border-t border-slate-700 h-8 flex items-center z-40 overflow-hidden">
        <div className="bg-brand-blue px-3 h-full flex items-center font-bold text-xs text-white z-10 shadow-[0_0_15px_rgba(0,174,239,0.5)]">
            LIVE UPLINK
        </div>
        <div className="whitespace-nowrap flex items-center gap-12 text-xs font-mono text-slate-400 pl-4 animate-ticker-scroll w-full">
            <span className="flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> WEATHER ALERT: SEVERE HAIL DETECTED IN SECTOR 7 (OKLAHOMA)</span>
            <span>MARKET DATA: ASPHALT SHINGLE PRICES UP 2.4%</span>
            <span>SYSTEM STATUS: SATELLITE ARRAY V4 ONLINE</span>
            <span>NEW LEADS: +124 DETECTED IN LAST HOUR</span>
            <span>ROOFMAXX: REJUVENATION UPTAKE INCREASED BY 15% Q3</span>
            <span>THERMAL SCANS: CALIBRATING... OK</span>
            <span>REGIONAL ALERT: HIGH WIND ADVISORY IN EFFECT FOR MIDWEST</span>
        </div>
        <style>{`
            .animate-ticker-scroll {
                animation: ticker 30s linear infinite;
                will-change: transform;
            }
            @keyframes ticker {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }
        `}</style>
    </div>
  );
};
export default NewsTicker;