import React, { useRef, useEffect, useState } from 'react';
import { Lead, Rival } from '../types';

interface RadarMapProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  rivals?: Rival[];
  onJamRival?: (id: string) => void;
}

interface StormCell {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
}

const RadarMap: React.FC<RadarMapProps> = ({ leads, onLeadClick, rivals = [], onJamRival }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredLead, setHoveredLead] = useState<Lead | null>(null);
  const [hoveredRival, setHoveredRival] = useState<Rival | null>(null);
  const [activeLayer, setActiveLayer] = useState<'standard' | 'weather' | 'intel'>('standard');
  
  // Refs for simulation state
  const stormsRef = useRef<StormCell[]>([]);

  // Initialize entities
  useEffect(() => {
    // Storms
    if (stormsRef.current.length === 0) {
      stormsRef.current = Array.from({ length: 3 }).map(() => ({
        x: Math.random() * 500,
        y: Math.random() * 500,
        radius: 60 + Math.random() * 80,
        vx: 0.2 + Math.random() * 0.3,
        vy: 0.1 + Math.random() * 0.2
      }));
    }
  }, []);

  // Helper to map lat/lng to canvas coordinates
  const getCanvasCoords = (lat: number, lng: number, minLat: number, maxLat: number, minLng: number, maxLng: number, width: number, height: number, padding: number) => {
    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;
    const yNorm = (lat - minLat) / latRange;
    const xNorm = (lng - minLng) / lngRange;
    const x = padding + xNorm * (width - padding * 2);
    const y = height - (padding + yNorm * (height - padding * 2));
    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let radarAngle = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const padding = 50;

      // Clear
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, width, height);

      // --- Draw Grid ---
      ctx.strokeStyle = activeLayer === 'weather' ? '#334155' : '#1e293b';
      ctx.lineWidth = 1;
      const gridSize = 50;
      
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // --- Draw Radar Circles ---
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) / 2 - 20;
      
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * 0.66, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * 0.33, 0, Math.PI * 2);
      ctx.stroke();

      // --- Draw Storm Cells (Enhanced in Weather Mode) ---
      stormsRef.current.forEach(storm => {
        storm.x += storm.vx;
        storm.y += storm.vy;
        if (storm.x > width + storm.radius) storm.x = -storm.radius;
        if (storm.y > height + storm.radius) storm.y = -storm.radius;

        const isWeatherMode = activeLayer === 'weather';
        const opacity = isWeatherMode ? 0.4 : 0.15;
        const color = isWeatherMode ? '255, 50, 50' : '234, 179, 8';

        const grad = ctx.createRadialGradient(storm.x, storm.y, 0, storm.x, storm.y, storm.radius * (isWeatherMode ? 1.5 : 1));
        grad.addColorStop(0, `rgba(${color}, ${opacity})`);
        grad.addColorStop(1, `rgba(${color}, 0)`);
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(storm.x, storm.y, storm.radius * (isWeatherMode ? 1.5 : 1), 0, Math.PI * 2);
        ctx.fill();
        
        if (isWeatherMode) {
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(storm.x, storm.y, storm.radius * 1.5, 0, Math.PI * 2);
            ctx.stroke();
        }
      });

      // --- Calculate bounds ---
      let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
      if (leads.length > 0) {
        leads.forEach(l => {
          minLat = Math.min(minLat, l.lat);
          maxLat = Math.max(maxLat, l.lat);
          minLng = Math.min(minLng, l.lng);
          maxLng = Math.max(maxLng, l.lng);
        });
      } else {
        minLat = 0; maxLat = 1; minLng = 0; maxLng = 1;
      }

      // --- Draw Leads ---
      leads.forEach(lead => {
        const { x, y } = getCanvasCoords(lead.lat, lead.lng, minLat, maxLat, minLng, maxLng, width, height, padding);
        const isCritical = lead.condition === 'Critical';
        const isPoor = lead.condition === 'Poor';
        const isSecured = lead.status === 'Secured';
        const isLost = lead.status === 'Lost';
        
        let inStorm = false;
        stormsRef.current.forEach(storm => {
           const dx = x - storm.x;
           const dy = y - storm.y;
           if (Math.sqrt(dx*dx + dy*dy) < storm.radius * (activeLayer === 'weather' ? 1.5 : 0.8)) {
             inStorm = true;
           }
        });

        // Color Logic
        let color = isCritical ? '#ef4444' : isPoor ? '#f97316' : '#eab308';
        if (isSecured) color = '#22c55e';
        if (isLost) color = '#64748b'; // Slate for lost
        
        // Dim if weather mode active and not in storm
        if (activeLayer === 'weather' && !inStorm) {
            color = '#475569';
        }

        const pulse = inStorm ? Math.sin(Date.now() / 200) * 3 : 0;

        ctx.beginPath();
        ctx.fillStyle = isSecured ? 'rgba(34, 197, 94, 0.5)' : (isCritical ? 'rgba(239, 68, 68, 0.5)' : (isLost ? 'rgba(100,116,139,0.3)' : 'rgba(234, 179, 8, 0.5)'));
        ctx.arc(x, y, 6 + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = inStorm ? '#ffffff' : color;
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Lost marker (X)
        if (isLost) {
            ctx.beginPath();
            ctx.moveTo(x - 3, y - 3);
            ctx.lineTo(x + 3, y + 3);
            ctx.moveTo(x + 3, y - 3);
            ctx.lineTo(x - 3, y + 3);
            ctx.strokeStyle = '#ef4444';
            ctx.stroke();
        }

        // Team Visualization
        if (lead.assignedTeam && !isSecured) {
            ctx.beginPath();
            ctx.strokeStyle = '#22c55e';
            ctx.setLineDash([2, 2]);
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        if (hoveredLead?.id === lead.id) {
          ctx.beginPath();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1;
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.stroke();
          
          // Tooltip
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          const tooltipWidth = 150;
          const tooltipHeight = 65; 
          ctx.fillRect(x + 10, y - 20, tooltipWidth, tooltipHeight);
          ctx.strokeRect(x + 10, y - 20, tooltipWidth, tooltipHeight);
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(lead.address.substring(0, 18) + '...', x + 15, y - 8);
          ctx.fillStyle = color;
          ctx.font = '10px monospace';
          ctx.fillText(`COND: ${lead.condition.toUpperCase()}`, x + 15, y + 5);
          
          if (inStorm) {
            ctx.fillStyle = '#ef4444';
            ctx.fillText('⚠ STORM CELL ACTIVE', x + 15, y + 35);
          } else if (lead.assignedTeam) {
            ctx.fillStyle = '#22c55e';
            ctx.fillText(`TEAM ${lead.assignedTeam} ENGAGED`, x + 15, y + 35);
          } else if (isLost) {
            ctx.fillStyle = '#ef4444';
            ctx.fillText('STATUS: LOST TO RIVAL', x + 15, y + 35);
          }
        }
      });

      // --- Draw Rivals (Passed from props) ---
      if (activeLayer !== 'weather') {
          rivals.forEach(rival => {
            const { x, y } = getCanvasCoords(rival.lat, rival.lng, minLat, maxLat, minLng, maxLng, width, height, padding);
            
            // Draw Target Line
            const target = leads.find(l => l.id === rival.targetLeadId);
            if (target) {
                const targetPos = getCanvasCoords(target.lat, target.lng, minLat, maxLat, minLng, maxLng, width, height, padding);
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(targetPos.x, targetPos.y);
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Draw Rival Drone
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Date.now() / 500); // Spin effect
            
            // Drone Body
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(6, 6);
            ctx.lineTo(-6, 6);
            ctx.closePath();
            ctx.fillStyle = '#d946ef'; // Fuchsia
            ctx.fill();
            
            // Pulse Ring
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(217, 70, 239, ${Math.abs(Math.sin(Date.now() / 200))})`;
            ctx.stroke();
            
            ctx.restore();

            if (hoveredRival?.id === rival.id) {
                ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                ctx.fillRect(x + 10, y - 25, 120, 40);
                ctx.strokeStyle = '#d946ef';
                ctx.strokeRect(x + 10, y - 25, 120, 40);
                ctx.fillStyle = '#d946ef';
                ctx.font = 'bold 10px monospace';
                ctx.fillText('⚠ RIVAL DRONE', x + 15, y - 12);
                ctx.fillStyle = 'white';
                ctx.fillText('CLICK TO JAM SIGNAL', x + 15, y + 5);
            }
          });
      }

      // --- Draw Radar Sweep ---
      radarAngle += 0.02;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(radarAngle);
      const gradient = ctx.createLinearGradient(0, 0, maxRadius, 0);
      gradient.addColorStop(0, 'rgba(0, 174, 239, 0)');
      gradient.addColorStop(1, 'rgba(0, 174, 239, 0.2)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, maxRadius, -0.2, 0);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 174, 239, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(maxRadius, 0);
      ctx.stroke();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [leads, hoveredLead, activeLayer, rivals, hoveredRival]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || leads.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    leads.forEach(l => {
      minLat = Math.min(minLat, l.lat);
      maxLat = Math.max(maxLat, l.lat);
      minLng = Math.min(minLng, l.lng);
      maxLng = Math.max(maxLng, l.lng);
    });

    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;

    // Check Rivals First
    if (onJamRival) {
        const clickedRival = rivals.find(r => {
            const { x, y } = getCanvasCoords(r.lat, r.lng, minLat, maxLat, minLng, maxLng, width, height, padding);
            const dist = Math.sqrt(Math.pow(clickX - x, 2) + Math.pow(clickY - y, 2));
            return dist < 20; // Larger hit area for drone
        });
        if (clickedRival) {
            onJamRival(clickedRival.id);
            return;
        }
    }

    // Check Leads
    const clicked = leads.find(lead => {
      const { x, y } = getCanvasCoords(lead.lat, lead.lng, minLat, maxLat, minLng, maxLng, width, height, padding);
      const dist = Math.sqrt(Math.pow(clickX - x, 2) + Math.pow(clickY - y, 2));
      return dist < 10;
    });

    if (clicked) onLeadClick(clicked);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || leads.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    leads.forEach(l => {
        minLat = Math.min(minLat, l.lat);
        maxLat = Math.max(maxLat, l.lat);
        minLng = Math.min(minLng, l.lng);
        maxLng = Math.max(maxLng, l.lng);
    });

    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;

    // Check Rivals
    const hoveredR = rivals.find(r => {
        const { x, y } = getCanvasCoords(r.lat, r.lng, minLat, maxLat, minLng, maxLng, width, height, padding);
        const dist = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
        return dist < 20;
    });
    setHoveredRival(hoveredR || null);

    // Check Leads
    const hovered = leads.find(lead => {
      const { x, y } = getCanvasCoords(lead.lat, lead.lng, minLat, maxLat, minLng, maxLng, width, height, padding);
      const dist = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
      return dist < 15;
    });

    setHoveredLead(hovered || null);
    
    canvas.style.cursor = (hovered || hoveredR) ? 'pointer' : 'default';
  };

  return (
    <div ref={containerRef} className="flex-1 bg-slate-900 border border-slate-700 m-4 rounded-lg relative overflow-hidden shadow-xl">
       {leads.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-slate-600 font-mono text-sm">NO SIGNAL DETECTED</div>
          </div>
       )}
       
       {/* Layer Controls */}
       <div className="absolute top-4 right-4 z-20 flex gap-1">
          <button 
             onClick={() => setActiveLayer('standard')}
             className={`px-3 py-1 text-[10px] font-bold uppercase rounded-l border border-slate-600 transition-colors ${
                 activeLayer === 'standard' ? 'bg-brand-blue text-white border-brand-blue' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
             }`}
          >
              Tactical
          </button>
          <button 
             onClick={() => setActiveLayer('weather')}
             className={`px-3 py-1 text-[10px] font-bold uppercase border-y border-slate-600 transition-colors ${
                 activeLayer === 'weather' ? 'bg-red-600 text-white border-red-600' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
             }`}
          >
              Weather
          </button>
          <button 
             onClick={() => setActiveLayer('intel')}
             className={`px-3 py-1 text-[10px] font-bold uppercase rounded-r border border-slate-600 transition-colors ${
                 activeLayer === 'intel' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
             }`}
          >
              Intel
          </button>
       </div>

       {/* Legend */}
       <div className="absolute top-4 left-4 z-10 bg-black/50 p-2 rounded border border-slate-700 backdrop-blur-sm pointer-events-none">
         <div className="flex flex-col gap-1">
            {/* Standard Legend Items */}
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-red-500"></div>
               <span className="text-[10px] text-slate-300 font-mono uppercase">Critical</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-orange-500"></div>
               <span className="text-[10px] text-slate-300 font-mono uppercase">Poor</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               <span className="text-[10px] text-slate-300 font-mono uppercase">Secured</span>
            </div>
            {rivals.length > 0 && (
                <div className="flex items-center gap-2 mt-1 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-[10px] text-purple-300 font-mono uppercase font-bold">Rival Active ({rivals.length})</span>
                </div>
            )}
            
            {activeLayer === 'weather' && (
                <div className="mt-2 pt-2 border-t border-slate-600">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500/50 border border-red-500 animate-pulse"></div>
                        <span className="text-[10px] text-red-300 font-mono uppercase">High Wind</span>
                    </div>
                </div>
            )}
         </div>
       </div>
       <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
       />
    </div>
  );
};

export default RadarMap;