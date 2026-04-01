import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Sphere, Float, Box } from '@react-three/drei';
import * as THREE from 'three';

// ── Mode → scan cone colour ───────────────────────────────────
const MODE_COLOR = {
  GAS_TOMOGRAPHY:       '#27ae60',
  THERMAL_PROFILING:    '#e67e22',
  ACOUSTIC_DIAGNOSTICS: '#2980b9',
  LIDAR_MAPPING:        '#8e44ad',
};

// ── Single rotor assembly ─────────────────────────────────────
const Rotor = () => (
  <group>
    {/* Blade 1 */}
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <boxGeometry args={[0.55, 0.03, 0.025]} />
      <meshStandardMaterial color="#2c3e50" metalness={0.6} roughness={0.3} />
    </mesh>
    {/* Blade 2 — perpendicular */}
    <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}>
      <boxGeometry args={[0.55, 0.03, 0.025]} />
      <meshStandardMaterial color="#2c3e50" metalness={0.6} roughness={0.3} />
    </mesh>
    {/* Hub */}
    <mesh>
      <cylinderGeometry args={[0.06, 0.06, 0.06, 10]} />
      <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
    </mesh>
  </group>
);

// ── Full hexacopter model ─────────────────────────────────────
const Hexacopter = ({ scanColor }) => {
  const rotorRefs = useRef([]);
  const scanRef   = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    rotorRefs.current.forEach((r, i) => {
      if (r) r.rotation.y += i % 2 === 0 ? 0.6 : -0.6;
    });
    if (scanRef.current) {
      scanRef.current.material.opacity = 0.12 + Math.abs(Math.sin(t * 3)) * 0.10;
    }
  });

  const ARM_COUNT = 6;
  const ARM_RADIUS = 0.65;

  return (
    <group>
      {/* Central body disc */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.18, 20]} />
        <meshStandardMaterial color="#ecf0f1" metalness={0.2} roughness={0.15} />
      </mesh>

      {/* Sensor dome (top) */}
      <mesh position={[0, 0.16, 0]}>
        <sphereGeometry args={[0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#bdc3c7" metalness={0.3} roughness={0.2} />
      </mesh>

      {/* Camera / sensor payload (bottom) */}
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[0.18, 0.14, 0.18]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Scanning cone emitted downward */}
      <mesh ref={scanRef} position={[0, -1.6, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.2, 3.2, 32, 1, true]} />
        <meshBasicMaterial
          color={scanColor || '#27ae60'}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 6 Arms + Rotors */}
      {[...Array(ARM_COUNT)].map((_, i) => {
        const angle = (i * Math.PI * 2) / ARM_COUNT;
        const x = Math.cos(angle) * ARM_RADIUS;
        const z = Math.sin(angle) * ARM_RADIUS;
        return (
          <group key={i} position={[x, 0, z]}>
            {/* Arm tube */}
            <mesh rotation={[0, -angle + Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.035, 0.035, ARM_RADIUS * 1.3]} />
              <meshStandardMaterial color="#95a5a6" metalness={0.5} roughness={0.4} />
            </mesh>
            {/* Motor nacelle */}
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.12, 10]} />
              <meshStandardMaterial color="#2c3e50" metalness={0.7} roughness={0.2} />
            </mesh>
            {/* Rotor */}
            <group position={[0, 0.14, 0]} ref={el => { rotorRefs.current[i] = el; }}>
              <Rotor />
            </group>
          </group>
        );
      })}
    </group>
  );
};

