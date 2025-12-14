import React, { useState, useRef, useEffect } from 'react';
import { Lead, WeatherCondition, ChatMessage } from '../types';
import { generateOutreach, negotiateWithHomeowner } from '../services/geminiService';
import { playAlert } from '../services/audioService';

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onAction: (id: string, action: 'Claimed' | 'Archived') => void;
  onUpdate: (lead: Lead) => void;
  availableTeams: string[];
  onDeployTeam: (leadId: string, team: string) => void;
  onDeepScan: (leadId: string) => void;
  weather: WeatherCondition;
  onBook: (leadId: string) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onAction, onUpdate, availableTeams, onDeployTeam, onDeepScan, weather, onBook }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'outreach' | 'intel' | 'direct'>('analysis');
  const [outreachData, setOutreachData] = useState<{ subject: string; body: string; sms: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDroneLaunching, setIsDroneLaunching] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  // New State for Thermal View
  const [isThermal, setIsThermal] = useState(false);

  useEffect(() => {
    if (activeTab === 'direct' && chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, lead?.negotiationMessages]);

  if (!lead) return null;

  const handleGenerateOutreach = async () => {
    setIsGenerating(true);
    try {
      const data = await generateOutreach(lead);
      setOutreachData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLaunchDrone = () => {
    setIsDroneLaunching(true);
    setTimeout(() => {
        const updatedLead: Lead = {
            ...lead,
            inspectionType: 'Drone',
            satelliteConfidence: 99,
            imageUrl: lead.imageUrl + '?drone=true', 
            condition: Math.random() > 0.7 && lead.condition === 'Fair' ? 'Poor' : lead.condition,
        };
        onUpdate(updatedLead);
        setIsDroneLaunching(false);
    }, 3000);
  };

  const handleNegotiationSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || isTyping) return;

      const userMsg: ChatMessage = { role: 'user', content: chatInput, timestamp: Date.now() };
      const newHistory = [...(lead.negotiationMessages || []), userMsg];
      
      // Optimistic update
      const updatedLead = { ...lead, negotiationMessages: newHistory };
      onUpdate(updatedLead);
      setChatInput('');
      setIsTyping(true);

      // AI Response
      try {
          const { reply, booked } = await negotiateWithHomeowner(updatedLead, newHistory, userMsg.content);
          
          setTimeout(() => {
              const aiMsg: ChatMessage = { role: 'assistant', content: reply, timestamp: Date.now() };
              const finalHistory = [...newHistory, aiMsg];
              
              if (booked) {
                  onBook(lead.id);
                  playAlert("Appointment confirmed. Commission registered.", "high");
              } else {
                  playAlert("New message from homeowner.");
              }

              onUpdate({ 
                  ...updatedLead, 
                  negotiationMessages: finalHistory,
                  status: booked ? 'Booked' : lead.status
              });
              setIsTyping(false);
          }, 1500 + Math.random() * 1000); // Simulated typing delay

      } catch (e) {
          setIsTyping(false);
      }
  };

  const isDroneAllowed = weather !== 'HAIL';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-slate-900 border border-brand-blue rounded-lg shadow-[0_0_50px_rgba(0,174,239,0.15)] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative flex flex-col md:flex-row animate-fade-in z-10">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 z-20 p-2 text-slate-400 hover:text-white bg-black/50 hover:bg-red-500/20 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Left Column: Visuals */}
        <div className="w-full md:w-1/2 p-0 bg-black relative min-h-[300px] md:min-h-full flex flex-col overflow-hidden">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start">
            <span className={`text-white text-xs font-bold px-2 py-1 rounded shadow ${
                lead.inspectionType === 'Drone' ? 'bg-purple-600' : 'bg-brand-blue/90'
            }`}>
                {lead.inspectionType === 'Drone' ? 'DRONE FEED' : 'SAT-VIEW'}
            </span>
            {isThermal && (
               <span className="text-white text-xs font-bold px-2 py-1 rounded shadow bg-orange-500 animate-pulse">
                  THERMAL ON
               </span>
            )}
            {lead.assignedTeam && !['Secured', 'Booked'].includes(lead.status) && (
                <div className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-2 animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    TEAM {lead.assignedTeam.toUpperCase()} ON SITE
                </div>
            )}
            {['Secured', 'Booked'].includes(lead.status) && (
                <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {lead.status.toUpperCase()}
                </div>
            )}
          </div>

          <div className="absolute top-4 right-4 z-10">
             <button
               onClick={() => setIsThermal(!isThermal)}
               className={`w-8 h-8 rounded flex items-center justify-center border transition-all ${
                 isThermal ? 'bg-orange-500/20 border-orange-500 text-orange-500' : 'bg-black/50 border-slate-500 text-slate-400 hover:text-white'
               }`}
               title="Toggle Thermal Vision"
             >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
               </svg>
             </button>
          </div>
          
          <div className="relative w-full h-2/3 overflow-hidden">
             <img 
                src={lead.imageUrl} 
                alt="Inspection View" 
                className={`w-full h-full object-cover transition-all duration-1000 ${
                  isDroneLaunching ? 'scale-125 blur-sm opacity-50' : 'opacity-80'
                } ${
                  isThermal ? 'sepia contrast-150 hue-rotate-180 invert brightness-90' : ''
                }`}
             />
             
             {/* Deployment Overlay */}
             {lead.assignedTeam && !['Secured', 'Booked'].includes(lead.status) && (
                 <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4 border-t border-green-500">
                     <div className="flex justify-between text-green-400 text-xs font-mono mb-1">
                         <span>STRIKE TEAM {lead.assignedTeam.toUpperCase()}</span>
                         <span>SECURING ASSET... {Math.round(lead.teamProgress || 0)}%</span>
                     </div>
                     <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                         <div 
                             className="h-full bg-green-500 transition-all duration-1000 ease-linear"
                             style={{ width: `${lead.teamProgress || 0}%` }}
                         ></div>
                     </div>
                 </div>
             )}

             {/* Drone HUD Overlay */}
             {isDroneLaunching && (
                 <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                     <div className="w-64 h-64 border-2 border-purple-500 rounded-full animate-ping opacity-20 absolute"></div>
                     <div className="w-48 h-48 border border-white/30 rounded-full animate-spin"></div>
                     <div className="text-purple-400 font-mono font-bold animate-pulse mt-4 bg-black/50 px-2">DRONE DEPLOYING...</div>
                     <div className="text-xs text-white font-mono mt-1">Acquiring High-Res Target</div>
                 </div>
             )}

             {/* Static HUD */}
             <div className="absolute inset-0 pointer-events-none opacity-30 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
             {lead.inspectionType === 'Drone' && (
                 <div className="absolute bottom-4 right-4 z-10 border border-purple-500/50 bg-purple-900/20 px-2 py-1 rounded text-purple-300 text-[10px] font-mono">
                     4K RESOLUTION // ALT: 50ft
                 </div>
             )}
          </div>
          
          <div className="flex-1 bg-black p-6 border-t border-slate-800 flex flex-col">
             <h3 className="text-slate-500 text-xs font-mono uppercase mb-2">Spectral Analysis</h3>
             <div className="flex gap-4">
                <div className="text-center">
                    <div className="text-2xl font-mono text-red-500">{lead.roofAge}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Est. Age (Yrs)</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-mono text-brand-blue">{lead.pitch}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Roof Pitch</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-mono text-yellow-500">{lead.surfaceArea.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Surface (Sq Ft)</div>
                </div>
             </div>
             
             <div className="mt-4 grid grid-cols-2 gap-3">
                {(!lead.inspectionType || lead.inspectionType === 'Satellite') && (
                    <button 
                        onClick={handleLaunchDrone}
                        disabled={isDroneLaunching || ['Secured', 'Booked'].includes(lead.status) || !isDroneAllowed}
                        className={`bg-purple-900/30 border text-xs font-bold py-2 rounded uppercase tracking-wider transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed ${
                           !isDroneAllowed 
                             ? 'border-red-500/30 text-red-400 cursor-not-allowed' 
                             : 'border-purple-500/30 hover:bg-purple-900/50 hover:border-purple-400 text-purple-300'
                        }`}
                        title={!isDroneAllowed ? "Drones grounded due to weather" : ""}
                    >
                        {isDroneLaunching ? 'Deploying...' : !isDroneAllowed ? 'Weather Lock' : 'Drone Recon'}
                    </button>
                )}
                
                {lead.status !== 'Secured' && lead.status !== 'Booked' && !lead.assignedTeam && (
                    <button 
                        onClick={() => {
                            if(availableTeams.length > 0) onDeployTeam(lead.id, availableTeams[0]);
                        }}
                        disabled={availableTeams.length === 0}
                        className={`bg-green-900/30 border border-green-500/30 text-green-300 text-xs font-bold py-2 rounded uppercase tracking-wider transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed ${
                            lead.inspectionType === 'Drone' ? 'col-span-1' : 'col-span-1'
                        } ${(!lead.inspectionType || lead.inspectionType === 'Satellite') ? '' : 'col-span-2'}`}
                    >
                        {availableTeams.length > 0 ? `Deploy Team ${availableTeams[0]}` : 'Teams Busy'}
                    </button>
                )}
             </div>
          </div>
        </div>

        {/* Right Column: Data */}
        <div className="w-full md:w-1/2 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-slate-700">
                <button 
                  onClick={() => setActiveTab('analysis')}
                  className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'analysis' ? 'bg-slate-800 text-brand-blue border-b-2 border-brand-blue' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    Data
                </button>
                <button 
                  onClick={() => setActiveTab('outreach')}
                  className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'outreach' ? 'bg-slate-800 text-brand-blue border-b-2 border-brand-blue' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    Scripts
                </button>
                <button 
                  onClick={() => setActiveTab('direct')}
                  className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 ${activeTab === 'direct' ? 'bg-slate-800 text-brand-blue border-b-2 border-brand-blue' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    <span className={`w-2 h-2 rounded-full ${lead.status !== 'New' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></span>
                    Direct Line
                </button>
                <button 
                  onClick={() => setActiveTab('intel')}
                  className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'intel' ? 'bg-slate-800 text-brand-blue border-b-2 border-brand-blue' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    Intel
                </button>
            </div>

            {activeTab === 'analysis' && (
                <div className="p-6 md:p-8 flex flex-col gap-6 flex-1">
                    <div>
                        <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-white mb-1">{lead.address}</h2>
                        {lead.status !== 'New' && (
                            <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                            lead.status === 'Claimed' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
                            ['Secured', 'Booked'].includes(lead.status) ? 'bg-green-500 text-black border border-green-400' :
                            'bg-slate-700 text-slate-400'
                            }`}>
                            {lead.status}
                            </span>
                        )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span>{lead.city}, {lead.state} {lead.zip}</span>
                        <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                        <span className="font-mono text-brand-blue">ID: {lead.id}</span>
                        </div>
                    </div>

                    {/* Competitor Warning */}
                    {lead.competitorActivity === 'High' && (
                        <div className="bg-purple-900/30 border border-purple-500/50 p-3 rounded flex items-center gap-3">
                           <div className="p-2 bg-purple-500/20 rounded-full">
                              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                           </div>
                           <div>
                              <div className="text-purple-300 font-bold text-xs uppercase tracking-wide">Competitor Activity High</div>
                              <div className="text-purple-200/70 text-xs">High rival traffic in this sector. Engage immediately.</div>
                           </div>
                        </div>
                    )}

                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-xs text-slate-400 uppercase font-mono mb-1">Damage Vector</div>
                            <div className="text-lg text-white font-bold">{lead.damageVector.toUpperCase()} DETECTED</div>
                        </div>
                        <div className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                            lead.condition === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 
                            lead.condition === 'Poor' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                        }`}>
                            Condition: {lead.condition}
                        </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Confidence Score</span>
                                <span className={`font-mono font-bold ${lead.satelliteConfidence > 95 ? 'text-green-400' : 'text-white'}`}>{lead.satelliteConfidence}%</span>
                            </div>
                            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full ${lead.satelliteConfidence > 95 ? 'bg-green-500' : 'bg-brand-blue'}`} style={{ width: `${lead.satelliteConfidence}%` }}></div>
                            </div>
                            
                            <div className="flex justify-between text-sm mt-3">
                                <span className="text-slate-400">Thermal Efficiency Drop</span>
                                <span className="text-white font-mono">12.4%</span>
                            </div>
                            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-orange-500 h-full" style={{ width: '12.4%' }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h4 className="text-xs text-slate-400 uppercase font-mono mb-3">AI Recommendation</h4>
                        <p className="text-sm text-slate-300 leading-relaxed bg-slate-900 border-l-2 border-brand-blue pl-3 py-1">
                            {lead.inspectionType === 'Drone' 
                                ? `Drone flyover confirms ${lead.damageVector.toLowerCase()} damage with high precision. Immediate intervention recommended.`
                                : `Satellite imagery indicates high probability of ${lead.damageVector.toLowerCase()} damage consistent with recent weather patterns. Recommended for Roofmaxx rejuvenation.`
                            }
                        </p>
                    </div>

                    {lead.status === 'New' && !lead.assignedTeam && (
                        <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button 
                            onClick={() => onAction(lead.id, 'Archived')}
                            className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded text-sm font-bold transition-colors"
                        >
                            ARCHIVE
                        </button>
                        <button 
                            onClick={() => onAction(lead.id, 'Claimed')}
                            className="bg-brand-blue hover:bg-blue-600 text-white py-3 rounded text-sm font-bold tracking-wide shadow-lg shadow-blue-500/20 transition-all"
                        >
                            CLAIM LEAD
                        </button>
                        </div>
                    )}
                    
                    {lead.status !== 'New' && (
                        <div className="mt-auto text-center p-3 bg-slate-800 rounded border border-slate-700">
                        <span className="text-slate-400 text-sm">Action Taken: </span>
                        <span className={`font-bold ${
                            ['Secured', 'Booked'].includes(lead.status) ? 'text-green-400' : 
                            lead.status === 'Claimed' ? 'text-blue-400' : 'text-slate-300'
                        }`}>{lead.status.toUpperCase()}</span>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'intel' && (
                <div className="p-6 md:p-8 flex flex-col gap-6 flex-1 h-full items-center justify-center text-center">
                    {!lead.isIntelDecrypted ? (
                        <div className="space-y-6 max-w-sm">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-2 border-slate-600">
                                <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Restricted Data</h3>
                                <p className="text-slate-400 text-sm">Owner identity and insurance records are encrypted. Decryption requires resource allocation.</p>
                            </div>
                            <div className="bg-slate-800 p-4 rounded border border-slate-700">
                                <div className="flex justify-between text-xs text-slate-400 mb-2">
                                    <span>DECRYPTION COST</span>
                                    <span className="text-yellow-500">50 XP</span>
                                </div>
                                <button 
                                    onClick={() => onDeepScan(lead.id)}
                                    className="w-full bg-brand-blue hover:bg-blue-600 text-white py-2 rounded font-bold uppercase tracking-wider transition-colors shadow-lg"
                                >
                                    Initialize Deep Scan
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-start text-left space-y-6">
                             <div className="flex items-center gap-3 w-full border-b border-slate-700 pb-4">
                                <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold uppercase tracking-wider">Intel Decrypted</h3>
                                    <p className="text-green-500 text-xs font-mono">ACCESS GRANTED</p>
                                </div>
                             </div>

                             <div className="space-y-6 w-full">
                                <div className="bg-slate-800/50 p-4 rounded border border-slate-700 w-full">
                                    <span className="text-xs text-slate-500 font-mono uppercase block mb-1">Property Owner</span>
                                    <div className="text-xl text-white font-bold tracking-wide">{lead.ownerName || 'Unknown'}</div>
                                    <div className="text-xs text-slate-400 mt-1">Confidence: 99.9% (Public Records Cross-Ref)</div>
                                </div>

                                <div className="bg-slate-800/50 p-4 rounded border border-slate-700 w-full">
                                    <span className="text-xs text-slate-500 font-mono uppercase block mb-1">Insurance Carrier</span>
                                    <div className="text-xl text-white font-bold tracking-wide">{lead.insuranceCarrier || 'Unknown'}</div>
                                    <div className="text-xs text-slate-400 mt-1">Policy Active: Likely</div>
                                </div>

                                <div className="bg-slate-800/50 p-4 rounded border border-slate-700 w-full">
                                    <span className="text-xs text-slate-500 font-mono uppercase block mb-1">Last Permit Date</span>
                                    <div className="text-xl text-white font-bold tracking-wide">2008-05-14</div>
                                    <div className="text-xs text-slate-400 mt-1">Re-roofing Permit #49281</div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'outreach' && (
                <div className="p-6 md:p-8 flex flex-col gap-6 flex-1 h-full">
                    {/* Outreach tab content */}
                    {lead.status === 'New' ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Uplink Locked</h3>
                            <p className="text-slate-400 max-w-xs">You must claim this lead before establishing communication protocols.</p>
                            <button 
                                onClick={() => onAction(lead.id, 'Claimed')}
                                className="bg-brand-blue hover:bg-blue-600 text-white py-2 px-6 rounded text-sm font-bold shadow-lg transition-all"
                            >
                                CLAIM LEAD
                            </button>
                        </div>
                    ) : (
                        <>
                            {!outreachData ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                                    <div className="w-16 h-16 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue animate-pulse">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                                        </svg>
                                    </div>
                                    <div className="max-w-xs">
                                        <h3 className="text-lg font-bold text-white mb-2">Initialize Outreach</h3>
                                        <p className="text-slate-400 text-sm">Generate personalized email & SMS scripts using satellite telemetry data.</p>
                                    </div>
                                    <button 
                                        onClick={handleGenerateOutreach}
                                        disabled={isGenerating}
                                        className="bg-brand-blue hover:bg-blue-600 text-white py-3 px-8 rounded text-sm font-bold shadow-[0_0_20px_rgba(0,174,239,0.4)] transition-all flex items-center gap-2"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                GENERATING...
                                            </>
                                        ) : 'GENERATE SCRIPTS'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 h-full overflow-y-auto">
                                    <div className="bg-slate-800 rounded p-4 border border-slate-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-mono uppercase text-slate-500">Email Subject</span>
                                            <button className="text-xs text-brand-blue hover:text-white" onClick={() => navigator.clipboard.writeText(outreachData.subject)}>COPY</button>
                                        </div>
                                        <div className="text-white font-medium">{outreachData.subject}</div>
                                    </div>

                                    <div className="bg-slate-800 rounded p-4 border border-slate-700 flex-1">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-mono uppercase text-slate-500">Email Body</span>
                                            <button className="text-xs text-brand-blue hover:text-white" onClick={() => navigator.clipboard.writeText(outreachData.body)}>COPY</button>
                                        </div>
                                        <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{outreachData.body}</div>
                                    </div>

                                    <div className="bg-slate-800 rounded p-4 border border-slate-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-mono uppercase text-slate-500">SMS Script</span>
                                            <button className="text-xs text-brand-blue hover:text-white" onClick={() => navigator.clipboard.writeText(outreachData.sms)}>COPY</button>
                                        </div>
                                        <div className="text-slate-300 text-sm">{outreachData.sms}</div>
                                    </div>
                                    
                                    <button onClick={() => setOutreachData(null)} className="w-full py-2 text-xs text-slate-500 hover:text-white">REGENERATE</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {activeTab === 'direct' && (
                <div className="flex flex-col h-full bg-slate-950">
                    {/* Header */}
                    <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${lead.status === 'Booked' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                            <div>
                                <div className="text-sm font-bold text-white">Homeowner (Unknown)</div>
                                <div className="text-xs text-slate-400 font-mono">
                                    MOOD DETECTED: <span className={`${
                                        lead.homeownerMood === 'Angry' ? 'text-red-400' : 
                                        lead.homeownerMood === 'Interested' ? 'text-green-400' : 'text-yellow-400'
                                    }`}>{lead.homeownerMood?.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                        {lead.status === 'Booked' && (
                            <div className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded text-xs font-bold uppercase animate-pulse">
                                Appointment Confirmed
                            </div>
                        )}
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {(!lead.negotiationMessages || lead.negotiationMessages.length === 0) && (
                            <div className="text-center text-slate-500 text-sm italic mt-10">
                                Start the conversation. Introduce yourself and mention the roof condition.
                            </div>
                        )}
                        
                        {lead.negotiationMessages?.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                                    msg.role === 'user' 
                                      ? 'bg-brand-blue text-white rounded-br-none' 
                                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 text-slate-400 p-3 rounded-lg border border-slate-700 text-xs italic flex items-center gap-1">
                                    <span>Homeowner is typing</span>
                                    <span className="animate-bounce">.</span>
                                    <span className="animate-bounce delay-100">.</span>
                                    <span className="animate-bounce delay-200">.</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatBottomRef}></div>
                    </div>

                    {/* Input */}
                    <form onSubmit={handleNegotiationSend} className="p-4 bg-slate-900 border-t border-slate-700 flex gap-2">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={lead.status === 'New' ? "Claim lead to enable chat..." : "Type your message..."}
                            disabled={lead.status === 'New' || lead.status === 'Booked' || isTyping}
                            className="flex-1 bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-brand-blue disabled:opacity-50"
                        />
                        <button 
                            type="submit"
                            disabled={lead.status === 'New' || lead.status === 'Booked' || isTyping}
                            className="bg-brand-blue hover:bg-blue-600 text-white px-4 py-2 rounded font-bold transition-colors disabled:opacity-50"
                        >
                            SEND
                        </button>
                    </form>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;