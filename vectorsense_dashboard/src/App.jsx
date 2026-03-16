import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import SpatialTwin from './components/SpatialTwin';
import MissionControl from './components/MissionControl';
import ThreatEconomics from './components/ThreatEconomics';
import MitigationControl from './components/MitigationControl';
import SystemDiagnostics from './components/SystemDiagnostics';
import './App.css';

function App() {
  const [wsStatus, setWsStatus] = useState("DISCONNECTED");
  const [telemetry, setTelemetry] = useState({
    reality: { mass_loss: 0, status: "CORE_SYNC_OK", leak: false, mode: "GAS_TOMOGRAPHY" },
    alert_status: "NOMINAL",
    cyber_physical_discrepancy: false,
    telemetry_raw: "",
    infrastructure_status: {}
  });

  // THE HIGH-PERFORMANCE SINK: Reference stored خارج React state for 60FPS updates
  const telemetryRef = useRef({
    pos: [0, 5, 0],
    quat: [0, 0, 0, 1],
    reality: {}
  });

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
            // Update the high-speed reference (BUTTERY SMOOTH)
            telemetryRef.current = {
              pos: data.reality?.pos || telemetryRef.current.pos,
              quat: data.reality?.quat || telemetryRef.current.quat,
              reality: data.reality
            };

            // Update UI state (Throttled by React)
            setTelemetry({
              reality: data.reality,
              alert_status: data.alert_status,
              cyber_physical_discrepancy: data.cyber_physical_discrepancy,
              telemetry_raw: data.telemetry_raw,
              infrastructure_status: data.infrastructure_status
            });
          }
        } catch (e) { console.error("Parse Fail", e); }
      };
    };
    connectWS();
    return () => ws.current?.close();
  }, []);

  const handleModeChange = (mode) => {
    if (ws.current) ws.current.send(JSON.stringify({ type: "MISSION_CHANGE", mode }));
  };

  const isHacked = telemetry.cyber_physical_discrepancy;

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden font-sans">
      
      {/* FULL-BLEED SPATIAL TWIN CANVAS */}
      <div className="absolute inset-0 pointer-events-none">
        <Canvas shadows gl={{ antialias: false, stencil: false, depth: true }}>
          <PerspectiveCamera makeDefault position={[30, 15, 30]} fov={45} />
          <color attach="background" args={['#050510']} />
          <Environment preset="night" />
          
          <SpatialTwin telemetryRef={telemetryRef} />

          <EffectComposer disableNormalPass>
            <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* OVERLAY: LIQUID GLASS PANELS */}
      <div className="relative z-50 h-full w-full p-8 pointer-events-none">
        
        {/* TOP BAR: HUD */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-6">
            <div className="h-12 w-12 bg-cyan-500/20 rounded-xl border border-cyan-500/50 flex items-center justify-center font-black text-cyan-400">VS</div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">VectorSense Ghost Core</h1>
              <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono tracking-widest mt-1 uppercase">
                <span className={`h-2 w-2 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-cyan-400' : 'bg-red-500 animate-pulse'}`} />
                {wsStatus} <span className="mx-1">/</span> LINUX_IPC_OK <span className="mx-1">/</span> TRT_STABLE
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <GlassPanel label="NS_RESIDUAL" value={telemetry.reality.ns_residual?.toFixed(6) || "0.000000"} color="text-cyan-400" />
            <GlassPanel label="MASS_LOSS" value={`${telemetry.reality.mass_loss || 0} kg/s`} color="text-red-400" />
            <GlassPanel label="FIN_EXPOSURE" value={`$${(telemetry.reality.commodity_loss_rate || 0).toLocaleString()}/hr`} color="text-emerald-400" />
          </div>
        </div>

        {/* RIGHT FLANK: CONTROL & ECONOMICS */}
        <div className="absolute right-8 top-32 flex flex-col gap-6 w-80 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-2xl border border-white/5 p-6 rounded-3xl shadow-2xl">
            <MissionControl currentMode={telemetry.reality.mode} onModeChange={handleModeChange} />
          </div>
          
          <div className="bg-black/60 backdrop-blur-2xl border border-white/5 p-6 rounded-3xl shadow-2xl">
            <ThreatEconomics massFlux={telemetry.reality.mass_loss || 0} activeTime={0} gasType="CH4" />
          </div>

          <div className="bg-black/60 backdrop-blur-2xl border border-white/5 p-6 rounded-3xl shadow-2xl">
            <MitigationControl valveState={isHacked ? "SPOOFED" : "LOCKED"} />
          </div>
        </div>

        {/* BOTTOM: SYSTEM CONSOLE */}
        <div className="absolute bottom-8 left-8 right-8 pointer-events-auto">
          <SystemDiagnostics 
            telemetryRaw={telemetry.telemetry_raw} 
            infraStatus={telemetry.infrastructure_status} 
          />
        </div>

      </div>

      {isHacked && (
        <div className="absolute inset-0 z-[100] border-[20px] border-red-500/20 pointer-events-none animate-pulse" />
      )}
    </div>
  );
}

function GlassPanel({ label, value, color }) {
  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl min-w-[160px]">
      <div className="text-[10px] font-mono text-white/30 tracking-[0.2em] mb-1 uppercase">{label}</div>
      <div className={`text-xl font-black tracking-tighter ${color}`}>{value}</div>
    </div>
  );
}

export default App;
