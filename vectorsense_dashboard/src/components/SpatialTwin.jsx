import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Text } from '@react-three/drei';
import * as THREE from 'three';

const Propeller = () => (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.05]} />
        <meshStandardMaterial color="#00ffff" transparent opacity={0.5} emissive="#00ffff" emissiveIntensity={5} />
    </mesh>
);

const BusSkin = () => (
    <group>
        {/* Main Body */}
        <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[4, 2, 10]} />
            <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* Windows */}
        <mesh position={[0, 1.8, 0]}>
            <boxGeometry args={[4.1, 0.8, 8]} />
            <meshStandardMaterial color="#88ccff" transparent opacity={0.6} metalness={1} />
        </mesh>
        {/* Wheels */}
        {[[-1.8, 0, 3.5], [1.8, 0, 3.5], [-1.8, 0, -3.5], [1.8, 0, -3.5]].map((pos, i) => (
            <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.6, 0.6, 0.4]} />
                <meshStandardMaterial color="#111" />
            </mesh>
        ))}
    </group>
);

const SpatialTwin = ({ telemetryRef }) => {
    const busGroup = useRef();

    useFrame(() => {
        if (!busGroup.current || !telemetryRef.current) return;
        const { pos, quat } = telemetryRef.current;
        if (pos) busGroup.current.position.set(pos[0], pos[1], pos[2]);
        if (quat) busGroup.current.quaternion.set(quat[0], quat[1], quat[2], quat[3]);
    });

    return (
        <group>
            <fog attach="fog" args={['#050510', 50, 500]} />
            <ambientLight intensity={1.5} />
            <pointLight position={[20, 50, 20]} intensity={10} color="#ffffff" />
            
            <gridHelper args={[2000, 100, '#111', '#0a0a0a']} />
            <Stars radius={300} depth={60} count={10000} factor={4} saturation={0} fade speed={1} />
            
            <group ref={busGroup}>
                <BusSkin />
                <Text position={[0, 5, 0]} fontSize={1.5} color="#00ffff">
                    SMARTBUS_E_PRO_V6
                </Text>
            </group>
        </group>
    );
};

export default SpatialTwin;
