import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Texture generata al volo (nuvola soffice)
const cloudTex = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64,64,0, 64,64,64);
  grad.addColorStop(0, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad; ctx.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(canvas);
})();

export function FogParticle({ position }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      // Fa sì che la nebbia guardi sempre te
      ref.current.quaternion.copy(state.camera.quaternion);
      // Leggera oscillazione
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <planeGeometry args={[6, 6]} />
      <meshBasicMaterial 
        map={cloudTex} 
        transparent 
        opacity={0.5} 
        depthWrite={false} 
        blending={THREE.AdditiveBlending} 
      />
    </mesh>
  );
}