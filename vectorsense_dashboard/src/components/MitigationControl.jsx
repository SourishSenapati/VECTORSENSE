import React from 'react';

const MitigationControl = () => {
  const panelStyle = {
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px',
    width: '380px'
  };

  const statusStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '16px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px'
  };

  return (
    <div style={panelStyle}>
        <div className="mono" style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '16px' }}>SYSTEMS CONTROL</div>
        
        <div style={statusStyle}>
            <div style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,100,100,0.8)' }}>INCIDENT SIMULATION</div>
        </div>

        <button style={{
            width: '100%',
            padding: '16px',
            background: 'rgba(255, 77, 77, 0.2)',
            border: '2px solid rgba(255, 77, 77, 0.4)',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            textTransform: 'uppercase',
            fontSize: '11px',
            marginBottom: '10px'
        }}>
            DETONATE THERMAL EVENT (PACK 02)
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <button style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,77,77,0.5)', borderRadius: '4px', color: '#ff4d4d', fontSize: '10px' }}>SMOKE CLOUD</button>
            <button style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,77,77,0.5)', borderRadius: '4px', color: '#ff4d4d', fontSize: '10px' }}>GAS DIFFUSION</button>
        </div>

        <div style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(100, 200, 255, 0.8)', marginBottom: '10px' }}>HARDWARE COMMANDS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {['SPRINKLER', 'EXTINGUISH', 'ALARM BUS', 'DOOR GEARS', 'BAT-CUTOFF', 'GLASS-SOL'].map(cmd => (
                <button key={cmd} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#ccc', fontSize: '10px' }}>{cmd}</button>
            ))}
        </div>
    </div>
  );
};

export default MitigationControl;
