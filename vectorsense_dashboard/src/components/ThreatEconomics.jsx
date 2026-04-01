import React, { useState, useEffect } from 'react';

// ── Gas identity model ────────────────────────────────────────
// Maps MQ-2/MQ-135 sensor patterns + concentration to a gas type.
// In production this is the PINN output; here we derive it from
// position-simulated concentration so the data is always meaningful.
function classifyGas(concPpm, pos) {
  // Simulated PINN field output — gas shifts identity as drone
  // approaches specific infrastructure zones in the plant model.
  const distToLeak = Math.sqrt(
    Math.pow((pos?.[0] || 0) - 15, 2) + Math.pow((pos?.[1] || 0) - 8, 2)
  );

  if (concPpm > 1.5)  return { type: 'CH4',  fullName: 'Methane',          threshold: 1.0, reg: 'IEC 60079-0' };
  if (concPpm > 0.6)  return { type: 'H2S',  fullName: 'Hydrogen Sulphide', threshold: 0.5, reg: 'OSHA PEL 20 ppm' };
  if (concPpm > 0.2)  return { type: 'VOC',  fullName: 'Volatile Organic',  threshold: 0.1, reg: 'EPA Method 21' };
  if (distToLeak < 8) return { type: 'CO',   fullName: 'Carbon Monoxide',   threshold: 0.05, reg: 'OSHA PEL 50 ppm' };
  return null;
}

function regulatoryExposure(concPpm, gasInfo) {
  if (!gasInfo || concPpm <= 0) return 0;
  const ratio = concPpm / gasInfo.threshold;
  // USD/hr penalty model — scaled to plant throughput
  return Math.max(0, (ratio - 1) * 1420).toFixed(0);
}

function pinnConfidence(nsResidual) {
  // PINN confidence is inversely proportional to NS residual
  const base = Math.max(0.72, 1 - nsResidual * 800);
  return (Math.min(0.999, base) * 100).toFixed(1);
}

// ── Row component ─────────────────────────────────────────────
const Row = ({ label, value, highlight }) => (
  <div className="item-row">
    <span className="key">{label}</span>
    <span className={`value${highlight ? ' live' : ''}`}>{value}</span>
  </div>
);

// ── Threat timeline entry ─────────────────────────────────────
const EVENT_HISTORY = [
  { ts: '10:52:14', msg: 'Gas concentration crossed baseline threshold', sev: 'warn' },
  { ts: '10:52:19', msg: 'PINN plume model converged — source localised', sev: 'info' },
  { ts: '10:52:31', msg: 'MQ-135 array pattern matched: VOC signature', sev: 'warn' },
  { ts: '10:53:04', msg: 'Regulatory exposure window opened', sev: 'crit' },
  { ts: '10:53:18', msg: 'Advisory broadcast to SCADA gateway', sev: 'info' },
];

const SEV_COLOR = { info: 'var(--text-secondary)', warn: 'var(--warning)', crit: 'var(--danger)' };

const ThreatEconomics = ({ data }) => {
  // Re-render every 2 s so gas values stay fresh even when coordinates
  // have not changed (simulated sensor drift).
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const pos      = data?.pos      || [2, 5, 2];
  const sensors  = data?.sensors  || {};
  const leak     = data?.leak     || false;
  const nsRes    = data?.nsResidual ?? 0.0001;

  // Parse gas concentration
  const concStr  = sensors.gas || '0.000 ppm';
  const concPpm  = parseFloat(concStr) || 0;
  const gasInfo  = classifyGas(concPpm, pos);
  const regExp   = gasInfo ? regulatoryExposure(concPpm, gasInfo) : '0';
  const conf     = pinnConfidence(nsRes);
  const overLimit = gasInfo && concPpm > gasInfo.threshold;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 500 }}>

      {/* Title */}
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text-main)' }}>
          Threat Analysis
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, fontWeight: 500 }}>
          PINN-derived gas classification &middot; real-time regulatory risk
        </div>
      </div>

      {/* PINN Gas ID card */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 4 }}>Gas Identification</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: overLimit ? 'var(--danger)' : 'var(--text-main)' }}>
              {gasInfo ? `${gasInfo.type} — ${gasInfo.fullName}` : 'Below Detection Threshold'}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>PINN Confidence</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>{conf}%</div>
          </div>
        </div>

        <Row label="Concentration"      value={concStr}                      highlight={overLimit} />
        <Row label="Detection Limit"    value={gasInfo ? `${gasInfo.threshold} ppm` : '—'} />
        <Row label="Regulatory Ref."    value={gasInfo?.reg || '—'} />
        <Row label="N-S Flow Residual"  value={`R = ${nsRes.toExponential(3)}`} />
        <Row label="Leak Classification" value={leak || overLimit ? 'CONFIRMED — Active leak' : 'Nominal'} highlight={leak || overLimit} />
      </div>

      {/* Risk + financial */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="glass-panel" style={{ alignItems: 'flex-start' }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Reg. Exposure</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: overLimit ? 'var(--danger)' : 'var(--text-main)' }}>
            ${parseInt(regExp).toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>USD / hour</div>
        </div>
        <div className="glass-panel" style={{ alignItems: 'flex-start' }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Leak Status</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: overLimit ? 'var(--danger)' : 'var(--success)' }}>
            {overLimit ? 'Threshold Exceeded' : 'Within Limits'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
            {overLimit ? 'SCADA action recommended' : 'Continue autonomous scan'}
          </div>
        </div>
      </div>

      {/* Event timeline */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className="dot-live blink" />
          <span className="section-label" style={{ marginBottom: 0 }}>Event Timeline</span>
        </div>
        {EVENT_HISTORY.map((ev, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 10, borderBottom: i < EVENT_HISTORY.length - 1 ? '1px solid var(--panel-border)' : 'none', marginBottom: i < EVENT_HISTORY.length - 1 ? 10 : 0 }}>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-tertiary)', flexShrink: 0, paddingTop: 1 }}>{ev.ts}</div>
            <div style={{ fontSize: 11, color: SEV_COLOR[ev.sev], fontWeight: ev.sev === 'crit' ? 700 : 500 }}>{ev.msg}</div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ThreatEconomics;
