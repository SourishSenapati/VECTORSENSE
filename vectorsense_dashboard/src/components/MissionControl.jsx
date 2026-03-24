import React from 'react';

const MissionControl = ({ mode, onModeChange }) => {
  const modes = [
    { id: 'GAS_TOMOGRAPHY', label: 'GAS LEAK DETECT', color: '#ff4d4d' },
    { id: 'THERMAL_PROFILING', label: 'THERMAL SCAN', color: '#ff9900' },
    { id: 'ACOUSTIC_DIAGNOSTICS', label: 'ACOUSTIC INSPECTOR', color: '#00ffff' },
  ];

  const panelStyle = {
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  return (
    <div style={panelStyle}>
        <div className="mono" style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px' }}>MISSION_CONTROL</div>
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            style={{
              padding: '16px',
              background: mode === m.id ? m.color : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '8px',
              color: mode === m.id ? 'black' : 'white',
              fontSize: '11px',
              fontWeight: '900',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {m.label}
          </button>
        ))}
    </div>
  );
};

export default MissionControl;
