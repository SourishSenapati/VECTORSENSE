import React, { useMemo } from 'react';
import { Activity, DollarSign, Timer, TrendingUp, AlertCircle } from 'lucide-react';

const ThreatEconomics = ({ massFlux, activeTime, gasType }) => {
  // Economics Logic (React Mirror of Python Bridge)
  const stats = useMemo(() => {
    const pricePerKg = gasType === "Hydrogen" ? 3.00 : 1.50;
    const epaFixed = 25000;
    const hourlyRisk = (activeTime / 3600) * 1000;
    
    return {
      bleedRateHr: massFlux * pricePerKg * 3600,
      totalLoss: (massFlux * pricePerKg) * activeTime,
      epaRisk: epaFixed + hourlyRisk,
      timeToLEL: Math.max(0, 14.2 - (activeTime / 60)) // Simulation
    };
  }, [massFlux, activeTime, gasType]);

  return (
    <div className="absolute bottom-8 left-8 z-50 pointer-events-none">
      
      {/* HUD Title */}
      <h2 className="flex items-center gap-2 mb-2 px-3 py-1 bg-red-600/20 border-l-4 border-red-600 font-mono text-xs tracking-widest text-red-500 uppercase">
        <Activity size={14}/> PINN_THREAT_ECONOMICS // ACTIVE_ANALYSIS
      </h2>

      <div className="flex gap-4 p-6 bg-black/60 backdrop-blur-xl border border-white/5 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        {/* Commodity Loss Card */}
        <div className="flex flex-col gap-1 pr-6 border-r border-white/5 w-48">
          <div className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono tracking-widest uppercase">
            <DollarSign size={12}/> COMMODITY_LOSS_RATE
          </div>
          <div className="text-3xl font-black tracking-tighter text-red-400">
            ${(massFlux * 3600 * 3).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/hr
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 animate-[width_1s_ease-out]" style={{width: '65%'}}></div>
            </div>
            <TrendingUp size={12} className="text-red-600"/>
          </div>
        </div>

        {/* Regulatory Exposure Card */}
        <div className="flex flex-col gap-1 px-6 border-r border-white/5 w-48">
          <div className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono tracking-widest uppercase">
            <AlertCircle size={12}/> EPA_REGULATORY_EXPOSURE
          </div>
          <div className="text-3xl font-black tracking-tighter text-yellow-400">
            ${stats.epaRisk.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-yellow-600/80 mt-1 uppercase font-mono">
            * LIABILITY_STATUS: HIGH_THRESHOLD
          </div>
        </div>

        {/* Physics LEL Timer Card */}
        <div className="flex flex-col gap-1 pl-6 w-48">
          <div className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono tracking-widest uppercase">
            <Timer size={12}/> CRITICAL_LEL_THRESHOLD
          </div>
          <div className="text-3xl font-black tracking-tighter text-white tabular-nums">
            {stats.timeToLEL.toFixed(1)}m
          </div>
          <div className="text-[10px] text-blue-500 mt-1 uppercase font-mono animate-pulse">
             * TIME_TO_DEFLAGRATION
          </div>
        </div>

      </div>

      <div className="flex gap-4 mt-4">
        <div className="px-3 py-1.5 bg-zinc-900 border border-white/5 text-[10px] font-mono tracking-widest text-zinc-400 flex items-center gap-2">
           MASS_LOSS: <span className="text-white font-black">{massFlux.toFixed(4)} kg/s</span>
        </div>
        <div className="px-3 py-1.5 bg-zinc-900 border border-white/5 text-[10px] font-mono tracking-widest text-zinc-400 flex items-center gap-2">
           FLUID: <span className="text-white font-black">{gasType.toUpperCase()}</span>
        </div>
      </div>

    </div>
  );
}

export default ThreatEconomics;
