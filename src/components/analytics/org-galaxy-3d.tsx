'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Environment, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

type GalaxyUser = {
  id: string;
  name: string;
  role: string;
  department: string;
  managerId: string | null;
  goalCount: number;
  approvedCount: number;
  avgScore: number;
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#3b82f6',
  MANAGER: '#06b6d4',
  EMPLOYEE: '#a5b4fc',
};

function scoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#22c55e';
  if (score >= 30) return '#f59e0b';
  if (score > 0) return '#ef4444';
  return '#71717a';
}

function CoreNode({ position, user, size, onHover, onUnhover }: {
  position: [number, number, number];
  user: GalaxyUser;
  size: number;
  onHover: (u: GalaxyUser, p: [number, number, number]) => void;
  onUnhover: () => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const color = ROLE_COLORS[user.role] ?? '#71717a';

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.elapsedTime * 0.3;
      mesh.current.rotation.y = state.clock.elapsedTime * 0.4;
    }
    if (halo.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.08;
      halo.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position}>
      <mesh ref={mesh} onPointerOver={() => onHover(user, position)} onPointerOut={onUnhover}>
        <icosahedronGeometry args={[size, 2]} />
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.85}
          distort={0.15}
          speed={1.5}
        />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[size * 1.7, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[size * 2.4, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.04} />
      </mesh>
    </group>
  );
}

