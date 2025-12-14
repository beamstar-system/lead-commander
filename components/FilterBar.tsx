import React from 'react';

interface FilterBarProps {
  viewMode: 'list' | 'map';
  onViewChange: (mode: 'list' | 'map') => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExport: () => void;
  count: number;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  viewMode, 
  onViewChange, 
  filter, 
  onFilterChange, 
  searchQuery,
  onSearchChange,
  onExport,
  count
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 p-2 flex flex-wrap gap-4 justify-between items-center">
      
      <div className="flex items-center gap-4 flex-1">
        <div className="flex bg-slate-800 rounded p-1 border border-slate-700 shrink-0">
          <button
            onClick={() => onViewChange('list')}
            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all ${
              viewMode === 'list' 
                ? 'bg-slate-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => onViewChange('map')}
            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all ${
              viewMode === 'map' 
                ? 'bg-slate-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Radar Map
          </button>
        </div>

        <div className="h-6 w-px bg-slate-700 hidden md:block"></div>

        <div className="relative flex-1 max-w-md">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
           </div>
           <input 
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="SEARCH SECTOR DATA..."
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded pl-9 pr-3 py-1.5 w-full focus:outline-none focus:border-brand-blue font-mono placeholder:text-slate-600"
           />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-mono uppercase hidden lg:inline">Filter:</span>
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-brand-blue"
          >
            <option value="all">ALL CONDITIONS</option>
            <option value="Critical">CRITICAL ONLY</option>
            <option value="Poor">POOR + CRITICAL</option>
            <option value="Fair">FAIR ONLY</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span className="text-xs text-slate-500 font-mono hidden md:inline">
          {count} RECORDS FOUND
        </span>
        <button 
          onClick={onExport}
          disabled={count === 0}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
            count === 0 
              ? 'border-slate-800 text-slate-600 cursor-not-allowed' 
              : 'border-brand-blue/30 text-brand-blue hover:bg-brand-blue hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="hidden md:inline">EXPORT CSV</span>
          <span className="md:hidden">CSV</span>
        </button>
      </div>
    </div>
  );
};

export default FilterBar;