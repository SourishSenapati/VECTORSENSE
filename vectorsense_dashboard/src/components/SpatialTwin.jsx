import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Text, Trail, Cylinder, Box, Points } from '@react-three/drei';
import * as THREE from 'three';

const SpatialTwin = ({ pos, reality }) => {
  const droneRef = useRef();
  const mode = reality.mode || 'GAS_TOMOGRAPHY';

  // 1. Infrastructure 
  const Infrastructure = useMemo(() => {
    return (
      <group>
        {/* Reactor Vessel (Thermal Target) */}
        <group position={[10, 0, -5]}>
          <Cylinder args={[2, 2, 5]} position={[0, 2.5, 0]}>
            <meshStandardMaterial 
              color={mode === 'THERMAL_PROFILING' ? '#ff3300' : '#222'} 
              emissive={mode === 'THERMAL_PROFILING' ? '#ff5500' : '#000'}
              emissiveIntensity={mode === 'THERMAL_PROFILING' ? 2 : 0}
            />
          </Cylinder>
          <Text position={[0, 6, 0]} fontSize={0.3} color="orange">REACTOR_V_01</Text>
        </group>

        {/* Pump Station (Acoustic Target) */}
        <group position={[-10, 0, 10]}>
          <Box args={[1, 1, 1]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#333" />
          </Box>
          <Text position={[0, 2, 0]} fontSize={0.3} color="cyan">PUMP_STAT_K6</Text>
        </group>

        {/* Pipe Racks */}
        <Cylinder args={[0.3, 0.3, 40]} position={[0, 8, 5]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#111" metalness={1} />
        </Cylinder>
      </group>
    );
  }, [mode]);

  // Dynamic Hazard Visuals
  const plumeRef = useRef();
  const soundRef = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (plumeRef.current) {
      plumeRef.current.scale.set(1.2 + Math.sin(t) * 0.1, 1, 1.2 + Math.cos(t) * 0.1);
    }
    if (soundRef.current) {
      soundRef.current.scale.setScalar(1 + (t % 1) * 2);
      soundRef.current.material.opacity = 1 - (t % 1);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <Infrastructure />

      {/* Mode 1: Gas Mode Visualization */}
      {mode === 'GAS_TOMOGRAPHY' && reality.leak && (
        <group position={[5, 5, 8]} ref={plumeRef}>
          <Sphere args={[2, 32, 32]}>
            <MeshDistortMaterial
              color="#00ffff"
              distort={0.6}
              radius={1}
              transparent
              opacity={0.4}
              emissive="#0088ff"
              emissiveIntensity={4}
            />
          </Sphere>
        </group>
      )}

      {/* Mode 2: Thermal Mode Visualization (Heat Map) */}
      {mode === 'THERMAL_PROFILING' && reality.anomaly_detected && (
        <group position={[10, 2.5, -5]}>
          <Sphere args={[2.5, 32, 32]}>
            <meshStandardMaterial 
              color="#ff6600" 
              transparent 
              opacity={0.3} 
              wireframe 
            />
          </Sphere>
          <Text position={[0, 4, 0]} color="orange" fontSize={0.4}>CRITICAL_HEAT: {reality.temp_intensity}K</Text>
        </group>
      )}

      {/* Mode 3: Acoustic Mode Visualization (Pulsing Rings) */}
      {mode === 'ACOUSTIC_DIAGNOSTICS' && reality.anomaly_detected && (
        <group position={[-10, 0.5, 10]}>
          <mesh rotation-x={-Math.PI / 2} ref={soundRef}>
            <ringGeometry args={[0.5, 0.6, 32]} />
            <meshStandardMaterial color="#00ffff" transparent opacity={0.5} emissive="#00ffff" emissiveIntensity={5} />
          </mesh>
          <Text position={[0, 3, 0]} color="cyan" fontSize={0.4}>CAVITATION_THRESHOLD_EXCEEDED</Text>
        </group>
      )}

      {/* Drone & Trajectory */}
      <group position={pos} ref={droneRef}>
        <Trail width={0.4} length={30} color={new THREE.Color(0, 1, 1)} attenuation={(t) => t * t}>
          <Box args={[0.4, 0.1, 0.4]}>
            <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={10} />
          </Box>
        </Trail>
      </group>
      
      <gridHelper args={[100, 50, "#003333", "#020202"]} />
    </>
  );
};

export default SpatialTwin;
