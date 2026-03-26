import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore'; 
import { OceanWorld } from './worlds/OceanWorld';
import { SpaceWorld } from './worlds/SpaceWorld';

// ─── ATTORI ───────────────────────────────────────────────────────────────────

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
        {/* Corpo */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.5, 0.8, 0.4]} />
          <meshStandardMaterial color={color} roughness={0.6}/>
        </mesh>
        {/* Testa + cappello */}
        <group position={[0, 1.35, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.25]} />
            <meshStandardMaterial color="#ffdbac" />
          </mesh>
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

// ─── PONTE / CONNESSIONE ──────────────────────────────────────────────────────

/**
 * Renderizza un arco tra due nodi con aspetto visivo basato sul tipo.
 *
 * type: 'normal'   → legno/metallo standard
 * type: 'bridge'   → colorato in base agli usi rimasti (verde→giallo→rosso)
 * type: 'portal'   → cilindro luminoso, colore accentuato
 * type: 'one_way'  → freccia direzionale (TODO: aggiungere freccia 3D)
 */
function Connection({ conn, nodeFrom, nodeTo, isSpace }) {
  if (!nodeFrom || !nodeTo) return null;

  const dx = nodeTo.x - nodeFrom.x;
  const dz = nodeTo.z - nodeFrom.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle  = Math.atan2(dx, dz);
  const midX   = (nodeFrom.x + nodeTo.x) / 2;
  const midZ   = (nodeFrom.z + nodeTo.z) / 2;

  // ── Calcola colore in base al tipo e agli usi rimanenti ─────────────────
  let color    = isSpace ? '#4444ff' : '#4a3528';
  let emissive = isSpace ? '#2222ff' : '#000000';
  let width    = isSpace ? 0.3 : 0.8;
  let height   = 0.3;
  let opacity  = 1;

  if (conn.type === 'bridge') {
    // uses: 2 → verde, 1 → giallo, 0 → rosso/trasparente (esaurito)
    const uses = conn.uses ?? 2;
    color    = uses >= 2 ? '#22cc44' : uses === 1 ? '#ffcc00' : '#cc2222';
    emissive = uses >= 2 ? '#004400' : uses === 1 ? '#443300' : '#440000';
    width    = isSpace ? 0.35 : 0.7;
    opacity  = uses <= 0 ? 0.3 : 1;
  }

  if (conn.type === 'portal') {
    color    = '#cc44ff';
    emissive = '#882299';
    width    = 0.4;
    height   = 0.4;
  }

  if (conn.type === 'one_way') {
    color    = isSpace ? '#44ffcc' : '#cc8800';
    emissive = isSpace ? '#007744' : '#442200';
    width    = isSpace ? 0.25 : 0.6;
  }

  // Arco esaurito: mostra comunque ma sbiadito
  const mat = (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={conn.type === 'portal' ? 1.2 : 0.4}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );

  return (
    <mesh
      position={[midX, -0.2, midZ]}
      rotation={[0, angle, 0]}
    >
      <boxGeometry args={[width, height, length]} />
      {mat}
    </mesh>
  );
}

// ─── PIATTAFORMA / NODO ───────────────────────────────────────────────────────

function IslandNode({ node, isSpace, blockedNodes, collectedKeys, onClick }) {
  const isExit    = node.type === 'exit' || node.type === 'unlocked';
  const isLocked  = node.type === 'locked';
  const isKey     = node.type === 'key';
  const isBlocked = blockedNodes.has(node.id);

  // Colore piattaforma
  let platformColor = isSpace ? '#222233' : '#ffffff';
  if (isBlocked)      platformColor = '#333333';
  if (isExit)         platformColor = '#ff3300';
  if (isLocked)       platformColor = '#884400';
  if (isKey)          platformColor = '#ffcc00';

  // Emissive
  let emissiveColor = '#000000';
  if (isExit)   emissiveColor = '#ff1100';
  if (isLocked) emissiveColor = '#441100';
  if (isKey)    emissiveColor = '#886600';

  // Emoji label
  let emoji = null;
  if (isExit)   emoji = isSpace ? '🚀' : '⛵';
  if (isLocked) emoji = '🔒';
  if (isKey)    emoji = '🔑';

  return (
    <group position={[node.x, 0, node.z]} onClick={(e) => { e.stopPropagation(); onClick(node.id); }}>
      <mesh castShadow receiveShadow>
        {isSpace
          ? <octahedronGeometry args={[1.2, 0]} />
          : <cylinderGeometry args={[1.2, 1.3, 0.6, 6]} />
        }
        <meshStandardMaterial
          color={platformColor}
          emissive={emissiveColor}
          emissiveIntensity={isExit ? 0.6 : 0.2}
        />
      </mesh>

      {/* Anello pulsante per uscita */}
      {isExit && (
        <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.6, 6]} />
          <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={1} transparent opacity={0.7} />
        </mesh>
      )}

      {emoji && (
        <Text rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.7, 0]} fontSize={1.0}>
          {emoji}
        </Text>
      )}
    </group>
  );
}

// ─── GAMESCENE PRINCIPALE ─────────────────────────────────────────────────────

