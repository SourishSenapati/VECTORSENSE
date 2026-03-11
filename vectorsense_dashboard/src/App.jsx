import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Environment } from '@react-three/drei';
import { Activity, Zap, ShieldAlert, Cpu, Network } from 'lucide-react';
import SpatialTwin from './components/SpatialTwin';
import ThreatEconomics from './components/ThreatEconomics';
import MitigationControl from './components/MitigationControl';
import MissionControl from './components/MissionControl';
import './App.css';

function App() {
  const [telemetry, setTelemetry] = useState({
    pos: [0, 5, 10], 
    reality: { mass_loss: 0, status: "CORE_SYNC_OK", leak: false, mode: "GAS_TOMOGRAPHY" },
    network: { digital_status: "CLOSED", digital_pressure: "1.0 atm", network_integrity: "SECURE" },
    cyber_physical_discrepancy: false,
    alert_status: "NOMINAL"
  });

  const [wsStatus, setWsStatus] = useState("DISCONNECTED");
  const ws = useRef(null);

  useEffect(() => {
    const connectWS = () => {
      ws.current = new WebSocket("ws://localhost:8000");
      ws.current.onopen = () => setWsStatus("CONNECTED");
      ws.current.onclose = () => {
        setWsStatus("RECONNECTING...");
        setTimeout(connectWS, 2000);
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.source === "DISCREPANCY_ENGINE") {
          setTelemetry(current => ({
            ...current,
            reality: data.reality,
            network: data.network,
            cyber_physical_discrepancy: data.cyber_physical_discrepancy,
            alert_status: data.alert_status,
            pos: data.reality.pos || current.pos
          }));
        }
      };
    };

    connectWS();
    return () => ws.current?.close();
  }, []);

  const handleModeChange = (newMode) => {
    if (ws.current && wsStatus === "CONNECTED") {
      ws.current.send(JSON.stringify({ type: "MISSION_CHANGE", mode: newMode }));
    }
  };

  const isHacked = telemetry.cyber_physical_discrepancy;

  return (
    <div className={`dashboard-container h-screen w-screen text-[#e0e0f0] overflow-hidden font-sans ${isHacked ? 'bg-red-950/20' : 'bg-[#050510]'}`}>
      
      {/* Cyber Alert Overlay */}
      {isHacked && (
        <div className="absolute inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center bg-red-900/10 backdrop-blur-[2px] animate-pulse">
          <div className="border-4 border-red-500 p-8 bg-black/90 text-red-500 max-w-2xl transform -skew-x-12 shadow-[0_0_50px_rgba(239,68,68,0.5)]">
            <h2 className="text-6xl font-black tracking-tighter uppercase italic mb-4 flex items-center gap-4">
              <ShieldAlert size={64}/> SCADA_SPOOFING
            </h2>
            <p className="text-xl font-mono tracking-widest text-white mb-6 uppercase">Physical reality mismatches digital telemetry</p>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className={`absolute top-0 w-full z-50 p-6 flex justify-between items-center transition-all duration-500 ${isHacked ? 'border-b-2 border-red-500 bg-red-900/10' : 'bg-black/50'}`}>
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 flex items-center justify-center font-bold text-xl rounded-sm transition-all duration-500 ${isHacked ? 'bg-red-600' : 'bg-blue-600'}`}>VS</div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white/90">
              VectorSense // General Purpose Suite
            </h1>
            <div className="flex items-center gap-2 text-[10px] tracking-widest font-mono uppercase">
              <span className={`h-2 w-2 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`} />
              CORE_BRAIN: {wsStatus} // MISSION: {telemetry.reality.mode}
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <StatBox icon={<Network size={16}/>} label="CYBER_NETWORK" value={telemetry.network.network_integrity} color={isHacked ? "text-red-500" : "text-blue-400"} />
          <StatBox icon={<Cpu size={16}/>} label="ADAPTIVE_BRAIN" value={telemetry.reality.mode} color="text-green-400" />
        </div>
      </header>

      {/* Phase 3: Mission Control Panel */}
      <MissionControl currentMode={telemetry.reality.mode} onModeChange={handleModeChange} />

      {/* Main 3D Viewport */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[20, 10, 20]} fov={50} />
          <OrbitControls target={[0, 5, 0]} maxPolarAngle={Math.PI / 2.1} />
          <color attach="background" args={['#020205']} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <SpatialTwin pos={telemetry.pos} reality={telemetry.reality} />
          <Environment preset="night" />
        </Canvas>
      </div>

      <ThreatEconomics massFlux={telemetry.reality.mass_loss || 0} activeTime={0} gasType="Hydrocarbon" />
      <MitigationControl valveState={isHacked ? "SPOOFED" : (telemetry.network.digital_status || "CLOSED")} />

      {/* Aesthetic Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[200]" style={{backgroundSize: '100% 2px, 3px 100%'}} />
    </div>
  );
}

function StatBox({ icon, label, value, color }) {
  return (
    <div className="flex flex-col items-end">
      <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1">{icon} {label}</div>
      <div className={`text-lg font-black tracking-tight ${color}`}>{value}</div>
    </div>
  );
}

export default App;
