import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import SpatialTwin from './components/SpatialTwin';
import MissionControl from './components/MissionControl';
import ThreatEconomics from './components/ThreatEconomics';
import MitigationControl from './components/MitigationControl';
import SystemDiagnostics from './components/SystemDiagnostics';
import './App.css';

const Loader = () => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#00ffff', background: '#050510', zIndex: 999 }}>
    <div className="pulse" style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '4px' }}>SMARTBUS E-PRO</div>
    <div className="mono" style={{ fontSize: '10px', marginTop: '10px', opacity: 0.6 }}>INITIALIZING NEURAL PHYSICS KERNEL...</div>
  </div>
);

function App() {
  const [wsStatus, setWsStatus] = useState("OFFLINE");
  const [telemetry, setTelemetry] = useState({
    reality: { mass_loss: 0, status: "CORE_SYNC_OK", leak: false, mode: "GAS_TOMOGRAPHY", pos: [0, 5, 0] },
    network: { digital_status: "CLOSED", digital_pressure: "1.00 atm" },
    alert_status: "NOMINAL",
    cyber_physical_discrepancy: false,
    telemetry_raw: "WATING FOR SEED...",
    infrastructure_status: {
        WSL_GAZEBO_BRIDGE: "OFFLINE",
        WIN_PINN_KERNEL: "OFFLINE",
        DCS_ACTUATOR_API: "STANDBY"
    }
  });

  const telemetryRef = useRef({ pos: [0, 5, 0], quat: [0, 0, 0, 1] });

  const [isReady, setIsReady] = useState(false);

  // WebSocket lifecycle
  useEffect(() => {
    let ws;
    const connect = () => {
      ws = new WebSocket("ws://localhost:8000");
      ws.onopen = () => { setWsStatus("CONNECTED"); setIsReady(true); };
      ws.onclose = () => { setWsStatus("OFFLINE"); setIsReady(false); setTimeout(connect, 3000); };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.source === "DISCREPANCY_ENGINE") {
            telemetryRef.current = {
              pos: data.reality?.pos || [0, 5, 0],
              quat: data.reality?.quat || [0, 0, 0, 1]
            };
            setTelemetry({
              reality: data.reality,
              network: data.network,
              alert_status: data.alert_status,
              cyber_physical_discrepancy: data.cyber_physical_discrepancy,
              telemetry_raw: JSON.stringify(data.reality),
              infrastructure_status: data.infrastructure_status
            });
          }
        } catch (e) {
          console.warn("Parse Fail", e);
        }
      };
    };
    connect();
    return () => ws?.close();
  }, []);

  const isAlert = telemetry.cyber_physical_discrepancy;

  return (
    <div className="dashboard-container">
       {!isReady && <Loader />}
       
        {/* 3D Visual Engine */}
        <div style={{ position: 'absolute', inset: 0, opacity: isReady ? 1 : 0, transition: 'opacity 1s' }}>
          <Canvas gl={{ antialias: false }}>
            <PerspectiveCamera makeDefault position={[50, 40, 50]} fov={35} far={2000} />
            <OrbitControls enableDamping dampingFactor={0.05} />
            <SpatialTwin telemetryRef={telemetryRef} />
          </Canvas>
        </div>

        {/* HUD Overlay System */}
        <div className="hud-overlay">
          {/* Header Row */}
          <div className="top-bar">
            <div className="glass-panel">
              <div className="logo-box pulse">SB</div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-2px', margin: 0, color: '#e0e0e0' }}>SMARTBUS E-PRO</h1>
                <div className="mono" style={{ fontSize: '10px', color: wsStatus === 'CONNECTED' ? '#00ffff' : '#ff4d4d', marginTop: '4px' }}>
                   MISSION TIME: {new Date().toLocaleTimeString()} | BRIDGE: {wsStatus}
                </div>
              </div>
            </div>
            
            <div className={`status-pill ${isAlert ? 'alert animate-bounce' : ''}`}>
              {isAlert ? '🔥 FIRE ALERT: L2 RESPONSE' : 'SYSTEM NOMINAL'}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="main-content" style={{ display: 'flex', height: '100%', alignItems: 'stretch', paddingTop: '40px' }}>
            {/* Left Nav Buttons */}
            <div style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '15px', pointerEvents: 'auto' }}>
                {['NORMAL VISUAL', 'X-RAY PRO', 'EXPLODE CAD', 'SENSOR HUB', 'FIRE SIM', 'WIRING SYS', 'HEAT MAP'].map((mode, i) => (
                    <button key={mode} className="mono" style={{
                        padding: '10px 5px',
                        background: i === 0 ? 'rgba(0, 255, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: i === 0 ? '2px solid #00ffff' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: i === 0 ? '#00ffff' : '#888',
                        fontSize: '9px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        textAlign: 'center'
                    }}>
                        {mode}
                    </button>
                ))}
            </div>

            {/* Middle Spacer for 3D */}
            <div style={{ flex: 1 }} />

            {/* Right Control Panels */}
            <div className="right-panel pointer-events-auto" style={{ alignSelf: 'flex-start' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <MitigationControl valveState={telemetry.network.digital_status} />
                 {/* ROS2 Telemetry Stream Mock */}
                 <div className="glass-panel" style={{ flexDirection: 'column', alignItems: 'flex-start', fontSize: '10px', maxHeight: '200px' }}>
                    <div className="mono" style={{ color: '#00ffff', marginBottom: '10px' }}>ROS2 TELEMETRY STREAM</div>
                    <div className="mono" style={{ color: '#00ffb4', fontSize: '9px', opacity: 0.8, background: 'rgba(0,0,0,0.5)', padding: '10px', width: '100%', borderRadius: '4px' }}>
                        [7:04:12 PM] Core Bootstrap: OK. ROS2 Data Bus: Online.
                    </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bottom-bar pointer-events-auto" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="glass-panel" style={{ padding: '8px 20px', fontSize: '10px' }}>
                <div className="mono">HARDWARE NODES: <span style={{ color: '#00ffff' }}>24 ACTIVE</span></div>
            </div>
            <div className="glass-panel" style={{ padding: '8px 20px', fontSize: '10px' }}>
                <div className="mono">CPU LATENCY: <span style={{ color: '#00ffff' }}>0.32 ms</span></div>
            </div>
            <div className="glass-panel" style={{ padding: '8px 20px', fontSize: '10px' }}>
                <div className="mono">I/O TRAFFIC: <span style={{ color: '#00ffff' }}>12.5 GB/S</span></div>
            </div>
          </div>
        </div>
    </div>
  );
}

export default App;
