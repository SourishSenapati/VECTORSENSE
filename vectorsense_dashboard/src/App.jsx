import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Environment } from '@react-three/drei';
import { Activity, Zap, ShieldAlert, Cpu, Network } from 'lucide-react';
import SpatialTwin from './components/SpatialTwin';
import ThreatEconomics from './components/ThreatEconomics';
import MitigationControl from './components/MitigationControl';
import './App.css';

function App() {
  const [telemetry, setTelemetry] = useState({
    pos: [0, 5, 10], 
    reality: { mass_loss: 0, status: "CORE_SYNC_OK", leak: false },
    network: { digital_status: "CLOSED", digital_pressure: "1.0 atm" },
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
          setTelemetry(prev => ({
            ...prev,
            ...data,
            pos: data.reality?.plume_origin || prev.pos
          }));
        }
      };
    };

    connectWS();
    return () => ws.current?.close();
  }, []);

  const isHacked = telemetry.cyber_physical_discrepancy;

  return (
    <div className={`dashboard-container h-screen w-screen text-[#e0e0f0] overflow-hidden font-sans ${isHacked ? 'bg-red-950/20' : 'bg-[#050510]'}`}>
      
      {/* Directive 3.2: The 'SYSTEM INTEGRITY' Intelligence Overlay */}
      {isHacked && (
        <div className="absolute inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center bg-red-900/10 backdrop-blur-[2px] animate-pulse">
          <div className="border-4 border-red-500 p-8 bg-black/90 text-red-500 max-w-2xl transform -skew-x-12 shadow-[0_0_50px_rgba(239,68,68,0.5)]">
            <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-none mb-4 flex items-center gap-4">
              <ShieldAlert size={64}/> SCADA_SPOOFING_ATTACK
            </h2>
            <p className="text-xl font-mono tracking-widest text-white mb-6">
              CYBER_PHYSICAL_DISCREPANCY_DETECTED: PHYSICAL REALITY MISMATCHES DIGITAL TELEMETRY
            </p>
            <div className="grid grid-cols-2 gap-4 font-mono text-sm border-t border-red-500/50 pt-6">
              <div className="p-4 bg-red-500/20 text-white">
                <span className="text-red-400 block mb-1 uppercase text-xs tracking-tighter">Plant Sensor Reporting</span>
                VALVE_104A: {telemetry.network.digital_status} (NOMINAL)
              </div>
              <div className="p-4 bg-green-500/20 text-white">
                <span className="text-green-400 block mb-1 uppercase text-xs tracking-tighter">Drone Ground Truth</span>
                MASS_FLUX: {telemetry.reality.mass_loss} kg/s (HAZARD_DETECTED)
              </div>
            </div>
            <div className="mt-6 text-center text-xs tracking-[0.5em] text-red-500 font-bold animate-bounce">
              PROTOCOL_ACTUAL_TRUTH_ENABLED // AIRGAPPED_VERIFICATION_COMPLETE
            </div>
          </div>
          {/* Aggressive Visual Disturbance */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,0,0,0.1)_3px)]" />
        </div>
      )}

      {/* Header Bar */}
      <header className={`absolute top-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent transition-all duration-500 ${isHacked ? 'border-b-2 border-red-500' : ''}`}>
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 flex items-center justify-center font-bold text-xl rounded-sm transition-all duration-500 ${isHacked ? 'bg-red-600 animate-spin-slow' : 'bg-blue-600'}`}>
            VS
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
              VectorSense // Intelligence Node
            </h1>
            <div className="flex items-center gap-2 text-[10px] tracking-widest font-mono uppercase">
              <span className={`inline-block h-2 w-2 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              Sovereign Link: {wsStatus} // {isHacked ? 'THREAT_MODEL_ACTIVE' : 'SYSTEM_SECURE'}
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <StatBox icon={<Network size={16}/>} label="CYBER_NETWORK" value={telemetry.network.network_integrity} color={isHacked ? "text-red-500" : "text-blue-400"} />
          <StatBox icon={<Cpu size={16}/>} label="TRUTH_ENGINE" value={isHacked ? "HACK_DETECTED" : "SYNCHRONIZED"} color={isHacked ? "text-red-500" : "text-green-400"} />
        </div>
      </header>

      {/* Main 3D Viewport */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
          <OrbitControls 
            target={telemetry.reality.plume_origin || [0, 5, 0]}
            maxPolarAngle={Math.PI / 2.1} 
            maxDistance={40}
          />
          
          <color attach="background" args={[isHacked ? '#100000' : '#050508']} />
          <fog attach="fog" args={[isHacked ? '#100000' : '#050508', 20, 50]} />
          
          <ambientLight intensity={0.5} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <SpatialTwin pos={telemetry.pos} reality={telemetry.reality} />
          
          <Environment preset="night" />
        </Canvas>
      </div>

      <ThreatEconomics 
        massFlux={telemetry.reality.mass_loss} 
        activeTime={0} 
        gasType="Hydrocarbon" 
      />

      <MitigationControl valveState={isHacked ? "SPOOFED_OPEN" : "CLOSED"} />

      {/* Aesthetic Overlays */}
      <div className="absolute inset-0 pointer-events-none border-[20px] border-white/5 opacity-20" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)] opacity-40" />

    </div>
  );
}

function StatBox({ icon, label, value, color }) {
  return (
    <div className="flex flex-col items-end">
      <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1">
        {icon} {label}
      </div>
      <div className={`text-lg font-black tracking-tight ${color}`}>{value}</div>
    </div>
  );
}

export default App;
