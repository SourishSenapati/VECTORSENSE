import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Environment, Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { AlertTriangle, DollarSign, Activity, Zap, ShieldAlert, Thermometer, Box } from 'lucide-react';
import SpatialTwin from './components/SpatialTwin';
import ThreatEconomics from './components/ThreatEconomics';
import MitigationControl from './components/MitigationControl';
import './App.css';

function App() {
  const [telemetry, setTelemetry] = useState({
    drone_id: "VectorSense_1",
    pos: [0, 5, 10], // x, y, z
    plume: [], // concentration tensor
    mass_flux: 0.0,
    gas_type: "Hydrogen",
    active_time: 0,
    valve_state: "OPEN"
  });

  const [wsStatus, setWsStatus] = useState("DISCONNECTED");
  const ws = useRef(null);

  // Connection to Python Spatial Twin Bridge
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
        setTelemetry(prev => ({
          ...prev,
          ...data,
          active_time: prev.active_time + 0.016 // Approx simulation increment @ 60fps
        }));
      };
    };

    connectWS();
    return () => ws.current?.close();
  }, []);

  return (
    <div className="dashboard-container h-screen w-screen bg-[#050510] text-[#e0e0f0] overflow-hidden font-sans selection:bg-red-900">
      
      {/* Header Bar */}
      <header className="absolute top-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-[#0a0a20] to-transparent">
        <div className="flex items-center gap-4">
          <div className="logo-glitch-active bg-red-600 h-10 w-10 flex items-center justify-center font-bold text-xl rounded-sm shadow-[0_0_20px_rgba(220,38,38,0.5)]">
            VS
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-red-400">
              VectorSense / Industrial Twin
            </h1>
            <div className="flex items-center gap-2 text-[10px] tracking-widest text-red-500/80 font-mono uppercase">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              CORE_SYNC: {wsStatus} // ASYNC_PINN_ACTIVE
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <StatBox icon={<Activity size={16}/>} label="SENSOR_PRECISION" value="99.98%" color="text-blue-400" />
          <StatBox icon={<Zap size={16}/>} label="PHYSICS_THROUGHPUT" value="12.4 TFLOPS" color="text-yellow-400" />
          <StatBox icon={<Box size={16}/>} label="WORM_LEDGER" value="INTEGRITY_OK" color="text-green-400" />
        </div>
      </header>

      {/* Main 3D Viewport */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
          <OrbitControls 
            target={[0, 5, 0]}
            maxPolarAngle={Math.PI / 2.1} 
            minDistance={5} 
            maxDistance={40}
            autoRotate={wsStatus === "DISCONNECTED"}
            autoRotateSpeed={0.5}
          />
          
          <color attach="background" args={['#050508']} />
          <fog attach="fog" args={['#050508', 20, 50]} />
          
          <ambientLight intensity={0.5} />
          <spotLight position={[20, 20, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
          <pointLight position={[-10, 10, -10]} intensity={1} color="#4040ff" />
          
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          {/* Volumetric Data Stream Component */}
          <SpatialTwin pos={telemetry.pos} plume={telemetry.plume} />
          
          <Environment preset="night" />
        </Canvas>
      </div>

      {/* Financial & Threat Overlay */}
      <ThreatEconomics 
        massFlux={telemetry.mass_flux} 
        activeTime={telemetry.active_time} 
        gasType={telemetry.gas_type} 
      />

      {/* Mitigation Logic */}
      <MitigationControl valveState={telemetry.valve_state} />

      {/* Scanning Overlay (Aesthetics) */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 opacity-50 scanner-scanline" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_#050510_100%)] opacity-40" />

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
