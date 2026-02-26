import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Float, MeshDistortMaterial } from '@react-three/drei';

export function SpacePortal({ color = "#00ffff" }) {
  const ring1 = useRef();
  const ring2 = useRef();

  useFrame((state, delta) => {
    if (ring1.current) ring1.current.rotation.z += delta * 3;
    if (ring2.current) ring2.current.rotation.z -= delta * 2;
  });

  return (
    <group position={[0, 1, 0]}>
      <Float speed={4} rotationIntensity={1} floatIntensity={0.5}>
        {/* Nucleo energetico */}
        <mesh>
          <torusGeometry args={[0.8, 0.05, 16, 100]} />
          <meshBasicMaterial color={color} />
        </mesh>
        
        {/* Anelli rotanti */}
        <mesh ref={ring1} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.1, 0.02, 16, 100]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} />
        </mesh>
        <mesh ref={ring2} rotation={[Math.PI / 2, Math.PI / 4, 0]}>
          <torusGeometry args={[1.3, 0.02, 16, 100]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
        </mesh>

        <Sparkles count={40} scale={2} size={4} speed={1.5} color={color} />
      </Float>
    </group>
  );
}