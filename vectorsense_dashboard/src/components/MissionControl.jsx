import React from 'react';
import { Camera, Wind, Volume2, Shield } from 'lucide-react';

const MissionControl = ({ currentMode, onModeChange }) => {
  const modes = [
    { id: 'GAS_TOMOGRAPHY', label: 'GAS LEAK DETECT', icon: <Wind size={18}/>, color: 'hover:bg-red-600', active: 'bg-red-600' },
    { id: 'THERMAL_PROFILING', label: 'THERMAL SCAN', icon: <Camera size={18}/>, color: 'hover:bg-orange-600', active: 'bg-orange-600' },
    { id: 'ACOUSTIC_DIAGNOSTICS', label: 'ACOUSTIC INSPECT', icon: <Volume2 size={18}/>, color: 'hover:bg-cyan-600', active: 'bg-cyan-600' },
  ];

  return (
    <div className="absolute left-6 top-32 z-50 flex flex-col gap-4">
      <div className="bg-black/60 backdrop-blur-md border border-white/10 p-2 flex flex-col gap-2 rounded-sm">
        <div className="text-[10px] font-black tracking-[0.3em] text-white/40 mb-2 px-2">MISSION_CONTROL</div>
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-tighter uppercase transition-all duration-300 border border-white/5 ${
              currentMode === mode.id ? mode.active : `bg-white/5 ${mode.color}`
            }`}
          >
            {mode.icon}
            {mode.label}
            {currentMode === mode.id && <span className="ml-auto animate-pulse">●</span>}
          </button>
        ))}
      </div>

      <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-sm">
        <div className="text-[10px] font-black tracking-[0.3em] text-white/40 mb-3">SQUAD_COMMAND</div>
        <button className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 py-2 text-[10px] font-bold tracking-widest uppercase text-blue-400">
          <Shield size={12}/> ACTIVATE_QUARANTINE
        </button>
      </div>
    </div>
  );
};

export default MissionControl;
