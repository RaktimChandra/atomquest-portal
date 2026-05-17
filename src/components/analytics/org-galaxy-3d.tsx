'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
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
  ADMIN: '#ec4899',
  MANAGER: '#f59e0b',
  EMPLOYEE: '#10b981',
};

function scoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#22c55e';
  if (score >= 30) return '#f59e0b';
  if (score > 0) return '#ef4444';
  return '#71717a';
}

function Node({
  position,
  user,
  size,
  onHover,
  onUnhover,
}: {
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
      mesh.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
    if (halo.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      halo.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={mesh}
        onPointerOver={() => onHover(user, position)}
        onPointerOut={onUnhover}
      >
        <icosahedronGeometry args={[size, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

function Goals({ count, radius, color, speed = 1 }: { count: number; radius: number; color: string; speed?: number }) {
  const group = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    const arr: { angle: number; tilt: number; phase: number }[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        angle: (i / count) * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.2 * speed;
    }
  });

  return (
    <group ref={group}>
      {particles.map((p, i) => {
        const x = Math.cos(p.angle) * radius;
        const y = Math.sin(p.phase) * 0.15;
        const z = Math.sin(p.angle) * radius;
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function Edge({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const ref = useRef<THREE.BufferGeometry>(null);
  const points = useMemo(() => new Float32Array([...from, ...to]), [from, to]);

  return (
    <line>
      <bufferGeometry ref={ref}>
        <bufferAttribute attach="attributes-position" count={2} array={points} itemSize={3} args={[points, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#6366f1" transparent opacity={0.18} />
    </line>
  );
}

function Galaxy({ users, onHover, onUnhover }: { users: GalaxyUser[]; onHover: (u: GalaxyUser, p: [number, number, number]) => void; onUnhover: () => void }) {
  // Layout: admins/managers in inner orbit, employees in outer orbit grouped by manager
  const admins = users.filter((u) => u.role === 'ADMIN');
  const managers = users.filter((u) => u.role === 'MANAGER');
  const employees = users.filter((u) => u.role === 'EMPLOYEE');

  const center: [number, number, number] = [0, 0, 0];

  const positions = useMemo(() => {
    const map = new Map<string, [number, number, number]>();

    // Admins: center cluster
    admins.forEach((a, i) => {
      const angle = (i / Math.max(1, admins.length)) * Math.PI * 2;
      map.set(a.id, [Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5]);
    });

    // Managers: middle ring radius 3.5
    const managerRadius = 3.5;
    managers.forEach((m, i) => {
      const angle = (i / Math.max(1, managers.length)) * Math.PI * 2;
      const y = (i % 2 === 0 ? 0.6 : -0.6);
      map.set(m.id, [Math.cos(angle) * managerRadius, y, Math.sin(angle) * managerRadius]);
    });

    // Employees: outer cluster around their manager
    const empByMgr: Record<string, GalaxyUser[]> = {};
    employees.forEach((e) => {
      const k = e.managerId ?? 'orphan';
      if (!empByMgr[k]) empByMgr[k] = [];
      empByMgr[k].push(e);
    });

    Object.entries(empByMgr).forEach(([mgrId, list]) => {
      const mgrPos = map.get(mgrId) ?? center;
      list.forEach((e, i) => {
        const angle = (i / list.length) * Math.PI * 2;
        const localRadius = 1.4;
        const tilt = (Math.random() - 0.5) * 0.6;
        map.set(e.id, [mgrPos[0] + Math.cos(angle) * localRadius, mgrPos[1] + tilt, mgrPos[2] + Math.sin(angle) * localRadius]);
      });
    });

    return map;
  }, [users]);

  return (
    <group>
      {/* Edges manager → employees */}
      {employees.map((e) => {
        const ep = positions.get(e.id);
        const mp = e.managerId ? positions.get(e.managerId) : null;
        if (!ep || !mp) return null;
        return <Edge key={'e-' + e.id} from={mp} to={ep} />;
      })}

      {/* Edges admin → managers */}
      {managers.map((m) => {
        const mp = positions.get(m.id);
        const apId = m.managerId;
        const ap = apId ? positions.get(apId) : null;
        if (!mp) return null;
        if (ap) return <Edge key={'m-' + m.id} from={ap} to={mp} />;
        return <Edge key={'m-' + m.id} from={center} to={mp} />;
      })}

      {/* Nodes */}
      {users.map((u) => {
        const pos = positions.get(u.id) ?? center;
        const size = u.role === 'ADMIN' ? 0.35 : u.role === 'MANAGER' ? 0.28 : 0.22;
        return (
          <group key={u.id}>
            <Node position={pos} user={u} size={size} onHover={onHover} onUnhover={onUnhover} />
            {u.approvedCount > 0 && (
              <group position={pos}>
                <Goals count={Math.min(u.approvedCount, 8)} radius={size * 2.2} color={scoreColor(u.avgScore)} speed={1 + u.avgScore / 200} />
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
    <div className="relative h-[480px] w-full bg-black/30 rounded-b-xl overflow-hidden">
      <Canvas camera={{ position: [0, 4, 9], fov: 55 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#a5b4fc" />
        <pointLight position={[-10, -5, -10]} intensity={0.8} color="#ec4899" />
        <Stars radius={30} depth={50} count={1500} factor={3} fade speed={0.5} />

        <Galaxy
          users={users}
          onHover={(u, p) => setHovered({ user: u, position: p })}
          onUnhover={() => setHovered(null)}
        />

        {hovered && (
          <Html position={hovered.position} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div className="rounded-lg border border-border/60 bg-popover/95 backdrop-blur-xl shadow-xl px-3 py-2 whitespace-nowrap text-xs">
              <div className="font-semibold text-sm">{hovered.user.name}</div>
              <div className="text-muted-foreground text-[11px]">{hovered.user.role} · {hovered.user.department}</div>
              <div className="mt-1 text-[11px] flex items-center gap-2">
                <span>📋 {hovered.user.goalCount}</span>
                <span>✓ {hovered.user.approvedCount}</span>
                <span>📊 {hovered.user.avgScore}/100</span>
              </div>
            </div>
          </Html>
        )}

        <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.4} minDistance={5} maxDistance={20} />
      </Canvas>

      {/* Legend */}
      <div className="absolute top-4 left-4 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 px-3 py-2 text-xs space-y-1">
        <div className="text-[10px] uppercase tracking-widest text-white/60 font-semibold mb-1">Legend</div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-400" /> Admin</div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" /> Manager</div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Employee</div>
        <div className="border-t border-white/10 my-1.5" />
        <div className="text-white/60 text-[10px]">Orbiting particles = goals</div>
        <div className="text-white/60 text-[10px]">Color = achievement score</div>
      </div>

      <div className="absolute bottom-4 right-4 text-[10px] text-white/40 uppercase tracking-widest">Drag to rotate · Scroll to zoom</div>
    </div>
  );
}