import React, { useRef, useEffect } from 'react';
import { Lead } from '../types';

interface LeadTableProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}

const LeadTable: React.FC<LeadTableProps> = ({ 
  leads, 
  onLeadClick, 
  selectedIds, 
  onToggleSelect, 
  onToggleSelectAll 
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current && selectedIds.size === 0) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [leads.length, selectedIds.size]);

  const allSelected = leads.length > 0 && selectedIds.size === leads.length;

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-900 rounded-lg border border-slate-700 shadow-xl m-4 relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-blue via-purple-500 to-brand-blue opacity-50"></div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-800 text-slate-400 font-mono text-xs uppercase sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 w-8 text-center">
                <input 
                  type="checkbox" 
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-600 bg-slate-700 text-brand-blue focus:ring-brand-blue cursor-pointer"
                />
              </th>
              <th className="px-2 py-3 font-semibold w-10"></th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">Address</th>
              <th className="px-4 py-3 font-semibold">City</th>
              <th className="px-4 py-3 font-semibold">Rival Activity</th>
              <th className="px-4 py-3 font-semibold">Zip</th>
              <th className="px-4 py-3 font-semibold text-right">Roof Age</th>
              <th className="px-4 py-3 font-semibold">Condition</th>
              <th className="px-4 py-3 font-semibold text-right">Sat. Conf.</th>
              <th className="px-4 py-3 font-semibold text-right">Scanned At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
            {leads.map((lead) => (
              <tr 
                key={lead.id} 
                onClick={() => onLeadClick(lead)}
                className={`hover:bg-slate-800/80 hover:cursor-pointer transition-all animate-fade-in group ${
                  lead.status === 'Archived' ? 'opacity-40 grayscale' : 
                  lead.status === 'Lost' ? 'opacity-50 bg-red-900/10' : ''
                } ${selectedIds.has(lead.id) ? 'bg-brand-blue/10' : ''}`}
              >
                <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                   <input 
                     type="checkbox" 
                     checked={selectedIds.has(lead.id)}
                     onChange={() => onToggleSelect(lead.id)}
                     disabled={lead.status === 'Lost'}
                     className="rounded border-slate-600 bg-slate-700 text-brand-blue focus:ring-brand-blue cursor-pointer disabled:opacity-50"
                   />
                </td>
                <td className="px-2 py-2 text-center">
                   {lead.status === 'Secured' && (
                     <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] mx-auto"></div>
                   )}
                   {lead.status === 'Claimed' && (
                     <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(0,174,239,0.6)] mx-auto"></div>
                   )}
                   {lead.status === 'New' && (
                     <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mx-auto"></div>
                   )}
                   {lead.status === 'Lost' && (
                     <div className="text-red-500 text-[10px] font-bold">X</div>
                   )}
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    lead.status === 'Lost' ? 'bg-slate-700 text-slate-400 border border-slate-600' :
                    lead.condition === 'Critical' ? 'bg-red-900 text-red-200 shadow-[0_0_10px_rgba(127,29,29,0.4)]' :
                    lead.condition === 'Poor' ? 'bg-orange-900 text-orange-200' :
                    'bg-yellow-900 text-yellow-200'
                  }`}>
                    {lead.status === 'Lost' ? 'LOST' : lead.condition.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-500 group-hover:text-brand-blue transition-colors">#{lead.id}</td>
                <td className={`px-4 py-2 font-medium text-white ${lead.status === 'Lost' ? 'line-through decoration-red-500/50 decoration-2' : ''}`}>
                    {lead.address}
                    {lead.assignedTeam && !lead.status.includes('Secured') && (
                        <span className="ml-2 text-xs text-green-400 animate-pulse">[TEAM {lead.assignedTeam}]</span>
                    )}
                </td>
                <td className="px-4 py-2">{lead.city}</td>
                
                {/* Competitor Activity */}
                <td className="px-4 py-2">
                    {lead.status === 'Lost' ? (
                        <span className="text-red-500 font-bold tracking-wider">SECURED BY RIVAL</span>
                    ) : (
                        <>
                        {lead.competitorActivity === 'High' && (
                            <div className="flex items-center gap-2 text-purple-400 font-bold">
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                                HIGH
                            </div>
                        )}
                        {lead.competitorActivity === 'Moderate' && <span className="text-purple-300/70">Moderate</span>}
                        {(lead.competitorActivity === 'Low' || lead.competitorActivity === 'None') && <span className="text-slate-600">-</span>}
                        </>
                    )}
                </td>

                <td className="px-4 py-2">{lead.zip}</td>
                <td className="px-4 py-2 text-right">{lead.roofAge} yr</td>
                <td className="px-4 py-2">{lead.condition}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-blue" 
                        style={{ width: `${lead.satelliteConfidence}%` }}
                      ></div>
                    </div>
                    <span>{lead.satelliteConfidence}%</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right text-slate-500">{lead.lastScanned}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center text-slate-500 italic">
                  Awaiting satellite feed... Initiate scan to begin data stream.
                </td>
              </tr>
            )}
            <tr ref={bottomRef}></tr>
          </tbody>
        </table>
      </div>
      
      <div className="bg-slate-800 p-2 flex justify-between items-center text-xs text-slate-500 font-mono border-t border-slate-700">
        <div className="flex items-center gap-4">
           <span className="text-brand-blue hidden md:inline">Shift+Click to select ranges (coming soon)</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="hidden md:inline">LATENCY: 42ms</span>
          <span className="hidden md:inline">UPLINK: ACTIVE</span>
        </div>
      </div>
    </div>
  );
};

export default LeadTable;