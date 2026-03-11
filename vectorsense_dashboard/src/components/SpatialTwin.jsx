import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Text, Trail, Cylinder, Box, Points } from '@react-three/drei';
import * as THREE from 'three';

const SpatialTwin = ({ pos }) => {
  const droneRef = useRef();

  // 1. Industrial Infrastructure Mock (Pipe Rack)
  const Pipes = useMemo(() => {
    return (
      <group position={[0, 0, 0]}>
        {/* Main Pipe Rack */}
        <Cylinder args={[0.2, 0.2, 20]} position={[0, 5, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#333" roughness={0.1} metalness={0.8} />
        </Cylinder>
        <Cylinder args={[0.15, 0.15, 20]} position={[0, 4.5, 0.5]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#222" roughness={0.1} metalness={0.9} />
        </Cylinder>
        
        {/* Structural Supports */}
        {[-8, -4, 0, 4, 8].map((x, i) => (
          <Box key={i} args={[0.5, 5, 0.5]} position={[x, 2.5, 0]}>
            <meshStandardMaterial color="#111" />
          </Box>
        ))}
      </group>
    );
  }, []);

  // 2. Volumetric Plume (Navier-Stokes Visualizer)
  // Generating static random distribution for particles
  const particles = useMemo(() => {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.sin(i * 0.1) * 2.5);
      positions[i * 3 + 1] = (Math.cos(i * 0.2) * 1.5);
      positions[i * 3 + 2] = (Math.sin(i * 0.3) * 1.5);
      sizes[i] = 0.05 + Math.abs(Math.sin(i)) * 0.05;
    }
    return { positions, sizes };
  }, []);

  const plumeRef = useRef();
  
  useFrame((state) => {
    if (plumeRef.current) {
      // Pulse plume concentration
      const t = state.clock.getElapsedTime();
      plumeRef.current.rotation.y = t * 0.1;
      plumeRef.current.position.y = 5 + Math.sin(t * 2) * 0.1;
      plumeRef.current.scale.set(1 + Math.sin(t) * 0.05, 1, 1);
    }
  });

  return (
    <>
      {/* Infrastructure Backdrop */}
      {Pipes}

      {/* Volumetric Gas Leak (Simulated Volumetrics) */}
      <group position={[2, 5, 0]} ref={plumeRef}>
        <Float speed={5} rotationIntensity={1} floatIntensity={2}>
          <Sphere args={[1.5, 32, 32]} scale={[2, 1, 1]}>
            <MeshDistortMaterial
              color="#ff3000"
              speed={4}
              distort={0.4}
              radius={1}
              transparent
              opacity={0.3}
              emissive="#ff1000"
              emissiveIntensity={2}
            />
          </Sphere>
        </Float>
        
        <Points positions={particles.positions} sizes={particles.sizes}>
          <pointsMaterial 
            color="#ff6000" 
            size={0.05} 
            transparent 
            opacity={0.6} 
            blending={THREE.AdditiveBlending}
          />
        </Points>
        
        <Text
          position={[0, 2, 0]}
          fontSize={0.3}
          color="#ff3000"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
        >
          HAZARD_DETECTED: LEL_THREAT_HIGH
        </Text>
      </group>

      {/* Drone Hologram */}
      <Float speed={10} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={pos} ref={droneRef}>
          <Trail
            width={0.2}
            length={10}
            color={new THREE.Color(2, 0.1, 0.1)}
            attenuation={(t) => t * t}
          >
            <mesh>
              <Box args={[0.4, 0.1, 0.4]}>
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={5} />
              </Box>
            </mesh>
          </Trail>
          
          <mesh position={[0, 0.2, 0]}>
            <Cylinder args={[0.05, 0.05, 0.1]}>
              <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
            </Cylinder>
          </mesh>

          <Text
            position={[0, 0.5, 0]}
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            VS_UNIT_01
          </Text>
        </group>
      </Float>
      
      {/* Ground Plane */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#111" transparent opacity={0.5} roughness={0.8} />
      </mesh>
      <gridHelper args={[100, 50, "#222", "#0a0a0a"]} position={[0, 0, 0]} />
    </>
  );
};

export default SpatialTwin;
