import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import SpatialTwin from './components/SpatialTwin';
import MitigationControl from './components/MitigationControl';
import MissionControl from './components/MissionControl';
import SystemDiagnostics from './components/SystemDiagnostics';
import ThreatEconomics from './components/ThreatEconomics';
import DroneSpecs from './components/DroneSpecs';
import './App.css';

const TABS = [
  { id: 'Spatial Twin' },
  { id: 'Mission Control' },
  { id: 'Drone Specs' },
  { id: 'Threat Log' },
  { id: 'System Diagnostics' },
];

const WS_URL = 'ws://127.0.0.1:8188';
const STEP   = 1.5; // metres per keypress

// ── Keyboard map ─────────────────────────────────────────────
const KEY_MAP = {
  w: { dx: 0,     dy: STEP,  dz: 0 },
  s: { dx: 0,     dy: -STEP, dz: 0 },
  a: { dx: -STEP, dy: 0,     dz: 0 },
  d: { dx: STEP,  dy: 0,     dz: 0 },
  f: { dx: 0,     dy: 0,     dz: STEP  },
  c: { dx: 0,     dy: 0,     dz: -STEP },
};

// ── Simulated sensor values that drift realistically ─────────
function useSensorSim(mode, pos) {
  // Returns fake-but-plausible sensor readouts derived from drone position + mode
  const distToLeak = Math.sqrt(
    Math.pow(pos[0] - 15, 2) + Math.pow(pos[1] - 8, 2)
  );
  const gas     = Math.max(0, (1 / (distToLeak + 0.5)) * 2.8).toFixed(3) + ' ppm';
  const thermal = (22 + (1 / (distToLeak + 1)) * 18).toFixed(1) + ' °C';
  const sonic   = (38 + Math.abs(Math.sin(Date.now() / 3000)) * 12).toFixed(0) + ' dB';
  const alert   = distToLeak < 6;
  return { gas, thermal, sonic, alert };
}

// ── Loader splash ─────────────────────────────────────────────
const Loader = () => (
  <div style={{
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', zIndex: 999,
  }}>
    <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-main)' }}>
      VectorSense
    </div>
    <div style={{ fontSize: 12, marginTop: 10, color: 'var(--text-secondary)', fontWeight: 500 }}>
      Initializing digital twin...
    </div>
  </div>
);

