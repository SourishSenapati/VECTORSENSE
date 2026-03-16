import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Text, Trail, Cylinder, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

// ─── STLs Loader Component ──────────────────────────────────────────────────
const DroneMesh = ({ mode, frozen }) => {
  const group = useRef();
  
  // Load STLs from public/meshes
  const baseSTL = useLoader(STLLoader, '/meshes/DroneFYDPBase.stl');
  const xbeamSTL = useLoader(STLLoader, '/meshes/Xbeam.stl');
  const beam180STL = useLoader(STLLoader, '/meshes/180beam.stl');
  const topPlateSTL = useLoader(STLLoader, '/meshes/top_plate.stl');
  const motorSTL = useLoader(STLLoader, '/meshes/motor_attachment.stl');

  const propColor =
    mode === 'THERMAL_PROFILING' ? '#ff6600' :
    mode === 'ACOUSTIC_DIAGNOSTICS' ? '#00ccff' : '#00ffcc';

  const m1 = useRef(), m2 = useRef(), m3 = useRef(), m4 = useRef();

  useFrame((state) => {
    if (frozen) return;
    const t = state.clock.getElapsedTime();
    const speed = 15;
    if (m1.current) m1.current.rotation.z += speed;
    if (m2.current) m2.current.rotation.z -= speed;
    if (m3.current) m3.current.rotation.z += speed;
    if (m4.current) m4.current.rotation.z -= speed;
    
    // Subtle tilt based on movement or time
    if (group.current) {
        group.current.rotation.x = Math.sin(t * 0.5) * 0.05;
        group.current.rotation.z = Math.cos(t * 0.5) * 0.05;
    }
  });

  return (
    <group ref={group}>
      {/* Visual Skins: Dressing the Ghost Core */}
      <mesh geometry={baseSTL} scale={0.001}>
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh geometry={xbeamSTL} position={[0, 0, 0.05]} scale={0.001}>
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.1} />
      </mesh>

      <mesh geometry={beam180STL} position={[0, 0, 0.05]} rotation={[0, Math.PI / 2, 0]} scale={0.001}>
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.1} />
      </mesh>

      <mesh geometry={topPlateSTL} position={[0, 0, 0.1]} scale={0.001}>
        <meshStandardMaterial color="#111" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Motors & Props */}
      <Motor unitRef={m1} geometry={motorSTL} position={[ 0.25, -0.25, 0.08]} color="#999" propColor={propColor} />
      <Motor unitRef={m2} geometry={motorSTL} position={[ 0.25,  0.25, 0.08]} color="#999" propColor={propColor} />
      <Motor unitRef={m3} geometry={motorSTL} position={[-0.25, -0.25, 0.08]} color="#999" propColor={propColor} />
      <Motor unitRef={m4} geometry={motorSTL} position={[-0.25,  0.25, 0.08]} color="#999" propColor={propColor} />

      <pointLight position={[0, 0.15, 0]} intensity={0.5} color={propColor} />
    </group>
  );
};

const Motor = ({ unitRef, geometry, position, color, propColor }) => (
  <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
    <mesh geometry={geometry} scale={0.001}>
      <meshStandardMaterial color={color} metalness={0.9} />
    </mesh>
    <mesh ref={unitRef} position={[0, 0, 0.02]}>
        <circleGeometry args={[0.2, 32]} />
        <meshStandardMaterial 
            color={propColor} 
            transparent 
            opacity={0.3} 
            side={THREE.DoubleSide}
            emissive={propColor}
            emissiveIntensity={2}
        />
    </mesh>
  </group>
);

// ─── Procedural Industrial Site (Emulating NCI-25) ───────────────────────────
const MegaRefinery = () => (
    <group>
        <gridHelper args={[200, 50, '#1a1a2e', '#0f0f1a']} />
        {/* Core Infrastructure Overlays */}
        <IndustrialAsset type="column" position={[10, 0, -10]} scale={[2, 12, 2]} label="DISTILL_UNIT_A1" color="#1a2535" />
        <IndustrialAsset type="column" position={[12, 0, -8]} scale={[1.5, 8, 1.5]} label="CAT_CRACKER_B2" color="#1a2535" />
        <IndustrialAsset type="pipeStack" position={[0, 0, 5]} scale={[40, 0.5, 0.5]} label="TRANSFER_LINE_PRIMARY" color="#222" />
        
        {/* Distributed Tank Farm */}
        <IndustrialAsset type="tank" position={[-25, 0, 15]} scale={[4, 4, 4]} label="STORAGE_ALPHA" color="#111" />
        <IndustrialAsset type="tank" position={[-35, 0, 15]} scale={[4, 4, 4]} label="STORAGE_BETA" color="#111" />
        <IndustrialAsset type="tank" position={[-30, 0, 25]} scale={[4, 4, 4]} label="STORAGE_GAMMA" color="#111" />

        <ambientLight intensity={0.2} />
        <pointLight position={[20, 10, -10]} color="#f00" intensity={0.5} />
    </group>
);

const IndustrialAsset = ({ type, position, scale, label, color }) => (
    <group position={position}>
        {type === 'column' && <Cylinder args={[1, 1, 1]} scale={scale} position={[0, scale[1]/2, 0]}><meshStandardMaterial color={color} metalness={0.8} /></Cylinder>}
        {type === 'tank' && <Cylinder args={[1, 1, 1]} scale={scale} position={[0, scale[1]/2, 0]}><meshStandardMaterial color={color} metalness={0.5} /></Cylinder>}
        {type === 'pipeStack' && <Cylinder args={[1, 1, 1]} rotation={[0, 0, Math.PI/2]} scale={scale} position={[0, 6, 0]}><meshStandardMaterial color={color} metalness={0.9} /></Cylinder>}
        
        <Text position={[0, scale[1] + 1, 0]} fontSize={0.5} color="white" opacity={0.3} transparent>{label}</Text>
    </group>
);

// ─── SpatialTwin — main export ────────────────────────────────────────────────
const SpatialTwin = ({ pos, reality, frozen }) => {
  const mode = reality.mode || 'GAS_TOMOGRAPHY';

  return (
    <>
      <Environment preset="night" />
      <ambientLight intensity={0.15} />
      <directionalLight position={[50, 50, 50]} intensity={1} castShadow />

      <MegaRefinery />

      {/* Gas plume visualization */}
      {reality.leak && (
        <group position={[10, 6, -10]}>
          <Sphere args={[4, 32, 32]}>
             <MeshDistortMaterial
              color="#00ffff" distort={0.6} radius={1}
              transparent opacity={0.2}
              emissive="#00ccff" emissiveIntensity={2}
            />
          </Sphere>
          <Text position={[0, 6, 0]} fontSize={0.5} color="#00ffff">LEAK_CONFIRMED: {reality.commodity_loss_rate} USD/HR</Text>
        </group>
      )}

      {/* The Drone */}
      <group position={pos}>
        <Trail width={1} length={40} color={new THREE.Color(0, 0.8, 1)} attenuation={(t) => t * t}>
          <DroneMesh mode={mode} frozen={frozen} />
        </Trail>
        <Text position={[0, 1.5, 0]} fontSize={0.2} color="#00ffcc" anchorX="center" anchorY="middle">
          VECTORSENSE_GHOST_101
        </Text>
      </group>
    </>
  );
};

export default SpatialTwin;