export function GameScene() {
  const {
    currentLevel,
    currentLevelNumber,
    thiefPositions,
    guardPositions,
    blockedNodes,
    collectedKeys,
    moveGuard,
    gameState,
    setView,
    nextLevel,
    startLevel,
  } = useGameStore();

  if (!currentLevel) return null;

  const isSpace = currentLevel.biome === 'SPACE' || currentLevel.biome === 'ALIEN';

  return (
    <div className="w-full h-screen relative bg-black">

      {/* ── UI Overlay ──────────────────────────────────────────────────────── */}
      <div className="absolute top-0 w-full p-8 z-10 flex justify-between pointer-events-none">
        <button
          onClick={() => setView('CAREER')}
          className="pointer-events-auto bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl text-white font-black border border-white/20 hover:bg-white/20 transition-all"
        >
          ← MAPPA
        </button>
        <div className="text-right uppercase italic">
          <h1 className="text-yellow-400 text-5xl font-black drop-shadow-xl">CATCH THEM!!</h1>
          <p className="text-white font-bold opacity-60">
            LIVELLO {currentLevelNumber} - {currentLevel.biomeName || currentLevel.biome}
          </p>
        </div>
      </div>

      {/* Hint livello (solo livelli manuali) */}
      {currentLevel.hint && gameState === 'PLAYING' && (
        <div className="absolute bottom-16 w-full flex justify-center z-10 pointer-events-none">
          <div className="bg-black/60 backdrop-blur px-6 py-3 rounded-2xl text-white text-sm font-semibold border border-white/20 max-w-xs text-center">
            💡 {currentLevel.hint}
          </div>
        </div>
      )}

      {/* Meccaniche attive (badge) */}
      {currentLevel.mechanics && gameState === 'PLAYING' && (
        <div className="absolute top-24 right-8 z-10 flex flex-col gap-2 pointer-events-none">
          {currentLevel.mechanics.hasBridges && (
            <span className="bg-green-500/80 text-white text-xs font-bold px-3 py-1 rounded-full">🌉 Ponti fragili</span>
          )}
          {currentLevel.mechanics.hasPortals && (
            <span className="bg-purple-500/80 text-white text-xs font-bold px-3 py-1 rounded-full">🌀 Portali</span>
          )}
          {currentLevel.mechanics.hasKeys && (
            <span className="bg-yellow-500/80 text-black text-xs font-bold px-3 py-1 rounded-full">🔑 Chiavi</span>
          )}
          {currentLevel.mechanics.hasOneWay && (
            <span className="bg-cyan-500/80 text-black text-xs font-bold px-3 py-1 rounded-full">➡️ Senso unico</span>
          )}
        </div>
      )}

      {/* ── Game Over / Win ──────────────────────────────────────────────────── */}
      {gameState !== 'PLAYING' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-lg">
          <h2 className={`text-9xl font-black italic mb-12 ${gameState === 'WON' ? 'text-green-500' : 'text-red-600 animate-pulse'}`}>
            {gameState === 'WON' ? 'PRESO!' : 'PERSO!'}
          </h2>
          <div className="flex gap-6">
            <button
              onClick={() => startLevel(currentLevelNumber)}
              className="px-12 py-6 bg-white/10 text-white rounded-full font-black border border-white/20 hover:bg-white/30"
            >
              RIGIOCA
            </button>
            {gameState === 'WON' && (
              <button
                onClick={() => nextLevel()}
                className="px-24 py-8 bg-yellow-400 text-black font-black text-3xl rounded-full shadow-[0_12px_0_rgb(161,98,7)] hover:translate-y-1 hover:shadow-[0_8px_0_rgb(161,98,7)] transition-all"
              >
                AVANTI →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Canvas 3D ───────────────────────────────────────────────────────── */}
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[20, 25, 20]} fov={30} />
          <OrbitControls
            enablePan={false}
            maxPolarAngle={Math.PI / 2.5}
            minDistance={15}
            maxDistance={40}
          />

          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 20, 10]}
            castShadow
            intensity={1}
            shadow-mapSize={[1024, 1024]}
          />

          {isSpace ? <SpaceWorld /> : <OceanWorld />}

          {/* ── CONNESSIONI (PONTI) ─────────────────────────────────────────
              FIX PRINCIPALE: conn.from / conn.to invece di conn[0] / conn[1]
          ─────────────────────────────────────────────────────────────────── */}
          {currentLevel.connections.map((conn, idx) => {
            // ✅ CORRETTO: oggetti {from, to, type, uses, directed}
            const nodeFrom = currentLevel.nodes.find(n => n.id === conn.from);
            const nodeTo   = currentLevel.nodes.find(n => n.id === conn.to);

            return (
              <Connection
                key={`conn-${idx}`}
                conn={conn}
                nodeFrom={nodeFrom}
                nodeTo={nodeTo}
                isSpace={isSpace}
              />
            );
          })}

          {/* ── NODI (ISOLE) ────────────────────────────────────────────── */}
          {currentLevel.nodes.map(node => (
            <IslandNode
              key={node.id}
              node={node}
              isSpace={isSpace}
              blockedNodes={blockedNodes}
              collectedKeys={collectedKeys}
              onClick={moveGuard}
            />
          ))}

          {/* ── GUARDIE ─────────────────────────────────────────────────── */}
          {guardPositions.map((gPos, idx) => {
            const node = currentLevel.nodes.find(n => n.id === gPos);
            if (!node) return null;
            return (
              <ActorModel
                key={`guard-${idx}`}
                position={[node.x, 0, node.z]}
                label="GUARDIA"
                color="#00ffff"
                isGuard={true}
              />
            );
          })}

          {/* ── LADRI ───────────────────────────────────────────────────── */}
          {thiefPositions.map((tPos, idx) => {
            const node = currentLevel.nodes.find(n => n.id === tPos);
            if (!node) return null;
            return (
              <ActorModel
                key={`thief-${idx}`}
                position={[node.x, 0, node.z]}
                label="LADRO"
                color="#ff00ff"
                isGuard={false}
              />
            );
          })}

          <ContactShadows position={[0, -0.6, 0]} opacity={0.4} scale={50} blur={2} far={10} />
        </Suspense>
      </Canvas>
    </div>
  );
}