// ── On-screen flight pad (bottom-right, out of 3D viewport centre) ───
const FlightPad = ({ onPress }) => {
  const rows = [
    [['F', 'Alt +'], ['W', 'Forward'], ['C', 'Alt -']],
    [['A', 'Left'],  ['S', 'Back'],    ['D', 'Right']],
  ];
  return (
    <div className="flight-pad">
      <div className="flight-pad-label">Flight — WASD &nbsp;·&nbsp; F / C altitude</div>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: 5 }}>
          {row.map(([key, label]) => (
            <button
              key={key}
              id={`flight-${key.toLowerCase()}`}
              className="flight-key"
              onMouseDown={() => onPress(key.toLowerCase())}
            >
              <strong>{key}</strong>
              <span>{label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

// ── Right panel: metric row helper ───────────────────────────
const MetricRow = ({ label, value, live }) => (
  <div className="item-row">
    <span className="key">{label}</span>
    <span className={`value${live ? ' live' : ''}`}>{value}</span>
  </div>
);

// ── Spatial Twin mini-HUD (small, hugs bottom-left corner) ───
const SpatialHUD = ({ pos, sensors }) => (
  <div style={{
    position: 'absolute',
    bottom: 28,
    left: 32,
    background: 'rgba(255,255,255,0.76)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--panel-border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    display: 'flex',
    gap: 20,
    alignItems: 'center',
    boxShadow: 'var(--shadow-sm)',
    zIndex: 50,
    pointerEvents: 'none',
  }}>
    {[['X', pos[0]], ['Y', pos[1]], ['Z', pos[2]]].map(([axis, val]) => (
      <div key={axis} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{axis}</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>{(+val).toFixed(1)}</div>
      </div>
    ))}
    <div style={{ width: 1, height: 28, background: 'var(--panel-border)' }} />
    <div style={{ textAlign: 'left' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Gas</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: sensors.alert ? 'var(--danger)' : 'var(--text-main)' }}>{sensors.gas}</div>
    </div>
    <div style={{ textAlign: 'left' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Thermal</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>{sensors.thermal}</div>
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════
function App() {
  const [wsStatus,   setWsStatus]   = useState('Offline');
  const [activeTab,  setActiveTab]  = useState('Spatial Twin');
  const [showPad,    setShowPad]    = useState(true);
  const [pos,        setPos]        = useState([2, 5, 2.0]);
  const [modeLabel,  setModeLabel]  = useState('GAS_TOMOGRAPHY');
  const [valveState, setValveState] = useState('OPEN');
  const [nsResidual, setNsResidual] = useState(0.0001);
  const [leak,       setLeak]       = useState(false);
  const [advisory,   setAdvisory]   = useState('Simulation nominal. Autonomous inspection loop active.');

  const telemetryRef = useRef({ pos: [2, 5, 2.0], quat: [0, 0, 0, 1] });
  const socketRef    = useRef(null);
  const isReady      = wsStatus === 'Connected';

  // Derive sensors from position in real-time
  const sensors = useSensorSim(modeLabel, pos);

  // ── WebSocket ──────────────────────────────────────────────
  useEffect(() => {
    let retryTimer;
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      ws.onopen  = () => setWsStatus('Connected');
      ws.onclose = () => {
        setWsStatus('Offline');
        retryTimer = setTimeout(connect, 3000);
      };
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.source === 'DISCREPANCY_ENGINE') {
            const p = data.reality?.pos || pos;
            telemetryRef.current = {
              pos:  p,
              quat: data.reality?.quat || [0, 0, 0, 1],
            };
            setPos([...p]);
            setNsResidual(data.reality?.ns_residual ?? nsResidual);
            setLeak(!!data.reality?.leak);
            setValveState(data.network?.digital_status || valveState);
            setAdvisory(data.reality?.advisory || advisory);
            setModeLabel(data.mission_mode || modeLabel);
          }
        } catch { /* non-JSON frame, ignore */ }
      };
      socketRef.current = ws;
    };
    connect();
    return () => {
      clearTimeout(retryTimer);
      socketRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Send WS message helper ─────────────────────────────────
  const send = useCallback((obj) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(obj));
    }
  }, []);

  // ── Manual flight from keyboard ────────────────────────────
  const sendMove = useCallback((key) => {
    const move = KEY_MAP[key.toLowerCase()];
    if (!move) return;

    // Always update local position for instant visual feedback
    setPos(prev => {
      const next = [prev[0] + move.dx, prev[1] + move.dy, prev[2] + move.dz];
      telemetryRef.current = { pos: next, quat: [0, 0, 0, 1] };
      return next;
    });

    // Also push to backend if connected
    send({ type: 'MANUAL_MOVE', ...move });
  }, [send]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k in KEY_MAP) { e.preventDefault(); sendMove(k); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sendMove]);

  // ── Tab content ─────────────────────────────────────────────
  // On Spatial Twin the centre is empty — the 3D scene shows through.
  // A compact HUD at the bottom-left handles position + key sensor data.
  const renderCenter = () => {
    switch (activeTab) {
      case 'Mission Control':
        return (
          <MissionControl
            mode={modeLabel}
            onModeChange={(m) => {
              setModeLabel(m);
              send({ type: 'MISSION_CHANGE', mode: m });
            }}
          />
        );
      case 'Drone Specs':
        return <DroneSpecs />;
      case 'Threat Log':
        return <ThreatEconomics data={{ leak, sensors, pos }} />;
      case 'System Diagnostics':
        return (
          <SystemDiagnostics
            telemetryRaw={JSON.stringify({ pos, nsResidual, sensors, mode: modeLabel }, null, 2)}
            infraStatus={{
              GAZEBO_BRIDGE: isReady ? 'CONNECTED' : 'OFFLINE',
              PINN_KERNEL:   'CONNECTED',
              DCS_GATEWAY:   'ENCRYPTED',
            }}
          />
        );
      case 'Spatial Twin':
      default:
        return null; // 3D scene fills this space completely
    }
  };

  return (
    <div className="dashboard-container">
      {!isReady && <Loader />}

      {/* ── 3D Canvas Background ───────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, opacity: 1, transition: 'opacity 0.8s' }}>
        <Canvas gl={{ antialias: true, alpha: true }}>
          <PerspectiveCamera makeDefault position={[40, 28, 40]} fov={38} far={2000} />
          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            autoRotate
            autoRotateSpeed={0.35}
            minPolarAngle={0.3}
            maxPolarAngle={Math.PI / 2.1}
          />
          <SpatialTwin telemetryRef={telemetryRef} mode={modeLabel} />
        </Canvas>
      </div>

      {/* ── HUD Glass Layer ────────────────────────────────── */}
      <div className="hud-overlay">

        {/* Header */}
        <div className="top-bar">
          <div className="glass-panel header-panel">
            <div className="logo-box">VS</div>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px' }}>
                VectorSense Dashboard
              </h1>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontWeight: 500 }}>
                Connection:&nbsp;
                <span style={{ fontWeight: 700, color: isReady ? 'var(--success)' : 'var(--danger)' }}>
                  {wsStatus}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              id="toggle-flight-pad"
              className="status-pill"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowPad(v => !v)}
            >
              {showPad ? 'Hide Controls' : 'Show Controls'}
            </button>
            <div className={`status-pill${leak ? ' alert' : ''}`}>
              {leak ? 'Anomaly Detected' : 'System Nominal'}
            </div>
          </div>
        </div>

        {/* Main 3-column layout */}
        <div className="main-content">

          {/* ── Left column ──────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 240, flexShrink: 0, overflowY: 'auto', maxHeight: '100%', paddingBottom: 8 }}>

            {/* Navigation */}
            <div className="glass-panel">
              <div className="section-label">Applications</div>
              <nav className="side-nav">
                {TABS.map(({ id }) => (
                  <button
                    key={id}
                    id={`nav-${id.replace(/\s+/g, '-').toLowerCase()}`}
                    className={`nav-button${activeTab === id ? ' active' : ''}`}
                    onClick={() => setActiveTab(id)}
                  >
                    {id}
                  </button>
                ))}
              </nav>
            </div>

            {/* SCADA Controls */}
            <MitigationControl
              valveState={valveState}
              onCommand={(cmd) => send({ type: 'SCADA_COMMAND', command: cmd })}
            />
          </div>

          {/* ── Centre ───────────────────────────────────── */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
            {renderCenter()}
          </div>

          {/* ── Right column ─────────────────────────────── */}
          <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>

            {/* Current Protocol */}
            <div className="glass-panel">
              <div className="section-label">Current Protocol</div>
              <div style={{ background: 'var(--panel-item-bg)', borderRadius: 'var(--radius-sm)', padding: '14px', border: '1px solid var(--panel-border)', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
                  {{
                    GAS_TOMOGRAPHY:       'Gas Leak Detection',
                    THERMAL_PROFILING:    'Thermal IR Scan',
                    ACOUSTIC_DIAGNOSTICS: 'Acoustic Inspection',
                    LIDAR_MAPPING:        'LiDAR 3D Mapping',
                  }[modeLabel] || 'In-Flight Surveillance'}
                </div>
                <MetricRow label="Position X/Y" value={`${pos[0].toFixed(2)}, ${pos[1].toFixed(2)}`} />
                <MetricRow label="Altitude Z" value={`${pos[2].toFixed(2)} m`} />
                <MetricRow label="Core Residual" value={nsResidual.toExponential(3)} live />
              </div>
            </div>

            {/* Hardware Sensors */}
            <div className="glass-panel">
              <div className="section-label">Hardware Sensors</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Gas Conc.',  reading: sensors.gas,    cls: sensors.alert ? 'bad' : '' },
                  { label: 'Thermal IR', reading: sensors.thermal, cls: '' },
                  { label: 'Sonic Node', reading: sensors.sonic,   cls: '' },
                  { label: 'LiDAR Mesh', reading: 'Active',        cls: 'ok' },
                ].map(s => (
                  <div key={s.label} className={`sensor-cell${s.cls ? ' ' + s.cls : ''}`}>
                    <div className="label">{s.label}</div>
                    <div className="reading">{s.reading}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Intelligence Advisory */}
            <div className="glass-panel" style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="dot-live blink" />
                <span className="section-label" style={{ marginBottom: 0 }}>Intelligence Advisory</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--text-main)', fontWeight: 500 }}>
                {advisory}
              </div>
              {sensors.alert && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(192,57,43,0.07)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(192,57,43,0.18)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>
                    Gas concentration elevated — {sensors.gas}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>
                    Proximity to mapped leak source: critical range
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── On-screen flight pad — bottom-centre gap between columns ─ */}
      {showPad && <FlightPad onPress={sendMove} />}
    </div>
  );
}

export default App;
