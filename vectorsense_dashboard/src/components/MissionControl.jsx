import React, { useState, useEffect } from 'react';

const MODES = [
  {
    id:    'GAS_TOMOGRAPHY',
    label: 'Gas Leak Detection',
    desc:  'MQ-2/MQ-135 array active. Atmospheric tomography at 24 Hz.',
  },
  {
    id:    'THERMAL_PROFILING',
    label: 'Thermal IR Scan',
    desc:  'Micro-bolometer active. Thermal gradient mapped across all infrastructure.',
  },
  {
    id:    'ACOUSTIC_DIAGNOSTICS',
    label: 'Acoustic Inspection',
    desc:  'Ultrasonic MEMS array listening. Structural resonance diagnostics running.',
  },
  {
    id:    'LIDAR_MAPPING',
    label: 'LiDAR 3D Mapping',
    desc:  '360 LiDAR sweep active. Point-cloud facility topology being generated.',
  },
];

const MissionControl = ({ mode, onModeChange }) => {
  const [localMode, setLocalMode] = useState(mode || 'GAS_TOMOGRAPHY');

  useEffect(() => { if (mode) setLocalMode(mode); }, [mode]);

  const handleSelect = (id) => {
    setLocalMode(id);
    onModeChange(id);
  };

  const active = MODES.find(m => m.id === localMode) || MODES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 460 }}>

      {/* Active Mode Status Banner */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--panel-border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 18px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className="dot-live blink" />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Active Protocol
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
          {active.label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {active.desc}
        </div>
      </div>

      {/* Mode Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {MODES.map(m => {
          const isActive = m.id === localMode;
          return (
            <button
              key={m.id}
              id={`mission-${m.id.toLowerCase()}`}
              className={`mode-button${isActive ? ' active' : ''}`}
              onClick={() => handleSelect(m.id)}
            >
              <div className="mode-label">{m.label}</div>
              <div className="mode-desc">{m.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MissionControl;