// ── Gas leak haze (particle simulation substitute) ───────────
const LeakHaze = ({ active }) => {
  const LEAK_POS = [15, 0, -8];
  const groupRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.y = ((t * 0.4 + i * 0.7) % 6);
        child.material.opacity = 0.06 + Math.abs(Math.sin(t * 0.5 + i)) * 0.07;
      });
    }
  });

  return (
    <group position={LEAK_POS}>
      {/* Source indicator */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#c0392b" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      {/* Rising gas puffs */}
      <group ref={groupRef}>
        {[...Array(8)].map((_, i) => (
          <mesh
            key={i}
            position={[
              (Math.sin(i * 1.3) * 2),
              i * 0.8,
              (Math.cos(i * 1.3) * 2),
            ]}
          >
            <sphereGeometry args={[0.5 + i * 0.15, 8, 8]} />
            <meshBasicMaterial
              color={active ? '#e74c3c' : '#27ae60'}
              transparent
              opacity={0.08}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ── Industrial facility ───────────────────────────────────────
const Facility = () => (
  <group>
    {/* Base grid */}
    <gridHelper args={[200, 80, '#d5d5da', '#e8e8ed']} position={[0, 0, 0]} />

    {/* Storage Tank A */}
    <group position={[15, 5, -15]}>
      <Cylinder args={[3.5, 3.5, 10, 24]}>
        <meshStandardMaterial color="#ecf0f1" metalness={0.25} roughness={0.3} />
      </Cylinder>
      <Sphere args={[3.5, 20, 12]} position={[0, 5, 0]}>
        <meshStandardMaterial color="#bdc3c7" metalness={0.25} roughness={0.3} />
      </Sphere>
    </group>

    {/* Storage Tank B */}
    <group position={[26, 5, -15]}>
      <Cylinder args={[3.5, 3.5, 10, 24]}>
        <meshStandardMaterial color="#ecf0f1" metalness={0.25} roughness={0.3} />
      </Cylinder>
      <Sphere args={[3.5, 20, 12]} position={[0, 5, 0]}>
        <meshStandardMaterial color="#bdc3c7" metalness={0.25} roughness={0.3} />
      </Sphere>
    </group>

    {/* Processing block */}
    <group position={[5, 4, -5]}>
      <Box args={[8, 8, 7]}>
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.2} />
      </Box>
      {/* Windows */}
      {[-2, 0, 2].map(ox => (
        <Box key={ox} args={[1.2, 1.2, 0.1]} position={[ox, 1, 3.6]}>
          <meshStandardMaterial color="#2980b9" transparent opacity={0.5} metalness={0.8} />
        </Box>
      ))}
    </group>

    {/* Distillation tower */}
    <group position={[36, 12, -5]}>
      <Cylinder args={[1.8, 1.8, 24, 16]}>
        <meshStandardMaterial color="#d5d5da" metalness={0.5} roughness={0.4} />
      </Cylinder>
      {[...Array(5)].map((_, i) => (
        <Cylinder key={i} args={[2.1, 2.1, 0.5, 16]} position={[0, -8 + i * 4, 0]}>
          <meshStandardMaterial color="#95a5a6" metalness={0.6} roughness={0.3} />
        </Cylinder>
      ))}
    </group>

    {/* Horizontal pipe connecting tanks to tower */}
    <Cylinder args={[0.25, 0.25, 20, 10]} position={[20, 1.5, -8]} rotation={[0, 0, Math.PI / 2]}>
      <meshStandardMaterial color="#7f8c8d" metalness={0.6} roughness={0.3} />
    </Cylinder>

    {/* Pipe vertical run at leak source */}
    <Cylinder args={[0.25, 0.25, 8, 10]} position={[15, 4, -8]}>
      <meshStandardMaterial color="#7f8c8d" metalness={0.6} roughness={0.3} />
    </Cylinder>
  </group>
);

// ── Main export ───────────────────────────────────────────────
const SpatialTwin = ({ telemetryRef, mode }) => {
  const droneGroup = useRef();
  const scanColor  = MODE_COLOR[mode] || '#27ae60';

  useFrame(() => {
    if (!droneGroup.current || !telemetryRef?.current) return;
    const { pos } = telemetryRef.current;
    if (!pos) return;
    // Map Gazebo coords (X forward, Y left, Z up) → Three.js (X, Y=Z_up, Z=-Y)
    droneGroup.current.position.lerp(
      new THREE.Vector3(pos[0], pos[2], -pos[1]),
      0.08
    );
  });

  return (
    <group>
      {/* Fog matches background colour for seamless blend */}
      <fog attach="fog" args={['#f5f5f7', 30, 180]} />

      {/* Lighting — bright, neutral, professional */}
      <ambientLight intensity={1.8} color="#ffffff" />
      <directionalLight position={[30, 60, 30]} intensity={1.2} color="#ffffff" castShadow />
      <hemisphereLight skyColor="#ffffff" groundColor="#c8c8cd" intensity={0.7} />

      <Facility />
      <LeakHaze active={mode === 'GAS_TOMOGRAPHY'} />

      {/* Drone */}
      <group ref={droneGroup} position={[2, 5, -5]}>
        <Float speed={1.8} rotationIntensity={0.15} floatIntensity={0.15}>
          <Hexacopter scanColor={scanColor} />
        </Float>
      </group>
    </group>
  );
};

export default SpatialTwin;
