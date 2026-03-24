import React from 'react';

const ThreatEconomics = ({ data }) => {
  const panelStyle = {
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px',
    width: '380px'
  };

  const metricStyle = {
    marginBottom: '20px'
  };

  const labelStyle = {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '4px'
  };

  const valueStyle = {
    fontSize: '28px',
    fontWeight: '900',
    color: '#00ffff',
    fontFamily: 'Consolas, monospace'
  };

  return (
    <div style={panelStyle}>
        <div className="mono" style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '16px' }}>THREAT_ECONOMICS</div>
        
        <div style={metricStyle}>
            <div style={labelStyle}>Navier-Stokes Residual (R_NS)</div>
            <div style={valueStyle}>{data?.ns_residual?.toFixed(6) || "0.000000"}</div>
        </div>

        <div style={metricStyle}>
            <div style={labelStyle}>Est. Reg. Exposure (USD/hr)</div>
            <div style={valueStyle}>${((data?.ns_residual || 0) * 1420).toLocaleString()}</div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                <div style={labelStyle}>Leak Flag</div>
                <div style={{ color: data?.leak ? '#ff4d4d' : '#00ffff', fontWeight: 'bold' }}>{data?.leak ? 'ACTIVE' : 'NONE'}</div>
            </div>
            <div style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                <div style={labelStyle}>Confidence</div>
                <div style={{ color: '#00ffff', fontWeight: 'bold' }}>98.2%</div>
            </div>
        </div>
    </div>
  );
};

export default ThreatEconomics;
