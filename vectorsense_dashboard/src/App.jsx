import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Environment } from '@react-three/drei';
import { Activity, Zap, Cpu } from 'lucide-react';
import SpatialTwin from './components/SpatialTwin';
import ThreatEconomics from './components/ThreatEconomics';
import MitigationControl from './components/MitigationControl';
import MissionControl from './components/MissionControl';
import SystemDiagnostics from './components/SystemDiagnostics';
import './App.css';

function App() {
  const [telemetry, setTelemetry] = useState({
    pos: [0, 5, 10],
    reality: {
      mass_loss: 0, status: "CORE_SYNC_OK", leak: false, mode: "GAS_TOMOGRAPHY",
      sensor_precision: 99.98, physics_tflops: 12.4, worm_ledger: "INTEGRITY_OK"
    },
    network: { digital_status: "CLOSED", digital_pressure: "1.0 atm", network_integrity: "SECURE" },
    cyber_physical_discrepancy: false,
    alert_status: "NOMINAL",
    telemetry_raw: "",
    infrastructure_status: {}
  });

  const [wsStatus, setWsStatus] = useState("DISCONNECTED");
  const [kinematicLoss, setKinematicLoss] = useState(false);
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
        try {
          const data = JSON.parse(event.data);
          if (data.source === "DISCREPANCY_ENGINE") {
            const isLoss = data.alert_status === "KINEMATIC_LOSS";
            setKinematicLoss(isLoss);
            setTelemetry(current => ({
              ...current,
              reality: data.reality,
              network: data.network,
              cyber_physical_discrepancy: data.cyber_physical_discrepancy,
              alert_status: data.alert_status,
              telemetry_raw: data.telemetry_raw,
              infrastructure_status: data.infrastructure_status,
              pos: isLoss ? current.pos : (data.reality?.pos ?? current.pos),
            }));
          }
        } catch (parseErr) { console.warn("WS frame parse error:", parseErr); }
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
    <div className={`h-screen w-screen overflow-hidden ${isHacked ? 'bg-red-950/10' : ''}`}>
      
      {/* 1. LAYER 0: THE SPATIAL TWIN (BACKGROUND) */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[20, 10, 20]} fov={50} />
          <OrbitControls target={[0, 5, 0]} maxPolarAngle={Math.PI / 2.1} />
          <color attach="background" args={['#020205']} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <SpatialTwin pos={telemetry.pos} reality={telemetry.reality} frozen={kinematicLoss} />
          <Environment preset="night" />
        </Canvas>
      </div>

      {/* 2. LAYER 1: GLASS NAV & STATS */}
      <header className={`absolute top-6 left-6 right-6 z-50 liquid-glass p-4 flex justify-between items-center transition-all duration-700 ${isHacked ? 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)]' : ''}`}>
        <div className="flex items-center gap-6">
          <div className={`h-10 w-10 flex items-center justify-center font-bold text-lg rounded-xl liquid-glass-soft transition-colors duration-500 ${isHacked ? 'text-red-500' : 'text-emerald-400'}`}>VS</div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white/90">VectorSense <span className="text-white/30 font-light mx-2">|</span> <span className="mono text-xs text-white/50">PHYSICS_TWIN_V4.0</span></h1>
            <div className="flex items-center gap-3 text-[10px] mono uppercase mt-1">
              <span className={`h-1.5 w-1.5 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-emerald-400 accent-glow' : 'bg-rose-500 animate-pulse'}`} />
              <span className="text-white/40">Status:</span> <span className={wsStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-rose-500'}>{wsStatus}</span>
              <span className="text-white/40 ml-2">Kernel:</span> <span className="text-emerald-400/70">ASYNC_PINN_OK</span>
            </div>
          </div>
        </div>

        <div className="flex gap-10 pr-4">
          <StatBox icon={<Activity size={14}/>} label="PRECISION" value={`${(telemetry.reality.sensor_precision || 99.98).toFixed(2)}%`} color="text-emerald-400" />
          <StatBox icon={<Zap size={14}/>} label="THROUGHPUT" value={`${(telemetry.reality.physics_tflops || 12.4).toFixed(1)}T`} color="text-cyan-400" />
          <StatBox icon={<Cpu size={14}/>} label="ADAPTIVE" value={telemetry.reality.mode} color="text-white/80" />
        </div>
      </header>

      {/* 3. LAYER 2: INTERACTIVE MODULES */}
      <div className="absolute top-32 right-6 z-40 flex flex-col gap-6 w-80">
        <div className="liquid-glass p-5">
           <MissionControl currentMode={telemetry.reality.mode} onModeChange={handleModeChange} />
        </div>
        <div className="liquid-glass p-5">
           <ThreatEconomics massFlux={telemetry.reality.mass_loss || 0} activeTime={0} gasType="Hydrocarbon" />
        </div>
        <div className="liquid-glass p-5">
           <MitigationControl valveState={isHacked ? "SPOOFED" : (telemetry.network.digital_status || "CLOSED")} />
        </div>
      </div>

      {/* 4. LAYER 3: PERSISTENT DIAGNOSTICS */}
      <SystemDiagnostics 
        telemetryRaw={telemetry.telemetry_raw} 
        infraStatus={telemetry.infrastructure_status} 
      />

      {/* 5. ALERTS & OVERLAYS */}
      {kinematicLoss && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-xl">
          <div className="liquid-glass p-10 border-yellow-500/50 max-w-2xl text-center">
            <h2 className="text-4xl font-black text-yellow-500 mb-4 tracking-tighter uppercase">ERR_0x04: KINEMATIC_TIMEOUT</h2>
            <p className="mono text-yellow-200/60 text-sm mb-6 uppercase tracking-widest">WSL Physics engine link broken. Drone state is stale.</p>
            <div className="liquid-glass-soft p-4 rounded-lg mono text-xs text-left">
              $ ros2 launch vectorsense_drone_sim full_demo.launch.py
            </div>
          </div>
        </div>
      )}

      {isHacked && !kinematicLoss && (
        <div className="absolute inset-0 z-[150] pointer-events-none bg-red-950/20 backdrop-blur-[1px] animate-pulse" />
      )}
    </div>
  );
}

function StatBox({ icon, label, value, color }) {
  return (
    <div className="flex flex-col items-start min-w-[100px]">
      <div className="text-[10px] mono text-white/30 uppercase tracking-widest flex items-center gap-1.5 mb-1">{icon} {label}</div>
      <div className={`text-sm font-bold tracking-tight ${color}`}>{value}</div>
    </div>
  );
}

export default App;
