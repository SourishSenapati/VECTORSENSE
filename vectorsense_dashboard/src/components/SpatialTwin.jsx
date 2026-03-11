import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Text, Trail, Cylinder, Box, Points } from '@react-three/drei';
import * as THREE from 'three';

const SpatialTwin = ({ pos }) => {
  const droneRef = useRef();

  // Directive 3.1: Industrial Infrastructure Map (Extended Pipe Rack)
  const Pipes = useMemo(() => {
    return (
      <group position={[0, 0, 0]}>
        {/* Main Pipe Rack Tunnels */}
        <Cylinder args={[0.3, 0.3, 40]} position={[0, 8, 5]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#222" roughness={0} metalness={1} />
        </Cylinder>
        <Cylinder args={[0.2, 0.2, 40]} position={[0, 7.5, 6]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#333" roughness={0} metalness={1} />
        </Cylinder>
        
        {/* Massive Infrastructure Pillars */}
        {[-15, -10, -5, 0, 5, 10, 15, 20].map((x, i) => (
          <Box key={i} args={[0.8, 8, 0.8]} position={[x, 4, 5]}>
            <meshStandardMaterial color="#111" />
          </Box>
        ))}
      </group>
    );
  }, []);

  // Volumetric Hazard Visualizer
  const particles = useMemo(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
      sizes[i] = Math.random() * 0.1;
    }
    return { positions, sizes };
  }, []);

  const plumeRef = useRef();
  
  useFrame((state) => {
    if (plumeRef.current) {
      const t = state.clock.getElapsedTime();
      plumeRef.current.rotation.y = t * 0.2;
      plumeRef.current.scale.set(1.2 + Math.sin(t) * 0.1, 1, 1.2 + Math.cos(t) * 0.1);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      {/* Industrial Backbone */}
      {Pipes}

      {/* Phase 3: The Holographic Gas Cloud (Aggressive Evasive Target) */}
      <group position={[5, 5, 8]} ref={plumeRef}>
        <Float speed={2} rotationIntensity={2} floatIntensity={1}>
          <Sphere args={[2, 64, 64]}>
            <MeshDistortMaterial
              color="#00ffff"
              speed={5}
              distort={0.6}
              radius={1}
              transparent
              opacity={0.4}
              emissive="#0088ff"
              emissiveIntensity={4}
            />
          </Sphere>
        </Float>
        
        <Points positions={particles.positions} sizes={particles.sizes}>
          <pointsMaterial 
            color="#00ffff" 
            size={0.08} 
            transparent 
            opacity={0.8} 
            blending={THREE.AdditiveBlending}
          />
        </Points>
        
        <Text
          position={[0, 3, 0]}
          fontSize={0.4}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
        >
          APF_OBSTACLE: GAS_PLUME_DETECTED
        </Text>
      </group>

      {/* Phase 3: The Sovereign Drone & Glowing Trajectory */}
      <group position={pos} ref={droneRef}>
        <Trail
          width={0.5}
          length={40}
          color={new THREE.Color(0, 1, 1)}
          attenuation={(t) => t * t}
        >
          <group>
            {/* High-Fidelity Drone Representation */}
            <Box args={[0.5, 0.1, 0.5]}>
              <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={5} />
            </Box>
            <Cylinder args={[0.05, 0.3, 0.2]} position={[0, -0.15, 0]}>
              <meshStandardMaterial color="#444" />
            </Cylinder>
          </group>
        </Trail>

        <Text
          position={[0, 0.8, 0]}
          fontSize={0.3}
          color="cyan"
          anchorX="center"
          anchorY="middle"
        >
          VS_UNIT_01 | AUTONOMOUS_APF
        </Text>
      </group>
      
      {/* Ground Grid */}
      <gridHelper args={[100, 50, "#00aaaa", "#050505"]} position={[0, 0, 0]} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.1, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#020202" />
      </mesh>
    </>
  );
};

export default SpatialTwin;
