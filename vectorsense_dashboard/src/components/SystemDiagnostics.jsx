import React, { useState, useEffect, useRef } from 'react';

const SystemDiagnostics = ({ telemetryRaw, infraStatus }) => {
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);

  useEffect(() => {
    let newEntry = null;

    if (telemetryRaw) {
      newEntry = telemetryRaw;
    } else if (infraStatus?.WSL_GAZEBO_BRIDGE === 'OFFLINE') {
      newEntry = "ERR: ZMQ_TIMEOUT - WSL KINEMATIC FEED LOST";
    }

    if (newEntry) {
      setLogs((prev) => {
        if (prev[prev.length - 1] === newEntry) return prev;
        return [...prev, newEntry].slice(-10);
      });
    }
  }, [telemetryRaw, infraStatus?.WSL_GAZEBO_BRIDGE]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="fixed bottom-6 left-6 z-[180] w-80 pointer-events-none">
      <div className="liquid-glass p-5 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
        {/* Integrity Checklist */}
        <div className="mb-4 border-b border-white/5 pb-3">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/40 mono uppercase tracking-widest text-[10px]">Infrastructure</span>
            <span className="bg-emerald-500 text-black px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold">LIVE</span>
          </div>
          
          <div className="space-y-2">
            <StatusRow label="GAZEBO_BRIDGE" status={infraStatus?.WSL_GAZEBO_BRIDGE || 'OFFLINE'} />
            <StatusRow label="PINN_KERNEL" status={infraStatus?.WIN_PINN_KERNEL || 'OFFLINE'} />
            <StatusRow label="ACTUATOR_API" status={infraStatus?.DCS_ACTUATOR_API || 'STANDBY'} />
          </div>
        </div>

        {/* Live Feed */}
        <div className="h-32 overflow-hidden flex flex-col justify-end">
          <div className="text-emerald-400/30 mono text-[9px] mb-2 uppercase tracking-widest flex items-center gap-2">
            <div className="h-1 w-1 bg-emerald-400 rounded-full animate-ping" />
            Telemetry Stream
          </div>
          <div className="space-y-1.5 overflow-hidden">
            {logs.map((log, i) => (
              <div key={i} className={`mono text-[9px] whitespace-nowrap transition-all duration-300 ${i === logs.length - 1 ? 'text-emerald-400' : 'text-emerald-400/20'}`}>
                {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusRow = ({ label, status }) => {
  const isOk = status === 'CONNECTED' || status === 'STANDBY';
  const isErr = status === 'OFFLINE' || status === 'ERROR';
  
  return (
    <div className="flex justify-between items-center text-[10px] mono">
      <span className="text-white/30">{label}:</span>
      <span className={`font-medium ${isOk ? 'text-emerald-400' : isErr ? 'text-rose-500 animate-pulse' : 'text-yellow-400'}`}>
        {status}
      </span>
    </div>
  );
};

export default SystemDiagnostics;
