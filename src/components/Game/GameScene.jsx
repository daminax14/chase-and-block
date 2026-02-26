import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore'; 
import { OceanWorld } from './worlds/OceanWorld';
import { SpaceWorld } from './worlds/SpaceWorld';

function ActorModel({ position, label, color, isGuard }) {
  const groupRef = useRef();
  const currentPos = useRef(new THREE.Vector3(position[0], 0, position[2]));
  
  useFrame((state) => {
    if (groupRef.current) {
      // Movimento fluido (Lerp)
      currentPos.current.lerp(new THREE.Vector3(position[0], 0, position[2]), 0.15);
      groupRef.current.position.copy(currentPos.current);
      // Animazione di "floating"
      groupRef.current.children[0].position.y = 0.2 + Math.sin(state.clock.getElapsedTime() * 3) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <group>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.5, 0.8, 0.4]} />
          <meshStandardMaterial color={color} roughness={0.6}/>
        </mesh>
        <group position={[0, 1.35, 0]}>
          <mesh castShadow><sphereGeometry args={[0.25]} /><meshStandardMaterial color="#ffdbac" /></mesh>
          <mesh position={[0, isGuard ? 0.15 : 0.05, isGuard ? 0 : 0.18]} castShadow>
            <boxGeometry args={isGuard ? [0.6, 0.1, 0.6] : [0.4, 0.12, 0.1]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      </group>
      <Text position={[0, 2.6, 0]} fontSize={0.3} color="white" fontWeight="bold">
        {label}
      </Text>
    </group>
  );
}

export function GameScene() {
  const store = useGameStore();
  const { 
    currentLevel, 
    currentLevelNumber, 
    thiefPosition, 
    guardPosition, 
    blockedNodes, 
    blockNode, 
    gameState, 
    setView, 
    nextLevel 
  } = store;

  if (!currentLevel) return null;

  const isSpace = currentLevel.biome === "SPACE";
  const tNode = currentLevel.nodes.find(n => n.id === thiefPosition);
  const gNode = currentLevel.nodes.find(n => n.id === guardPosition);

  return (
    <div className="w-full h-screen relative bg-black">
      {/* UI Overlay */}
      <div className="absolute top-0 w-full p-8 z-10 flex justify-between pointer-events-none">
        <button onClick={() => setView('CAREER')} className="pointer-events-auto bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl text-white font-black border border-white/20 hover:bg-white/20 transition-all">← MAPPA</button>
        <div className="text-right uppercase italic">
          <h1 className="text-yellow-400 text-5xl font-black drop-shadow-xl">CATCH THEM!!</h1>
          <p className="text-white font-bold opacity-60">LIVELLO {currentLevelNumber} - {currentLevel.biome}</p>
        </div>
      </div>

      {/* Game Over / Win Screens */}
      {gameState !== 'PLAYING' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-lg transition-all">
           <h2 className={`text-9xl font-black italic mb-12 ${gameState === 'WON' ? 'text-green-500' : 'text-red-600 animate-pulse'}`}>
             {gameState === 'WON' ? 'PRESO!' : 'PERSO!'}
           </h2>
           <div className="flex gap-6">
             <button onClick={() => useGameStore.getState().startLevel(currentLevelNumber)} className="px-12 py-6 bg-white/10 text-white rounded-full font-black border border-white/20 hover:bg-white/30">RIGIOCA</button>
             {gameState === 'WON' && (
               <button onClick={() => nextLevel()} className="px-24 py-8 bg-yellow-400 text-black font-black text-3xl rounded-full shadow-[0_12px_0_rgb(161,98,7)] hover:translate-y-1 hover:shadow-[0_8px_0_rgb(161,98,7)] transition-all">AVANTI</button>
             )}
           </div>
        </div>
      )}

      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[20, 25, 20]} fov={30} />
          <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.5} minDistance={15} maxDistance={40} />
          
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 20, 10]} castShadow intensity={1} shadow-mapSize={[1024, 1024]} />
          
          {isSpace ? <SpaceWorld /> : <OceanWorld />}

          {/* Ponti (Connections) */}
          {currentLevel.connections.map((conn, idx) => {
            const s = currentLevel.nodes.find(n => n.id === conn[0]);
            const e = currentLevel.nodes.find(n => n.id === conn[1]);
            if (!s || !e) return null;
            
            const dx = e.x - s.x;
            const dz = e.z - s.z;
            const length = Math.sqrt(dx*dx + dz*dz);
            const angle = Math.atan2(dx, dz);

            return (
              <mesh key={`conn-${idx}`} position={[(s.x + e.x) / 2, -0.2, (s.z + e.z) / 2]} rotation={[0, angle, 0]}>
                <boxGeometry args={[isSpace ? 0.3 : 0.8, 0.3, length]} />
                <meshStandardMaterial color={isSpace ? "#44f" : "#4a3528"} emissive={isSpace ? "#22f" : "#000"} />
              </mesh>
            );
          })}

          {/* Piattaforme (Nodes) */}
          {currentLevel.nodes.map(node => {
            const isSelectable = true; // Qui potresti aggiungere un controllo sui vicini della guardia
            return (
              <group key={node.id} position={[node.x, 0, node.z]} onClick={(e) => { e.stopPropagation(); blockNode(node.id); }}>
                <mesh castShadow receiveShadow>
                  {isSpace ? <octahedronGeometry args={[1.2, 0]} /> : <cylinderGeometry args={[1.2, 1.3, 0.6, 6]} />}
                  <meshStandardMaterial 
                    color={node.type === 'exit' ? "#ff3300" : (blockedNodes.has(node.id) ? "#333" : (isSpace ? "#222" : "#fff"))} 
                    emissive={node.type === 'exit' ? "#ff0000" : "#000"}
                    emissiveIntensity={0.5}
                  />
                </mesh>
                {node.type === 'exit' && (
                  <Text rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.7, 0]} fontSize={1.2}>
                    {isSpace ? "🚀" : "⛵"}
                  </Text>
                )}
              </group>
            );
          })}

          {/* Attori */}
          {tNode && <ActorModel position={[tNode.x, 0, tNode.z]} label="LADRO" color="#ff00ff" isGuard={false} />}
          {gNode && <ActorModel position={[gNode.x, 0, gNode.z]} label="GUARDIA" color="#00ffff" isGuard={true} />}
          
          <ContactShadows position={[0, -0.6, 0]} opacity={0.4} scale={50} blur={2} far={10} />
        </Suspense>
      </Canvas>
    </div>
  );
}