function GoalParticles({ count, radius, color, speed = 1 }: { count: number; radius: number; color: string; speed?: number }) {
  const group = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    const arr: { angle: number; tilt: number; size: number }[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        angle: (i / count) * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 0.3,
        size: 0.03 + Math.random() * 0.02,
      });
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.25 * speed;
    }
  });

  return (
    <group ref={group}>
      {particles.map((p, i) => {
        const x = Math.cos(p.angle) * radius;
        const y = p.tilt;
        const z = Math.sin(p.angle) * radius;
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[p.size, 8, 8]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function Edge({ from, to, color = '#3b82f6', opacity = 0.2 }: { from: [number, number, number]; to: [number, number, number]; color?: string; opacity?: number }) {
  const points = useMemo(() => new Float32Array([...from, ...to]), [from, to]);
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={2} array={points} itemSize={3} args={[points, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}

function Galaxy({ users, onHover, onUnhover }: { users: GalaxyUser[]; onHover: (u: GalaxyUser, p: [number, number, number]) => void; onUnhover: () => void }) {
  const admins = users.filter((u) => u.role === 'ADMIN');
  const managers = users.filter((u) => u.role === 'MANAGER');
  const employees = users.filter((u) => u.role === 'EMPLOYEE');

  const positions = useMemo(() => {
    const map = new Map<string, [number, number, number]>();

    // Admins cluster near center
    admins.forEach((a, i) => {
      const angle = (i / Math.max(1, admins.length)) * Math.PI * 2;
      map.set(a.id, [Math.cos(angle) * 0.4, 0, Math.sin(angle) * 0.4]);
    });

    // Managers in middle orbit
    const managerRadius = 3.8;
    managers.forEach((m, i) => {
      const angle = (i / Math.max(1, managers.length)) * Math.PI * 2;
      const y = Math.sin(angle * 2) * 0.4;
      map.set(m.id, [Math.cos(angle) * managerRadius, y, Math.sin(angle) * managerRadius]);
    });

    // Employees clustered around their manager
    const empByMgr: Record<string, GalaxyUser[]> = {};
    employees.forEach((e) => {
      const k = e.managerId ?? 'orphan';
      if (!empByMgr[k]) empByMgr[k] = [];
      empByMgr[k].push(e);
    });

    Object.entries(empByMgr).forEach(([mgrId, list]) => {
      const mgrPos = map.get(mgrId) ?? [0, 0, 0];
      list.forEach((e, i) => {
        const angle = (i / list.length) * Math.PI * 2;
        const r = 1.5 + (i % 2) * 0.3;
        const tilt = (Math.random() - 0.5) * 0.4;
        map.set(e.id, [
          mgrPos[0] + Math.cos(angle) * r,
          mgrPos[1] + tilt,
          mgrPos[2] + Math.sin(angle) * r,
        ]);
      });
    });

    return map;
  }, [users]);

  return (
    <group>
      {/* Edges */}
      {employees.map((e) => {
        const ep = positions.get(e.id);
        const mp = e.managerId ? positions.get(e.managerId) : null;
        if (!ep || !mp) return null;
        return <Edge key={'edge-' + e.id} from={mp} to={ep} color="#3b82f6" opacity={0.15} />;
      })}
      {managers.map((m) => {
        const mp = positions.get(m.id);
        const ap = m.managerId ? positions.get(m.managerId) : null;
        if (!mp) return null;
        const start: [number, number, number] = ap ?? [0, 0, 0];
        return <Edge key={'edge-m-' + m.id} from={start} to={mp} color="#06b6d4" opacity={0.25} />;
      })}

      {/* Nodes + goal particles */}
      {users.map((u) => {
        const pos = positions.get(u.id) ?? [0, 0, 0];
        const size = u.role === 'ADMIN' ? 0.4 : u.role === 'MANAGER' ? 0.3 : 0.22;
        return (
          <group key={u.id}>
            <CoreNode position={pos} user={u} size={size} onHover={onHover} onUnhover={onUnhover} />
            {u.approvedCount > 0 && (
              <group position={pos}>
                <GoalParticles count={Math.min(u.approvedCount, 8)} radius={size * 2.4} color={scoreColor(u.avgScore)} speed={1 + u.avgScore / 200} />
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}

export function OrgGalaxy3D({ users }: { users: GalaxyUser[] }) {
  const [hovered, setHovered] = useState<{ user: GalaxyUser; position: [number, number, number] } | null>(null);

  return (
    <div className="relative h-[520px] w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-b-xl overflow-hidden">
      <Canvas camera={{ position: [0, 4.5, 10], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[8, 8, 8]} intensity={1.4} color="#a5b4fc" />
        <pointLight position={[-8, -4, -8]} intensity={0.9} color="#06b6d4" />
        <pointLight position={[0, -8, 4]} intensity={0.5} color="#3b82f6" />

        <Stars radius={40} depth={60} count={2000} factor={3} fade speed={0.4} />

        <Galaxy
          users={users}
          onHover={(u, p) => setHovered({ user: u, position: p })}
          onUnhover={() => setHovered(null)}
        />

        {hovered && (
          <Html position={hovered.position} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div className="rounded-xl border border-white/10 bg-black/85 backdrop-blur-xl shadow-2xl px-3 py-2 whitespace-nowrap text-xs text-white">
              <div className="font-semibold text-sm">{hovered.user.name}</div>
              <div className="text-white/60 text-[11px]">{hovered.user.role} · {hovered.user.department}</div>
              <div className="mt-1 text-[11px] flex items-center gap-2.5 text-white/80">
                <span>📋 {hovered.user.goalCount}</span>
                <span>✓ {hovered.user.approvedCount}</span>
                <span style={{ color: scoreColor(hovered.user.avgScore) }}>● {hovered.user.avgScore}/100</span>
              </div>
            </div>
          </Html>
        )}

        <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.35} minDistance={5} maxDistance={22} />
      </Canvas>

      {/* Legend overlay */}
      <div className="absolute top-4 left-4 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 px-3.5 py-2.5 text-xs text-white space-y-1.5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-semibold mb-1">Galaxy legend</div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-400" /> Admin / HR</div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-400" /> Manager</div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-indigo-300" /> Employee</div>
        <div className="border-t border-white/10 my-1.5" />
        <div className="text-white/60 text-[10px]">Orbiting particles = goals</div>
        <div className="text-white/60 text-[10px]">Color = achievement score</div>
      </div>

      <div className="absolute bottom-4 right-4 text-[10px] text-white/40 uppercase tracking-[0.18em]">Drag · Scroll · Hover</div>
    </div>
  );
}