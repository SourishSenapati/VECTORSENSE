import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Stars, Text, Trail, Cylinder, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

const DroneSkin = () => {
  const baseSTL = useLoader(STLLoader, '/meshes/DroneFYDPBase.stl');
  const xbeamSTL = useLoader(STLLoader, '/meshes/Xbeam.stl');
  const beam180STL = useLoader(STLLoader, '/meshes/180beam.stl');
  const topPlateSTL = useLoader(STLLoader, '/meshes/top_plate.stl');
  const motorSTL = useLoader(STLLoader, '/meshes/motor_attachment.stl');

  const m1 = useRef(), m2 = useRef(), m3 = useRef(), m4 = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const rpm = 30; // High frequency visual rotation
    if (m1.current) m1.current.rotation.z += rpm;
    if (m2.current) m2.current.rotation.z -= rpm;
    if (m3.current) m3.current.rotation.z += rpm;
    if (m4.current) m4.current.rotation.z -= rpm;
  });

  return (
    <group scale={1}>
      <mesh geometry={baseSTL} scale={0.001}>
         <meshStandardMaterial color="#222" metalness={1} roughness={0.1} />
      </mesh>
      <mesh geometry={xbeamSTL} position={[0, 0, 0.05]} scale={0.001}>
         <meshStandardMaterial color="#444" metalness={0.9} />
      </mesh>
      <mesh geometry={beam180STL} position={[0, 0, 0.05]} rotation={[0, Math.PI/2, 0]} scale={0.001}>
         <meshStandardMaterial color="#444" metalness={0.9} />
      </mesh>
      <group position={[0.225, -0.225, 0.08]} ref={m1}><mesh geometry={motorSTL} scale={0.001} rotation={[-Math.PI/2, 0, 0]} /><Propeller /></group>
      <group position={[0.225, 0.225, 0.08]} ref={m2}><mesh geometry={motorSTL} scale={0.001} rotation={[-Math.PI/2, 0, 0]} /><Propeller /></group>
      <group position={[-0.225, -0.225, 0.08]} ref={m3}><mesh geometry={motorSTL} scale={0.001} rotation={[-Math.PI/2, 0, 0]} /><Propeller /></group>
      <group position={[-0.225, 0.225, 0.08]} ref={m4}><mesh geometry={motorSTL} scale={0.001} rotation={[-Math.PI/2, 0, 0]} /><Propeller /></group>
    </group>
  );
};

const Propeller = () => (
  <mesh position={[0, 0.02, 0]} rotation={[Math.PI/2, 0, 0]}>
    <circleGeometry args={[0.2, 32]} />
    <meshStandardMaterial color="#00ffff" transparent opacity={0.4} emissive="#00ffff" emissiveIntensity={5} side={THREE.DoubleSide} />
  </mesh>
);

const NCI25Refinery = () => {
    const assets = useMemo(() => [
        { type: 'tower', pos: [15, 0, -20], scale: [3, 25, 3], id: 'DISTILL_A1' },
        { type: 'tower', pos: [20, 0, -18], scale: [2, 18, 2], id: 'CRACKER_B1' },
        { type: 'tank', pos: [-40, 0, 10], scale: [10, 8, 10], id: 'TANK_STORAGE_01' },
        { type: 'tank', pos: [-55, 0, 10], scale: [10, 8, 10], id: 'TANK_STORAGE_02' },
        { type: 'pipe', pos: [0, 8, 0], scale: [100, 0.8, 0.8], id: 'MAIN_FEED_LINE' },
    ], []);

    return (
        <group>
            <gridHelper args={[500, 100, '#111', '#050505']} />
            <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} fade speed={2} />
            {assets.map((a, i) => (
                <group key={i} position={a.pos}>
                    <Cylinder args={[1, 1, 1]} scale={a.scale} position={[0, a.scale[1]/2, 0]}>
                        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
                    </Cylinder>
                    <Text position={[0, a.scale[1] + 2, 0]} fontSize={1} color="#ffffff33">{a.id}</Text>
                </group>
            ))}
        </group>
    );
};

const SpatialTwin = ({ telemetryRef }) => {
    const droneGroup = useRef();

    useFrame(() => {
        if (!droneGroup.current || !telemetryRef.current) return;
        
        const { pos, quat } = telemetryRef.current;
        
        // DIRECT ATTRIBUTE UPDATE: No React diffing, zero lag.
        droneGroup.current.position.set(pos[0], pos[1], pos[2]);
        droneGroup.current.quaternion.set(quat[0], quat[1], quat[2], quat[3]);
    });

    return (
        <group>
            <ambientLight intensity={0.2} />
            <NCI25Refinery />
            
            <group ref={droneGroup}>
                <Trail width={1.5} length={50} color={new THREE.Color("#00ffff")} attenuation={(t) => t * t}>
                    <DroneSkin />
                </Trail>
                <Text position={[0, 2, 0]} fontSize={0.3} color="#00ffff" font="/fonts/Inter-Bold.woff">
                    VECTORSENSE_GHOST_CORE_V4
                </Text>
            </group>

            {/* VOLUMETRIC LEAK RENDER */}
            <group position={[15, 10, -20]}>
                 <Sphere args={[5, 64, 64]}>
                    <MeshDistortMaterial color="#00ffff" distort={0.5} speed={4} transparent opacity={0.15} emissive="#00ffff" emissiveIntensity={2} />
                 </Sphere>
            </group>
        </group>
    );
};

export default SpatialTwin;
