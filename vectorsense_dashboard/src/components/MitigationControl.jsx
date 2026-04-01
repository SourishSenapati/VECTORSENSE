import React, { useState, useCallback } from 'react';

const COMMANDS = [
  { id: 'VALVE_LOCK',   label: 'Valve Lock',      desc: 'Seal all upstream flow valves' },
  { id: 'PURGE_GAS',   label: 'Purge Gas Line',   desc: 'Flush pipeline with inert nitrogen' },
  { id: 'DEPRESSURIZE', label: 'Depressurize',     desc: 'Bleed system to atmospheric pressure' },
  { id: 'SHUTDOWN',    label: 'Emergency Shutdown', desc: 'Full-plant SCADA shutdown sequence' },
];

const ValveStatus = ({ state }) => {
  const color = state === 'LOCKED' ? 'var(--danger)' : state === 'CLOSED' ? 'var(--warning)' : 'var(--success)';
  return (
    <div className="item-row" style={{ marginBottom: 14 }}>
      <span className="key">Line Status</span>
      <span className="value" style={{ color, fontSize: 11, fontWeight: 700 }}>
        {state || 'OPEN'}
      </span>
    </div>
  );
};

const MitigationControl = ({ valveState, onCommand }) => {
  const [armed, setArmed] = useState(null);
  const [sent, setSent]   = useState(null);
  const armTimers = {};

  const handleClick = useCallback((id) => {
    if (armed === id) {
      onCommand(id);
      setSent(id);
      setArmed(null);
      clearTimeout(armTimers[id]);
    } else {
      setArmed(id);
      armTimers[id] = setTimeout(() => setArmed(null), 3000);
    }
  }, [armed, onCommand]);

  return (
    <div className="glass-panel">
      <div className="section-label">SCADA Controls</div>
      <ValveStatus state={valveState} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {COMMANDS.map(cmd => {
          const isArmed = armed === cmd.id;
          const wasSent = sent === cmd.id && armed !== cmd.id;
          return (
            <button
              key={cmd.id}
              id={`scada-${cmd.id.toLowerCase()}`}
              className={`cmd-button${isArmed ? ' armed' : ''}`}
              onClick={() => handleClick(cmd.id)}
            >
              <div style={{ flex: 1 }}>
                <div className="cmd-label">
                  {isArmed ? `Confirm: ${cmd.label}` : cmd.label}
                </div>
                <div className="cmd-desc">
                  {isArmed ? 'Tap again to execute command' : cmd.desc}
                </div>
              </div>
              {wasSent && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', flexShrink: 0 }}>
                  Sent
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'monospace', letterSpacing: '0.3px' }}>
        AUTH: vs_secure_197 &middot; Commands encrypted
      </div>
    </div>
  );
};

export default MitigationControl;
