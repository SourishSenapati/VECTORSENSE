import React, { useState, useEffect, useRef } from 'react';

const SystemDiagnostics = ({ telemetryRaw, infraStatus }) => {
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);

  useEffect(() => {
    let newEntry = null;
    if (telemetryRaw && telemetryRaw.length > 20) {
      newEntry = "PKT_RECV: " + telemetryRaw.substring(0, 45) + "...";
    } else if (infraStatus?.GAZEBO_BRIDGE === 'OFFLINE') {
      newEntry = "ERR: ZMQ_TIMEOUT - WSL KINEMATIC FEED LOST";
    }

    if (newEntry) {
      setLogs((prev) => {
        if (prev[prev.length - 1] === newEntry) return prev;
        return [...prev, newEntry].slice(-5);
      });
    }
  }, [telemetryRaw, infraStatus]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const panelStyle = {
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(30px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    padding: '24px',
    width: '450px',
    pointerEvents: 'auto'
  };

  const statusTextStyle = (status) => ({
    color: (status === 'CONNECTED' || status === 'ENCRYPTED') ? '#00ffff' : '#ff4d4d',
    fontWeight: '900',
    fontFamily: 'Consolas, monospace',
    fontSize: '11px'
  });

  return (
    <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
            <div className="mono" style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)' }}>INFRASTRUCTURE_INTEGRITY</div>
            <div style={{ fontSize: '10px', background: '#00ffff', color: 'black', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>LIVE</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>GAZEBO_BRIDGE: <span style={statusTextStyle(infraStatus?.GAZEBO_BRIDGE)}>{infraStatus?.GAZEBO_BRIDGE || 'OFFLINE'}</span></div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>PINN_KERNEL: <span style={statusTextStyle(infraStatus?.PINN_KERNEL)}>{infraStatus?.PINN_KERNEL || 'OFFLINE'}</span></div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>DCS_GATEWAY: <span style={statusTextStyle(infraStatus?.DCS_GATEWAY)}>{infraStatus?.DCS_GATEWAY || 'SECURE'}</span></div>
        </div>

        <div className="mono" style={{ height: '80px', overflow: 'hidden', padding: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px' }}>
            {logs.map((log, i) => (
                <div key={i} style={{ color: i === logs.length - 1 ? '#00ffff' : 'rgba(0,255,255,0.2)', fontSize: '9px', marginBottom: '4px' }}>
                    [{new Date().toLocaleTimeString()}] {log}
                </div>
            ))}
            <div ref={logEndRef} />
        </div>
    </div>
  );
};

export default SystemDiagnostics;
