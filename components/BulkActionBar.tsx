import React from 'react';

interface BulkActionBarProps {
  count: number;
  onClaim: () => void;
  onArchive: () => void;
  onClear: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({ count, onClaim, onArchive, onClear }) => {
  if (count === 0) return null;

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-brand-blue text-white px-6 py-3 rounded-full shadow-[0_0_30px_rgba(0,174,239,0.5)] flex items-center gap-6 z-50 transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 border border-white/20">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="font-bold font-mono text-sm tracking-wide">{count} UNITS SELECTED</div>
      </div>
      
      <div className="h-6 w-px bg-white/30"></div>
      
      <div className="flex gap-2">
        <button 
          onClick={onClaim} 
          className="bg-white/10 hover:bg-white/20 hover:shadow-lg border border-white/10 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          Batch Claim
        </button>
        <button 
          onClick={onArchive} 
          className="bg-slate-900/30 hover:bg-red-900/50 hover:border-red-500/50 border border-transparent px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all text-slate-100"
        >
          Archive
        </button>
      </div>

      <button onClick={onClear} className="ml-2 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default BulkActionBar;