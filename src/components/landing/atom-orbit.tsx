'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, OrbitControls, Stars, Points, PointMaterial } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function Nucleus() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.x = state.clock.elapsedTime * 0.2;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.3;
  });
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color="#6366f1"
          distort={0.35}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          emissive="#4f46e5"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.08} />
      </mesh>
    </Float>
  );
}

function Electron({
  radius,
  speed,
  offset,
  color,
  axis,
}: {
  radius: number;
  speed: number;
  offset: number;
  color: string;
  axis: [number, number, number];
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + offset;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    const y = Math.sin(t * 2) * 0.15;
    if (mesh.current) mesh.current.position.set(x, y, z);
    if (halo.current) halo.current.position.set(x, y, z);
  });

  return (
    <group rotation={axis}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.008, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
      <mesh ref={mesh}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function GoalParticles() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      const r = 3 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.05;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#a5b4fc" size={0.03} sizeAttenuation depthWrite={false} />
    </Points>
  );
}

export function AtomOrbit() {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#a5b4fc" />
        <pointLight position={[-5, -5, -5]} intensity={1} color="#ec4899" />

        <Stars radius={20} depth={60} count={1500} factor={3} fade speed={1} />

        <Nucleus />

        <Electron radius={2.0} speed={1.2} offset={0}   color="#10b981" axis={[0, 0, 0]} />
        <Electron radius={2.4} speed={0.9} offset={1.5} color="#f59e0b" axis={[Math.PI / 3, 0, 0]} />
        <Electron radius={2.8} speed={0.7} offset={3.0} color="#ec4899" axis={[0, 0, Math.PI / 3]} />
        <Electron radius={2.2} speed={1.0} offset={2.0} color="#3b82f6" axis={[Math.PI / 4, Math.PI / 4, 0]} />

        <GoalParticles />

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
