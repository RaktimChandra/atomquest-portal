'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, MeshTransmissionMaterial, Environment, Stars } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function GlassCore() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.x = state.clock.elapsedTime * 0.1;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.15;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.1, 2]} />
        <MeshTransmissionMaterial
          backside
          backsideThickness={0.4}
          thickness={0.6}
          roughness={0.05}
          chromaticAberration={0.12}
          anisotropicBlur={0.4}
          distortion={0.3}
          distortionScale={0.4}
          temporalDistortion={0.1}
          ior={1.45}
          color="#ffffff"
        />
      </mesh>
      {/* Inner glowing core */}
      <mesh>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial color="#3b82f6" toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.25} />
      </mesh>
    </Float>
  );
}

function ParticleRibbon({ radius, count, tilt, color, speed, phase = 0 }: { radius: number; count: number; tilt: number; color: string; speed: number; phase?: number }) {
  const group = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    const arr: { x: number; y: number; z: number; size: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const wiggle = (Math.random() - 0.5) * 0.15;
      arr.push({
        x: Math.cos(angle) * radius,
        y: wiggle,
        z: Math.sin(angle) * radius,
        size: 0.015 + Math.random() * 0.025,
      });
    }
    return arr;
  }, [count, radius]);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * speed + phase;
    }
  });

  return (
    <group ref={group} rotation={[tilt, 0, 0]}>
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
      {/* Ribbon ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.005, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

export function AtomV2() {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0.4, 4.5], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-5, -3, -5]} intensity={0.8} color="#06b6d4" />
        <pointLight position={[0, -5, 2]} intensity={0.4} color="#3b82f6" />

        <Environment preset="city" />

        <Stars radius={20} depth={50} count={800} factor={2} fade speed={0.3} />

        <GlassCore />

        <ParticleRibbon radius={1.9} count={45} tilt={0}              color="#3b82f6" speed={0.4} />
        <ParticleRibbon radius={2.3} count={55} tilt={Math.PI / 3.5}  color="#06b6d4" speed={0.3} phase={1.5} />
        <ParticleRibbon radius={2.7} count={65} tilt={Math.PI / 2.2}  color="#a5b4fc" speed={0.22} phase={3.0} />

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 1.8} />
      </Canvas>
    </div>
  );
}