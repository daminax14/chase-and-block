import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Float, Sparkles, Cloud, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

export function SpaceWorld() {
  const planetRef = useRef();
  const atmosphereRef = useRef();

  useFrame((state, delta) => {
    if (planetRef.current) planetRef.current.rotation.y += delta * 0.05;
    if (atmosphereRef.current) atmosphereRef.current.rotation.y += delta * 0.07;
  });

  return (
    <>
      <color attach="background" args={['#020205']} />
      
      {/* Sfondo stellato ad alta densità */}
      <Stars radius={150} depth={50} count={15000} factor={6} saturation={0.5} fade speed={1} />
      
      {/* LA STELLA (IL SOLE) - Luce direzionale calda e potente */}
      <pointLight position={[50, 20, 30]} intensity={4} color="#ffaa44" castShadow />
      <mesh position={[50, 20, 30]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#ffcc88" />
        <Sparkles count={50} scale={10} size={10} speed={2} color="#ffaa44" />
      </mesh>

      {/* NEBULOSE VOLUMETRICHE - Danno profondità al vuoto */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Cloud opacity={0.2} speed={0.2} width={60} depth={10} segments={20} color="#4400aa" position={[-20, -10, -30]} />
        <Cloud opacity={0.15} speed={0.2} width={40} depth={10} segments={20} color="#0044aa" position={[20, 15, -40]} />
      </Float>

      {/* IL PIANETA REALISTICO - Stratificato per effetto wow */}
      <group position={[0, -40, -20]} rotation={[0.4, 0, 0.2]}>
        {/* Nucleo gassoso */}
        <mesh ref={planetRef}>
          <sphereGeometry args={[25, 64, 64]} />
          <meshStandardMaterial 
            color="#1a2a6c" 
            metalness={0.9} 
            roughness={0.4} 
            emissive="#001133"
            emissiveIntensity={2}
          />
        </mesh>
        
        {/* Atmosfera luminosa */}
        <mesh ref={atmosphereRef} scale={[1.02, 1.02, 1.02]}>
          <sphereGeometry args={[25, 64, 64]} />
          <meshStandardMaterial 
            color="#44aaff" 
            transparent 
            opacity={0.2} 
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Luce ambiente per non avere neri piatti */}
      <ambientLight intensity={0.1} color="#223366" />
    </>
  );
}