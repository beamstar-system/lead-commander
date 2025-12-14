import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from './components/Header';
import LeadTable from './components/LeadTable';
import ScannerControl from './components/ScannerControl';
import SatelliteVisualizer from './components/SatelliteVisualizer';
import LeadDetailModal from './components/LeadDetailModal';
import FilterBar from './components/FilterBar';
import RadarMap from './components/RadarMap';
import MissionControl from './components/MissionControl';
import NewsTicker from './components/NewsTicker';
import BulkActionBar from './components/BulkActionBar';
import SystemDiagnostics from './components/SystemDiagnostics';
import NotificationToast from './components/NotificationToast';
import { Lead, AppStatus, Notification, WeatherCondition, Rival } from './types';
import { fetchLeadsForRegion } from './services/geminiService';
import { playAlert, setMute } from './services/audioService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [targetCity, setTargetCity] = useState('');
  const [targetState, setTargetState] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  
  // Progression & Notifications
  const [xp, setXp] = useState(120);
  const [commission, setCommission] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Weather & Rivals
  const [weather, setWeather] = useState<WeatherCondition>('CLEAR');
  const [rivals, setRivals] = useState<Rival[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  // Selection State for Bulk Actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  
  // New UI State
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Refs to manage scanning loop interval
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const teamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const weatherIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rivalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper to add notification
  const addNotification = (message: string, type: 'success' | 'info' | 'warning' | 'error', xpGain?: number) => {
    const id = Math.random().toString(36).substring(7);
    const newNotif: Notification = { id, message, type, xp: xpGain };
    
    setNotifications(prev => [...prev, newNotif]);
    if (xpGain) setXp(prev => prev + xpGain);

    // Auto dismiss
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const toggleMute = () => {
      setIsMuted(!isMuted);
      setMute(!isMuted);
  }

  const startScanning = (city: string, state: string) => {
    setTargetCity(city);
    setTargetState(state);
    setStatus(AppStatus.SCANNING);
    addNotification(`SCAN INITIATED: ${city}, ${state}`, 'info');
    playAlert("Scan initiated. Satellite uplink active.");
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setStatus(AppStatus.PAUSED);
    addNotification('SCANNER HALTED BY OPERATOR', 'warning');
    playAlert("Scanner halted.");
  };

  const handleLeadAction = (id: string, action: 'Claimed' | 'Archived') => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: action } : l));
    if (action === 'Archived') {
      setSelectedLead(null);
      addNotification('ASSET ARCHIVED', 'info', 10);
    } else if (action === 'Claimed') {
      addNotification('ASSET SECURED: PIPELINE UPDATED', 'success', 150);
      playAlert("Asset secured.");
    }
  };

  const handleLeadUpdate = (updatedLead: Lead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    setSelectedLead(updatedLead);
    if (updatedLead.inspectionType === 'Drone') {
      addNotification('DRONE RECON COMPLETE: DATA ENRICHED', 'success', 50);
      playAlert("Drone recon complete.");
    }
  };

  const handleLeadBooked = (leadId: string) => {
     // Called when negotiation succeeds
     const commissionAmount = 750 + Math.floor(Math.random() * 500);
     setCommission(prev => prev + commissionAmount);
     setXp(prev => prev + 500);
     addNotification(`APPOINTMENT CONFIRMED! COMMISSION: $${commissionAmount}`, 'success', 500);
  };

  // Strike Team Logic
  const allTeams = ['Alpha', 'Bravo', 'Charlie'];
  const activeTeamsCount = leads.filter(l => l.assignedTeam).length;
  const availableTeams = allTeams.filter(t => !leads.some(l => l.assignedTeam === t));

  const handleDeployTeam = (leadId: string, team: string) => {
    setLeads(prev => prev.map(l => 
        l.id === leadId 
        ? { ...l, assignedTeam: team as any, teamProgress: 0, status: 'Claimed' } 
        : l
    ));
    addNotification(`STRIKE TEAM ${team} DEPLOYED TO SECTOR ${leadId.substring(0,4)}`, 'info');
    playAlert(`Strike Team ${team} deployed.`);
  };

  // Deep Scan Logic
  const handleDeepScan = (leadId: string) => {
      if (xp < 50) {
          addNotification('INSUFFICIENT XP FOR DEEP SCAN', 'error');
          return;
      }
      
      setXp(prev => prev - 50);
      
      // Generate mock data for deep scan
      const names = ['John Smith', 'Sarah Conner', 'Michael Chang', 'Elena Rodriguez', 'Robert Ford'];
      const carriers = ['State Farm', 'Allstate', 'Liberty Mutual', 'Travelers', 'Farmers'];
      
      const updatedLead: Partial<Lead> = {
          ownerName: names[Math.floor(Math.random() * names.length)],
          insuranceCarrier: carriers[Math.floor(Math.random() * carriers.length)],
          isIntelDecrypted: true
      };

      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updatedLead } : l));
      
      // Update selected lead if it's the one being scanned
      if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(prev => prev ? { ...prev, ...updatedLead } : null);
      }
      
      addNotification('INTEL DECRYPTED: OWNER DATA SECURED', 'success');
      playAlert("Intel decryption successful.");
  };

  // Weather Cycle Logic
  useEffect(() => {
    weatherIntervalRef.current = setInterval(() => {
        const rand = Math.random();
        let nextWeather: WeatherCondition = 'CLEAR';
        if (rand > 0.7) nextWeather = 'WIND';
        if (rand > 0.9) nextWeather = 'HAIL';
        
        if (nextWeather !== weather) {
            setWeather(nextWeather);
            if (nextWeather === 'HAIL') {
                addNotification('ALERT: SEVERE HAIL STORM DETECTED', 'warning');
                playAlert("Alert. Severe hail storm detected. Drones grounded.", "high");
            }
            if (nextWeather === 'WIND') {
                addNotification('ADVISORY: HIGH WINDS IN SECTOR', 'info');
                playAlert("High winds advisory in sector.");
            }
            if (nextWeather === 'CLEAR') {
                addNotification('WEATHER CLEARING: VFR CONDITIONS', 'info');
                playAlert("Weather clearing. V F R conditions restored.");
            }
        }
    }, 45000); 

    return () => {
        if (weatherIntervalRef.current) clearInterval(weatherIntervalRef.current);
    }
  }, [weather]);

  // Rival Logic
  useEffect(() => {
    rivalIntervalRef.current = setInterval(() => {
        setRivals(currentRivals => {
            // 1. Move existing rivals
            let updatedRivals = currentRivals.map(rival => {
                const target = leads.find(l => l.id === rival.targetLeadId);
                if (!target || target.status !== 'New') return null; // Target gone or claimed

                const dx = target.lat - rival.lat;
                const dy = target.lng - rival.lng;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < 0.001) {
                    // Rival Reached Target
                    setLeads(prev => prev.map(l => l.id === rival.targetLeadId ? { ...l, status: 'Lost' } : l));
                    addNotification(`ASSET LOST TO COMPETITOR: ${target.address}`, 'error');
                    playAlert("Asset lost to competitor.");
                    return null;
                }

                // Move closer
                const moveStep = rival.speed * 0.002;
                return {
                    ...rival,
                    lat: rival.lat + (dx / dist) * moveStep,
                    lng: rival.lng + (dy / dist) * moveStep
                };
            }).filter(Boolean) as Rival[];

            // 2. Spawn new rival? (10% chance per second if there are 'New' leads)
            const availableTargets = leads.filter(l => l.status === 'New');
            if (Math.random() > 0.90 && availableTargets.length > 0 && updatedRivals.length < 3) {
                const target = availableTargets[Math.floor(Math.random() * availableTargets.length)];
                // Spawn near target but slightly offset
                const spawnLat = target.lat + (Math.random() - 0.5) * 0.05;
                const spawnLng = target.lng + (Math.random() - 0.5) * 0.05;
                
                updatedRivals.push({
                    id: Math.random().toString(),
                    targetLeadId: target.id,
                    lat: spawnLat,
                    lng: spawnLng,
                    speed: 0.5 + Math.random() * 0.5
                });
                addNotification('RIVAL DRONE DETECTED IN AIRSPACE', 'warning');
                playAlert("Warning. Rival drone signature detected.");
            }

            return updatedRivals;
        });
    }, 1000);

    return () => {
        if (rivalIntervalRef.current) clearInterval(rivalIntervalRef.current);
    }
  }, [leads]); // Depend on leads to find targets

  const handleJamRival = (rivalId: string) => {
     setRivals(prev => prev.filter(r => r.id !== rivalId));
     addNotification('RIVAL SIGNAL JAMMED', 'success', 25);
     playAlert("Target neutralized.");
  };


  // Team Progression Interval
  useEffect(() => {
    teamIntervalRef.current = setInterval(() => {
        setLeads(currentLeads => {
            let updated = false;
            const nextLeads = currentLeads.map(lead => {
                if (lead.assignedTeam && lead.status !== 'Secured') {
                    updated = true;
                    const newProgress = (lead.teamProgress || 0) + 10; // 10% per second
                    if (newProgress >= 100) {
                        // Mission Complete
                        addNotification(`TEAM ${lead.assignedTeam} REPORT: TARGET SECURED`, 'success', 500);
                        playAlert(`Team ${lead.assignedTeam}, mission accomplished.`);
                        return { 
                            ...lead, 
                            teamProgress: 100, 
                            status: 'Secured' as const, 
                            assignedTeam: undefined 
                        };
                    }
                    return { ...lead, teamProgress: newProgress };
                }
                return lead;
            });
            return updated ? nextLeads : currentLeads;
        });
    }, 1000);

    return () => {
        if (teamIntervalRef.current) clearInterval(teamIntervalRef.current);
    };
  }, []);

  // Update selected lead if it changes in background
  useEffect(() => {
    if (selectedLead) {
        const fresh = leads.find(l => l.id === selectedLead.id);
        if (fresh && (fresh.teamProgress !== selectedLead.teamProgress || fresh.status !== selectedLead.status || fresh.negotiationMessages?.length !== selectedLead.negotiationMessages?.length)) {
            setSelectedLead(fresh);
        }
    }
  }, [leads, selectedLead]);


  // Bulk Action Handlers
  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleBatchClaim = () => {
    setLeads(prev => prev.map(l => selectedLeadIds.has(l.id) ? { ...l, status: 'Claimed' } : l));
    const count = selectedLeadIds.size;
    setSelectedLeadIds(new Set());
    addNotification(`BATCH OP: ${count} ASSETS CLAIMED`, 'success', count * 100);
    playAlert(`${count} assets claimed.`);
  };

  const handleBatchArchive = () => {
    setLeads(prev => prev.map(l => selectedLeadIds.has(l.id) ? { ...l, status: 'Archived' } : l));
    const count = selectedLeadIds.size;
    setSelectedLeadIds(new Set());
    addNotification(`BATCH OP: ${count} ASSETS ARCHIVED`, 'info', count * 10);
  };

  const handleExport = () => {
      const leadsToExport = selectedLeadIds.size > 0 
        ? leads.filter(l => selectedLeadIds.has(l.id))
        : leads;
  
      if (leadsToExport.length === 0) return;
  
      const headers = ['ID', 'Address', 'City', 'State', 'Zip', 'Status', 'Roof Age', 'Condition', 'Confidence', 'Surface Area', 'Pitch', 'Damage Vector', 'Estimated Value', 'Date Scanned', 'Inspection Type', 'Negotiation Status'];
      const rows = leadsToExport.map(lead => [
        lead.id,
        `"${lead.address}"`,
        lead.city,
        lead.state,
        lead.zip,
        lead.status,
        lead.roofAge,
        lead.condition,
        `${lead.satelliteConfidence}%`,
        lead.surfaceArea,
        lead.pitch,
        lead.damageVector,
        lead.estimatedValue,
        lead.lastScanned,
        lead.inspectionType || 'Satellite',
        lead.status === 'Booked' ? 'Appointment Confirmed' : (lead.negotiationMessages?.length ? 'In Progress' : 'Not Started')
      ]);
  
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
  
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `roofmaxx_leads_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addNotification('DATA EXPORT COMPLETE', 'success');
  };

  // Filter Logic
  const filteredLeads = useMemo(() => {
    let result = leads;
    
    // Condition Filter
    if (filterCondition === 'Poor') {
       result = result.filter(l => l.condition === 'Poor' || l.condition === 'Critical');
    } else if (filterCondition !== 'all') {
       result = result.filter(l => l.condition === filterCondition);
    }
    
    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.address.toLowerCase().includes(q) || 
        l.city.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [leads, filterCondition, searchQuery]);

  const totalPipelineValue = useMemo(() => {
      return leads
        .filter(l => l.status !== 'Archived' && l.status !== 'Lost') 
        .reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
  }, [leads]);

  // The Effect that drives the scanning process
  useEffect(() => {
    const performScan = async () => {
        if (status !== AppStatus.SCANNING) return;

        setStatus(AppStatus.ANALYZING); // Brief UI state change
        
        try {
            // Pass current weather condition to influence generation
            const newLeads = await fetchLeadsForRegion(targetCity, targetState, leads.length, weather);
            setLeads(prev => [...prev, ...newLeads]);
            
            // Random chance for "Critical" lead notification
            const critical = newLeads.find(l => l.condition === 'Critical');
            if (critical) {
               addNotification(`CRITICAL DAMAGE DETECTED: ${critical.address}`, 'warning');
               playAlert("Critical damage signature confirmed.", "high");
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (scanIntervalRef.current) {
                setStatus(AppStatus.SCANNING);
            }
        }
    };

    if (status === AppStatus.SCANNING) {
        performScan();
        scanIntervalRef.current = setInterval(performScan, 12000);
    }

    return () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, targetCity, targetState, weather]);

  return (
    <div className="flex flex-col h-screen bg-brand-dark text-slate-300">
      <Header 
        status={status} 
        leadCount={leads.length} 
        pipelineValue={totalPipelineValue}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        xp={xp}
        activeTeamsCount={activeTeamsCount}
        weather={weather}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        commission={commission}
      />
      
      <NotificationToast notifications={notifications} />

      <div className="flex flex-1 overflow-hidden relative pb-8">
        <ScannerControl 
            status={status} 
            onStart={startScanning} 
            onStop={stopScanning} 
        />
        
        <div className="flex-1 flex flex-col min-w-0 relative">
            <SatelliteVisualizer status={status} weather={weather} />
            
            <FilterBar 
                viewMode={viewMode}
                onViewChange={setViewMode}
                filter={filterCondition}
                onFilterChange={setFilterCondition}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onExport={handleExport}
                count={filteredLeads.length}
            />

            {viewMode === 'list' ? (
                <LeadTable 
                    leads={filteredLeads} 
                    onLeadClick={(lead) => setSelectedLead(lead)}
                    selectedIds={selectedLeadIds}
                    onToggleSelect={toggleSelectLead}
                    onToggleSelectAll={toggleSelectAll}
                />
            ) : (
                <RadarMap 
                    leads={filteredLeads}
                    onLeadClick={(lead) => setSelectedLead(lead)}
                    rivals={rivals}
                    onJamRival={handleJamRival}
                />
            )}
            
            <BulkActionBar 
               count={selectedLeadIds.size}
               onClaim={handleBatchClaim}
               onArchive={handleBatchArchive}
               onClear={() => setSelectedLeadIds(new Set())}
            />
            
            {/* Mission Control Drawer */}
            <MissionControl 
               leads={leads}
               isOpen={isChatOpen}
               onClose={() => setIsChatOpen(false)}
            />
        </div>
      </div>

      <NewsTicker />
      
      {/* Detailed Inspection Modal */}
      <LeadDetailModal 
        lead={selectedLead} 
        onClose={() => setSelectedLead(null)}
        onAction={handleLeadAction}
        onUpdate={handleLeadUpdate}
        availableTeams={availableTeams}
        onDeployTeam={handleDeployTeam}
        onDeepScan={handleDeepScan}
        weather={weather}
        onBook={handleLeadBooked}
      />

      {/* System Diagnostics Overlay */}
      {isDiagnosticsOpen && (
          <SystemDiagnostics 
             leads={leads}
             onClose={() => setIsDiagnosticsOpen(false)}
          />
      )}
    </div>
  );
};

export default App;