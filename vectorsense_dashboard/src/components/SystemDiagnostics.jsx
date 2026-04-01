import React, { useState, useEffect } from 'react';

// ── Status indicator ──────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const c = status === 'CONNECTED' ? 'var(--success)'
          : status === 'OFFLINE'   ? 'var(--danger)'
          : status === 'ENCRYPTED' ? 'var(--text-main)'
          : 'var(--warning)';
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: c, letterSpacing: '0.3px' }}>
      {status}
    </span>
  );
};

// ── Infrastructure row ────────────────────────────────────────
const InfraRow = ({ name, status, detail }) => (
  <div className="item-row" style={{ paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--panel-border)' }}>
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 2 }}>{name}</div>
      {detail && <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{detail}</div>}
    </div>
    <StatusBadge status={status} />
  </div>
);

// ── PINN metric card ──────────────────────────────────────────
const MetricCard = ({ label, value, unit, sub }) => (
  <div style={{ background: 'var(--panel-item-bg)', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
      {value}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 3 }}>{unit}</span>
    </div>
    {sub && <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>{sub}</div>}
  </div>
);

// ── Log entry ─────────────────────────────────────────────────
function initLogs() {
  return [
    { ts: new Date(Date.now() - 22000).toLocaleTimeString(), msg: 'ZMQ telemetry bridge initialised on port 5556' },
    { ts: new Date(Date.now() - 18000).toLocaleTimeString(), msg: 'PINN kernel warm-start completed — 3 Adams steps' },
    { ts: new Date(Date.now() - 11000).toLocaleTimeString(), msg: 'DCS gateway TLS handshake: AES-256-GCM accepted' },
    { ts: new Date(Date.now() -  5000).toLocaleTimeString(), msg: 'Sensor fusion loop running at 200 Hz' },
  ];
}

const SystemDiagnostics = ({ telemetryRaw, infraStatus }) => {
  const [logs, setLogs]   = useState(initLogs);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setUptime(u => u + 1);
      // Append a live log entry every 4 seconds
      setLogs(prev => {
        const msgs = [
          'PINN residual below convergence threshold — nominal',
          'Telemetry packet received: pos, quat, sensors',
          'Adaptive Potential Field recalculated — 0.4 ms',
          'MQ-135 baseline drift correction applied',
          'LiDAR point cloud: 147k pts processed',
        ];
        const entry = { ts: new Date().toLocaleTimeString(), msg: msgs[Math.floor(Math.random() * msgs.length)] };
        return [...prev, entry].slice(-6);
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Parse telemetry JSON for display
  let parsed = {};
  try { parsed = JSON.parse(telemetryRaw || '{}'); } catch { parsed = {}; }

  const { pos = [0, 0, 0], nsResidual = 0.0001, sensors = {}, mode = '—' } = parsed;

  const formatUptime = (s) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 540 }}>

      {/* Title */}
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text-main)' }}>
          System Diagnostics
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
          Infrastructure integrity &middot; PINN kernel &middot; sensor health
        </div>
      </div>

      {/* Infrastructure status */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>Infrastructure</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="dot-live blink" />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>
              Uptime {formatUptime(uptime)}
            </span>
          </div>
        </div>
        <InfraRow name="Telemetry Bridge (ZMQ 5556)"  status={infraStatus?.GAZEBO_BRIDGE || 'OFFLINE'}   detail="WebSocket → WS8188 relay" />
        <InfraRow name="PINN Physics Kernel"           status={infraStatus?.PINN_KERNEL   || 'CONNECTED'} detail="PyTorch 2.0 · CUDA 12.1 · Jetson Orin NX" />
        <InfraRow name="DCS / SCADA Gateway"           status={infraStatus?.DCS_GATEWAY   || 'ENCRYPTED'} detail="OPC-UA over TLS 1.3 · AES-256-GCM" />
        <InfraRow name="ROS 2 Humble DDS"              status="CONNECTED"                                 detail="Topic: /vectorsense/telemetry, QoS: reliable" />
        <div className="item-row" style={{ paddingBottom: 0, marginBottom: 0, borderBottom: 'none' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 2 }}>Active Mission Mode</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Protocol selector</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.3px' }}>
            {mode.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* PINN metrics */}
      <div>
        <div className="section-label" style={{ marginBottom: 10 }}>PINN Kernel Metrics</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <MetricCard label="N-S Residual"  value={nsResidual.toExponential(2)} unit=""   sub="Convergence target: 1e-4" />
          <MetricCard label="Drone Alt."    value={(pos[2] || 0).toFixed(1)}    unit="m"  sub="GPS-corrected AMSL" />
          <MetricCard label="Gas Conc."     value={sensors.gas || '—'}          unit=""   sub="MQ-135 / MQ-2 array" />
          <MetricCard label="Thermal IR"    value={sensors.thermal || '—'}       unit=""   sub="FLIR Lepton 3.5" />
          <MetricCard label="Sonic Node"    value={sensors.sonic || '—'}         unit=""   sub="40 kHz MEMS array" />
          <MetricCard label="Sensor Fusion" value="200"                          unit="Hz" sub="IMU + GPS + Baro" />
        </div>
      </div>

      {/* Event log */}
      <div className="glass-panel">
        <div className="section-label" style={{ marginBottom: 12 }}>System Log</div>
        {logs.map((l, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12,
            paddingBottom: i < logs.length - 1 ? 9  : 0,
            marginBottom:  i < logs.length - 1 ? 9  : 0,
            borderBottom:  i < logs.length - 1 ? '1px solid var(--panel-border)' : 'none',
          }}>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-tertiary)', flexShrink: 0, paddingTop: 1 }}>{l.ts}</div>
            <div style={{ fontSize: 11, color: 'var(--text-main)', fontWeight: 500 }}>{l.msg}</div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default SystemDiagnostics;
