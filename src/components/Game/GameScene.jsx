import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { OceanWorld } from './worlds/OceanWorld';

function ActorModel({ position, label, color, isGuard }) {
  const groupRef = useRef();
  const currentPos = useRef(new THREE.Vector3(position[0], 0, position[2]));
  useFrame((state) => {
    if (groupRef.current) {
      currentPos.current.lerp(new THREE.Vector3(position[0], 0, position[2]), 0.15);
      groupRef.current.position.copy(currentPos.current);
      groupRef.current.children[0].position.y = 0.2 + Math.sin(state.clock.getElapsedTime() * 3) * 0.05;
    }
  });
  return (
    <group ref={groupRef}>
      <group>
        <mesh position={[0, 0.6, 0]} castShadow><boxGeometry args={[0.5, 0.8, 0.4]} /><meshStandardMaterial color={color} roughness={0.6}/></mesh>
        <mesh position={[-0.15, 0.2, 0]} castShadow><capsuleGeometry args={[0.08, 0.35]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0.15, 0.2, 0]} castShadow><capsuleGeometry args={[0.08, 0.35]} /><meshStandardMaterial color="#111" /></mesh>
        <group position={[0, 1.35, 0]}>
          <mesh castShadow><sphereGeometry args={[0.25]} /><meshStandardMaterial color="#ffdbac" /></mesh>
          <mesh position={[0, isGuard ? 0.15 : 0.05, isGuard ? 0 : 0.18]} castShadow>
            <boxGeometry args={isGuard ? [0.6, 0.1, 0.6] : [0.4, 0.12, 0.1]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      </group>
      <Text position={[0, 2.6, 0]} fontSize={0.3} color="white" bold italic>{label}</Text>
    </group>
  );
}

export function GameScene() {
  const { levels, currentLevel, thiefPosition, guardPosition, blockedNodes, blockNode, gameState, setView, nextLevel } = useGameStore();
  const level = useMemo(() => levels.find(l => l.id === currentLevel), [levels, currentLevel]);

  if (!level) return null;
  const tNode = level.nodes.find(n => n.id === thiefPosition);
  const gNode = level.nodes.find(n => n.id === guardPosition);

  return (
    <div className="w-full h-screen relative bg-[#001e3c]">
      <div className="absolute top-0 w-full p-8 z-10 flex justify-between pointer-events-none">
        <button onClick={() => setView('CAREER')} className="pointer-events-auto bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl text-white font-black border border-white/20">← MAPPA</button>
        <div className="text-right uppercase italic">
          <h1 className="text-yellow-400 text-5xl font-black drop-shadow-xl">CATCH HIM!!</h1>
          <p className="text-white font-bold opacity-60">LIVELLO {currentLevel} - {level.name}</p>
        </div>
      </div>

      {gameState !== 'PLAYING' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-lg">
           <h2 className={`text-9xl font-black italic mb-12 ${gameState === 'WON' ? 'text-green-500' : 'text-red-600 animate-bounce'}`}>{gameState === 'WON' ? 'PRESO!' : 'PERSO!'}</h2>
           <div className="flex gap-6">
             <button onClick={() => useGameStore.getState().setCurrentLevel(currentLevel)} className="px-12 py-6 bg-white/10 text-white rounded-full font-black">RIGIOCA</button>
             {gameState === 'WON' && <button onClick={() => nextLevel()} className="px-24 py-8 bg-yellow-400 text-black font-black text-3xl rounded-full shadow-[0_12px_0_rgb(161,98,7)]">AVANTI</button>}
           </div>
        </div>
      )}

      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[20, 25, 20]} fov={30} />
          <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.5} minDistance={15} maxDistance={50} />
          <OceanWorld />

          {/* Ponti */}
          {level.connections.map((conn, idx) => {
            const s = level.nodes.find(n => n.id === conn[0]), e = level.nodes.find(n => n.id === conn[1]);
            if (!s || !e) return null;
            const dir = new THREE.Vector3(e.x - s.x, 0, e.z - s.z);
            return (
              <mesh key={idx} position={[(s.x+e.x)/2, -0.15, (s.z+e.z)/2]} rotation={[0, Math.atan2(dir.x, dir.z), 0]}>
                <boxGeometry args={[0.7, 0.25, dir.length()]} />
                <meshStandardMaterial color="#4a3528" roughness={1} />
              </mesh>
            );
          })}

          {/* Nodi ed Esagoni */}
          {level.nodes.map(node => (
            <group key={node.id} position={[node.x, 0, node.z]} onClick={() => blockNode(node.id)}>
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[1.2, 1.3, 0.6, 6]} />
                <meshStandardMaterial color={node.type === 'exit' ? "#ff3300" : "#444"} roughness={0.7} />
              </mesh>
              
              {/* Visualizzazione Nodi Bloccati (Scogli/Boe) */}
              {blockedNodes.has(node.id) && (
                <group position={[0, 0.5, 0]}>
                   <mesh castShadow><sphereGeometry args={[0.8, 4, 4]} /><meshStandardMaterial color="#555" /></mesh>
                   <Text position={[0, 1.2, 0]} fontSize={0.5} color="red">⚠️</Text>
                </group>
              )}

              {node.type === 'exit' && <Text rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.7, 0]} fontSize={1.2}>⛵</Text>}
            </group>
          ))}

          {tNode && <ActorModel position={[tNode.x, 0, tNode.z]} label="LADRO" color="#6b21a8" isGuard={false} />}
          {gNode && <ActorModel position={[gNode.x, 0, gNode.z]} label="GUARDIA" color="#1e3a8a" isGuard={true} />}
          <ContactShadows position={[0, -0.5, 0]} opacity={0.5} scale={60} blur={2.5} />
        </Suspense>
      </Canvas>
    </div>
  );
}